import { db, eq } from '@allotech/db';
import {
  alertes,
  disponibilites,
  technicienCompetences,
  techniciens,
  users,
} from '@allotech/db/schema';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { adminProcedure, protectedProcedure, router } from '../trpc';

export const techniciensRouter = router({
  /**
   * Mise à jour des compétences du technicien connecté
   */
  updateCompetences: protectedProcedure
    .input(
      z.object({
        competenceIds: z.array(z.string().uuid()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tech = await db.query.techniciens.findFirst({
        where: eq(techniciens.userId, ctx.user.id),
      });

      if (!tech) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Technicien introuvable.' });
      }

      // Supprimer les compétences existantes
      await db.delete(technicienCompetences).where(eq(technicienCompetences.technicienId, tech.id));

      // Insérer les nouvelles compétences
      if (input.competenceIds.length > 0) {
        await db.insert(technicienCompetences).values(
          input.competenceIds.map((cId) => ({
            technicienId: tech.id,
            competenceId: cId,
          })),
        );
      }

      // Mettre à jour le timestamp du profil technicien
      await db
        .update(techniciens)
        .set({ updatedAt: new Date() })
        .where(eq(techniciens.id, tech.id));

      // Recharger le profil avec compétences
      const updated = await db.query.techniciens.findFirst({
        where: eq(techniciens.id, tech.id),
        with: {
          competences: {
            with: { competence: true },
          },
        },
      });

      return {
        success: true,
        competences: updated?.competences || [],
      };
    }),
  /**
   * Mise à jour du profil du technicien connecté
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        prenom: z.string().min(1, 'Le prénom est requis.'),
        nom: z.string().min(1, 'Le nom est requis.'),
        telephone: z.string().min(1, 'Le téléphone est requis.'),
        photoUrl: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tech = await db.query.techniciens.findFirst({
        where: eq(techniciens.userId, ctx.user.id),
      });

      if (!tech) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Technicien introuvable.' });
      }

      const updateData: {
        prenom: string;
        nom: string;
        telephone: string;
        photoUrl?: string | null;
        updatedAt: Date;
      } = {
        prenom: input.prenom.trim(),
        nom: input.nom.trim(),
        telephone: input.telephone.trim(),
        updatedAt: new Date(),
      };

      if (input.photoUrl !== undefined) {
        updateData.photoUrl = input.photoUrl;
      }

      await db.update(techniciens).set(updateData).where(eq(techniciens.id, tech.id));

      await db
        .update(users)
        .set({
          name: `${input.prenom.trim()} ${input.nom.trim()}`,
          ...(input.photoUrl !== undefined ? { image: input.photoUrl } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        technicien: {
          ...tech,
          prenom: input.prenom.trim(),
          nom: input.nom.trim(),
          telephone: input.telephone.trim(),
          photoUrl: input.photoUrl !== undefined ? input.photoUrl : tech.photoUrl,
        },
      };
    }),
  /**
   * Liste tous les techniciens avec leur statut (Admin)
   */
  list: protectedProcedure
    .input(
      z.object({
        isActif: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      const allTechniciens = await db.query.techniciens.findMany({
        with: {
          user: true,
          competences: {
            with: { competence: true },
          },
        },
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      });

      let filtered = allTechniciens;

      if (input.isActif !== undefined) {
        filtered = filtered.filter((t) => t.isActif === input.isActif);
      }

      return filtered;
    }),

  /**
   * Liste simplifiée des techniciens actifs pour l'assignation
   */
  listActifs: protectedProcedure.query(async () => {
    return db.query.techniciens.findMany({
      where: eq(techniciens.isActif, true),
      with: {
        competences: {
          with: { competence: true },
        },
      },
      orderBy: (table, { asc }) => [asc(table.nom)],
    });
  }),

  /**
   * Détail d'un technicien
   */
  byId: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    const tech = await db.query.techniciens.findFirst({
      where: eq(techniciens.id, input.id),
      with: {
        user: true,
        competences: {
          with: { competence: true },
        },
        disponibilites: {
          orderBy: (table, { desc }) => [desc(table.dateDebut)],
        },
        ticketAssignations: {
          with: {
            ticket: {
              with: { client: true },
            },
          },
        },
      },
    });

    if (!tech) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Technicien introuvable.' });
    }

    return tech;
  }),

  /**
   * Activation / Désactivation d'un compte technicien (Admin uniquement)
   */
  toggleActivation: adminProcedure
    .input(
      z.object({
        technicienId: z.string().uuid(),
        isActif: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      const tech = await db.query.techniciens.findFirst({
        where: eq(techniciens.id, input.technicienId),
      });

      if (!tech) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Technicien introuvable.' });
      }

      await db
        .update(techniciens)
        .set({ isActif: input.isActif, updatedAt: new Date() })
        .where(eq(techniciens.id, input.technicienId));

      if (input.isActif) {
        await db.insert(alertes).values({
          typeAlerte: 'NOUVELLE_INSCRIPTION',
          message: `Votre compte technicien (${tech.matricule}) a été validé et activé par l'administrateur. Bienvenue sur le terrain AlloTech !`,
          isLue: false,
        });
      }

      return {
        success: true,
        matricule: tech.matricule,
        isActif: input.isActif,
      };
    }),

  /**
   * Ajoute une période d'absence / congé pour un technicien (Admin uniquement)
   */
  ajouterDisponibilite: adminProcedure
    .input(
      z.object({
        technicienId: z.string().uuid(),
        motif: z.string().optional(),
        dateDebut: z.string(),
        dateFin: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const debut = new Date(input.dateDebut);
      const fin = new Date(input.dateFin);

      if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime())) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Les dates renseignées sont invalides.',
        });
      }

      if (debut >= fin) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'La date de début doit être antérieure à la date de fin.',
        });
      }

      const [dispo] = await db
        .insert(disponibilites)
        .values({
          technicienId: input.technicienId,
          motif: input.motif?.trim() || 'Congé',
          dateDebut: debut,
          dateFin: fin,
        })
        .returning();

      return { success: true, disponibilite: dispo };
    }),

  /**
   * Supprime une période d'absence / congé (Admin uniquement)
   */
  supprimerDisponibilite: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await db.delete(disponibilites).where(eq(disponibilites.id, input.id));
      return { success: true };
    }),

  /**
   * Profil du technicien connecté avec ses disponibilités actuelles
   * Utilisé par l'application mobile pour afficher le statut et les bannières
   */
  monProfil: protectedProcedure.query(async ({ ctx }) => {
    const tech = await db.query.techniciens.findFirst({
      where: eq(techniciens.userId, ctx.user.id),
      with: {
        user: true,
        competences: { with: { competence: true } },
        disponibilites: {
          orderBy: (d, { desc }) => [desc(d.dateDebut)],
        },
      },
    });

    if (!tech) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Profil technicien introuvable.' });
    }

    // Vérifier si le technicien est actuellement en absence
    const now = new Date();
    const hasActiveAbsence = (tech.disponibilites || []).some((d) => {
      if (!d.dateDebut || !d.dateFin) return false;
      const debut = new Date(d.dateDebut);
      const fin = new Date(d.dateFin);
      return now >= debut && now <= fin;
    });

    return {
      ...tech,
      email: tech.user?.email || ctx.user.email,
      hasActiveAbsence,
    };
  }),

  /**
   * Liste des absences d'un technicien
   */
  listDisponibilites: protectedProcedure
    .input(z.object({ technicienId: z.string().uuid() }))
    .query(async ({ input }) => {
      return db.query.disponibilites.findMany({
        where: eq(disponibilites.technicienId, input.technicienId),
        orderBy: (d, { desc }) => [desc(d.dateDebut)],
      });
    }),

  /**
   * Liste des techniciens disponibles pour l'assignation de tickets :
   * Exclut automatiquement les techniciens inactifs ET les techniciens absents/en congé à la date ciblée.
   */
  listAssignables: protectedProcedure
    .input(
      z
        .object({
          date: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const targetDate = input?.date ? new Date(input.date) : new Date();

      // Récupérer les techniciens actifs avec leurs compétences et leurs périodes d'absence
      const actifs = await db.query.techniciens.findMany({
        where: eq(techniciens.isActif, true),
        with: {
          competences: {
            with: { competence: true },
          },
          disponibilites: true,
        },
        orderBy: (table, { asc }) => [asc(table.nom)],
      });

      // Filtrage automatique : exclusion des techniciens absents sur la date cible
      return actifs.filter((tech) => {
        const hasAbsence = tech.disponibilites.some((d) => {
          const debut = new Date(d.dateDebut);
          const fin = new Date(d.dateFin);
          return targetDate >= debut && targetDate <= fin;
        });
        return !hasAbsence;
      });
    }),
});

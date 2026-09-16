import { db, eq } from '@allotech/db';
import {
  administrateurs,
  alertes,
  competences,
  technicienCompetences,
  techniciens,
  users,
} from '@allotech/db/schema';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../trpc';

export const authRouter = router({
  /**
   * Récupération du profil de l'utilisateur connecté (Admin ou Technicien)
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const role = ctx.user.role;

    if (role === 'ADMIN') {
      const admin = await db.query.administrateurs.findFirst({
        where: eq(administrateurs.userId, userId),
      });

      return {
        id: userId,
        role: 'ADMIN' as const,
        email: ctx.user.email,
        admin: admin || null,
      };
    }

    // Rôle Technicien
    const tech = await db.query.techniciens.findFirst({
      where: eq(techniciens.userId, userId),
      with: {
        competences: {
          with: {
            competence: true,
          },
        },
      },
    });

    return {
      id: userId,
      role: 'TECHNICIEN' as const,
      matricule: ctx.user.matricule,
      technicien: tech || null,
    };
  }),

  /**
   * Liste des compétences disponibles pour l'auto-déclaration des techniciens
   */
  getCompetences: publicProcedure.query(async () => {
    const list = await db.select().from(competences);
    return list;
  }),

  /**
   * Initialisation des compétences de base si la table est vide
   */
  seedCompetences: publicProcedure.mutation(async () => {
    const existing = await db.select().from(competences).limit(1);
    if (existing.length > 0) {
      return { message: 'Les compétences sont déjà initialisées.' };
    }

    const defaultSkills = [
      'Réseau & Switchs (Cisco, Mikrotik)',
      'Câblage structuré RJ45 / Baie',
      'Imprimantes, Traceurs & Copieurs',
      'Systèmes Windows (Postes & Serveurs)',
      'Systèmes Linux & Virtualisation',
      'Sécurité, Pare-feu & Antivirus',
      'Onduleurs & Alimentation électrique',
      'Téléphonie VoIP & PABX',
      'Maintenance Hardware PC / Laptops',
    ];

    for (const libelle of defaultSkills) {
      await db.insert(competences).values({ libelle }).onConflictDoNothing();
    }

    return { success: true, count: defaultSkills.length };
  }),

  /**
   * Inscription d'un technicien depuis l'application mobile
   * - Matricule unique fourni par l'entreprise
   * - Compétences déclarées
   * - Compte inactif (isActif = false) par défaut jusqu'à activation admin
   * - Déclenche une alerte administrative
   */
  registerTechnicien: publicProcedure
    .input(
      z.object({
        matricule: z.string().min(2, 'Le matricule doit contenir au moins 2 caractères'),
        prenom: z.string().min(2, 'Le prénom est requis'),
        nom: z.string().min(2, 'Le nom est requis'),
        telephone: z.string().min(6, 'Le numéro de téléphone est requis'),
        email: z.string().email().optional().or(z.literal('')),
        password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
        photoUrl: z.string().url().optional().or(z.literal('')),
        competenceIds: z.array(z.string().uuid()).default([]),
      }),
    )
    .mutation(async ({ input }) => {
      const matriculeClean = input.matricule.trim().toUpperCase();

      // 1. Vérification de l'unicité du matricule
      const existingTech = await db.query.techniciens.findFirst({
        where: eq(techniciens.matricule, matriculeClean),
      });

      if (existingTech) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Le matricule ${matriculeClean} est déjà enregistré. Contactez votre administrateur si besoin.`,
        });
      }

      // 2. Email technique ou utilisateur
      const techEmail =
        input.email && input.email.trim().length > 0
          ? input.email.trim().toLowerCase()
          : `${matriculeClean.toLowerCase()}@tech.allotech.cm`;

      // Vérification que l'email n'est pas déjà pris
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, techEmail),
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `L'adresse email ${techEmail} est déjà associée à un compte.`,
        });
      }

      // 3. Création de l'utilisateur
      const [newUser] = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          name: `${input.prenom.trim()} ${input.nom.trim()}`,
          email: techEmail,
          emailVerified: false,
          image: input.photoUrl || null,
        })
        .returning();

      if (!newUser) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: "Échec de création de l'utilisateur.",
        });
      }

      // 4. Création de la fiche technicien (isActif = false par défaut)
      const [newTechnicien] = await db
        .insert(techniciens)
        .values({
          userId: newUser.id,
          matricule: matriculeClean,
          prenom: input.prenom.trim(),
          nom: input.nom.trim(),
          telephone: input.telephone.trim(),
          photoUrl: input.photoUrl || null,
          isActif: false, // Inactif par défaut : validation requise par l'admin
        })
        .returning();

      if (!newTechnicien) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Échec de création du profil technicien.',
        });
      }

      // 5. Enregistrement des compétences déclarées
      if (input.competenceIds.length > 0) {
        const toInsert = input.competenceIds.map((compUniqueId) => ({
          technicienId: newTechnicien.id,
          competenceId: compUniqueId,
        }));

        await db.insert(technicienCompetences).values(toInsert);
      }

      // 6. Déclenchement d'une alerte administrateur pour nouvelle inscription
      await db.insert(alertes).values({
        typeAlerte: 'NOUVELLE_INSCRIPTION',
        message: `Nouveau technicien inscrit : ${input.prenom.trim()} ${input.nom.trim()} (${matriculeClean}). Compte en attente d'activation.`,
        isLue: false,
      });

      return {
        success: true,
        matricule: matriculeClean,
        technicienId: newTechnicien.id,
        message:
          "Inscription enregistrée avec succès. Votre compte est en attente d'activation par l'administrateur.",
      };
    }),
});

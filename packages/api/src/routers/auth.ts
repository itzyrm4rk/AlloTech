import { db, eq } from '@allotech/db';
import {
  accounts,
  administrateurs,
  alertes,
  competences,
  matriculesAutorises,
  technicienCompetences,
  techniciens,
  users,
} from '@allotech/db/schema';
import { TRPCError } from '@trpc/server';
import { hashPassword } from 'better-auth/crypto';
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
        user: true,
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
      matricule: tech?.matricule || ctx.user.matricule,
      email: tech?.user?.email || ctx.user.email,
      technicien: tech || null,
    };
  }),

  /**
   * Liste des compétences disponibles pour l'auto-déclaration des techniciens
   */
  getCompetences: publicProcedure.query(async () => {
    let list = await db.select().from(competences);
    if (!list || list.length === 0) {
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
      list = await db.select().from(competences);
    }
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
   * Résout l'adresse email réelle d'un technicien à partir de son matricule ou email
   */
  resolveTechnicienEmail: publicProcedure
    .input(z.object({ identifier: z.string().min(1) }))
    .query(async ({ input }) => {
      const clean = input.identifier.trim();
      if (clean.includes('@')) {
        return { email: clean.toLowerCase() };
      }
      const tech = await db.query.techniciens.findFirst({
        where: eq(techniciens.matricule, clean.toUpperCase()),
        with: { user: true },
      });
      if (tech?.user?.email) {
        return { email: tech.user.email.toLowerCase() };
      }
      return { email: `${clean.toLowerCase()}@tech.allotech.cm` };
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
        email: z.string().email("L'adresse email est requise et doit être valide"),
        password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
        photoUrl: z.string().url().optional().or(z.literal('')),
        competenceIds: z.array(z.string().uuid()).default([]),
      }),
    )
    .mutation(async ({ input }) => {
      const matriculeClean = input.matricule.trim().toUpperCase();

      // 0. Vérification règle d'or Sprint 2 : Le matricule doit avoir été pré-enregistré par l'administrateur
      const autorise = await db.query.matriculesAutorises.findFirst({
        where: eq(matriculesAutorises.matricule, matriculeClean),
      });

      if (!autorise) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Le matricule ${matriculeClean} n'a pas été autorisé par l'administrateur. Veuillez contacter votre responsable AlloTech.`,
        });
      }

      if (autorise.isUtilise) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Ce matricule ${matriculeClean} a déjà été utilisé pour créer un compte technicien.`,
        });
      }

      // 1. Vérification de l'unicité du matricule dans la table techniciens
      const existingTech = await db.query.techniciens.findFirst({
        where: eq(techniciens.matricule, matriculeClean),
      });

      if (existingTech) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Le matricule ${matriculeClean} est déjà enregistré. Contactez votre administrateur si besoin.`,
        });
      }

      // 2. Email de l'utilisateur
      const techEmail = input.email.trim().toLowerCase();

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

      // 4. Création du compte d'authentification Better Auth (table accounts) avec mot de passe haché
      const hashedPassword = await hashPassword(input.password);
      await db.insert(accounts).values({
        id: crypto.randomUUID(),
        userId: newUser.id,
        accountId: newUser.id,
        providerId: 'credential',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 5. Création de la fiche technicien (isActif = false par défaut)
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

      // 6. Enregistrement des compétences déclarées
      if (input.competenceIds.length > 0) {
        const toInsert = input.competenceIds.map((compUniqueId) => ({
          technicienId: newTechnicien.id,
          competenceId: compUniqueId,
        }));

        await db.insert(technicienCompetences).values(toInsert);
      }

      // 7. Marquer le matricule autorisé comme utilisé
      await db
        .update(matriculesAutorises)
        .set({ isUtilise: true })
        .where(eq(matriculesAutorises.matricule, matriculeClean));

      // 8. Déclenchement d'une alerte administrateur pour nouvelle inscription
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

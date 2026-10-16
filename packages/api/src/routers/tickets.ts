import { db, eq } from '@allotech/db';
import {
  administrateurs,
  alertes,
  equipements,
  medias,
  rapports,
  signatures,
  statutsHistorique,
  techniciens,
  ticketTechniciens,
  tickets,
} from '@allotech/db/schema';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { provisionEquipementInstallation } from '../services/cmdb-provisioning.service';
import { runDiagnosticIA } from '../services/diagnostic.service';
import { executeTicketTransition } from '../services/workflow.service';
import { adminProcedure, protectedProcedure, router, technicienProcedure } from '../trpc';

const TICKET_STATUTS = [
  'CREEE',
  'ASSIGNEE',
  'EN_ROUTE',
  'EN_COURS',
  'EN_PAUSE',
  'TERMINEE',
  'CLOTUREE',
  'ANNULEE',
] as const;

const ticketCreateSchema = z.object({
  clientId: z.string().uuid(),
  equipementId: z.string().uuid().optional(),
  typeDemande: z.enum(['PANNE', 'INSTALLATION']),
  urgence: z.enum(['CRITIQUE', 'HAUTE', 'NORMALE', 'BASSE']).default('NORMALE'),
  adresseSite: z.string().min(5, "L'adresse du site est requise"),
  description: z.string().min(10, 'La description doit faire au moins 10 caractères'),
  dateSouhaitee: z.string().datetime().optional().or(z.literal('')),
  commentaire: z.string().optional(),
  // Spécifique aux PANNES
  categoriePanne: z.enum(['MATERIEL', 'LOGICIEL']).optional(),
  sousTypePanneMat: z.enum(['RESEAU', 'IMPRIMANTE', 'ELECTRIQUE', 'AUTRE_MATERIEL']).optional(),
  sousTypePanneLog: z
    .enum(['SYSTEME_EXPLOITATION', 'APPLICATION', 'SECURITE_VIRUS', 'AUTRE_LOGICIEL'])
    .optional(),
  // Spécifique aux INSTALLATIONS
  equipementsDescription: z.string().optional(),
  // SLA (heures)
  slaHeures: z.number().int().positive().optional(),
});

/**
 * Génère une référence de ticket unique au format TCK-YYYY-NNNN
 */
async function generateReference(): Promise<string> {
  const year = new Date().getFullYear();
  const all = await db.query.tickets.findMany({ columns: { id: true } });
  const count = all.length + 1;
  return `TCK-${year}-${String(count).padStart(4, '0')}`;
}

export const ticketsRouter = router({
  /**
   * Liste des tickets avec filtres avancés
   */
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
        statut: z.enum(TICKET_STATUTS).optional(),
        urgence: z.enum(['CRITIQUE', 'HAUTE', 'NORMALE', 'BASSE']).optional(),
        clientId: z.string().uuid().optional(),
        technicienId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, limit } = input;
      const offset = (page - 1) * limit;

      const allTickets = await db.query.tickets.findMany({
        with: {
          client: true,
          equipement: true,
          techniciens: {
            with: { technicien: true },
          },
        },
        limit,
        offset,
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      });

      // Filtre post-requête (ensemble de données gérable)
      let filtered = allTickets;

      if (input.statut) {
        filtered = filtered.filter((t) => t.statutActuel === input.statut);
      }

      if (input.urgence) {
        filtered = filtered.filter((t) => t.urgence === input.urgence);
      }

      if (input.clientId) {
        filtered = filtered.filter((t) => t.clientId === input.clientId);
      }

      if (input.technicienId) {
        filtered = filtered.filter((t) =>
          t.techniciens.some((tt) => tt.technicienId === input.technicienId),
        );
      }

      // KPI rapides
      const allForKpi = await db.query.tickets.findMany();
      const kpi = {
        total: allForKpi.length,
        creees: allForKpi.filter((t) => t.statutActuel === 'CREEE').length,
        enCours: allForKpi.filter(
          (t) => t.statutActuel === 'EN_COURS' || t.statutActuel === 'EN_ROUTE',
        ).length,
        critiques: allForKpi.filter((t) => t.urgence === 'CRITIQUE').length,
        terminees: allForKpi.filter((t) => t.statutActuel === 'TERMINEE').length,
      };

      return {
        data: filtered,
        pagination: {
          page,
          limit,
          total: filtered.length,
        },
        kpi,
      };
    }),

  /**
   * Tickets assignés au technicien connecté (pour l'app mobile)
   */
  mesTickets: technicienProcedure.query(async ({ ctx }) => {
    const techId = ctx.user.technicienId;

    if (!techId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Profil technicien introuvable.',
      });
    }

    const assignations = await db.query.ticketTechniciens.findMany({
      where: eq(ticketTechniciens.technicienId, techId),
      with: {
        ticket: {
          with: {
            client: true,
            equipement: true,
            techniciens: {
              with: { technicien: true },
            },
          },
        },
      },
    });

    return assignations
      .map((a) => a.ticket)
      .filter((t) => t.statutActuel !== 'ANNULEE')
      .sort((a, b) => {
        const urgenceOrder = { CRITIQUE: 0, HAUTE: 1, NORMALE: 2, BASSE: 3 };
        return urgenceOrder[a.urgence] - urgenceOrder[b.urgence];
      });
  }),

  /**
   * Détail complet d'un ticket
   */
  byId: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    const ticket = await db.query.tickets.findFirst({
      where: eq(tickets.id, input.id),
      with: {
        client: true,
        equipement: true,
        administrateur: {
          with: { user: true },
        },
        techniciens: {
          with: { technicien: true },
        },
        statutsHistorique: {
          orderBy: (table, { desc }) => [desc(table.changedAt)],
        },
        medias: true,
        rapport: true,
        signature: true,
      },
    });

    if (!ticket) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket introuvable.' });
    }

    // Résolution et pré-signature sécurisée des médias Backblaze B2 pour le mobile
    const keyId = process.env.B2_KEY_ID?.trim();
    const appKey = process.env.B2_APP_KEY?.trim();
    const bucket = process.env.B2_BUCKET_NAME || 'allotech-medias-prod';
    const endpoint = process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
    const region = process.env.B2_REGION || 'us-east-005';

    let resolvedMedias = ticket.medias;
    if (keyId && appKey && ticket.medias && ticket.medias.length > 0) {
      try {
        // @ts-ignore — Module résolu à l'exécution dans le bundle Next.js
        const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
        // @ts-ignore — Module résolu à l'exécution dans le bundle Next.js
        const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
        const s3 = new S3Client({
          endpoint,
          region,
          credentials: { accessKeyId: keyId, secretAccessKey: appKey },
        });

        resolvedMedias = await Promise.all(
          ticket.medias.map(async (m) => {
            const rawUrl = m.fileUrl || '';
            let key = '';

            if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
              try {
                const urlObj = new URL(rawUrl);
                const parts = urlObj.pathname.replace(/^\//, '').split('/');
                key = parts[0] === bucket ? parts.slice(1).join('/') : parts.join('/');
              } catch {
                key = '';
              }
            } else if (rawUrl.startsWith('/uploads/')) {
              const cleanName = rawUrl.replace(/^\/uploads\//, '');
              key = `tickets/uploads/${cleanName}`;
            }

            if (key) {
              try {
                const viewUrl = await getSignedUrl(
                  s3,
                  new GetObjectCommand({
                    Bucket: bucket,
                    Key: key,
                  }),
                  { expiresIn: 3600 },
                );
                return { ...m, fileUrl: viewUrl };
              } catch {
                return m;
              }
            }
            return m;
          }),
        );
      } catch {
        // Fallback silencieux si S3 n'est pas disponible
      }
    }

    return {
      ...ticket,
      medias: resolvedMedias,
    };
  }),

  /**
   * Création d'un ticket (Admin uniquement)
   */
  create: adminProcedure.input(ticketCreateSchema).mutation(async ({ input, ctx }) => {
    // Récupérer l'ID de l'administrateur depuis le contexte
    const admin = await db.query.administrateurs.findFirst({
      where: eq(administrateurs.userId, ctx.user.id),
    });

    if (!admin) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Profil administrateur introuvable.',
      });
    }

    const reference = await generateReference();

    // Calcul de la date SLA si fournie (heures ouvrées estimées)
    const slaEcheanceAt = input.slaHeures
      ? new Date(Date.now() + input.slaHeures * 60 * 60 * 1000)
      : null;

    const [newTicket] = await db
      .insert(tickets)
      .values({
        reference,
        administrateurId: admin.id,
        clientId: input.clientId,
        equipementId: input.equipementId || null,
        typeDemande: input.typeDemande,
        urgence: input.urgence,
        adresseSite: input.adresseSite.trim(),
        description: input.description.trim(),
        dateSouhaitee: input.dateSouhaitee ? new Date(input.dateSouhaitee) : null,
        commentaire: input.commentaire?.trim() || null,
        categoriePanne: input.categoriePanne || null,
        sousTypePanneMat: input.sousTypePanneMat || null,
        sousTypePanneLog: input.sousTypePanneLog || null,
        equipementsDescription: input.equipementsDescription?.trim() || null,
        statutActuel: 'CREEE',
        slaEcheanceAt,
      })
      .returning();

    if (!newTicket) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Échec de la création du ticket.',
      });
    }

    // Enregistrement dans l'historique
    await db.insert(statutsHistorique).values({
      ticketId: newTicket.id,
      statutPrecedent: null,
      statutNouvel: 'CREEE',
      auteurAdminId: admin.id,
    });

    // Si ticket PANNE avec équipement rattaché, basculer l'équipement en EN_PANNE dans la CMDB
    if (input.typeDemande === 'PANNE' && input.equipementId) {
      await db
        .update(equipements)
        .set({
          statut: 'EN_PANNE',
          updatedAt: new Date(),
        })
        .where(eq(equipements.id, input.equipementId));
    }

    return newTicket;
  }),

  /**
   * Changement de statut d'un ticket (Admin ou Technicien selon le contexte)
   */
  changerStatut: protectedProcedure
    .input(
      z.object({
        ticketId: z.string().uuid(),
        nouveauStatut: z.enum(TICKET_STATUTS),
        motif: z.string().optional(),
        // Données terrain (pour EN_COURS)
        latitude: z.string().optional(),
        longitude: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const res = await executeTicketTransition({
        ticketId: input.ticketId,
        nouveauStatut: input.nouveauStatut,
        latitude: input.latitude,
        longitude: input.longitude,
        motif: input.motif,
        user: {
          role: ctx.user.role,
          adminId: ctx.user.adminId,
          technicienId: ctx.user.technicienId,
        },
      });

      if (input.nouveauStatut === 'ANNULEE') {
        const ticket = await db.query.tickets.findFirst({
          where: eq(tickets.id, input.ticketId),
        });
        if (ticket) {
          await db.insert(alertes).values({
            ticketId: input.ticketId,
            typeAlerte: 'CLOTURE',
            message: `Ticket ${ticket.reference} annulé. Motif : ${input.motif ?? 'Non précisé'}`,
            isLue: false,
          });
        }
      }

      return res;
    }),

  /**
   * Assignation de techniciens à un ticket (Admin uniquement)
   */
  assignerTechniciens: adminProcedure
    .input(
      z.object({
        ticketId: z.string().uuid(),
        technicienIds: z.array(z.string().uuid()).min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const ticket = await db.query.tickets.findFirst({
        where: eq(tickets.id, input.ticketId),
      });

      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket introuvable.' });
      }

      // Règle d'or Sprint 2 : Vérifier que chaque technicien assigné est actif et non en congé/absence
      const targetDate = ticket.dateSouhaitee ?? new Date();

      for (const techId of input.technicienIds) {
        const tech = await db.query.techniciens.findFirst({
          where: eq(techniciens.id, techId),
          with: { disponibilites: true },
        });

        if (!tech) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Technicien ${techId} introuvable.`,
          });
        }

        if (!tech.isActif) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Le technicien ${tech.prenom} ${tech.nom} (${tech.matricule}) est actuellement désactivé.`,
          });
        }

        const isAbsent = tech.disponibilites.some(
          (d) => new Date(d.dateDebut) <= targetDate && new Date(d.dateFin) >= targetDate,
        );

        if (isAbsent) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Le technicien ${tech.prenom} ${tech.nom} (${tech.matricule}) est en congé ou absent sur cette période.`,
          });
        }
      }

      // Suppression des assignations existantes
      await db.delete(ticketTechniciens).where(eq(ticketTechniciens.ticketId, input.ticketId));

      // Nouvelles assignations
      await db.insert(ticketTechniciens).values(
        input.technicienIds.map((techId) => ({
          ticketId: input.ticketId,
          technicienId: techId,
        })),
      );

      // Passage automatique au statut ASSIGNEE si le ticket était en CREEE
      if (ticket.statutActuel === 'CREEE') {
        const admin = await db.query.administrateurs.findFirst({
          where: eq(administrateurs.userId, ctx.user.id),
        });

        await db
          .update(tickets)
          .set({ statutActuel: 'ASSIGNEE', updatedAt: new Date() })
          .where(eq(tickets.id, input.ticketId));

        await db.insert(statutsHistorique).values({
          ticketId: input.ticketId,
          statutPrecedent: 'CREEE',
          statutNouvel: 'ASSIGNEE',
          auteurAdminId: admin?.id ?? null,
          motif: 'Assignation de technicien(s)',
        });
      }

      // Notification pour chaque technicien assigné
      for (const techId of input.technicienIds) {
        const assignedTech = await db.query.techniciens.findFirst({
          where: eq(techniciens.id, techId),
        });
        await db.insert(alertes).values({
          ticketId: input.ticketId,
          typeAlerte: 'SLA_PREDICTIF',
          message: `Nouveau ticket ${ticket.reference} assigné à votre compte (${assignedTech?.matricule ?? 'Technicien'}).`,
          isLue: false,
        });
      }

      return { success: true, count: input.technicienIds.length };
    }),

  /**
   * Réassignation de techniciens à un ticket (Admin uniquement)
   */
  reassign: adminProcedure
    .input(
      z.object({
        ticketId: z.string().uuid(),
        technicienIds: z.array(z.string().uuid()),
        motif: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const ticket = await db.query.tickets.findFirst({
        where: eq(tickets.id, input.ticketId),
      });

      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket introuvable.' });
      }

      const targetDate = ticket.dateSouhaitee ?? new Date();

      for (const techId of input.technicienIds) {
        const tech = await db.query.techniciens.findFirst({
          where: eq(techniciens.id, techId),
          with: { disponibilites: true },
        });

        if (!tech) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Technicien ${techId} introuvable.`,
          });
        }

        if (!tech.isActif) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Le technicien ${tech.prenom} ${tech.nom} (${tech.matricule}) est actuellement désactivé.`,
          });
        }

        const isAbsent = tech.disponibilites.some(
          (d) => new Date(d.dateDebut) <= targetDate && new Date(d.dateFin) >= targetDate,
        );

        if (isAbsent) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Le technicien ${tech.prenom} ${tech.nom} (${tech.matricule}) est en congé ou absent sur cette période.`,
          });
        }
      }

      // Supprimer les assignations existantes
      await db.delete(ticketTechniciens).where(eq(ticketTechniciens.ticketId, input.ticketId));

      // Nouvelles assignations
      if (input.technicienIds.length > 0) {
        await db.insert(ticketTechniciens).values(
          input.technicienIds.map((techId) => ({
            ticketId: input.ticketId,
            technicienId: techId,
          })),
        );
      }

      const admin = await db.query.administrateurs.findFirst({
        where: eq(administrateurs.userId, ctx.user.id),
      });

      const newStatut = input.technicienIds.length > 0 ? 'ASSIGNEE' : 'CREEE';
      await db
        .update(tickets)
        .set({ statutActuel: newStatut, updatedAt: new Date() })
        .where(eq(tickets.id, input.ticketId));

      await db.insert(statutsHistorique).values({
        ticketId: input.ticketId,
        statutPrecedent: ticket.statutActuel,
        statutNouvel: newStatut,
        auteurAdminId: admin?.id ?? null,
        motif: input.motif ?? 'Réaffectation manuelle de technicien(s)',
      });

      return { success: true, count: input.technicienIds.length, statut: newStatut };
    }),

  /**
   * Escalade du niveau d'urgence d'un ticket (Admin uniquement)
   */
  escalate: adminProcedure
    .input(
      z.object({
        ticketId: z.string().uuid(),
        urgence: z.enum(['CRITIQUE', 'HAUTE', 'NORMALE', 'BASSE']),
        motif: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const ticket = await db.query.tickets.findFirst({
        where: eq(tickets.id, input.ticketId),
      });

      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket introuvable.' });
      }

      if (ticket.urgence === input.urgence) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Le ticket est déjà au niveau d'urgence ${input.urgence}.`,
        });
      }

      const admin = await db.query.administrateurs.findFirst({
        where: eq(administrateurs.userId, ctx.user.id),
      });

      await db
        .update(tickets)
        .set({ urgence: input.urgence, updatedAt: new Date() })
        .where(eq(tickets.id, input.ticketId));

      await db.insert(statutsHistorique).values({
        ticketId: input.ticketId,
        statutPrecedent: ticket.statutActuel,
        statutNouvel: ticket.statutActuel,
        auteurAdminId: admin?.id ?? null,
        motif: input.motif ?? `Escalade d'urgence vers ${input.urgence}`,
      });

      if (input.urgence === 'CRITIQUE') {
        await db.insert(alertes).values({
          ticketId: input.ticketId,
          typeAlerte: 'SLA_DEPASSE',
          message: `URGENCE CRITIQUE : Ticket ${ticket.reference} escaladé en CRITIQUE. Motif : ${input.motif ?? 'Non précisé'}`,
          isLue: false,
        });
      }

      return { success: true, urgence: input.urgence };
    }),

  /**
   * Ajout d'un média rattaché à un ticket
   */
  addMedia: protectedProcedure
    .input(
      z.object({
        ticketId: z.string().uuid(),
        typeMedia: z.enum([
          'PHOTO_PANNE_CLIENT',
          'DOC_CAHIER_CHARGES',
          'PHOTO_INTERVENTION_TECH',
          'VIDEO_INTERVENTION_TECH',
        ]),
        fileUrl: z.string().url(),
        fileName: z.string().min(1),
        fileSizeBytes: z.number().int().positive().optional(),
        mimeType: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const ticket = await db.query.tickets.findFirst({
        where: eq(tickets.id, input.ticketId),
      });

      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket introuvable.' });
      }

      const [media] = await db
        .insert(medias)
        .values({
          ticketId: input.ticketId,
          typeMedia: input.typeMedia,
          fileUrl: input.fileUrl,
          fileName: input.fileName,
          fileSizeBytes: input.fileSizeBytes ?? null,
          mimeType: input.mimeType ?? null,
        })
        .returning();

      return { success: true, media };
    }),

  /**
   * Démarrage d'une intervention par le technicien sur le terrain (Mobile)
   * Enregistre l'heure de démarrage et la position GPS
   */
  demarrerIntervention: technicienProcedure
    .input(
      z.object({
        ticketId: z.string().uuid(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const ticket = await db.query.tickets.findFirst({
        where: eq(tickets.id, input.ticketId),
      });

      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket introuvable.' });
      }

      if (ticket.statutActuel === 'EN_COURS') {
        return {
          success: true,
          statut: 'EN_COURS',
          alreadyStarted: true,
          message: 'L’intervention est déjà en cours (démarrée par un coéquipier).',
        };
      }

      const techId = ctx.user.technicienId;

      await db
        .update(tickets)
        .set({
          statutActuel: 'EN_COURS',
          heureDemarrage: ticket.heureDemarrage ?? new Date(),
          latitudeDemarrage: input.latitude ?? ticket.latitudeDemarrage ?? null,
          longitudeDemarrage: input.longitude ?? ticket.longitudeDemarrage ?? null,
          updatedAt: new Date(),
        })
        .where(eq(tickets.id, input.ticketId));

      let techName = '';
      if (techId) {
        const tech = await db.query.techniciens.findFirst({
          where: eq(techniciens.id, techId),
          columns: { prenom: true, nom: true, matricule: true },
        });
        if (tech) {
          techName = ` par ${tech.prenom} ${tech.nom} (${tech.matricule})`;
        }
      }

      await db.insert(statutsHistorique).values({
        ticketId: input.ticketId,
        statutPrecedent: ticket.statutActuel,
        statutNouvel: 'EN_COURS',
        auteurTechId: techId ?? null,
        motif:
          ticket.statutActuel === 'EN_PAUSE'
            ? `Reprise de l’intervention après pause${techName}`
            : `Démarrage de l’intervention sur site${techName}`,
      });

      return { success: true, statut: 'EN_COURS' };
    }),

  /**
   * Assistant de diagnostic IA (Google Gemini)
   * Analyse l'historique de l'équipement CMDB et la description de la panne
   */
  diagnosticIA: protectedProcedure
    .input(
      z.object({
        ticketId: z.string().uuid().optional(),
        equipementId: z.string().uuid().optional(),
        descriptionPanne: z.string().min(3),
        categoriePanne: z.string().optional(),
        sousTypePanne: z.string().optional(),
        images: z
          .array(
            z.object({
              base64: z.string(),
              mimeType: z.string().optional().default('image/jpeg'),
            }),
          )
          .optional(),
        messages: z
          .array(
            z.object({
              role: z.enum(['user', 'assistant']),
              content: z.string(),
              images: z
                .array(
                  z.object({
                    base64: z.string(),
                    mimeType: z.string().optional().default('image/jpeg'),
                  }),
                )
                .optional(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return runDiagnosticIA(input);
    }),

  /**
   * Clôture officielle d'une intervention avec rapport d'intervention et signature client
   */
  cloturer: protectedProcedure
    .input(
      z.object({
        ticketId: z.string().uuid(),
        rapport: z.string().min(5, "Le rapport d'intervention doit contenir au moins 5 caractères"),
        signatureDataUrl: z.string().min(20, 'La signature client est requise'),
        nomSignataire: z.string().optional(),
        equipementInstallation: z
          .object({
            modele: z.string().optional(),
            numeroSerie: z.string().optional(),
            typeActif: z.enum(['MATERIEL', 'LOGICIEL']).optional(),
            editeur: z.string().optional(),
            version: z.string().optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const ticket = await db.query.tickets.findFirst({
        where: eq(tickets.id, input.ticketId),
        with: {
          client: true,
          equipement: true,
          techniciens: true,
        },
      });

      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket introuvable.' });
      }

      if (ticket.statutActuel === 'CLOTUREE') {
        return {
          success: true,
          statut: 'CLOTUREE',
          alreadyCloture: true,
          message: 'Ce ticket a déjà été clôturé par un coéquipier.',
        };
      }

      // Résolution du technicien auteur
      let techId = ctx.user.technicienId;
      if (!techId && ctx.user.role === 'ADMIN') {
        techId = ticket.techniciens[0]?.technicienId;
      }
      if (!techId) {
        const firstTech = await db.query.techniciens.findFirst();
        techId = firstTech?.id;
      }

      if (!techId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Aucun technicien associé pour enregistrer le rapport.',
        });
      }

      // 1. Enregistrement ou mise à jour du rapport technique
      const existingRapport = await db.query.rapports.findFirst({
        where: eq(rapports.ticketId, input.ticketId),
      });

      if (existingRapport) {
        await db
          .update(rapports)
          .set({
            contenu: input.rapport.trim(),
            technicienId: techId,
            updatedAt: new Date(),
          })
          .where(eq(rapports.ticketId, input.ticketId));
      } else {
        await db.insert(rapports).values({
          ticketId: input.ticketId,
          technicienId: techId,
          contenu: input.rapport.trim(),
        });
      }

      // 2. Enregistrement ou mise à jour de la signature client
      const existingSignature = await db.query.signatures.findFirst({
        where: eq(signatures.ticketId, input.ticketId),
      });

      const nomClientSignataire = input.nomSignataire?.trim() || ticket.client.nom;

      if (existingSignature) {
        await db
          .update(signatures)
          .set({
            signatureUrl: input.signatureDataUrl,
            nomSignataire: nomClientSignataire,
            signedAt: new Date(),
          })
          .where(eq(signatures.ticketId, input.ticketId));
      } else {
        await db.insert(signatures).values({
          ticketId: input.ticketId,
          signatureUrl: input.signatureDataUrl,
          nomSignataire: nomClientSignataire,
          signedAt: new Date(),
        });
      }

      // 3. Création ou activation automatique d'équipement dans la CMDB pour une INSTALLATION
      const { updatedEquipementId, nouvelEquipementCree } = await provisionEquipementInstallation({
        ticket,
        equipementInstallation: input.equipementInstallation,
      });

      // 4. Mise à jour du statut du ticket vers CLOTUREE
      const now = new Date();
      await db
        .update(tickets)
        .set({
          statutActuel: 'CLOTUREE',
          equipementId: updatedEquipementId,
          clotureAt: now,
          heureFinale: ticket.heureFinale ?? now,
          updatedAt: now,
        })
        .where(eq(tickets.id, input.ticketId));

      // 5. Historisation de la transition
      await db.insert(statutsHistorique).values({
        ticketId: input.ticketId,
        statutPrecedent: ticket.statutActuel,
        statutNouvel: 'CLOTUREE',
        auteurTechId: ctx.user.technicienId ?? null,
        auteurAdminId: ctx.user.adminId ?? null,
        motif: `Clôture officielle avec signature client de ${nomClientSignataire}`,
      });

      // 6. Alerte administrative
      await db.insert(alertes).values({
        ticketId: input.ticketId,
        typeAlerte: 'CLOTURE',
        message: `Intervention ${ticket.reference} (${ticket.client.nom}) clôturée. Rapport technique et signature client enregistrés.`,
        isLue: false,
      });

      return {
        success: true,
        reference: ticket.reference,
        clotureAt: now,
        nomSignataire: nomClientSignataire,
        equipementCree: nouvelEquipementCree,
      };
    }),

  /**
   * Ajout d'une photo / média d'intervention par le technicien sur le terrain
   */
  ajouterPhoto: protectedProcedure
    .input(
      z.object({
        ticketId: z.string().uuid(),
        fileUrl: z.string(),
        fileName: z.string(),
        note: z.string().optional(),
        typeMedia: z
          .enum([
            'PHOTO_PANNE_CLIENT',
            'DOC_CAHIER_CHARGES',
            'PHOTO_INTERVENTION_TECH',
            'VIDEO_INTERVENTION_TECH',
          ])
          .default('PHOTO_INTERVENTION_TECH'),
        fileSizeBytes: z.number().optional(),
        mimeType: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [media] = await db
        .insert(medias)
        .values({
          ticketId: input.ticketId,
          typeMedia: input.typeMedia,
          fileUrl: input.fileUrl,
          fileName: input.note ? `${input.fileName} (${input.note})` : input.fileName,
          fileSizeBytes: input.fileSizeBytes || null,
          mimeType: input.mimeType || 'image/jpeg',
        })
        .returning();

      return { success: true, media };
    }),

  /**
   * Supervision globale temps réel (Carte & Liste active avec SLA dynamique)
   */
  supervision: protectedProcedure
    .input(
      z
        .object({
          inclureClotures: z.boolean().default(false),
          filtreUrgence: z.enum(['CRITIQUE', 'HAUTE', 'NORMALE', 'BASSE']).optional(),
          filtreType: z.enum(['PANNE', 'INSTALLATION']).optional(),
        })
        .default({}),
    )
    .query(async ({ input }) => {
      const allTickets = await db.query.tickets.findMany({
        with: {
          client: true,
          equipement: true,
          techniciens: {
            with: {
              technicien: true,
            },
          },
          statutsHistorique: {
            orderBy: (h, { desc }) => [desc(h.changedAt)],
            limit: 1,
          },
        },
        orderBy: (t, { desc }) => [desc(t.createdAt)],
      });

      const now = Date.now();

      const filtered = allTickets.filter((t) => {
        if (
          !input.inclureClotures &&
          (t.statutActuel === 'CLOTUREE' || t.statutActuel === 'ANNULEE')
        ) {
          return false;
        }
        if (input.filtreUrgence && t.urgence !== input.filtreUrgence) {
          return false;
        }
        if (input.filtreType && t.typeDemande !== input.filtreType) {
          return false;
        }
        return true;
      });

      const enriched = filtered.map((t) => {
        // Calcul dynamique du SLA
        const durationHours =
          t.urgence === 'CRITIQUE'
            ? 4
            : t.urgence === 'HAUTE'
              ? 8
              : t.urgence === 'NORMALE'
                ? 24
                : 48;
        const totalDurationMs = durationHours * 3600 * 1000;
        const createdAtMs = new Date(t.createdAt).getTime();
        const echeanceMs = t.slaEcheanceAt
          ? new Date(t.slaEcheanceAt).getTime()
          : createdAtMs + totalDurationMs;
        const remainingMs = echeanceMs - now;
        const elapsedMs = now - createdAtMs;
        const progressPct = Math.min(
          100,
          Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)),
        );
        const isDepasse = remainingMs <= 0 && t.statutActuel !== 'CLOTUREE';
        const isImminent =
          !isDepasse && remainingMs <= 0.25 * totalDurationMs && t.statutActuel !== 'CLOTUREE';

        // Coordonnées GPS avec repli sur Douala si non renseignées
        let lat = t.latitudeSite ? Number.parseFloat(t.latitudeSite) : null;
        let lng = t.longitudeSite ? Number.parseFloat(t.longitudeSite) : null;

        // Si aucune coordonnée, fournir un point représentatif à Douala pour la visualisation
        if (!lat || !lng || Number.isNaN(lat) || Number.isNaN(lng)) {
          // Centré sur Akwa / Bonanjo Douala
          lat = 4.0511 + Math.sin(createdAtMs) * 0.02;
          lng = 9.7085 + Math.cos(createdAtMs) * 0.02;
        }

        return {
          id: t.id,
          reference: t.reference,
          typeDemande: t.typeDemande,
          statutActuel: t.statutActuel,
          urgence: t.urgence,
          description: t.description,
          adresseSite: t.adresseSite,
          coords: { lat, lng },
          dateSouhaitee: t.dateSouhaitee,
          heureDepart: t.heureDepart,
          heureDemarrage: t.heureDemarrage,
          heureFinale: t.heureFinale,
          clotureAt: t.clotureAt,
          createdAt: t.createdAt,
          client: t.client
            ? {
                id: t.client.id,
                nom: t.client.nom,
                telephone: t.client.telephone,
                adresse: t.client.adresse,
              }
            : null,
          techniciens: t.techniciens.map((ta) => ({
            id: ta.technicien.id,
            matricule: ta.technicien.matricule,
            nom: ta.technicien.nom,
            prenom: ta.technicien.prenom,
            telephone: ta.technicien.telephone,
          })),
          sla: {
            durationHours,
            totalDurationMs,
            echeanceAt: new Date(echeanceMs).toISOString(),
            remainingMinutes: Math.round(remainingMs / 60000),
            progressPct,
            isDepasse,
            isImminent,
          },
        };
      });

      // KPI de supervision
      const kpis = {
        totalActifs: enriched.length,
        enRoute: enriched.filter((t) => t.statutActuel === 'EN_ROUTE').length,
        enCours: enriched.filter((t) => t.statutActuel === 'EN_COURS').length,
        enPause: enriched.filter((t) => t.statutActuel === 'EN_PAUSE').length,
        critiques: enriched.filter((t) => t.urgence === 'CRITIQUE').length,
        slaDepasses: enriched.filter((t) => t.sla.isDepasse).length,
        slaImminents: enriched.filter((t) => t.sla.isImminent).length,
      };

      return {
        tickets: enriched,
        kpis,
        refreshedAt: new Date().toISOString(),
      };
    }),
});

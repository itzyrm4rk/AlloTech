import { db, eq, ilike, or } from '@allotech/db';
import { equipements } from '@allotech/db/schema';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { adminProcedure, protectedProcedure, router } from '../trpc';

const equipementInputSchema = z.object({
  clientId: z.string().uuid('Veuillez sélectionner un client valide'),
  modele: z.string().min(2, 'Le modèle est requis'),
  numeroSerie: z.string().min(2, 'Le numéro de série est requis'),
  dateInstallation: z.string().datetime().optional().or(z.literal('')),
  siteAdresse: z.string().optional().or(z.literal('')),
  statut: z.enum(['EN_SERVICE', 'EN_PANNE', 'EN_REFORME']).default('EN_SERVICE'),
});

export const equipementsRouter = router({
  /**
   * Liste tous les équipements avec filtres optionnels
   */
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
        search: z.string().optional(),
        clientId: z.string().uuid().optional(),
        statut: z.enum(['EN_SERVICE', 'EN_PANNE', 'EN_REFORME']).optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, limit, search, clientId, statut } = input;
      const offset = (page - 1) * limit;

      const allEquipements = await db.query.equipements.findMany({
        with: {
          client: true,
        },
        limit,
        offset,
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      });

      // Post-filter in memory for simplicity (small datasets)
      let filtered = allEquipements;

      if (clientId) {
        filtered = filtered.filter((e) => e.clientId === clientId);
      }

      if (statut) {
        filtered = filtered.filter((e) => e.statut === statut);
      }

      if (search && search.trim().length > 0) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.modele.toLowerCase().includes(q) ||
            e.numeroSerie.toLowerCase().includes(q) ||
            (e.siteAdresse?.toLowerCase().includes(q) ?? false),
        );
      }

      return {
        data: filtered,
        total: filtered.length,
      };
    }),

  /**
   * Équipements d'un client donné (pour les tickets PANNE)
   */
  byClientId: protectedProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ input }) => {
      return db.query.equipements.findMany({
        where: eq(equipements.clientId, input.clientId),
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      });
    }),

  /**
   * Détail d'un équipement avec le client et les tickets
   */
  byId: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    const equip = await db.query.equipements.findFirst({
      where: eq(equipements.id, input.id),
      with: {
        client: true,
        tickets: {
          orderBy: (table, { desc }) => [desc(table.createdAt)],
          with: {
            rapport: {
              with: {
                technicien: {
                  with: {
                    user: true,
                  },
                },
              },
            },
            techniciens: {
              with: {
                technicien: {
                  with: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!equip) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Équipement introuvable.' });
    }

    return equip;
  }),

  /**
   * Création d'un équipement avec génération automatique du QR code
   */
  create: adminProcedure.input(equipementInputSchema).mutation(async ({ input }) => {
    // Vérification que le numéro de série n'existe pas déjà
    const existing = await db.query.equipements.findFirst({
      where: eq(equipements.numeroSerie, input.numeroSerie.trim()),
    });

    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: `Le numéro de série "${input.numeroSerie}" est déjà enregistré.`,
      });
    }

    // Génération du QR code data unique (UUID v4)
    const qrCodeData = crypto.randomUUID();

    const [newEquipement] = await db
      .insert(equipements)
      .values({
        clientId: input.clientId,
        modele: input.modele.trim(),
        numeroSerie: input.numeroSerie.trim(),
        dateInstallation: input.dateInstallation ? new Date(input.dateInstallation) : null,
        siteAdresse: input.siteAdresse?.trim() || null,
        statut: input.statut,
        qrCodeData,
      })
      .returning();

    if (!newEquipement) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: "Échec de la création de l'équipement.",
      });
    }

    return newEquipement;
  }),

  /**
   * Mise à jour d'un équipement (Admin uniquement)
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: equipementInputSchema.partial().omit({ clientId: true }),
      }),
    )
    .mutation(async ({ input }) => {
      const existing = await db.query.equipements.findFirst({
        where: eq(equipements.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Équipement introuvable.' });
      }

      const [updated] = await db
        .update(equipements)
        .set({
          ...input.data,
          dateInstallation: input.data.dateInstallation
            ? new Date(input.data.dateInstallation)
            : undefined,
          updatedAt: new Date(),
        })
        .where(eq(equipements.id, input.id))
        .returning();

      return updated;
    }),

  /**
   * Recherche d'un équipement par QR code data (scan terrain)
   */
  byQrCode: protectedProcedure
    .input(z.object({ qrCodeData: z.string() }))
    .query(async ({ input }) => {
      let raw = input.qrCodeData.trim();
      try {
        if (raw.startsWith('http://') || raw.startsWith('https://')) {
          const url = new URL(raw);
          const parts = url.pathname.split('/').filter(Boolean);
          const last = parts[parts.length - 1];
          if (last) raw = last;
        }
      } catch {
        // Non-URL standard
      }
      const clean = raw
        .replace(/^ALLOTECH:EQUIPEMENT:/i, '')
        .replace(/["']/g, '')
        .trim();

      const equip = await db.query.equipements.findFirst({
        where: or(
          eq(equipements.qrCodeData, clean),
          ilike(equipements.numeroSerie, clean),
          ilike(equipements.modele, `%${clean}%`),
          ...(clean.length === 36 ? [eq(equipements.id, clean)] : []),
        ),
        with: {
          client: true,
          tickets: {
            orderBy: (table, { desc }) => [desc(table.createdAt)],
            limit: 10,
          },
        },
      });

      if (!equip) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Aucun équipement trouvé pour "${clean}". Vérifiez le QR Code ou saisissez le numéro de série.`,
        });
      }

      return equip;
    }),
});

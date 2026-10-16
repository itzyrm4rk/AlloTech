import { db, eq } from '@allotech/db';
import { clients } from '@allotech/db/schema';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { adminProcedure, protectedProcedure, router } from '../trpc';

const clientInputSchema = z.object({
  nom: z.string().min(2, 'Le nom est requis (min. 2 caractères)'),
  typeClient: z.enum(['ENTREPRISE', 'PARTICULIER']),
  telephone: z.string().min(6, 'Le numéro de téléphone est requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  adresse: z.string().optional().or(z.literal('')),
});

export const clientsRouter = router({
  /**
   * Liste des clients avec recherche et filtre en mémoire (dataset gérable)
   */
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(50),
        search: z.string().optional(),
        typeClient: z.enum(['ENTREPRISE', 'PARTICULIER']).optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, limit, search, typeClient } = input;

      // Chargement de tous les clients (dataset typiquement < 1000 pour AlloTech)
      const allClients = await db.query.clients.findMany({
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      });

      // Filtre en mémoire
      let filtered = allClients;

      if (typeClient) {
        filtered = filtered.filter((c) => c.typeClient === typeClient);
      }

      if (search && search.trim().length > 0) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.nom.toLowerCase().includes(q) ||
            c.telephone.includes(q) ||
            (c.email?.toLowerCase().includes(q) ?? false),
        );
      }

      // Pagination manuelle
      const total = filtered.length;
      const offset = (page - 1) * limit;
      const paginated = filtered.slice(offset, offset + limit);

      return {
        data: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  /**
   * Détail d'un client avec ses équipements et tickets
   */
  byId: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, input.id),
      with: {
        equipements: {
          orderBy: (table, { desc }) => [desc(table.createdAt)],
        },
        tickets: {
          orderBy: (table, { desc }) => [desc(table.createdAt)],
          with: {
            techniciens: {
              with: { technicien: true },
            },
          },
        },
      },
    });

    if (!client) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Client introuvable.',
      });
    }

    return client;
  }),

  /**
   * Création d'un nouveau client (Admin uniquement)
   */
  create: adminProcedure.input(clientInputSchema).mutation(async ({ input }) => {
    const [newClient] = await db
      .insert(clients)
      .values({
        nom: input.nom.trim(),
        typeClient: input.typeClient,
        telephone: input.telephone.trim(),
        email: input.email?.trim() || null,
        adresse: input.adresse?.trim() || null,
      })
      .returning();

    if (!newClient) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Échec de la création du client.',
      });
    }

    return newClient;
  }),

  /**
   * Modification d'un client existant (Admin uniquement)
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: clientInputSchema.partial(),
      }),
    )
    .mutation(async ({ input }) => {
      const existing = await db.query.clients.findFirst({
        where: eq(clients.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client introuvable.' });
      }

      const [updated] = await db
        .update(clients)
        .set({
          ...input.data,
          email: input.data.email?.trim() || null,
          adresse: input.data.adresse?.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(clients.id, input.id))
        .returning();

      return updated;
    }),

  /**
   * Suppression d'un client (Admin uniquement) — uniquement si sans tickets actifs
   */
  delete: adminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    const existing = await db.query.clients.findFirst({
      where: eq(clients.id, input.id),
      with: {
        tickets: { limit: 1 },
      },
    });

    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Client introuvable.' });
    }

    if (existing.tickets.length > 0) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message:
          'Impossible de supprimer ce client : il possède des tickets. Archivez les tickets concernés en premier.',
      });
    }

    await db.delete(clients).where(eq(clients.id, input.id));

    return { success: true };
  }),

  /**
   * Liste simplifiée pour les selects (id + nom uniquement)
   */
  listSimple: protectedProcedure.query(async () => {
    return db.query.clients.findMany({
      columns: { id: true, nom: true, typeClient: true },
      orderBy: (table, { asc }) => [asc(table.nom)],
    });
  }),
});

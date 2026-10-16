import { and, db, eq } from '@allotech/db';
import { alertes, ticketTechniciens } from '@allotech/db/schema';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const alertesRouter = router({
  /**
   * Liste toutes les alertes (filtrées par rôle : admin voit tout, technicien voit ses alertes métier)
   */
  list: protectedProcedure
    .input(
      z.object({
        nonLuesSeulement: z.boolean().default(false),
        limit: z.number().int().positive().max(50).default(20),
      }),
    )
    .query(async ({ input, ctx }) => {
      // 1. Cas TECHNICIEN : exclure les alertes administratives globales et ne garder que celles liées à ses tickets ou à son compte
      if (ctx.user.role === 'TECHNICIEN') {
        const techId = ctx.user.technicienId;
        const matricule = ctx.user.matricule;

        // Récupérer les tickets assignés à ce technicien
        const assigned = techId
          ? await db.query.ticketTechniciens.findMany({
              where: eq(ticketTechniciens.technicienId, techId),
            })
          : [];
        const ticketIds = new Set(assigned.map((a) => a.ticketId));

        const allAlertes = await db.query.alertes.findMany({
          with: { ticket: true },
          orderBy: (table, { asc, desc }) => [asc(table.isLue), desc(table.createdAt)],
          limit: 100,
        });

        const filtered = allAlertes.filter((a) => {
          // Les alertes de nouvelle inscription sont réservées aux administrateurs
          if (a.typeAlerte === 'NOUVELLE_INSCRIPTION') return false;

          // Alertes liées aux tickets assignés à ce technicien
          if (a.ticketId && ticketIds.has(a.ticketId)) return true;

          // Alertes ciblant explicitement ce technicien (par matricule)
          if (matricule && a.message.includes(matricule)) return true;

          return false;
        });

        const sliced = filtered.slice(0, input.limit);
        return input.nonLuesSeulement ? sliced.filter((a) => !a.isLue) : sliced;
      }

      // 2. Cas ADMINISTRATEUR : vision globale de toutes les alertes
      const allAlertes = await db.query.alertes.findMany({
        with: { ticket: true },
        orderBy: (table, { asc, desc }) => [asc(table.isLue), desc(table.createdAt)],
        limit: input.limit,
      });

      return input.nonLuesSeulement ? allAlertes.filter((a) => !a.isLue) : allAlertes;
    }),

  /**
   * Nombre d'alertes non lues (pour le badge de la cloche, adapté au rôle)
   */
  countNonLues: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role === 'TECHNICIEN') {
      const techId = ctx.user.technicienId;
      const matricule = ctx.user.matricule;

      const assigned = techId
        ? await db.query.ticketTechniciens.findMany({
            where: eq(ticketTechniciens.technicienId, techId),
          })
        : [];
      const ticketIds = new Set(assigned.map((a) => a.ticketId));

      const all = await db.query.alertes.findMany({
        where: eq(alertes.isLue, false),
      });

      const count = all.filter((a) => {
        if (a.typeAlerte === 'NOUVELLE_INSCRIPTION') return false;
        if (a.ticketId && ticketIds.has(a.ticketId)) return true;
        if (matricule && a.message.includes(matricule)) return true;
        return false;
      }).length;

      return { count };
    }

    const all = await db.query.alertes.findMany({
      where: eq(alertes.isLue, false),
    });
    return { count: all.length };
  }),

  /**
   * Marquer une alerte comme lue
   */
  marquerLue: protectedProcedure
    .input(z.object({ alerteId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await db.update(alertes).set({ isLue: true }).where(eq(alertes.id, input.alerteId));
      return { success: true };
    }),

  /**
   * Marquer toutes les alertes comme lues
   */
  marquerToutesLues: protectedProcedure.mutation(async () => {
    await db.update(alertes).set({ isLue: true }).where(eq(alertes.isLue, false));
    return { success: true };
  }),

  /**
   * Vérification et calcul automatique des alertes SLA (prédictif + dépassement)
   */
  verifierSLA: protectedProcedure.mutation(async () => {
    // Récupérer les tickets en cours de traitement
    const activeTickets = await db.query.tickets.findMany({
      with: {
        client: true,
      },
    });

    const nonClosed = activeTickets.filter(
      (t) => t.statutActuel !== 'CLOTUREE' && t.statutActuel !== 'ANNULEE',
    );

    const now = Date.now();
    let generatedCount = 0;

    for (const t of nonClosed) {
      // Calcul durée SLA standard si non spécifiée
      const durationHours =
        t.urgence === 'CRITIQUE'
          ? 4
          : t.urgence === 'HAUTE'
            ? 8
            : t.urgence === 'NORMALE'
              ? 24
              : 48;

      const echeance = t.slaEcheanceAt
        ? new Date(t.slaEcheanceAt).getTime()
        : new Date(t.createdAt).getTime() + durationHours * 3600 * 1000;

      const totalDuration = durationHours * 3600 * 1000;
      const remainingMs = echeance - now;

      // 1. Dépassement effectif
      if (remainingMs <= 0) {
        const existing = await db.query.alertes.findFirst({
          where: and(eq(alertes.ticketId, t.id), eq(alertes.typeAlerte, 'SLA_DEPASSE')),
        });

        if (!existing) {
          await db.insert(alertes).values({
            ticketId: t.id,
            typeAlerte: 'SLA_DEPASSE',
            message: `Dépassement SLA sur le ticket ${t.reference} (${t.client?.nom || 'Client'}) — Urgence ${t.urgence}.`,
            isLue: false,
          });
          generatedCount++;
        }
      }
      // 2. Alerte prédictive (moins de 25% du temps restant)
      else if (remainingMs <= 0.25 * totalDuration) {
        const existing = await db.query.alertes.findFirst({
          where: and(eq(alertes.ticketId, t.id), eq(alertes.typeAlerte, 'SLA_PREDICTIF')),
        });

        if (!existing) {
          const minRestantes = Math.max(1, Math.round(remainingMs / 60000));
          await db.insert(alertes).values({
            ticketId: t.id,
            typeAlerte: 'SLA_PREDICTIF',
            message: `Risque SLA imminent sur le ticket ${t.reference} (${t.client?.nom || 'Client'}) : moins de ${minRestantes} min restantes.`,
            isLue: false,
          });
          generatedCount++;
        }
      }
    }

    return { success: true, verifiedCount: nonClosed.length, generatedCount };
  }),
});

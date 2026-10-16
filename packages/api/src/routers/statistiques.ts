import { and, db, gte, lte } from '@allotech/db';
import { tickets } from '@allotech/db/schema';
import { z } from 'zod';
import {
  calculateMtta,
  calculateMttr,
  formatMtta,
  formatMttr,
  getResolutionDuration,
} from '../lib/mttr';
import { isSlaRespected } from '../lib/sla';
import { adminProcedure, router } from '../trpc';

const periodeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const statistiquesRouter = router({
  /**
   * Statistiques globales des interventions sur une periode
   */
  getGlobalStats: adminProcedure.input(periodeSchema).query(async ({ input }) => {
    const conditions = [];
    if (input.startDate) {
      conditions.push(gte(tickets.createdAt, new Date(input.startDate)));
    }
    if (input.endDate) {
      conditions.push(lte(tickets.createdAt, new Date(input.endDate)));
    }

    const allTickets = await db.query.tickets.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        techniciens: { with: { technicien: true } },
      },
    });

    const total = allTickets.length;
    const pannes = allTickets.filter((t) => t.typeDemande === 'PANNE').length;
    const installations = allTickets.filter((t) => t.typeDemande === 'INSTALLATION').length;

    const resolus = allTickets.filter(
      (t) => t.statutActuel === 'TERMINEE' || t.statutActuel === 'CLOTUREE',
    );

    // MTTR en minutes (Temps moyen de résolution)
    const mttrMinutes = calculateMttr(
      resolus.map((t) => ({
        heureDemarrage: t.heureDemarrage ?? undefined,
        heureFinale: t.heureFinale ?? undefined,
        clotureAt: t.clotureAt ?? undefined,
        createdAt: t.createdAt,
      })),
    );

    // MTTA en minutes (Temps moyen de prise en charge)
    const mttaMinutes = calculateMtta(
      allTickets.map((t) => ({
        createdAt: t.createdAt,
        assigneAt: t.techniciens[0]?.assigneAt ?? undefined,
        heureDepart: t.heureDepart ?? undefined,
        heureDemarrage: t.heureDemarrage ?? undefined,
      })),
    );

    // Taux SLA
    let slaRespected = 0;
    for (const t of resolus) {
      const resolvedAt = t.clotureAt ?? t.heureFinale;
      if (
        resolvedAt &&
        isSlaRespected(
          t.urgence as 'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'BASSE',
          t.createdAt,
          resolvedAt,
        )
      ) {
        slaRespected++;
      }
    }
    const tauxSla = resolus.length > 0 ? Math.round((slaRespected / resolus.length) * 100) : 100;

    // Par urgence
    const parUrgence = {
      CRITIQUE: allTickets.filter((t) => t.urgence === 'CRITIQUE').length,
      HAUTE: allTickets.filter((t) => t.urgence === 'HAUTE').length,
      NORMALE: allTickets.filter((t) => t.urgence === 'NORMALE').length,
      BASSE: allTickets.filter((t) => t.urgence === 'BASSE').length,
    };

    // Par categorie panne
    const panneTickets = allTickets.filter((t) => t.typeDemande === 'PANNE');
    const parCategorie = {
      MATERIEL: panneTickets.filter((t) => t.categoriePanne === 'MATERIEL').length,
      LOGICIEL: panneTickets.filter((t) => t.categoriePanne === 'LOGICIEL').length,
      nonClassifie: panneTickets.filter((t) => !t.categoriePanne).length,
    };

    // Par statut
    const parStatut = {
      CREEE: allTickets.filter((t) => t.statutActuel === 'CREEE').length,
      ASSIGNEE: allTickets.filter((t) => t.statutActuel === 'ASSIGNEE').length,
      EN_ROUTE: allTickets.filter((t) => t.statutActuel === 'EN_ROUTE').length,
      EN_COURS: allTickets.filter((t) => t.statutActuel === 'EN_COURS').length,
      EN_PAUSE: allTickets.filter((t) => t.statutActuel === 'EN_PAUSE').length,
      TERMINEE: allTickets.filter((t) => t.statutActuel === 'TERMINEE').length,
      CLOTUREE: allTickets.filter((t) => t.statutActuel === 'CLOTUREE').length,
      ANNULEE: allTickets.filter((t) => t.statutActuel === 'ANNULEE').length,
    };

    return {
      total,
      pannes,
      installations,
      resolus: resolus.length,
      mttrMinutes,
      mttrFormate: formatMttr(mttrMinutes),
      mttaMinutes,
      mttaFormate: formatMtta(mttaMinutes),
      tauxSla,
      slaRespected,
      parUrgence,
      parCategorie,
      parStatut,
      periode: {
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
      },
    };
  }),

  /**
   * Performance individuelle par technicien
   */
  getTechniciensPerformance: adminProcedure.input(periodeSchema).query(async ({ input }) => {
    const conditions = [];
    if (input.startDate) {
      conditions.push(gte(tickets.createdAt, new Date(input.startDate)));
    }
    if (input.endDate) {
      conditions.push(lte(tickets.createdAt, new Date(input.endDate)));
    }

    const allTechniciens = await db.query.techniciens.findMany({
      with: { user: true },
    });

    const allTickets = await db.query.tickets.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        techniciens: { with: { technicien: true } },
      },
    });

    const performance = allTechniciens.map((tech) => {
      const techTickets = allTickets.filter((t) =>
        t.techniciens.some((tt) => tt.technicienId === tech.id),
      );

      const resolus = techTickets.filter(
        (t) => t.statutActuel === 'TERMINEE' || t.statutActuel === 'CLOTUREE',
      );

      const mttrMinutes = calculateMttr(
        resolus.map((t) => ({
          heureDemarrage: t.heureDemarrage ?? undefined,
          heureFinale: t.heureFinale ?? undefined,
          clotureAt: t.clotureAt ?? undefined,
          createdAt: t.createdAt,
        })),
      );

      let slaRespected = 0;
      for (const t of resolus) {
        const resolvedAt = t.clotureAt ?? t.heureFinale;
        if (
          resolvedAt &&
          isSlaRespected(
            t.urgence as 'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'BASSE',
            t.createdAt,
            resolvedAt,
          )
        ) {
          slaRespected++;
        }
      }
      const tauxSla = resolus.length > 0 ? Math.round((slaRespected / resolus.length) * 100) : null;

      // Temps total terrain (somme des durees en minutes)
      const durations = resolus
        .map((t) =>
          getResolutionDuration({
            heureDemarrage: t.heureDemarrage ?? undefined,
            heureFinale: t.heureFinale ?? undefined,
            clotureAt: t.clotureAt ?? undefined,
            createdAt: t.createdAt,
          }),
        )
        .filter((d): d is number => d !== null);
      const tempsTotalMinutes = durations.reduce((acc, d) => acc + d, 0);

      return {
        id: tech.id,
        matricule: tech.matricule,
        prenom: tech.prenom,
        nom: tech.nom,
        photoUrl: tech.photoUrl,
        isActif: tech.isActif,
        totalAssignes: techTickets.length,
        resolus: resolus.length,
        mttrMinutes,
        mttrFormate: formatMttr(mttrMinutes),
        tauxSla,
        tempsTotalMinutes,
      };
    });

    // Tri par nombre de resolutions desc
    performance.sort((a, b) => b.resolus - a.resolus);

    return { techniciens: performance };
  }),
});

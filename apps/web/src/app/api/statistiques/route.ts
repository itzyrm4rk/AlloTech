import { calculateMtta, calculateMttr, formatMtta, formatMttr } from '@allotech/api/lib/mttr';
import { isSlaRespected } from '@allotech/api/lib/sla';
import { auth } from '@allotech/auth';
import { and, db, gte, lte } from '@allotech/db';
import { tickets } from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const defaultStart = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const defaultEnd = endDate ? new Date(endDate) : new Date();

    const conditions = [gte(tickets.createdAt, defaultStart), lte(tickets.createdAt, defaultEnd)];

    const allTickets = await db.query.tickets.findMany({
      where: and(...conditions),
      with: {
        client: true,
        techniciens: { with: { technicien: true } },
      },
    });

    const total = allTickets.length;
    const pannes = allTickets.filter((t) => t.typeDemande === 'PANNE').length;
    const installations = allTickets.filter((t) => t.typeDemande === 'INSTALLATION').length;

    const resolus = allTickets.filter(
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

    const mttaMinutes = calculateMtta(
      allTickets.map((t) => ({
        createdAt: t.createdAt,
        assigneAt: t.techniciens[0]?.assigneAt ?? undefined,
        heureDepart: t.heureDepart ?? undefined,
        heureDemarrage: t.heureDemarrage ?? undefined,
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
    const tauxSla = resolus.length > 0 ? Math.round((slaRespected / resolus.length) * 100) : 100;

    const parUrgence = {
      CRITIQUE: allTickets.filter((t) => t.urgence === 'CRITIQUE').length,
      HAUTE: allTickets.filter((t) => t.urgence === 'HAUTE').length,
      NORMALE: allTickets.filter((t) => t.urgence === 'NORMALE').length,
      BASSE: allTickets.filter((t) => t.urgence === 'BASSE').length,
    };

    const panneTickets = allTickets.filter((t) => t.typeDemande === 'PANNE');
    const parCategorie = {
      MATERIEL: panneTickets.filter((t) => t.categoriePanne === 'MATERIEL').length,
      LOGICIEL: panneTickets.filter((t) => t.categoriePanne === 'LOGICIEL').length,
    };

    const parStatut = {
      CREEE: allTickets.filter((t) => t.statutActuel === 'CREEE').length,
      ASSIGNEE: allTickets.filter((t) => t.statutActuel === 'ASSIGNEE').length,
      EN_COURS: allTickets.filter((t) => t.statutActuel === 'EN_COURS').length,
      TERMINEE: allTickets.filter((t) => t.statutActuel === 'TERMINEE').length,
      CLOTUREE: allTickets.filter((t) => t.statutActuel === 'CLOTUREE').length,
    };

    const allTechs = await db.query.techniciens.findMany({
      with: { user: true },
    });

    const techniciensStats = allTechs.map((tech) => {
      const techTickets = allTickets.filter((t) =>
        t.techniciens.some((tt) => tt.technicienId === tech.id),
      );
      const techResolus = techTickets.filter(
        (t) => t.statutActuel === 'TERMINEE' || t.statutActuel === 'CLOTUREE',
      );

      const techMttr = calculateMttr(
        techResolus.map((t) => ({
          heureDemarrage: t.heureDemarrage ?? undefined,
          heureFinale: t.heureFinale ?? undefined,
          clotureAt: t.clotureAt ?? undefined,
          createdAt: t.createdAt,
        })),
      );

      let techSlaRespected = 0;
      for (const t of techResolus) {
        const resolvedAt = t.clotureAt ?? t.heureFinale;
        if (
          resolvedAt &&
          isSlaRespected(
            t.urgence as 'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'BASSE',
            t.createdAt,
            resolvedAt,
          )
        ) {
          techSlaRespected++;
        }
      }

      const tauxSla =
        techResolus.length > 0 ? Math.round((techSlaRespected / techResolus.length) * 100) : null;

      const tempsTotalMinutes = techResolus.reduce((acc, t) => {
        const start = t.heureDemarrage
          ? new Date(t.heureDemarrage).getTime()
          : new Date(t.createdAt).getTime();
        const end = t.clotureAt
          ? new Date(t.clotureAt).getTime()
          : t.heureFinale
            ? new Date(t.heureFinale).getTime()
            : Date.now();
        return acc + Math.max(0, Math.round((end - start) / 60000));
      }, 0);

      return {
        id: tech.id,
        matricule: tech.matricule,
        prenom: tech.prenom,
        nom: tech.nom,
        photoUrl: tech.photoUrl,
        isActif: tech.isActif,
        totalAssignes: techTickets.length,
        resolus: techResolus.length,
        mttrMinutes: techMttr,
        mttrFormate: formatMttr(techMttr),
        tauxSla,
        tempsTotalMinutes,
      };
    });

    return NextResponse.json({
      success: true,
      globalStats: {
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
      },
      techniciens: techniciensStats,
      periode: {
        startDate: defaultStart.toISOString(),
        endDate: defaultEnd.toISOString(),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

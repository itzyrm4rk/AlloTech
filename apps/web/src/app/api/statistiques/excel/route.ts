import { calculateMttr, formatMttr, getResolutionDuration, isSlaRespected } from '@allotech/api';
import { auth } from '@allotech/auth';
import { and, db, gte, lte } from '@allotech/db';
import { tickets } from '@allotech/db/schema';
import ExcelJS from 'exceljs';
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
    const defaultStart = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate') as string)
      : new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const defaultEnd = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate') as string)
      : new Date();

    const [allTickets, allTechs] = await Promise.all([
      db.query.tickets.findMany({
        where: and(gte(tickets.createdAt, defaultStart), lte(tickets.createdAt, defaultEnd)),
        with: { client: true, techniciens: { with: { technicien: true } } },
      }),
      db.query.techniciens.findMany({
        with: { user: true },
      }),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AlloTech';
    workbook.created = new Date();

    // ---- Feuille 1 : Synthese ----
    const synthSheet = workbook.addWorksheet('Synthese', {
      properties: { tabColor: { argb: 'FF31525B' } },
    });

    const primaryFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF31525B' },
    };
    const headerFont: Partial<ExcelJS.Font> = {
      name: 'Calibri',
      size: 12,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };

    // Titre
    synthSheet.mergeCells('A1:E1');
    const titleCell = synthSheet.getCell('A1');
    titleCell.value = "RAPPORT D'ACTIVITE ALLOTECH";
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = primaryFill;
    synthSheet.getRow(1).height = 36;

    // Periode
    synthSheet.mergeCells('A2:E2');
    const periodeCell = synthSheet.getCell('A2');
    periodeCell.value = `Periode : ${defaultStart.toLocaleDateString('fr-FR')} au ${defaultEnd.toLocaleDateString('fr-FR')}`;
    periodeCell.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF64748B' } };
    periodeCell.alignment = { horizontal: 'center' };

    synthSheet.addRow([]);

    // KPIs
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
    let slaOk = 0;
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
        slaOk++;
      }
    }
    const tauxSla = resolus.length > 0 ? Math.round((slaOk / resolus.length) * 100) : 100;

    const kpiHeaders = synthSheet.addRow(['Indicateur', 'Valeur']);
    kpiHeaders.eachCell((cell) => {
      cell.font = headerFont;
      cell.fill = primaryFill;
    });

    const kpis = [
      ['Total interventions', allTickets.length],
      ['Pannes', allTickets.filter((t) => t.typeDemande === 'PANNE').length],
      ['Installations', allTickets.filter((t) => t.typeDemande === 'INSTALLATION').length],
      ['Resolues & Cloturees', resolus.length],
      ['MTTR moyen', formatMttr(mttrMinutes)],
      ['Taux respect SLA', `${tauxSla}%`],
      ['SLA respectes', slaOk],
      ['SLA non respectes', resolus.length - slaOk],
    ];
    for (const [label, value] of kpis) {
      synthSheet.addRow([label, value]);
    }
    synthSheet.getColumn(1).width = 30;
    synthSheet.getColumn(2).width = 20;

    // ---- Feuille 2 : Performance Techniciens ----
    const techSheet = workbook.addWorksheet('Performance Techniciens', {
      properties: { tabColor: { argb: 'FFFFA101' } },
    });

    const techHeaders = techSheet.addRow([
      'Matricule',
      'Nom & Prénom',
      'Statut',
      'Assignés',
      'Résolus',
      'En cours',
      'Taux Respect SLA',
      'MTTR Moyen',
    ]);
    techHeaders.eachCell((cell) => {
      cell.font = headerFont;
      cell.fill = primaryFill;
    });

    for (const tech of allTechs) {
      const techTickets = allTickets.filter((t) =>
        t.techniciens.some((tt) => tt.technicienId === tech.id),
      );
      const techResolus = techTickets.filter(
        (t) => t.statutActuel === 'TERMINEE' || t.statutActuel === 'CLOTUREE',
      );
      const techEnCours = techTickets.length - techResolus.length;

      const techMttr = calculateMttr(
        techResolus.map((t) => ({
          heureDemarrage: t.heureDemarrage ?? undefined,
          heureFinale: t.heureFinale ?? undefined,
          clotureAt: t.clotureAt ?? undefined,
          createdAt: t.createdAt,
        })),
      );

      let techSlaOk = 0;
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
          techSlaOk++;
        }
      }

      const techTauxSla =
        techResolus.length > 0 ? Math.round((techSlaOk / techResolus.length) * 100) : null;

      const row = techSheet.addRow([
        tech.matricule,
        `${tech.prenom} ${tech.nom}`.trim(),
        tech.isActif ? 'Actif' : 'Inactif',
        techTickets.length,
        techResolus.length,
        techEnCours,
        techTauxSla !== null ? `${techTauxSla}%` : 'N/A',
        formatMttr(techMttr),
      ]);

      if (techTauxSla !== null) {
        if (techTauxSla >= 80) {
          row.getCell(7).font = { color: { argb: 'FF2E8B57' }, bold: true };
        } else if (techTauxSla >= 60) {
          row.getCell(7).font = { color: { argb: 'FFD97706' }, bold: true };
        } else {
          row.getCell(7).font = { color: { argb: 'FFC0392B' }, bold: true };
        }
      }
    }

    const techColWidths = [16, 26, 14, 14, 14, 14, 18, 16];
    techColWidths.forEach((w, idx) => {
      techSheet.getColumn(idx + 1).width = w;
    });
    techSheet.autoFilter = { from: 'A1', to: 'H1' };

    // ---- Feuille 3 : Detail Tickets ----
    const detailSheet = workbook.addWorksheet('Detail Tickets', {
      properties: { tabColor: { argb: 'FF64748B' } },
    });

    const detailHeaders = detailSheet.addRow([
      'Reference',
      'Type',
      'Urgence',
      'Statut',
      'Client',
      'Adresse',
      'Cree le',
      'Resolu le',
      'Duree (min)',
      'SLA Respecte',
    ]);
    detailHeaders.eachCell((cell) => {
      cell.font = headerFont;
      cell.fill = primaryFill;
    });

    for (const t of allTickets) {
      const resolvedAt = t.clotureAt ?? t.heureFinale;
      const duration = getResolutionDuration({
        heureDemarrage: t.heureDemarrage ?? undefined,
        heureFinale: t.heureFinale ?? undefined,
        clotureAt: t.clotureAt ?? undefined,
        createdAt: t.createdAt,
      });
      const slaResp = resolvedAt
        ? isSlaRespected(
            t.urgence as 'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'BASSE',
            t.createdAt,
            resolvedAt,
          )
          ? 'OUI'
          : 'NON'
        : 'N/A';

      const row = detailSheet.addRow([
        t.reference,
        t.typeDemande,
        t.urgence,
        t.statutActuel,
        (t.client as { nom: string } | null)?.nom ?? 'Inconnu',
        t.adresseSite,
        t.createdAt.toLocaleDateString('fr-FR'),
        resolvedAt?.toLocaleDateString('fr-FR') ?? '',
        duration ?? '',
        slaResp,
      ]);

      if (slaResp === 'NON') {
        row.getCell(10).font = { color: { argb: 'FFC0392B' }, bold: true };
      } else if (slaResp === 'OUI') {
        row.getCell(10).font = { color: { argb: 'FF2E8B57' }, bold: true };
      }
    }

    for (let i = 1; i <= 10; i++) {
      detailSheet.getColumn(i).width = 18;
    }
    detailSheet.autoFilter = { from: 'A1', to: 'J1' };

    // ---- Generation du buffer ----
    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="allotech-statistiques-${defaultStart.toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

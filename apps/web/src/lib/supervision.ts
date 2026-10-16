import { db, desc } from '@allotech/db';
import { tickets } from '@allotech/db/schema';

export interface GetSupervisionOptions {
  inclureClotures?: boolean;
  filtreUrgence?: string | null;
  filtreType?: string | null;
}

export async function getSupervisionData(options: GetSupervisionOptions = {}) {
  const { inclureClotures = false, filtreUrgence, filtreType } = options;

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
    orderBy: [desc(tickets.createdAt)],
  });

  const now = Date.now();

  const filtered = allTickets.filter((t) => {
    if (!inclureClotures && (t.statutActuel === 'CLOTUREE' || t.statutActuel === 'ANNULEE')) {
      return false;
    }
    if (filtreUrgence && t.urgence !== filtreUrgence) {
      return false;
    }
    if (filtreType && t.typeDemande !== filtreType) {
      return false;
    }
    return true;
  });

  const enriched = filtered.map((t) => {
    const durationHours =
      t.urgence === 'CRITIQUE' ? 4 : t.urgence === 'HAUTE' ? 8 : t.urgence === 'NORMALE' ? 24 : 48;
    const totalDurationMs = durationHours * 3600 * 1000;
    const createdAtMs = new Date(t.createdAt).getTime();
    const echeanceMs = t.slaEcheanceAt
      ? new Date(t.slaEcheanceAt).getTime()
      : createdAtMs + totalDurationMs;
    const remainingMs = echeanceMs - now;
    const elapsedMs = now - createdAtMs;
    const progressPct = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));
    const isDepasse = remainingMs <= 0 && t.statutActuel !== 'CLOTUREE';
    const isImminent =
      !isDepasse && remainingMs <= 0.25 * totalDurationMs && t.statutActuel !== 'CLOTUREE';

    let lat = t.latitudeSite ? Number.parseFloat(t.latitudeSite) : null;
    let lng = t.longitudeSite ? Number.parseFloat(t.longitudeSite) : null;

    // Coordonnées par défaut si absentes
    if (!lat || !lng || Number.isNaN(lat) || Number.isNaN(lng)) {
      lat = 4.0511 + Math.sin(createdAtMs) * 0.025;
      lng = 9.7085 + Math.cos(createdAtMs) * 0.025;
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
      latitudeDemarrage: t.latitudeDemarrage,
      longitudeDemarrage: t.longitudeDemarrage,
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
      equipement: t.equipement
        ? {
            id: t.equipement.id,
            modele: t.equipement.modele,
            numeroSerie: t.equipement.numeroSerie,
            statut: t.equipement.statut,
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
    success: true,
    tickets: enriched,
    kpis,
    refreshedAt: new Date().toISOString(),
  };
}

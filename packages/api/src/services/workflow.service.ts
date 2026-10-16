import { db, eq } from '@allotech/db';
import { equipements, statutsHistorique, techniciens, tickets } from '@allotech/db/schema';
import { TRPCError } from '@trpc/server';

export type TicketStatut =
  | 'CREEE'
  | 'ASSIGNEE'
  | 'EN_ROUTE'
  | 'EN_COURS'
  | 'EN_PAUSE'
  | 'TERMINEE'
  | 'CLOTUREE'
  | 'ANNULEE';

export const ALLOWED_TRANSITIONS: Record<TicketStatut, TicketStatut[]> = {
  CREEE: ['ASSIGNEE', 'ANNULEE'],
  ASSIGNEE: ['EN_ROUTE', 'ANNULEE'],
  EN_ROUTE: ['EN_COURS', 'ANNULEE'],
  EN_COURS: ['EN_PAUSE', 'TERMINEE'],
  EN_PAUSE: ['EN_COURS', 'ANNULEE'],
  TERMINEE: ['CLOTUREE'],
  CLOTUREE: [],
  ANNULEE: [],
};

export interface TransitionTicketInput {
  ticketId: string;
  nouveauStatut: TicketStatut;
  latitude?: string;
  longitude?: string;
  motif?: string;
  user: {
    role: string;
    adminId?: string | null;
    technicienId?: string | null;
  };
}

/**
 * Service de gestion des transitions de statut et d'historisation
 */
export async function executeTicketTransition(input: TransitionTicketInput) {
  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, input.ticketId),
  });

  if (!ticket) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket introuvable.' });
  }

  // Concurrence optimiste & Idempotence : si le statut actuel est déjà le statut demandé
  if (ticket.statutActuel === input.nouveauStatut) {
    return {
      success: true,
      statut: ticket.statutActuel,
      alreadyUpdated: true,
      message: `Ce ticket est déjà au statut ${ticket.statutActuel}.`,
    };
  }

  const allowed = ALLOWED_TRANSITIONS[ticket.statutActuel] ?? [];
  if (!allowed.includes(input.nouveauStatut)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Transition interdite : ${ticket.statutActuel} → ${input.nouveauStatut}`,
    });
  }

  // Données additionnelles selon le statut
  const updateData: Record<string, unknown> = {
    statutActuel: input.nouveauStatut,
    updatedAt: new Date(),
  };

  if (input.nouveauStatut === 'EN_ROUTE') {
    updateData.heureDepart = new Date();
  }

  if (input.nouveauStatut === 'EN_COURS') {
    if (!ticket.heureDemarrage) {
      updateData.heureDemarrage = new Date();
    }
    if (input.latitude) updateData.latitudeDemarrage = input.latitude;
    if (input.longitude) updateData.longitudeDemarrage = input.longitude;
  }

  if (input.nouveauStatut === 'TERMINEE') {
    updateData.heureFinale = new Date();
  }

  if (input.nouveauStatut === 'CLOTUREE') {
    updateData.clotureAt = new Date();
  }

  await db.update(tickets).set(updateData).where(eq(tickets.id, input.ticketId));

  // Si clôturé et que le ticket est une panne avec un équipement lié (matériel ou logiciel), remise en EN_SERVICE
  if (input.nouveauStatut === 'CLOTUREE' && ticket.typeDemande === 'PANNE' && ticket.equipementId) {
    await db
      .update(equipements)
      .set({
        statut: 'EN_SERVICE',
        updatedAt: new Date(),
      })
      .where(eq(equipements.id, ticket.equipementId));
  }

  // Déterminer l'auteur
  let auteurAdminId: string | null = null;
  let auteurTechId: string | null = null;

  if (input.user.role === 'ADMIN' && input.user.adminId) {
    auteurAdminId = input.user.adminId;
  } else if (input.user.role === 'TECHNICIEN' && input.user.technicienId) {
    auteurTechId = input.user.technicienId;
  }

  // Enrichir le motif avec l'identité de l'auteur si disponible
  let motifFinal = input.motif?.trim() || null;
  if (auteurTechId) {
    const tech = await db.query.techniciens.findFirst({
      where: eq(techniciens.id, auteurTechId),
      columns: { prenom: true, nom: true, matricule: true },
    });
    if (tech && !motifFinal?.includes(tech.matricule)) {
      motifFinal = motifFinal
        ? `${motifFinal} (par ${tech.prenom} ${tech.nom} - ${tech.matricule})`
        : `Statut mis à jour par ${tech.prenom} ${tech.nom} (${tech.matricule})`;
    }
  }

  // Enregistrement dans l'historique
  await db.insert(statutsHistorique).values({
    ticketId: input.ticketId,
    statutPrecedent: ticket.statutActuel,
    statutNouvel: input.nouveauStatut,
    auteurAdminId,
    auteurTechId,
    motif: motifFinal,
  });

  return { success: true, statut: input.nouveauStatut };
}

import { auth } from '@allotech/auth';
import { db, eq } from '@allotech/db';
import {
  administrateurs,
  statutsHistorique,
  ticketTechniciens,
  tickets,
} from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// PATCH /api/tickets/[id]/reassign — Réaffectation des techniciens assignés
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const admin = await db.query.administrateurs.findFirst({
      where: eq(administrateurs.userId, session.user.id),
    });
    if (!admin) {
      return NextResponse.json({ error: 'Compte administrateur requis.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const technicienIds: string[] = body.technicienIds ?? [];
    const motif: string = body.motif ?? 'Réaffectation manuelle par administrateur';

    // Vérifier que le ticket existe
    const ticket = await db.query.tickets.findFirst({
      where: eq(tickets.id, id),
    });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket introuvable.' }, { status: 404 });
    }

    // Supprimer les anciennes assignations
    await db.delete(ticketTechniciens).where(eq(ticketTechniciens.ticketId, id));

    // Insérer les nouvelles assignations
    if (technicienIds.length > 0) {
      await db.insert(ticketTechniciens).values(
        technicienIds.map((tid: string) => ({
          ticketId: id,
          technicienId: tid,
        })),
      );
    }

    // Mettre à jour le statut vers ASSIGNEE
    const newStatut = technicienIds.length > 0 ? 'ASSIGNEE' : 'CREEE';
    await db
      .update(tickets)
      .set({ statutActuel: newStatut as 'ASSIGNEE' | 'CREEE', updatedAt: new Date() })
      .where(eq(tickets.id, id));

    // Tracer dans l'historique
    await db.insert(statutsHistorique).values({
      ticketId: id,
      statutPrecedent: ticket.statutActuel,
      statutNouvel: newStatut as 'ASSIGNEE' | 'CREEE',
      auteurAdminId: admin.id,
      motif,
    });

    return NextResponse.json({
      success: true,
      message:
        technicienIds.length > 0
          ? `Ticket réaffecté à ${technicienIds.length} technicien(s).`
          : 'Ticket désassigné.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur lors de la réaffectation';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

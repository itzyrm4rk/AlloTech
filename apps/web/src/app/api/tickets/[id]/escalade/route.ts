import { auth } from '@allotech/auth';
import { db, eq } from '@allotech/db';
import { administrateurs, statutsHistorique, tickets } from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

const URGENCES_VALIDES = ['CRITIQUE', 'HAUTE', 'NORMALE', 'BASSE'] as const;
type Urgence = (typeof URGENCES_VALIDES)[number];

// PATCH /api/tickets/[id]/escalade — Escalade d'urgence d'un ticket
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
    const nouvelleUrgence: Urgence = body.urgence;
    const motif: string = body.motif ?? `Escalade d'urgence vers ${nouvelleUrgence}`;

    if (!URGENCES_VALIDES.includes(nouvelleUrgence)) {
      return NextResponse.json({ error: "Niveau d'urgence invalide." }, { status: 400 });
    }

    // Vérifier que le ticket existe
    const ticket = await db.query.tickets.findFirst({
      where: eq(tickets.id, id),
    });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket introuvable.' }, { status: 404 });
    }

    if (ticket.urgence === nouvelleUrgence) {
      return NextResponse.json(
        { error: "Le ticket est déjà à ce niveau d'urgence." },
        { status: 400 },
      );
    }

    // Mettre à jour l'urgence
    await db
      .update(tickets)
      .set({ urgence: nouvelleUrgence, updatedAt: new Date() })
      .where(eq(tickets.id, id));

    // Tracer le changement dans l'historique statuts (on réutilise le même statut, juste un message)
    await db.insert(statutsHistorique).values({
      ticketId: id,
      statutPrecedent: ticket.statutActuel,
      statutNouvel: ticket.statutActuel,
      auteurAdminId: admin.id,
      motif: `Urgence escaladée de ${ticket.urgence} → ${nouvelleUrgence}. ${motif}`,
    });

    return NextResponse.json({
      success: true,
      message: `Urgence mise à jour : ${ticket.urgence} → ${nouvelleUrgence}.`,
      urgence: nouvelleUrgence,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur lors de l'escalade";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

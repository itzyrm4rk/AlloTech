import { provisionEquipementInstallation } from '@allotech/api';
import { auth } from '@allotech/auth';
import { db, eq } from '@allotech/db';
import { administrateurs, alertes, statutsHistorique, tickets } from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// POST /api/tickets/[id]/valider-cloture — Validation finale et clôture officielle par l'administrateur
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
      return NextResponse.json({ error: 'Action réservée aux administrateurs.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const commentaire =
      body.commentaire?.trim() ||
      'Validation administrative conforme après inspection des livrables terrain.';

    const ticket = await db.query.tickets.findFirst({
      where: eq(tickets.id, id),
      with: { client: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket introuvable.' }, { status: 404 });
    }

    if (ticket.statutActuel === 'CLOTUREE') {
      return NextResponse.json({ error: 'Ce ticket est déjà clôturé.' }, { status: 400 });
    }

    const now = new Date();

    // Provisionnement automatique dans la CMDB si installation (ou activation si pré-assigné / réparé)
    const { updatedEquipementId, nouvelEquipementCree } = await provisionEquipementInstallation({
      ticket: {
        reference: ticket.reference,
        clientId: ticket.clientId,
        equipementId: ticket.equipementId,
        typeDemande: ticket.typeDemande,
        adresseSite: ticket.adresseSite,
        equipementsDescription: ticket.equipementsDescription,
        categoriePanne: ticket.categoriePanne,
        description: ticket.description,
      },
      equipementInstallation: body.equipementInstallation,
    });

    // Mise à jour vers CLOTUREE avec association de l'équipement
    await db
      .update(tickets)
      .set({
        statutActuel: 'CLOTUREE',
        equipementId: updatedEquipementId,
        clotureAt: now,
        heureFinale: ticket.heureFinale ?? now,
        updatedAt: now,
      })
      .where(eq(tickets.id, id));

    // Historique
    await db.insert(statutsHistorique).values({
      ticketId: id,
      statutPrecedent: ticket.statutActuel,
      statutNouvel: 'CLOTUREE',
      auteurAdminId: admin.id,
      motif: commentaire,
    });

    // Alerte
    await db.insert(alertes).values({
      ticketId: id,
      typeAlerte: 'CLOTURE',
      message: `Ticket ${ticket.reference} (${ticket.client.nom}) clôturé et archivé par l'administrateur.`,
      isLue: false,
    });

    return NextResponse.json({
      success: true,
      message: `Intervention ${ticket.reference} validée et clôturée avec succès.`,
      clotureAt: now.toISOString(),
      equipementId: updatedEquipementId,
      equipementCree: nouvelEquipementCree,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur lors de la clôture';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

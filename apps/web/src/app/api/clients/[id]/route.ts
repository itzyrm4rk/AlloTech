import { auth } from '@allotech/auth';
import { db, eq } from '@allotech/db';
import { clients, equipements, tickets } from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/clients/[id] — Détails complets d'un client avec équipements et tickets
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Identifiant client manquant.' }, { status: 400 });
    }

    const client = await db.query.clients.findFirst({
      where: eq(clients.id, id),
      with: {
        equipements: {
          orderBy: (e, { desc }) => [desc(e.createdAt)],
        },
        tickets: {
          orderBy: (t, { desc }) => [desc(t.createdAt)],
          with: {
            techniciens: {
              with: {
                technicien: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client introuvable.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, client });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT /api/clients/[id] — Mise à jour des informations du client
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const nom = body.nom?.trim();
    const typeClient = body.typeClient === 'PARTICULIER' ? 'PARTICULIER' : 'ENTREPRISE';
    const telephone = body.telephone?.trim();
    const email = body.email?.trim().toLowerCase() || null;
    const adresse = body.adresse?.trim() || null;

    if (!nom || nom.length < 2) {
      return NextResponse.json(
        { error: 'Le nom du client est requis (2 caractères minimum).' },
        { status: 400 },
      );
    }

    if (!telephone || telephone.length < 6) {
      return NextResponse.json({ error: 'Le numéro de téléphone est requis.' }, { status: 400 });
    }

    if (!adresse || adresse.length < 3) {
      return NextResponse.json(
        { error: "L'adresse géographique / site du client est requise (3 caractères minimum)." },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(clients)
      .set({
        nom,
        typeClient,
        telephone,
        email,
        adresse,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Client introuvable.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      client: updated,
      message: 'Client mis à jour avec succès.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur lors de la modification';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/clients/[id] — Suppression d'un client
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier les contraintes (équipements / tickets liés)
    const existingTickets = await db.query.tickets.findFirst({
      where: eq(tickets.clientId, id),
    });

    if (existingTickets) {
      return NextResponse.json(
        {
          error:
            'Impossible de supprimer ce client car des tickets d’intervention y sont rattachés.',
        },
        { status: 400 },
      );
    }

    const existingEquipements = await db.query.equipements.findFirst({
      where: eq(equipements.clientId, id),
    });

    if (existingEquipements) {
      return NextResponse.json(
        {
          error:
            'Impossible de supprimer ce client car des équipements CMDB lui sont rattachés. Supprimez ou transférez d’abord ses équipements.',
        },
        { status: 400 },
      );
    }

    await db.delete(clients).where(eq(clients.id, id));

    return NextResponse.json({
      success: true,
      message: 'Client supprimé avec succès.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur lors de la suppression';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

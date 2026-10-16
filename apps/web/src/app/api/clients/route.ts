import { auth } from '@allotech/auth';
import { db } from '@allotech/db';
import { clients } from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// GET /api/clients — Récupère tous les clients avec leurs parcs d'équipements et tickets
export async function GET() {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const clientList = await db.query.clients.findMany({
      with: {
        equipements: true,
        tickets: true,
      },
      orderBy: (c, { desc }) => [desc(c.createdAt)],
    });

    return NextResponse.json({ success: true, clients: clientList });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/clients — Création manuelle d'un nouveau client
export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé. Veuillez vous connecter.' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const nom = body.nom?.trim();
    const typeClient = body.typeClient === 'PARTICULIER' ? 'PARTICULIER' : 'ENTREPRISE';
    const telephone = body.telephone?.trim();
    const email = body.email?.trim().toLowerCase() || null;
    const adresse = body.adresse?.trim() || null;

    if (!nom || nom.length < 2) {
      return NextResponse.json(
        { error: 'Le nom du client ou de l’entreprise est requis.' },
        { status: 400 },
      );
    }

    if (!telephone || telephone.length < 6) {
      return NextResponse.json(
        { error: 'Un numéro de téléphone valide est requis.' },
        { status: 400 },
      );
    }

    if (!adresse || adresse.length < 3) {
      return NextResponse.json(
        { error: "L'adresse géographique / site du client est requise (3 caractères minimum)." },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(clients)
      .values({
        nom,
        typeClient,
        telephone,
        email,
        adresse,
      })
      .returning();

    return NextResponse.json({
      success: true,
      client: created,
      message: `Client ${nom} créé avec succès.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur lors de la création du client';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

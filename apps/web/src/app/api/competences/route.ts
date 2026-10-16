import { auth } from '@allotech/auth';
import { db, eq } from '@allotech/db';
import { competences } from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// GET /api/competences — liste toutes les compétences
export async function GET() {
  try {
    const list = await db.select().from(competences).orderBy(competences.libelle);
    return NextResponse.json({ success: true, competences: list });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/competences — crée une compétence (admin only)
export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const body = await req.json();
    const libelle = body.libelle?.trim();

    if (!libelle || libelle.length < 3) {
      return NextResponse.json(
        { error: 'Le libellé doit contenir au moins 3 caractères.' },
        { status: 400 },
      );
    }

    const existing = await db.query.competences.findFirst({
      where: eq(competences.libelle, libelle),
    });

    if (existing) {
      return NextResponse.json(
        { error: `La compétence "${libelle}" existe déjà.` },
        { status: 409 },
      );
    }

    const [newComp] = await db.insert(competences).values({ libelle }).returning();
    return NextResponse.json({ success: true, competence: newComp });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

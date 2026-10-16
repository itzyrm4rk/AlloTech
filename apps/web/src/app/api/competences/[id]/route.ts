import { auth } from '@allotech/auth';
import { db, eq } from '@allotech/db';
import { competences, technicienCompetences } from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH & PUT /api/competences/[id] — renomme une compétence
export async function PUT(req: Request, context: RouteParams) {
  return PATCH(req, context);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const libelle = body.libelle?.trim();

    if (!libelle || libelle.length < 3) {
      return NextResponse.json(
        { error: 'Le libellé doit contenir au moins 3 caractères.' },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(competences)
      .set({ libelle })
      .where(eq(competences.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Compétence introuvable.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, competence: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/competences/[id] — supprime une compétence
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const { id } = await params;

    // Supprimer d'abord les liaisons technicien↔compétence
    await db.delete(technicienCompetences).where(eq(technicienCompetences.competenceId, id));

    const [deleted] = await db.delete(competences).where(eq(competences.id, id)).returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Compétence introuvable.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

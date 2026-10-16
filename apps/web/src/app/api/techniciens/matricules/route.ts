import { auth } from '@allotech/auth';
import { db, eq } from '@allotech/db';
import { matriculesAutorises, techniciens } from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// GET /api/techniciens/matricules — Liste des matricules pré-enregistrés par l'administrateur
export async function GET() {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const list = await db.query.matriculesAutorises.findMany({
      orderBy: (m, { desc }) => [desc(m.createdAt)],
    });

    return NextResponse.json({ success: true, matricules: list });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/techniciens/matricules — Pré-enregistrement d'un matricule autorisé par l'admin
// RÈGLE MÉTIER : L'administrateur ajoute uniquement le matricule. Il ne peut pas créer de compte.
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
    const matricule = body.matricule?.trim().toUpperCase();

    if (!matricule || matricule.length < 2) {
      return NextResponse.json(
        { error: 'Le matricule est requis (ex: TEC-001).' },
        { status: 400 },
      );
    }

    // 1. Vérifier si le matricule est déjà dans les matricules autorisés
    const existingMatricule = await db.query.matriculesAutorises.findFirst({
      where: eq(matriculesAutorises.matricule, matricule),
    });

    if (existingMatricule) {
      return NextResponse.json(
        {
          error: `Le matricule "${matricule}" est déjà pré-enregistré ${
            existingMatricule.isUtilise
              ? '(déjà utilisé par un technicien)'
              : '(en attente d’inscription)'
          }.`,
        },
        { status: 409 },
      );
    }

    // 2. Vérifier si un technicien existe déjà avec ce matricule
    const existingTech = await db.query.techniciens.findFirst({
      where: eq(techniciens.matricule, matricule),
    });

    if (existingTech) {
      return NextResponse.json(
        { error: `Le matricule "${matricule}" est déjà utilisé par un compte technicien.` },
        { status: 409 },
      );
    }

    // 3. Insertion du matricule autorisé
    const [created] = await db
      .insert(matriculesAutorises)
      .values({
        matricule,
        isUtilise: false,
      })
      .returning();

    return NextResponse.json({
      success: true,
      matricule: created,
      message: `Matricule ${matricule} autorisé avec succès. Le technicien peut maintenant créer son compte sur l'application mobile.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur lors de l’enregistrement.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/techniciens/matricules?id=... — Supprimer un matricule autorisé non encore utilisé
export async function DELETE(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis.' }, { status: 400 });
    }

    const item = await db.query.matriculesAutorises.findFirst({
      where: eq(matriculesAutorises.id, id),
    });

    if (!item) {
      return NextResponse.json({ error: 'Matricule introuvable.' }, { status: 404 });
    }

    if (item.isUtilise) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un matricule déjà utilisé par un technicien.' },
        { status: 400 },
      );
    }

    await db.delete(matriculesAutorises).where(eq(matriculesAutorises.id, id));

    return NextResponse.json({ success: true, message: 'Matricule supprimé avec succès.' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { auth } from '@allotech/auth';
import { db, eq } from '@allotech/db';
import { equipements, tickets } from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/equipements/[id]
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const { id } = await params;
    const equipement = await db.query.equipements.findFirst({
      where: eq(equipements.id, id),
      with: {
        client: true,
        tickets: {
          orderBy: (t, { desc }) => [desc(t.createdAt)],
          with: {
            techniciens: {
              with: {
                technicien: true,
              },
            },
            rapport: {
              with: {
                technicien: true,
              },
            },
          },
        },
      },
    });

    if (!equipement) {
      return NextResponse.json({ error: 'Équipement introuvable.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, equipement });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT /api/equipements/[id]
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const modele = body.modele !== undefined ? body.modele?.trim() : undefined;
    const siteAdresse =
      body.siteAdresse !== undefined ? body.siteAdresse?.trim() || null : undefined;
    const statut = ['EN_SERVICE', 'EN_PANNE', 'EN_REFORME'].includes(body.statut)
      ? body.statut
      : undefined;
    const typeActif = ['MATERIEL', 'LOGICIEL'].includes(body.typeActif)
      ? body.typeActif
      : undefined;
    const editeur = body.editeur !== undefined ? body.editeur?.trim() || null : undefined;
    const version = body.version !== undefined ? body.version?.trim() || null : undefined;
    const clientId = body.clientId !== undefined ? body.clientId : undefined;
    const dateInstallation =
      body.dateInstallation !== undefined
        ? body.dateInstallation
          ? new Date(body.dateInstallation)
          : null
        : undefined;

    if (modele !== undefined && (!modele || modele.length < 2)) {
      return NextResponse.json(
        { error: 'Le modèle ou libellé de l’équipement est requis (2 caractères min).' },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(equipements)
      .set({
        ...(modele !== undefined && { modele }),
        ...(siteAdresse !== undefined && { siteAdresse }),
        ...(statut !== undefined && { statut }),
        ...(typeActif !== undefined && { typeActif }),
        ...(editeur !== undefined && { editeur }),
        ...(version !== undefined && { version }),
        ...(clientId !== undefined && { clientId }),
        ...(dateInstallation !== undefined && { dateInstallation }),
        updatedAt: new Date(),
      })
      .where(eq(equipements.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Équipement introuvable.' }, { status: 404 });
    }

    const fullUpdated = await db.query.equipements.findFirst({
      where: eq(equipements.id, id),
      with: {
        client: true,
        tickets: true,
      },
    });

    return NextResponse.json({
      success: true,
      equipement: fullUpdated || updated,
      message: 'Équipement mis à jour avec succès.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/equipements/[id]
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const { id } = await params;

    // Check if tickets reference this equipment
    const linkedTickets = await db.query.tickets.findFirst({
      where: eq(tickets.equipementId, id),
    });

    if (linkedTickets) {
      return NextResponse.json(
        {
          error:
            'Impossible de supprimer cet équipement car des tickets d’intervention y sont rattachés. Vous pouvez plutôt modifier son statut en "Mis au rebut (EN_REFORME)".',
        },
        { status: 400 },
      );
    }

    await db.delete(equipements).where(eq(equipements.id, id));

    return NextResponse.json({
      success: true,
      message: 'Équipement supprimé avec succès.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

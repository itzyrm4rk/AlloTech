import { auth } from '@allotech/auth';
import { db, eq } from '@allotech/db';
import { equipements } from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// GET /api/equipements — Récupère tous les équipements avec leurs clients
export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    const list = await db.query.equipements.findMany({
      where: clientId ? eq(equipements.clientId, clientId) : undefined,
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
      orderBy: (e, { desc }) => [desc(e.createdAt)],
    });

    return NextResponse.json({ success: true, equipements: list });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/equipements — Enregistrement manuel d'un équipement dans la CMDB
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
    const clientId = body.clientId?.trim();
    const typeActif = body.typeActif === 'LOGICIEL' ? 'LOGICIEL' : 'MATERIEL';
    const modele = body.modele?.trim();
    const numeroSerie = body.numeroSerie?.trim().toUpperCase();
    const editeur = body.editeur?.trim() || null;
    const version = body.version?.trim() || null;
    const siteAdresse = body.siteAdresse?.trim() || null;
    const statut = ['EN_SERVICE', 'EN_PANNE', 'EN_REFORME'].includes(body.statut)
      ? body.statut
      : 'EN_SERVICE';
    const dateInstallation = body.dateInstallation ? new Date(body.dateInstallation) : new Date();

    if (!clientId) {
      return NextResponse.json({ error: 'Le client propriétaire est requis.' }, { status: 400 });
    }

    if (!modele) {
      return NextResponse.json(
        {
          error:
            typeActif === 'LOGICIEL'
              ? 'Le nom du logiciel / de l’application est requis.'
              : 'Le modèle de l’équipement est requis.',
        },
        { status: 400 },
      );
    }

    if (!numeroSerie) {
      return NextResponse.json(
        {
          error:
            typeActif === 'LOGICIEL'
              ? 'La clé de licence ou identifiant de licence est requis.'
              : 'Le numéro de série est requis et doit être unique.',
        },
        { status: 400 },
      );
    }

    // Vérifier l'unicité du numéro de série / licence
    const existingEq = await db.query.equipements.findFirst({
      where: eq(equipements.numeroSerie, numeroSerie),
    });

    if (existingEq) {
      return NextResponse.json(
        {
          error:
            typeActif === 'LOGICIEL'
              ? `Un logiciel avec la licence ou référence ${numeroSerie} existe déjà.`
              : `Un équipement avec le numéro de série ${numeroSerie} existe déjà.`,
        },
        { status: 409 },
      );
    }

    // Clé QR code (utilisée physiquement pour matériel, ou virtuellement pour logiciel)
    const qrCodeData =
      typeActif === 'LOGICIEL' ? `ALLOTECH:SOFT:${numeroSerie}` : `ALLOTECH:EQP:${numeroSerie}`;

    const [created] = await db
      .insert(equipements)
      .values({
        clientId,
        typeActif,
        modele,
        numeroSerie,
        editeur,
        version,
        siteAdresse,
        statut,
        dateInstallation,
        qrCodeData,
      })
      .returning();

    // Récupérer l'équipement complet avec les données du client propriétaire
    const fullCreated = await db.query.equipements.findFirst({
      where: eq(equipements.id, created.id),
      with: {
        client: true,
        tickets: true,
      },
    });

    return NextResponse.json({
      success: true,
      equipement: fullCreated || created,
      message:
        typeActif === 'LOGICIEL'
          ? `Logiciel ${modele} (${numeroSerie}) enregistré avec succès dans la CMDB.`
          : `Équipement ${modele} (${numeroSerie}) enregistré avec succès.`,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Erreur lors de la création de l’équipement';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

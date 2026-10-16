import { auth } from '@allotech/auth';
import { and, db, desc, eq, gte, lte, sqlHelper as sqlRaw } from '@allotech/db';
import {
  administrateurs,
  disponibilites,
  equipements,
  medias,
  statutsHistorique,
  ticketTechniciens,
  tickets,
} from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// GET /api/tickets — Liste des tickets réels avec jointures
export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statutFilter = searchParams.get('statut');
    const urgenceFilter = searchParams.get('urgence');

    const list = await db.query.tickets.findMany({
      where: and(
        statutFilter
          ? eq(
              tickets.statutActuel,
              statutFilter as
                | 'CREEE'
                | 'ASSIGNEE'
                | 'EN_ROUTE'
                | 'EN_COURS'
                | 'EN_PAUSE'
                | 'TERMINEE'
                | 'CLOTUREE'
                | 'ANNULEE',
            )
          : undefined,
        urgenceFilter
          ? eq(tickets.urgence, urgenceFilter as 'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'BASSE')
          : undefined,
      ),
      with: {
        client: true,
        equipement: true,
        techniciens: {
          with: {
            technicien: true,
          },
        },
        statutsHistorique: {
          orderBy: (h, { desc }) => [desc(h.changedAt)],
          limit: 1,
        },
        medias: true,
      },
      orderBy: [desc(tickets.createdAt)],
    });

    // Compter les stats
    const all = await db.query.tickets.findMany({
      columns: { id: true, statutActuel: true, urgence: true },
    });

    const activeCritiques = all.filter(
      (t) =>
        t.urgence === 'CRITIQUE' &&
        t.statutActuel !== 'TERMINEE' &&
        t.statutActuel !== 'CLOTUREE' &&
        t.statutActuel !== 'ANNULEE',
    ).length;

    const kpi = {
      total: all.length,
      creees: all.filter((t) => t.statutActuel === 'CREEE').length,
      enCours: all.filter(
        (t) =>
          t.statutActuel === 'EN_COURS' ||
          t.statutActuel === 'EN_ROUTE' ||
          t.statutActuel === 'EN_PAUSE',
      ).length,
      critiques: activeCritiques,
      terminees: all.filter((t) => t.statutActuel === 'TERMINEE' || t.statutActuel === 'CLOTUREE')
        .length,
    };

    return NextResponse.json({ success: true, tickets: list, kpi });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/tickets — Création transactionnelle d'un ticket
export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const body = await req.json();

    // Récupérer l'administrateur connecté
    const admin = await db.query.administrateurs.findFirst({
      where: eq(administrateurs.userId, session.user.id),
    });

    if (!admin) {
      return NextResponse.json({ error: 'Compte administrateur introuvable.' }, { status: 403 });
    }

    // Validation
    const {
      clientId,
      equipementId,
      typeDemande,
      urgence,
      adresseSite,
      latitudeSite,
      longitudeSite,
      description,
      dateSouhaitee,
      commentaire,
      categoriePanne,
      sousTypePanneMat,
      sousTypePanneLog,
      equipementsDescription,
      technicienIds,
    } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Le client est requis.' }, { status: 400 });
    }
    if (!adresseSite?.trim() || adresseSite.trim().length < 5) {
      return NextResponse.json({ error: "L'adresse du site est requise." }, { status: 400 });
    }
    if (!description?.trim() || description.trim().length < 10) {
      return NextResponse.json(
        { error: 'La description doit faire au moins 10 caractères.' },
        { status: 400 },
      );
    }

    // Générer la référence unique TCK-YYYY-XXXX
    const year = new Date().getFullYear();
    const countResult = await db.select({ count: sqlRaw<number>`count(*)::int` }).from(tickets);
    const count = Number(countResult[0]?.count ?? 0) + 1;
    const reference = `TCK-${year}-${String(count).padStart(4, '0')}`;

    // Créer le ticket
    const [created] = await db
      .insert(tickets)
      .values({
        reference,
        administrateurId: admin.id,
        clientId,
        equipementId: equipementId || null,
        typeDemande: typeDemande === 'INSTALLATION' ? 'INSTALLATION' : 'PANNE',
        urgence: (['CRITIQUE', 'HAUTE', 'NORMALE', 'BASSE'].includes(urgence)
          ? urgence
          : 'NORMALE') as 'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'BASSE',
        adresseSite: adresseSite.trim(),
        latitudeSite: latitudeSite ? String(latitudeSite) : null,
        longitudeSite: longitudeSite ? String(longitudeSite) : null,
        description: description.trim(),
        dateSouhaitee: dateSouhaitee ? new Date(dateSouhaitee) : null,
        commentaire: commentaire?.trim() || null,
        categoriePanne: categoriePanne || null,
        sousTypePanneMat: sousTypePanneMat || null,
        sousTypePanneLog: sousTypePanneLog || null,
        equipementsDescription: equipementsDescription?.trim() || null,
      })
      .returning();

    // Enregistrer le premier statut CREEE dans l'historique
    await db.insert(statutsHistorique).values({
      ticketId: created.id,
      statutPrecedent: null,
      statutNouvel: 'CREEE',
      auteurAdminId: admin.id,
      motif: 'Ticket créé',
    });

    // Assigner les techniciens si fournis
    if (Array.isArray(technicienIds) && technicienIds.length > 0) {
      await db.insert(ticketTechniciens).values(
        technicienIds.map((tid: string) => ({
          ticketId: created.id,
          technicienId: tid,
        })),
      );

      // Mettre à jour le statut vers ASSIGNEE
      await db.update(tickets).set({ statutActuel: 'ASSIGNEE' }).where(eq(tickets.id, created.id));

      await db.insert(statutsHistorique).values({
        ticketId: created.id,
        statutPrecedent: 'CREEE',
        statutNouvel: 'ASSIGNEE',
        auteurAdminId: admin.id,
        motif: `Assigné à ${technicienIds.length} technicien(s)`,
      });
    }

    // Enregistrer les médias rattachés si fournis
    const uploadedMedias = Array.isArray(body.medias) ? body.medias : [];
    if (uploadedMedias.length > 0) {
      await db.insert(medias).values(
        uploadedMedias.map(
          (m: {
            typeMedia?:
              | 'PHOTO_PANNE_CLIENT'
              | 'DOC_CAHIER_CHARGES'
              | 'PHOTO_INTERVENTION_TECH'
              | 'VIDEO_INTERVENTION_TECH';
            fileUrl: string;
            fileName: string;
            fileSizeBytes?: number;
            mimeType?: string;
          }) => ({
            ticketId: created.id,
            typeMedia:
              m.typeMedia ??
              (typeDemande === 'INSTALLATION'
                ? ('DOC_CAHIER_CHARGES' as const)
                : ('PHOTO_PANNE_CLIENT' as const)),
            fileUrl: m.fileUrl,
            fileName: m.fileName,
            fileSizeBytes: m.fileSizeBytes ? Math.round(Number(m.fileSizeBytes)) : null,
            mimeType: m.mimeType ?? null,
          }),
        ),
      );
    }

    // Si ticket de type PANNE avec équipement rattaché, basculer l'équipement en EN_PANNE dans la CMDB
    if ((typeDemande === 'PANNE' || !typeDemande) && equipementId) {
      await db
        .update(equipements)
        .set({
          statut: 'EN_PANNE',
          updatedAt: new Date(),
        })
        .where(eq(equipements.id, equipementId));
    }

    return NextResponse.json({
      success: true,
      ticket: { ...created, reference },
      message: `Ticket ${reference} créé avec succès.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur lors de la création du ticket';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Fonction utilitaire : vérifier la disponibilité des techniciens (exportée pour réutilisation)
export async function checkTechnicienDisponibilite(
  technicienId: string,
  date: Date,
): Promise<boolean> {
  const absences = await db.query.disponibilites.findMany({
    where: and(
      eq(disponibilites.technicienId, technicienId),
      lte(disponibilites.dateDebut, date),
      gte(disponibilites.dateFin, date),
    ),
  });
  return absences.length === 0;
}

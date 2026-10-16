import { sendTechnicienAbsenceNotificationEmail } from '@/lib/email';
import { auth } from '@allotech/auth';
import { db, eq } from '@allotech/db';
import { alertes, disponibilites, techniciens } from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// GET /api/techniciens/[id]/disponibilites — liste des absences du technicien
export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const list = await db.query.disponibilites.findMany({
      where: eq(disponibilites.technicienId, id),
      orderBy: (d, { desc }) => [desc(d.dateDebut)],
    });

    return NextResponse.json({ success: true, disponibilites: list });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/techniciens/[id]/disponibilites — ajouter une absence/congé
export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const tech = await db.query.techniciens.findFirst({
      where: eq(techniciens.id, id),
      with: { user: true },
    });
    if (!tech) {
      return NextResponse.json({ error: 'Technicien introuvable.' }, { status: 404 });
    }

    const body = await req.json();
    const motif = body.motif?.trim() || 'Congé';
    const dateDebut = new Date(body.dateDebut);
    const dateFin = new Date(body.dateFin);

    if (Number.isNaN(dateDebut.getTime()) || Number.isNaN(dateFin.getTime())) {
      return NextResponse.json({ error: 'Les dates renseignées sont invalides.' }, { status: 400 });
    }

    if (dateDebut >= dateFin) {
      return NextResponse.json(
        { error: 'La date de début doit précéder la date de fin.' },
        { status: 400 },
      );
    }

    const [newDispo] = await db
      .insert(disponibilites)
      .values({
        technicienId: id,
        motif,
        dateDebut,
        dateFin,
      })
      .returning();

    // 1. Déclencher une alerte
    const dateDebutStr = dateDebut.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const dateFinStr = dateFin.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    await db.insert(alertes).values({
      typeAlerte: 'PAUSE_PROLONGEE',
      message: `Période d'absence déclarée pour ${tech.prenom} ${tech.nom} (${tech.matricule}) : ${motif} du ${dateDebutStr} au ${dateFinStr}. Assignations suspendues.`,
      isLue: false,
    });

    // 2. Envoyer un email de notification au technicien
    if (tech.user?.email && !tech.user.email.endsWith('@tech.allotech.cm')) {
      void sendTechnicienAbsenceNotificationEmail({
        to: tech.user.email,
        prenom: tech.prenom,
        nom: tech.nom,
        matricule: tech.matricule,
        dateDebut: dateDebutStr,
        dateFin: dateFinStr,
        motif,
      }).catch((emailErr) => {
        console.warn("Impossible d'envoyer l'email d'absence:", emailErr);
      });
    }

    return NextResponse.json({
      success: true,
      message: `Période d'absence ajoutée pour ${tech.prenom} ${tech.nom}. Notification envoyée au technicien.`,
      disponibilite: newDispo,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Erreur lors de l'enregistrement de l'absence.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/techniciens/[id]/disponibilites — supprimer une absence
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await props.params;
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dispoId = searchParams.get('disponibiliteId');

    if (!dispoId) {
      return NextResponse.json(
        { error: "L'identifiant de la période d'absence est requis." },
        { status: 400 },
      );
    }

    await db.delete(disponibilites).where(eq(disponibilites.id, dispoId));

    return NextResponse.json({
      success: true,
      message: "Période d'absence supprimée avec succès.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

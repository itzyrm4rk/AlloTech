import { sendTechnicienActivationEmail } from '@/lib/email';
import { auth } from '@allotech/auth';
import { db, eq } from '@allotech/db';
import { techniciens } from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/techniciens/[id]/activation — active ou désactive un compte technicien
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    if (typeof body.isActif !== 'boolean') {
      return NextResponse.json(
        { error: 'Le champ isActif (boolean) est requis.' },
        { status: 400 },
      );
    }

    const tech = await db.query.techniciens.findFirst({
      where: eq(techniciens.id, id),
      with: { user: true },
    });

    if (!tech) {
      return NextResponse.json({ error: 'Technicien introuvable.' }, { status: 404 });
    }

    const [updated] = await db
      .update(techniciens)
      .set({ isActif: body.isActif, updatedAt: new Date() })
      .where(eq(techniciens.id, id))
      .returning();

    // Si le compte est activé, envoyer un email de notification au technicien
    if (body.isActif && tech.user?.email) {
      void sendTechnicienActivationEmail({
        to: tech.user.email,
        prenom: tech.prenom,
        nom: tech.nom,
        matricule: tech.matricule,
      }).catch((emailErr) => {
        console.warn("Impossible d'envoyer l'email d'activation:", emailErr);
      });
    }

    return NextResponse.json({
      success: true,
      technicien: {
        id: updated.id,
        matricule: updated.matricule,
        isActif: updated.isActif,
      },
      message: body.isActif
        ? `Le compte du technicien ${tech.prenom} ${tech.nom} a été activé avec succès. Un email de notification a été envoyé.`
        : `Le compte du technicien ${tech.prenom} ${tech.nom} a été désactivé.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

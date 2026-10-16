import { auth } from '@allotech/auth';
import { db, eq } from '@allotech/db';
import { medias, tickets } from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// POST /api/tickets/[id]/medias — Ajouter un média à un ticket
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const ticket = await db.query.tickets.findFirst({
      where: eq(tickets.id, id),
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket introuvable.' }, { status: 404 });
    }

    const { fileUrl, fileName, fileSizeBytes, mimeType, typeMedia } = body;

    if (!fileUrl || !fileName) {
      return NextResponse.json(
        { error: "L'URL et le nom du fichier sont obligatoires." },
        { status: 400 },
      );
    }

    const validTypes = [
      'PHOTO_PANNE_CLIENT',
      'DOC_CAHIER_CHARGES',
      'PHOTO_INTERVENTION_TECH',
      'VIDEO_INTERVENTION_TECH',
    ] as const;

    const resolvedType = validTypes.includes(typeMedia)
      ? typeMedia
      : ticket.typeDemande === 'INSTALLATION'
        ? 'DOC_CAHIER_CHARGES'
        : 'PHOTO_PANNE_CLIENT';

    const [created] = await db
      .insert(medias)
      .values({
        ticketId: id,
        typeMedia: resolvedType,
        fileUrl,
        fileName,
        fileSizeBytes: fileSizeBytes ? Math.round(Number(fileSizeBytes)) : null,
        mimeType: mimeType ?? null,
      })
      .returning();

    return NextResponse.json({ success: true, media: created });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur lors de l'enregistrement du média";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

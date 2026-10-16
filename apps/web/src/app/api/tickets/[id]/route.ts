import { auth } from '@allotech/auth';
import { db, eq } from '@allotech/db';
import { tickets } from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// GET /api/tickets/[id] — Détail complet d'un ticket + timeline
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await db.query.tickets.findFirst({
      where: eq(tickets.id, id),
      with: {
        client: true,
        equipement: true,
        administrateur: {
          with: { user: true },
        },
        techniciens: {
          with: {
            technicien: {
              with: { user: true },
            },
          },
        },
        statutsHistorique: {
          orderBy: (h, { asc }) => [asc(h.changedAt)],
          with: {
            auteurAdmin: true,
            auteurTech: true,
          },
        },
        medias: true,
        rapport: true,
        signature: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket introuvable.' }, { status: 404 });
    }

    // Résolution et pré-signature sécurisée des médias Backblaze B2 (compatible bucket privé)
    const keyId = process.env.B2_KEY_ID?.trim();
    const appKey = process.env.B2_APP_KEY?.trim();
    const bucket = process.env.B2_BUCKET_NAME || 'allotech-medias-prod';
    const endpoint = process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
    const region = process.env.B2_REGION || 'us-east-005';

    let resolvedMedias = ticket.medias;
    if (keyId && appKey && ticket.medias && ticket.medias.length > 0) {
      try {
        const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
        const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
        const s3 = new S3Client({
          endpoint,
          region,
          credentials: { accessKeyId: keyId, secretAccessKey: appKey },
        });

        resolvedMedias = await Promise.all(
          ticket.medias.map(async (m) => {
            const rawUrl = m.fileUrl || '';
            let key = '';

            if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
              try {
                const urlObj = new URL(rawUrl);
                const parts = urlObj.pathname.replace(/^\//, '').split('/');
                key = parts[0] === bucket ? parts.slice(1).join('/') : parts.join('/');
              } catch {
                key = '';
              }
            } else if (rawUrl.startsWith('/uploads/')) {
              // Si le fichier a également été synchronisé sur B2
              const cleanName = rawUrl.replace(/^\/uploads\//, '');
              key = `tickets/uploads/${cleanName}`;
            }

            if (key) {
              try {
                // 1. URL de visualisation directe (inline)
                const viewUrl = await getSignedUrl(
                  s3,
                  new GetObjectCommand({
                    Bucket: bucket,
                    Key: key,
                  }),
                  { expiresIn: 3600 },
                );

                // 2. URL de téléchargement forcé avec nom d'origine
                const cleanFileName = m.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
                const downloadUrl = await getSignedUrl(
                  s3,
                  new GetObjectCommand({
                    Bucket: bucket,
                    Key: key,
                    ResponseContentDisposition: `attachment; filename=${cleanFileName}`,
                  }),
                  { expiresIn: 3600 },
                );

                return {
                  ...m,
                  fileUrl: viewUrl,
                  downloadUrl,
                };
              } catch (signErr) {
                console.warn('[Ticket Detail API] Erreur presign B2:', signErr);
                return m;
              }
            }

            return m;
          }),
        );
      } catch (clientErr) {
        console.warn('[Ticket Detail API] Erreur init S3 client:', clientErr);
      }
    }

    return NextResponse.json({
      success: true,
      ticket: {
        ...ticket,
        medias: resolvedMedias,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

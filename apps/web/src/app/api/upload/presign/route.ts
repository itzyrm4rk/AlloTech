import crypto from 'node:crypto';
import { auth } from '@allotech/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// POST /api/upload/presign — Génération d'une URL présignée S3 (Backblaze B2)
export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const body = await req.json();
    const { fileName, fileType, ticketId } = body;

    if (!fileName) {
      return NextResponse.json({ error: 'Nom de fichier requis.' }, { status: 400 });
    }

    const keyId = process.env.B2_KEY_ID?.trim();
    const appKey = process.env.B2_APP_KEY?.trim();
    const bucket = process.env.B2_BUCKET_NAME || 'allotech-medias-prod';
    const endpoint = process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
    const region = process.env.B2_REGION || 'us-east-005';

    const ext = fileName.includes('.') ? fileName.split('.').pop() : '';
    const randomSuffix = crypto.randomBytes(6).toString('hex');
    const safeBase = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 40);
    const key = `tickets/${ticketId || 'temp'}/${Date.now()}-${safeBase}-${randomSuffix}${ext ? `.${ext}` : ''}`;

    // Si les clés B2 sont configurées, générer l'URL présignée S3
    if (keyId && appKey) {
      try {
        // @ts-ignore — Module résolu à l'exécution ou après installation SDK
        const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
        // @ts-ignore — Module résolu à l'exécution ou après installation SDK
        const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

        const s3 = new S3Client({
          endpoint,
          region,
          credentials: {
            accessKeyId: keyId,
            secretAccessKey: appKey,
          },
        });

        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: fileType || 'application/octet-stream',
        });

        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
        const publicUrl = `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`;

        return NextResponse.json({
          success: true,
          isPresigned: true,
          uploadUrl,
          fileUrl: publicUrl,
          key,
        });
      } catch (sdkError: unknown) {
        console.warn('Erreur B2 SDK, passage au fallback direct:', sdkError);
      }
    }

    // Fallback si clés B2 non configurées : informer le client d'utiliser l'upload direct
    return NextResponse.json({
      success: true,
      isPresigned: false,
      uploadUrl: '/api/upload',
      key,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Erreur lors de la génération de signature B2';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { auth } from '@allotech/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// POST /api/upload — Upload direct (multipart/form-data)
// Utilisé comme fallback de développement ou pour upload direct de médias
export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Nom de fichier assaini et horodaté
    const ext = path.extname(file.name);
    const base = path
      .basename(file.name, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 50);
    const uniqueFileName = `${Date.now()}_${base}${ext}`;

    // Répertoire public/uploads (sauvegarde de secours en environnement local)
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, uniqueFileName);
      await fs.writeFile(filePath, buffer);
    } catch {
      // Ignoré en environnement serverless (Vercel) où le système de fichiers est en lecture seule
    }

    let fileUrl = `/uploads/${uniqueFileName}`;

    // Tentative de synchronisation Cloud S3 / Backblaze B2 côté serveur (aucun blocage CORS possible)
    const keyId = process.env.B2_KEY_ID?.trim();
    const appKey = process.env.B2_APP_KEY?.trim();
    const bucket = process.env.B2_BUCKET_NAME || 'allotech-medias-prod';
    const endpoint = process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
    const region = process.env.B2_REGION || 'us-east-005';

    if (keyId && appKey) {
      try {
        // @ts-ignore — Module résolu à l'exécution ou après installation SDK
        const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
        const s3 = new S3Client({
          endpoint,
          region,
          credentials: { accessKeyId: keyId, secretAccessKey: appKey },
        });
        const key = `tickets/uploads/${uniqueFileName}`;
        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: file.type || 'application/octet-stream',
          }),
        );
        fileUrl = `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`;
      } catch (b2Error) {
        console.warn(
          '[Upload API] Erreur envoi Cloud B2, maintien de la copie locale active:',
          b2Error,
        );
      }
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur lors de l'upload du fichier";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

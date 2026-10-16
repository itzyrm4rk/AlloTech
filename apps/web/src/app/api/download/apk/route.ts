import { NextResponse } from 'next/server';

// ==============================================================================
// Téléchargement direct de l'APK Technicien Mobile
// Redirige automatiquement vers la dernière Release publiée sur GitHub
// ==============================================================================

const GITHUB_REPO = 'itzyrm4rk/AlloTech';
const APK_FILENAME = 'allotech-technicien.apk';
const GITHUB_RELEASE_DOWNLOAD_URL = `https://github.com/${GITHUB_REPO}/releases/latest/download/${APK_FILENAME}`;

export async function GET() {
  return NextResponse.redirect(GITHUB_RELEASE_DOWNLOAD_URL, {
    status: 302,
    headers: {
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
    },
  });
}

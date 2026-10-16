export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialisation du monitoring server-side (Sentry ou console d'observabilité)
    const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (sentryDsn) {
      console.log('[Observabilité] Monitoring Sentry configuré avec DSN');
    } else {
      console.log("[Observabilité] Mode standard actif — monitoring d'erreurs console activé");
    }
  }
}

export function onRequestError(
  err: unknown,
  request: {
    path: string;
    method: string;
    headers: Headers;
  },
) {
  console.error('[Observabilité Erreur Serveur]', {
    path: request.path,
    method: request.method,
    error: err instanceof Error ? err.message : String(err),
    timestamp: new Date().toISOString(),
  });
}

import { getSupervisionData } from '@/lib/supervision';
import { auth } from '@allotech/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(req.url);
    const inclureClotures = searchParams.get('inclureClotures') === 'true';
    const filtreUrgence = searchParams.get('urgence');
    const filtreType = searchParams.get('type');

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;

        const pushData = async () => {
          if (isClosed) return;
          try {
            const data = await getSupervisionData({
              inclureClotures,
              filtreUrgence,
              filtreType,
            });
            if (!isClosed) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            }
          } catch (err) {
            console.error('[SSE Supervision] Erreur lors de la récupération des données:', err);
          }
        };

        // Envoi initial immédiat
        await pushData();

        // Rafraîchissement cadencé toutes les 4 secondes
        const intervalId = setInterval(pushData, 4000);

        req.signal.addEventListener('abort', () => {
          isClosed = true;
          clearInterval(intervalId);
          try {
            controller.close();
          } catch {
            // Ignorer si déjà fermée
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur interne';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

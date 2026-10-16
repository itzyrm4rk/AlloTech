import { auth } from '@allotech/auth';
import { and, db, desc, eq } from '@allotech/db';
import { alertes } from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const nonLuesSeulement = searchParams.get('nonLuesSeulement') === 'true';
    const typeFilter = searchParams.get('type');

    // Déclenchement automatique de la vérification SLA
    const now = Date.now();
    try {
      const activeTickets = await db.query.tickets.findMany({
        with: { client: true },
      });
      const nonClosed = activeTickets.filter(
        (t) => t.statutActuel !== 'CLOTUREE' && t.statutActuel !== 'ANNULEE',
      );

      for (const t of nonClosed) {
        const durationHours =
          t.urgence === 'CRITIQUE'
            ? 4
            : t.urgence === 'HAUTE'
              ? 8
              : t.urgence === 'NORMALE'
                ? 24
                : 48;
        const totalDuration = durationHours * 3600 * 1000;
        const echeance = t.slaEcheanceAt
          ? new Date(t.slaEcheanceAt).getTime()
          : new Date(t.createdAt).getTime() + totalDuration;
        const remainingMs = echeance - now;

        if (remainingMs <= 0) {
          const existing = await db.query.alertes.findFirst({
            where: and(eq(alertes.ticketId, t.id), eq(alertes.typeAlerte, 'SLA_DEPASSE')),
          });
          if (!existing) {
            await db.insert(alertes).values({
              ticketId: t.id,
              typeAlerte: 'SLA_DEPASSE',
              message: `Dépassement SLA critique sur le ticket ${t.reference} (${t.client?.nom || 'Client'}) — Urgence ${t.urgence}.`,
              isLue: false,
            });
          }
        } else if (remainingMs <= 0.25 * totalDuration) {
          const existing = await db.query.alertes.findFirst({
            where: and(eq(alertes.ticketId, t.id), eq(alertes.typeAlerte, 'SLA_PREDICTIF')),
          });
          if (!existing) {
            const minRestantes = Math.max(1, Math.round(remainingMs / 60000));
            await db.insert(alertes).values({
              ticketId: t.id,
              typeAlerte: 'SLA_PREDICTIF',
              message: `Risque SLA imminent sur le ticket ${t.reference} (${t.client?.nom || 'Client'}) : moins de ${minRestantes} min restantes.`,
              isLue: false,
            });
          }
        }
      }
    } catch (slaErr) {
      console.warn('Vérification SLA en arrière-plan:', slaErr);
    }

    // Récupération des alertes
    const allAlertes = await db.query.alertes.findMany({
      with: {
        ticket: {
          with: {
            client: true,
          },
        },
      },
      orderBy: [desc(alertes.createdAt)],
      limit: 100,
    });

    const unreadCount = allAlertes.filter((a) => !a.isLue).length;

    let filtered = allAlertes;
    if (nonLuesSeulement) {
      filtered = filtered.filter((a) => !a.isLue);
    }
    if (typeFilter) {
      filtered = filtered.filter((a) => a.typeAlerte === typeFilter);
    }

    const sanitizedAlertes = filtered.map((a) => ({
      ...a,
      message: a.message.replace(/(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]|\uFE0F)/gu, '').trim(),
    }));

    return NextResponse.json({
      success: true,
      alertes: sanitizedAlertes,
      unreadCount,
      totalCount: allAlertes.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const { action, alerteId } = body;

    if (action === 'markAllRead') {
      await db.update(alertes).set({ isLue: true }).where(eq(alertes.isLue, false));
      return NextResponse.json({ success: true });
    }

    if (action === 'markRead' && alerteId) {
      await db.update(alertes).set({ isLue: true }).where(eq(alertes.id, alerteId));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action non supportée' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

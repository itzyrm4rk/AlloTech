import { getSupervisionData } from '@/lib/supervision';
import { auth } from '@allotech/auth';
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
    const inclureClotures = searchParams.get('inclureClotures') === 'true';
    const filtreUrgence = searchParams.get('urgence');
    const filtreType = searchParams.get('type');

    const result = await getSupervisionData({
      inclureClotures,
      filtreUrgence,
      filtreType,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

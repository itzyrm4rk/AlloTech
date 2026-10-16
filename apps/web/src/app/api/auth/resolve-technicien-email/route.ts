import { db } from '@allotech/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const matricule = searchParams.get('matricule')?.trim();

    if (!matricule) {
      return NextResponse.json({ error: 'Matricule requis' }, { status: 400 });
    }

    if (matricule.includes('@')) {
      return NextResponse.json({ email: matricule.toLowerCase() });
    }

    const raw = matricule.toUpperCase();
    const stripped = raw.replace(/[^A-Z0-9]/g, '');

    // Cherche le technicien avec correspondance souple (TEC-001, TECH-001, tec001, etc.)
    const allTechs = await db.query.techniciens.findMany({
      with: { user: true },
    });

    const found = allTechs.find((t) => {
      const tMat = t.matricule.toUpperCase();
      const tStrip = tMat.replace(/[^A-Z0-9]/g, '');
      return (
        tMat === raw ||
        tStrip === stripped ||
        (raw.startsWith('TECH-') && tMat === raw.replace('TECH-', 'TEC-')) ||
        (raw.startsWith('TEC-') && tMat === raw.replace('TEC-', 'TECH-')) ||
        (stripped.startsWith('TECH') && tStrip === stripped.replace('TECH', 'TEC')) ||
        (stripped.startsWith('TEC') && tStrip === stripped.replace('TEC', 'TECH'))
      );
    });

    if (found?.user?.email) {
      return NextResponse.json({ email: found.user.email.toLowerCase() });
    }

    return NextResponse.json({ email: `${matricule.toLowerCase()}@tech.allotech.cm` });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

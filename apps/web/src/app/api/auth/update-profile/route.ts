import { auth } from '@allotech/auth';
import { db, eq } from '@allotech/db';
import { administrateurs, users } from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé. Veuillez vous connecter.' },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const admin = await db.query.administrateurs.findFirst({
      where: eq(administrateurs.userId, userId),
    });

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    let prenom = admin?.prenom ?? '';
    let nom = admin?.nom ?? '';

    if (!prenom && !nom && user?.name) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length > 1) {
        nom = parts[parts.length - 1];
        prenom = parts.slice(0, -1).join(' ');
      } else {
        prenom = parts[0] ?? '';
      }
    }

    return NextResponse.json({
      success: true,
      prenom,
      nom,
      telephone: admin?.telephone || '',
      image: user?.image || null,
      name: user?.name || '',
      email: user?.email || session.user.email,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Erreur lors de la récupération du profil.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé. Veuillez vous connecter.' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { prenom, nom, telephone, image } = body;

    const userId = session.user.id;
    const fullName = `${(prenom ?? '').trim()} ${(nom ?? '').trim()}`.trim() || session.user.name;

    // 1. Mettre à jour l'utilisateur principal (table users)
    const userUpdateData: { name: string; image?: string | null; updatedAt: Date } = {
      name: fullName,
      updatedAt: new Date(),
    };

    if (image !== undefined) {
      userUpdateData.image = image || null;
    }

    await db.update(users).set(userUpdateData).where(eq(users.id, userId));

    // 2. Mettre à jour le profil administrateur
    const existingAdmin = await db.query.administrateurs.findFirst({
      where: eq(administrateurs.userId, userId),
    });

    if (existingAdmin) {
      await db
        .update(administrateurs)
        .set({
          prenom: prenom !== undefined ? prenom.trim() : existingAdmin.prenom,
          nom: nom !== undefined ? nom.trim() : existingAdmin.nom,
          telephone: telephone !== undefined ? telephone.trim() : existingAdmin.telephone,
          updatedAt: new Date(),
        })
        .where(eq(administrateurs.id, existingAdmin.id));
    } else if (prenom || nom || telephone) {
      await db.insert(administrateurs).values({
        userId,
        prenom: (prenom ?? '').trim(),
        nom: (nom ?? '').trim(),
        telephone: (telephone ?? '').trim(),
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: fullName,
        image: userUpdateData.image ?? session.user.image,
      },
      message: 'Profil et photo mis à jour avec succès.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

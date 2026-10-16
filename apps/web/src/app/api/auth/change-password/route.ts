import { auth, hashPassword, verifyPassword } from '@allotech/auth';
import { db, eq } from '@allotech/db';
import { accounts, users } from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    const body = await req.json();
    const currentPassword = body.currentPassword?.trim();
    const newPassword = body.newPassword;
    const email = body.email?.trim()?.toLowerCase();

    let userId = session?.user?.id;
    if (!userId && email) {
      const userRecord = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      if (userRecord) {
        userId = userRecord.id;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé. Veuillez vous connecter.' },
        { status: 401 },
      );
    }

    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Veuillez saisir votre mot de passe actuel.' },
        { status: 400 },
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit comporter au moins 8 caractères.' },
        { status: 400 },
      );
    }

    // 1. Recherche du compte d'authentification lié à l'utilisateur
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.userId, userId),
    });

    if (!account || !account.password) {
      return NextResponse.json(
        { error: 'Compte introuvable ou méthode de connexion non supportée.' },
        { status: 400 },
      );
    }

    // 2. Vérification du mot de passe actuel
    const isCurrentValid = await verifyPassword({
      password: currentPassword,
      hash: account.password,
    });

    if (!isCurrentValid) {
      return NextResponse.json({ error: 'Le mot de passe actuel est incorrect.' }, { status: 400 });
    }

    // 3. Hachage du nouveau mot de passe
    const hashedPassword = await hashPassword(newPassword);

    // 4. Mise à jour en base de données
    await db
      .update(accounts)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, account.id));

    return NextResponse.json({
      success: true,
      message: 'Mot de passe modifié avec succès.',
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

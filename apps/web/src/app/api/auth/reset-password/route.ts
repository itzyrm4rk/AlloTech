import { hashPassword } from '@allotech/auth';
import { and, db, eq, gt } from '@allotech/db';
import { accounts, users, verifications } from '@allotech/db/schema';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body.email?.trim()?.toLowerCase();
    const otp = body.otp?.trim();
    const newPassword = body.newPassword;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Veuillez fournir une adresse email valide.' },
        { status: 400 },
      );
    }

    if (!otp || otp.length < 6) {
      return NextResponse.json(
        { error: 'Veuillez saisir le code de vérification à 6 chiffres.' },
        { status: 400 },
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit comporter au moins 8 caractères.' },
        { status: 400 },
      );
    }

    // 1. Vérification du code OTP dans la table verifications (non expiré)
    const verification = await db.query.verifications.findFirst({
      where: and(
        eq(verifications.identifier, email),
        eq(verifications.value, otp),
        gt(verifications.expiresAt, new Date()),
      ),
    });

    if (!verification) {
      return NextResponse.json(
        {
          error:
            'Code de vérification invalide ou expiré. Veuillez vérifier le code ou en demander un nouveau.',
        },
        { status: 400 },
      );
    }

    // 2. Recherche de l'utilisateur
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Aucun compte associé à cette adresse email n’a été trouvé.' },
        { status: 404 },
      );
    }

    // 3. Hachage sécurisé du nouveau mot de passe
    const hashedPassword = await hashPassword(newPassword);

    // 4. Recherche ou création du compte Better Auth lié
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.userId, user.id),
    });

    if (account) {
      await db
        .update(accounts)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, account.id));
    } else {
      await db.insert(accounts).values({
        id: crypto.randomUUID(),
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 5. Supprimer le code OTP consommé pour éviter toute réutilisation
    await db.delete(verifications).where(eq(verifications.identifier, email));

    return NextResponse.json({
      success: true,
      message: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez vous connecter.',
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : 'Une erreur est survenue lors de la réinitialisation.';
    console.error('Erreur /api/auth/reset-password:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

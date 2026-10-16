import { sendPasswordResetOtpEmail } from '@/lib/email';
import { db, eq } from '@allotech/db';
import { users, verifications } from '@allotech/db/schema';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body.email?.trim()?.toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Veuillez fournir une adresse email valide.' },
        { status: 400 },
      );
    }

    // 1. Vérifier si l'utilisateur existe dans la base
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Aucun compte associé à cette adresse email n’a été trouvé.' },
        { status: 404 },
      );
    }

    // 2. Générer un code OTP à 6 chiffres
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // 3. Supprimer tout code précédent pour cet email
    await db.delete(verifications).where(eq(verifications.identifier, email));

    // 4. Enregistrer le nouvel OTP dans la table verifications
    await db.insert(verifications).values({
      id: crypto.randomUUID(),
      identifier: email,
      value: otp,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 5. Envoyer l'email via Gmail SMTP (Nodemailer)
    const firstName = user.name ? user.name.split(' ')[0] : undefined;
    const emailResult = await sendPasswordResetOtpEmail({
      to: email,
      prenom: firstName,
      otp,
    });

    return NextResponse.json({
      success: true,
      message: 'Un code de vérification à 6 chiffres a été envoyé à votre adresse email.',
      simulated: emailResult.simulated,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Erreur lors de la demande de réinitialisation.';
    console.error('Erreur /api/auth/forgot-password:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

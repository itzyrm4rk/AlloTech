import { auth } from '@allotech/auth';
import { db } from '@allotech/db';
import { administrateurs } from '@allotech/db/schema';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prenom, nom, email, telephone, password } = body;

    // Validation des champs requis
    if (!prenom?.trim() || !nom?.trim() || !email?.trim() || !telephone?.trim() || !password) {
      return NextResponse.json(
        { error: 'Tous les champs (prénom, nom, email, téléphone, mot de passe) sont requis.' },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères.' },
        { status: 400 },
      );
    }

    // 1. Création de l'utilisateur Better Auth (table users + accounts)
    const fullName = `${prenom.trim()} ${nom.trim()}`;
    const authResult = await auth.api.signUpEmail({
      body: {
        email: email.trim().toLowerCase(),
        password,
        name: fullName,
      },
    });

    if (!authResult || !authResult.user) {
      return NextResponse.json(
        { error: "Échec de création du compte d'authentification." },
        { status: 500 },
      );
    }

    // 2. Insertion du profil administrateur lié dans la table PostgreSQL 'administrateurs'
    await db.insert(administrateurs).values({
      userId: authResult.user.id,
      prenom: prenom.trim(),
      nom: nom.trim(),
      telephone: telephone.trim(),
    });

    return NextResponse.json({
      success: true,
      message: 'Compte administrateur créé avec succès.',
      user: authResult.user,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Une erreur est survenue lors de l'inscription.";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

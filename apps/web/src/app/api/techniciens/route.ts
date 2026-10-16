import { sendTechnicienActivationEmail } from '@/lib/email';
import { auth, hashPassword } from '@allotech/auth';
import { db, eq } from '@allotech/db';
import { accounts, technicienCompetences, techniciens, users } from '@allotech/db/schema';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// GET /api/techniciens — liste tous les techniciens avec leurs détails
export async function GET() {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const list = await db.query.techniciens.findMany({
      with: {
        competences: {
          with: { competence: true },
        },
        user: true,
        disponibilites: {
          orderBy: (d, { desc }) => [desc(d.dateDebut)],
        },
      },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    return NextResponse.json({ success: true, techniciens: list });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/techniciens — création d'un matricule / technicien par l'administrateur
export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé. Veuillez vous connecter.' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const matricule = body.matricule?.trim().toUpperCase();
    const prenom = body.prenom?.trim();
    const nom = body.nom?.trim();
    const telephone = body.telephone?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim() || 'AlloTech2026!';
    const isActif = Boolean(body.isActif);
    const competenceIds: string[] = Array.isArray(body.competenceIds) ? body.competenceIds : [];

    if (!matricule || matricule.length < 2) {
      return NextResponse.json(
        { error: 'Le matricule est obligatoire et doit contenir au moins 2 caractères.' },
        { status: 400 },
      );
    }

    if (!prenom || !nom) {
      return NextResponse.json(
        { error: 'Le prénom et le nom du technicien sont requis.' },
        { status: 400 },
      );
    }

    if (!telephone || telephone.length < 6) {
      return NextResponse.json(
        { error: 'Le numéro de téléphone est requis (minimum 6 chiffres).' },
        { status: 400 },
      );
    }

    // 1. Vérification d'unicité du matricule
    const existingTech = await db.query.techniciens.findFirst({
      where: eq(techniciens.matricule, matricule),
    });

    if (existingTech) {
      return NextResponse.json(
        { error: `Le matricule ${matricule} est déjà attribué à un technicien.` },
        { status: 409 },
      );
    }

    // 2. Email professionnel ou technique dérivé
    const techEmail =
      email && email.length > 0 ? email : `${matricule.toLowerCase()}@tech.allotech.cm`;

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, techEmail),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: `L'adresse email ${techEmail} est déjà utilisée.` },
        { status: 409 },
      );
    }

    // 3. Création du compte utilisateur dans users
    const [newUser] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        name: `${prenom} ${nom}`,
        email: techEmail,
        emailVerified: true,
        image: null,
      })
      .returning();

    if (!newUser) {
      return NextResponse.json(
        { error: 'Échec de création du compte utilisateur.' },
        { status: 500 },
      );
    }

    // 4. Création des identifiants Better Auth (table accounts)
    const hashedPassword = await hashPassword(password);
    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      userId: newUser.id,
      accountId: newUser.id,
      providerId: 'credential',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 5. Création de la fiche technicien
    const [newTechnicien] = await db
      .insert(techniciens)
      .values({
        userId: newUser.id,
        matricule,
        prenom,
        nom,
        telephone,
        isActif,
      })
      .returning();

    if (!newTechnicien) {
      return NextResponse.json(
        { error: 'Échec de création du profil technicien.' },
        { status: 500 },
      );
    }

    // 6. Liaison des compétences
    if (competenceIds.length > 0) {
      const links = competenceIds.map((cId) => ({
        technicienId: newTechnicien.id,
        competenceId: cId,
      }));
      await db.insert(technicienCompetences).values(links);
    }

    // 7. Envoi d'email de bienvenue / activation si actif et email réel
    if (isActif && email && email.includes('@') && !email.endsWith('@tech.allotech.cm')) {
      void sendTechnicienActivationEmail({
        to: email,
        prenom,
        nom,
        matricule,
      }).catch((err) => console.warn("Erreur d'envoi d'email d'activation :", err));
    }

    // 8. Récupération de l'objet complet avec relations pour rafraîchissement immédiat
    const completeTechnicien = await db.query.techniciens.findFirst({
      where: eq(techniciens.id, newTechnicien.id),
      with: {
        competences: {
          with: { competence: true },
        },
        user: true,
        disponibilites: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Le matricule ${matricule} a été créé avec succès pour ${prenom} ${nom}.`,
      technicien: completeTechnicien,
      initialPassword: password,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur lors de la création.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

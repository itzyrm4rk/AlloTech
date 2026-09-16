import { type TRPCContext, appRouter, fetchRequestHandler } from '@allotech/api';
import { auth } from '@allotech/auth';
import { db, eq } from '@allotech/db';
import { administrateurs, techniciens } from '@allotech/db/schema';
import type { NextRequest } from 'next/server';

/**
 * Création du contexte tRPC avec résolution de la session Better Auth
 * Détecte si l'utilisateur est un Administrateur ou un Technicien
 */
const createContext = async (req: NextRequest): Promise<TRPCContext> => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return { session: null };
    }

    const userId = session.user.id;

    // 1. Vérifier si c'est un Administrateur
    const admin = await db.query.administrateurs.findFirst({
      where: eq(administrateurs.userId, userId),
    });

    if (admin) {
      return {
        session: {
          user: {
            id: userId,
            role: 'ADMIN',
            email: session.user.email,
            adminId: admin.id,
          },
        },
      };
    }

    // 2. Vérifier si c'est un Technicien
    const tech = await db.query.techniciens.findFirst({
      where: eq(techniciens.userId, userId),
    });

    if (tech) {
      return {
        session: {
          user: {
            id: userId,
            role: 'TECHNICIEN',
            matricule: tech.matricule,
            technicienId: tech.id,
            isActif: tech.isActif,
          },
        },
      };
    }

    return { session: null };
  } catch (error) {
    console.error('Erreur résolution session tRPC:', error);
    return { session: null };
  }
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError:
      process.env.NODE_ENV === 'development'
        ? (opts) => {
            console.error(`❌ Erreur tRPC sur '${opts.path}': ${opts.error.message}`);
          }
        : undefined,
  });

export { handler as GET, handler as POST };

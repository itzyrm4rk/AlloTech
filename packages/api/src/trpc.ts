import { TRPCError, initTRPC } from '@trpc/server';

export interface TRPCContext {
  session?: {
    user?: {
      id: string;
      role: 'ADMIN' | 'TECHNICIEN';
      email?: string;
      matricule?: string;
      adminId?: string;
      technicienId?: string;
      isActif?: boolean;
    };
  } | null;
}

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

/**
 * Middleware vérifiant que l'utilisateur est authentifié
 */
const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Vous devez être connecté pour accéder à cette ressource.',
    });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

/**
 * Middleware réservé aux Administrateurs
 */
const isAdmin = middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Vous devez être connecté pour accéder à cette ressource.',
    });
  }
  if (ctx.session.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Accès réservé aux administrateurs.',
    });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

/**
 * Middleware réservé aux Techniciens
 */
const isTechnicien = middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Vous devez être connecté pour accéder à cette ressource.',
    });
  }
  if (ctx.session.user.role !== 'TECHNICIEN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Accès réservé aux techniciens.',
    });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(isAdmin);
export const technicienProcedure = t.procedure.use(isTechnicien);

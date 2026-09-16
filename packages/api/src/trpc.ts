import { initTRPC } from '@trpc/server';

export interface TRPCContext {
  session?: {
    user?: {
      id: string;
      role: 'ADMIN' | 'TECHNICIEN';
      email?: string;
      matricule?: string;
    };
  } | null;
}

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

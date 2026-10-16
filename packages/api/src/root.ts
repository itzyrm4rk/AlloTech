import { z } from 'zod';
import { alertesRouter } from './routers/alertes';
import { authRouter } from './routers/auth';
import { clientsRouter } from './routers/clients';
import { equipementsRouter } from './routers/equipements';
import { statistiquesRouter } from './routers/statistiques';
import { techniciensRouter } from './routers/techniciens';
import { ticketsRouter } from './routers/tickets';
import { publicProcedure, router } from './trpc';

export const appRouter = router({
  auth: authRouter,
  clients: clientsRouter,
  equipements: equipementsRouter,
  tickets: ticketsRouter,
  techniciens: techniciensRouter,
  alertes: alertesRouter,
  statistiques: statistiquesRouter,
  healthCheck: publicProcedure.query(() => {
    return {
      status: 'ok',
      service: 'AlloTech API',
      timestamp: new Date().toISOString(),
    };
  }),
  echo: publicProcedure.input(z.object({ message: z.string() })).query(({ input }) => {
    return { echo: input.message };
  }),
});

export type AppRouter = typeof appRouter;

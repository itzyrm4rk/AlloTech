import { z } from 'zod';
import { publicProcedure, router } from './trpc';

export const appRouter = router({
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

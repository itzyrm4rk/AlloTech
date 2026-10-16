import { describe, expect, it } from 'vitest';
import { appRouter } from '../root';
import type { TRPCContext } from '../trpc';

describe('Diagnostic IA Interactive Chat & Fallback Engine', () => {
  const fakeCtx = {
    session: {
      user: {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'tech@allotech.cm',
        name: 'Tech Test',
        role: 'TECHNICIEN' as const,
      },
    },
  } as unknown as TRPCContext;

  const caller = appRouter.createCaller(fakeCtx);

  it('génère un diagnostic initial structuré (Turn 1)', async () => {
    const res = await caller.tickets.diagnosticIA({
      descriptionPanne: 'Serveur ne démarre plus et voyants éteints',
      categoriePanne: 'MATERIEL',
    });

    expect(res.success).toBe(true);
    expect(res.diagnostic.toLowerCase()).toContain('causes probables');
    expect(res.diagnostic.toLowerCase()).toContain('points de vérification');
    expect(res.diagnostic.toLowerCase()).toContain('actions recommandées');
  });

  it('répond avec précision à une question de suivi sur les voyants LED (Turn 2)', async () => {
    const res = await caller.tickets.diagnosticIA({
      descriptionPanne: 'Switch non fonctionnel',
      categoriePanne: 'MATERIEL',
      messages: [
        {
          role: 'assistant',
          content: 'Diagnostic initial : vérifier les ports et l alimentation.',
        },
        {
          role: 'user',
          content: 'Que signifie le voyant orange qui clignote sur le port ?',
        },
      ],
    });

    expect(res.success).toBe(true);
    expect(res.diagnostic.toLowerCase()).toContain('voyant');
    expect(res.diagnostic.toLowerCase()).toContain('orange');
  });

  it('répond avec précision à une demande de réinitialisation usine / reset (Turn 3)', async () => {
    const res = await caller.tickets.diagnosticIA({
      descriptionPanne: 'Routeur bloqué',
      categoriePanne: 'MATERIEL',
      messages: [
        {
          role: 'assistant',
          content: 'Diagnostic initial...',
        },
        {
          role: 'user',
          content: 'Comment faire un reset usine sur cet équipement ?',
        },
      ],
    });

    expect(res.success).toBe(true);
    expect(res.diagnostic.toLowerCase()).toContain('reset');
    const diag = res.diagnostic.toLowerCase();
    expect(diag.includes('192.168.1.1') || diag.includes('usine') || diag.includes('défaut')).toBe(
      true,
    );
  });

  it('répond avec précision à une demande d accès ou mot de passe', async () => {
    const res = await caller.tickets.diagnosticIA({
      descriptionPanne: 'Accès impossible',
      categoriePanne: 'LOGICIEL',
      messages: [
        {
          role: 'user',
          content: 'Quel est le mot de passe admin par défaut ?',
        },
      ],
    });

    expect(res.success).toBe(true);
    expect(res.diagnostic.length).toBeGreaterThan(20);
  });

  it('prend en charge les photos transmises par le technicien (Multimodal)', async () => {
    const res = await caller.tickets.diagnosticIA({
      descriptionPanne: 'Condensateur gonflé sur la carte mère',
      categoriePanne: 'MATERIEL',
      images: [
        {
          base64:
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          mimeType: 'image/png',
        },
      ],
    });

    expect(res.success).toBe(true);
    expect(res.diagnostic.length).toBeGreaterThan(20);
  });
});

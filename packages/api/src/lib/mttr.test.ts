import { describe, expect, it } from 'vitest';
import {
  calculateEquipmentHealth,
  calculateMtbf,
  calculateMtta,
  calculateMttr,
  formatMtta,
  formatMttr,
  getResolutionDuration,
} from './mttr';

describe('getResolutionDuration', () => {
  it('retourne la duree en minutes basee sur heureDemarrage et heureFinale', () => {
    const ticket = {
      heureDemarrage: new Date('2026-01-01T09:00:00Z'),
      heureFinale: new Date('2026-01-01T11:30:00Z'), // 2h30 = 150 min
      clotureAt: undefined,
      createdAt: new Date('2026-01-01T08:00:00Z'),
    };
    expect(getResolutionDuration(ticket)).toBe(150);
  });

  it('utilise clotureAt si heureFinale est absent', () => {
    const ticket = {
      heureDemarrage: new Date('2026-01-01T09:00:00Z'),
      heureFinale: undefined,
      clotureAt: new Date('2026-01-01T10:00:00Z'), // 1h = 60 min
      createdAt: new Date('2026-01-01T08:00:00Z'),
    };
    expect(getResolutionDuration(ticket)).toBe(60);
  });

  it('utilise createdAt si heureDemarrage est absent', () => {
    const ticket = {
      heureDemarrage: undefined,
      heureFinale: new Date('2026-01-01T10:00:00Z'),
      clotureAt: undefined,
      createdAt: new Date('2026-01-01T08:00:00Z'), // 2h depuis creation = 120 min
    };
    expect(getResolutionDuration(ticket)).toBe(120);
  });

  it('retourne null si aucune date de fin disponible', () => {
    const ticket = {
      heureDemarrage: new Date('2026-01-01T09:00:00Z'),
      heureFinale: undefined,
      clotureAt: undefined,
      createdAt: new Date('2026-01-01T08:00:00Z'),
    };
    expect(getResolutionDuration(ticket)).toBeNull();
  });

  it('retourne null si la duree est negative', () => {
    const ticket = {
      heureDemarrage: new Date('2026-01-01T11:00:00Z'),
      heureFinale: new Date('2026-01-01T10:00:00Z'), // heure de fin avant debut
      clotureAt: undefined,
      createdAt: new Date('2026-01-01T08:00:00Z'),
    };
    expect(getResolutionDuration(ticket)).toBeNull();
  });
});

describe('calculateMttr', () => {
  it('calcule la moyenne correcte pour plusieurs tickets', () => {
    const tickets = [
      {
        heureDemarrage: new Date('2026-01-01T09:00:00Z'),
        heureFinale: new Date('2026-01-01T10:00:00Z'),
        clotureAt: undefined,
        createdAt: new Date('2026-01-01T08:00:00Z'),
      }, // 60 min
      {
        heureDemarrage: new Date('2026-01-02T09:00:00Z'),
        heureFinale: new Date('2026-01-02T12:00:00Z'),
        clotureAt: undefined,
        createdAt: new Date('2026-01-02T08:00:00Z'),
      }, // 180 min
    ];
    expect(calculateMttr(tickets)).toBe(120); // moyenne = 120 min
  });

  it('retourne null pour une liste vide', () => {
    expect(calculateMttr([])).toBeNull();
  });

  it('ignore les tickets sans donnees de resolution', () => {
    const tickets = [
      {
        heureDemarrage: new Date('2026-01-01T09:00:00Z'),
        heureFinale: new Date('2026-01-01T10:00:00Z'),
        clotureAt: undefined,
        createdAt: new Date('2026-01-01T08:00:00Z'),
      }, // 60 min
      {
        heureDemarrage: undefined,
        heureFinale: undefined,
        clotureAt: undefined,
        createdAt: new Date('2026-01-02T08:00:00Z'),
      }, // pas de fin -> ignore
    ];
    expect(calculateMttr(tickets)).toBe(60);
  });

  it('retourne null si tous les tickets n ont pas de fin', () => {
    const tickets = [
      {
        heureDemarrage: new Date('2026-01-01T09:00:00Z'),
        heureFinale: undefined,
        clotureAt: undefined,
        createdAt: new Date('2026-01-01T08:00:00Z'),
      },
    ];
    expect(calculateMttr(tickets)).toBeNull();
  });
});

describe('formatMttr', () => {
  it('retourne N/A pour null', () => {
    expect(formatMttr(null)).toBe('N/A');
  });

  it('formate correctement en heures et minutes', () => {
    expect(formatMttr(150)).toBe('2h 30m');
    expect(formatMttr(60)).toBe('1h');
    expect(formatMttr(45)).toBe('45m');
  });

  it('formate 0 minutes correctement', () => {
    expect(formatMttr(0)).toBe('0m');
  });
});

describe('calculateMtta', () => {
  it('calcule la prise en charge correcte basée sur assigneAt', () => {
    const ticket = {
      createdAt: new Date('2026-01-01T08:00:00Z'),
      assigneAt: new Date('2026-01-01T08:25:00Z'), // 25 min
    };
    expect(calculateMtta([ticket])).toBe(25);
  });

  it('calcule la moyenne MTTA pour plusieurs tickets', () => {
    const tickets = [
      {
        createdAt: new Date('2026-01-01T08:00:00Z'),
        assigneAt: new Date('2026-01-01T08:30:00Z'), // 30 min
      },
      {
        createdAt: new Date('2026-01-02T08:00:00Z'),
        heureDepart: new Date('2026-01-02T09:00:00Z'), // 60 min
      },
    ];
    expect(calculateMtta(tickets)).toBe(45);
    expect(formatMtta(45)).toBe('45m');
  });

  it('retourne null si aucun ticket n a de prise en charge', () => {
    const tickets = [
      {
        createdAt: new Date('2026-01-01T08:00:00Z'),
      },
    ];
    expect(calculateMtta(tickets)).toBeNull();
  });
});

describe('calculateMtbf', () => {
  const refDate = new Date('2026-06-01T00:00:00Z');

  it('calcule le MTBF correctement en divisant les jours ecoules par le nombre de pannes', () => {
    const startDate = new Date('2026-01-01T00:00:00Z'); // ~151 jours
    const tickets = [
      { typeDemande: 'PANNE', createdAt: '2026-02-01T00:00:00Z' },
      { typeDemande: 'PANNE', createdAt: '2026-04-01T00:00:00Z' },
      { typeDemande: 'MAINTENANCE', createdAt: '2026-05-01T00:00:00Z' }, // Ignoré pour MTBF
    ];

    const mtbf = calculateMtbf(startDate, tickets, refDate);
    // 151 jours / 2 pannes = 76 jours
    expect(mtbf).toBeGreaterThanOrEqual(75);
    expect(mtbf).toBeLessThanOrEqual(76);
  });

  it('retourne la totalite des jours ecoules si 0 panne', () => {
    const startDate = new Date('2026-05-01T00:00:00Z'); // 31 jours
    const mtbf = calculateMtbf(startDate, [], refDate);
    expect(mtbf).toBe(31);
  });
});

describe('calculateEquipmentHealth', () => {
  const refDate = new Date('2026-06-01T00:00:00Z');

  it('attribue une excellente fiabilite (score 100, EXCELLENT) a un actif sans panne', () => {
    const equip = {
      dateInstallation: '2026-01-01T00:00:00Z',
      statut: 'EN_SERVICE',
      typeActif: 'MATERIEL',
      tickets: [],
    };
    const health = calculateEquipmentHealth(equip, refDate);
    expect(health.score).toBe(100);
    expect(health.level).toBe('EXCELLENT');
    expect(health.isInstable).toBe(false);
  });

  it('bascule en surveillance conseillée (SURVEILLANCE) pour 1 panne recente', () => {
    const equip = {
      dateInstallation: '2026-01-01T00:00:00Z',
      statut: 'EN_SERVICE',
      typeActif: 'MATERIEL',
      tickets: [
        {
          typeDemande: 'PANNE',
          urgence: 'NORMALE',
          createdAt: '2026-05-20T00:00:00Z', // Panne récente (< 90j)
        },
      ],
    };
    const health = calculateEquipmentHealth(equip, refDate);
    expect(health.score).toBe(80);
    expect(health.level).toBe('EXCELLENT');
  });

  it('declenche une alerte critique (CRITIQUE, isInstable: true) pour pannes recurrentes', () => {
    const equip = {
      dateInstallation: '2026-01-01T00:00:00Z',
      statut: 'EN_SERVICE',
      typeActif: 'MATERIEL',
      tickets: [
        { typeDemande: 'PANNE', urgence: 'HAUTE', createdAt: '2026-04-10T00:00:00Z' },
        { typeDemande: 'PANNE', urgence: 'CRITIQUE', createdAt: '2026-05-01T00:00:00Z' },
        { typeDemande: 'PANNE', urgence: 'NORMALE', createdAt: '2026-05-25T00:00:00Z' },
      ],
    };
    const health = calculateEquipmentHealth(equip, refDate);
    expect(health.level).toBe('CRITIQUE');
    expect(health.score).toBeLessThanOrEqual(45);
    expect(health.isInstable).toBe(true);
    expect(health.alerteMessage).toContain('Équipement matériel instable');
    expect(health.recommandation).toContain('Remplacement');
  });

  it('adapte le message d alerte pour un progiciel / licence LOGICIEL', () => {
    const equip = {
      dateInstallation: '2026-01-01T00:00:00Z',
      statut: 'EN_PANNE',
      typeActif: 'LOGICIEL',
      tickets: [
        { typeDemande: 'PANNE', urgence: 'CRITIQUE', createdAt: '2026-05-15T00:00:00Z' },
        { typeDemande: 'PANNE', urgence: 'CRITIQUE', createdAt: '2026-05-25T00:00:00Z' },
      ],
    };
    const health = calculateEquipmentHealth(equip, refDate);
    expect(health.level).toBe('CRITIQUE');
    expect(health.isInstable).toBe(true);
    expect(health.alerteMessage).toContain('Logiciel instable');
    expect(health.recommandation).toContain('Réinstallation');
  });
});

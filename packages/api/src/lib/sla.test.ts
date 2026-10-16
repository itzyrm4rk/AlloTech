import { describe, expect, it } from 'vitest';
import {
  SLA_DURATIONS_HOURS,
  SLA_PREDICTIF_THRESHOLD_PCT,
  calculateSla,
  isSlaRespected,
} from './sla';

describe('SLA_DURATIONS_HOURS', () => {
  it('doit definir 4h pour CRITIQUE', () => {
    expect(SLA_DURATIONS_HOURS.CRITIQUE).toBe(4);
  });
  it('doit definir 8h pour HAUTE', () => {
    expect(SLA_DURATIONS_HOURS.HAUTE).toBe(8);
  });
  it('doit definir 24h pour NORMALE', () => {
    expect(SLA_DURATIONS_HOURS.NORMALE).toBe(24);
  });
  it('doit definir 48h pour BASSE', () => {
    expect(SLA_DURATIONS_HOURS.BASSE).toBe(48);
  });
  it('seuil predictif doit etre 25%', () => {
    expect(SLA_PREDICTIF_THRESHOLD_PCT).toBe(0.25);
  });
});

describe('calculateSla', () => {
  it('retourne isDepasse=false quand le SLA n est pas depasse', () => {
    const createdAt = new Date('2026-01-01T08:00:00Z');
    const now = new Date('2026-01-01T10:00:00Z'); // 2h apres creation, SLA CRITIQUE = 4h
    const result = calculateSla('CRITIQUE', createdAt, now);
    expect(result.isDepasse).toBe(false);
    expect(result.durationHours).toBe(4);
    expect(result.progressPct).toBe(50);
    expect(result.remainingMinutes).toBe(120);
  });

  it('retourne isDepasse=true quand le SLA est depasse', () => {
    const createdAt = new Date('2026-01-01T08:00:00Z');
    const now = new Date('2026-01-01T13:00:00Z'); // 5h apres, SLA CRITIQUE = 4h
    const result = calculateSla('CRITIQUE', createdAt, now);
    expect(result.isDepasse).toBe(true);
    expect(result.remainingMinutes).toBe(0);
    expect(result.progressPct).toBe(100);
  });

  it('retourne isImminent=true quand < 25% du temps restant (CRITIQUE)', () => {
    // SLA CRITIQUE = 4h = 240 min. 25% = 60 min.
    // Reste 30 min -> isImminent doit etre true
    const createdAt = new Date('2026-01-01T08:00:00Z');
    const now = new Date('2026-01-01T11:30:00Z'); // 3h30 ecoule, reste 30 min
    const result = calculateSla('CRITIQUE', createdAt, now);
    expect(result.isImminent).toBe(true);
    expect(result.isDepasse).toBe(false);
    expect(result.remainingMinutes).toBe(30);
  });

  it('retourne isImminent=false quand > 25% du temps restant', () => {
    // SLA CRITIQUE = 4h. Reste 2h (50%) -> pas imminent
    const createdAt = new Date('2026-01-01T08:00:00Z');
    const now = new Date('2026-01-01T10:00:00Z'); // 2h ecoule, reste 2h
    const result = calculateSla('CRITIQUE', createdAt, now);
    expect(result.isImminent).toBe(false);
  });

  it('calcule correctement pour BASSE (48h)', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const now = new Date('2026-01-02T00:00:00Z'); // 24h ecoule
    const result = calculateSla('BASSE', createdAt, now);
    expect(result.durationHours).toBe(48);
    expect(result.progressPct).toBe(50);
    expect(result.isDepasse).toBe(false);
    expect(result.isImminent).toBe(false);
  });
});

describe('isSlaRespected', () => {
  it('retourne true si resolu avant l echeance', () => {
    const createdAt = new Date('2026-01-01T08:00:00Z');
    const resolvedAt = new Date('2026-01-01T11:00:00Z'); // 3h apres, SLA CRITIQUE = 4h
    expect(isSlaRespected('CRITIQUE', createdAt, resolvedAt)).toBe(true);
  });

  it('retourne false si resolu apres l echeance', () => {
    const createdAt = new Date('2026-01-01T08:00:00Z');
    const resolvedAt = new Date('2026-01-01T13:00:00Z'); // 5h apres, SLA CRITIQUE = 4h
    expect(isSlaRespected('CRITIQUE', createdAt, resolvedAt)).toBe(false);
  });

  it('retourne true si resolu exactement a l echeance', () => {
    const createdAt = new Date('2026-01-01T08:00:00Z');
    const resolvedAt = new Date('2026-01-01T12:00:00Z'); // exactement 4h
    expect(isSlaRespected('CRITIQUE', createdAt, resolvedAt)).toBe(true);
  });

  it('fonctionne pour NORMALE (24h)', () => {
    const createdAt = new Date('2026-01-01T08:00:00Z');
    const resolvedAt = new Date('2026-01-02T06:00:00Z'); // 22h apres
    expect(isSlaRespected('NORMALE', createdAt, resolvedAt)).toBe(true);
  });
});

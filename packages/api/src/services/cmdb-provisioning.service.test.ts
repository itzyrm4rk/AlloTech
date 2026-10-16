import { describe, expect, it } from 'vitest';
import { detectTypeActif, sanitizeModeleName } from './cmdb-provisioning.service';

describe('CMDB Provisioning Service - Amélioration 1', () => {
  describe('sanitizeModeleName', () => {
    it('nettoie le préfixe [INSTALLATION LOGICIELLE]', () => {
      const input = '[INSTALLATION LOGICIELLE] Suite Microsoft 365 Business Standard';
      expect(sanitizeModeleName(input)).toBe('Suite Microsoft 365 Business Standard');
    });

    it('nettoie le préfixe [INSTALLATION LOGICIEL] sans E', () => {
      const input = '[INSTALLATION LOGICIEL] ERP Sage X3 Entreprise';
      expect(sanitizeModeleName(input)).toBe('ERP Sage X3 Entreprise');
    });

    it('nettoie le préfixe [INSTALLATION MATÉRIELLE] avec accent', () => {
      const input = '[INSTALLATION MATÉRIELLE] Switch Cisco Catalyst 24 Ports PoE';
      expect(sanitizeModeleName(input)).toBe('Switch Cisco Catalyst 24 Ports PoE');
    });

    it('nettoie le préfixe [INSTALLATION MATERIELLE] sans accent', () => {
      const input = '[INSTALLATION MATERIELLE] Onduleur APC Smart-UPS 1500VA';
      expect(sanitizeModeleName(input)).toBe('Onduleur APC Smart-UPS 1500VA');
    });

    it('préserve un nom de modèle propre sans préfixe', () => {
      const input = 'Routeur Mikrotik CCR2004-16G-2S+';
      expect(sanitizeModeleName(input)).toBe('Routeur Mikrotik CCR2004-16G-2S+');
    });

    it('retourne une chaîne vide si seul le tag était présent', () => {
      const input = '[INSTALLATION LOGICIELLE]';
      expect(sanitizeModeleName(input)).toBe('');
    });
  });

  describe('detectTypeActif', () => {
    it('respecte un typeActif explicite MATERIEL', () => {
      expect(detectTypeActif('MATERIEL', '[INSTALLATION LOGICIELLE] Office', null, null)).toBe(
        'MATERIEL',
      );
    });

    it('respecte un typeActif explicite LOGICIEL', () => {
      expect(detectTypeActif('LOGICIEL', null, null, null)).toBe('LOGICIEL');
    });

    it('détecte LOGICIEL via le tag dans equipementsDescription', () => {
      expect(
        detectTypeActif(
          undefined,
          '[INSTALLATION LOGICIELLE] Licence Antivirus Kaspersky Endpoint',
          'Installation sur 5 postes',
          null,
        ),
      ).toBe('LOGICIEL');
    });

    it('détecte LOGICIEL via le tag dans description', () => {
      expect(
        detectTypeActif(
          undefined,
          null,
          'Besoin de déploiement: [INSTALLATION LOGICIELLE] VPN FortiClient',
          null,
        ),
      ).toBe('LOGICIEL');
    });

    it('détecte LOGICIEL si categoriePanne vaut LOGICIEL', () => {
      expect(detectTypeActif(undefined, 'Suite bureautique', 'Installation', 'LOGICIEL')).toBe(
        'LOGICIEL',
      );
    });

    it('retourne MATERIEL par défaut ou pour du matériel étiqueté', () => {
      expect(
        detectTypeActif(undefined, '[INSTALLATION MATÉRIELLE] Serveur Dell PowerEdge', null, null),
      ).toBe('MATERIEL');
    });
  });
});

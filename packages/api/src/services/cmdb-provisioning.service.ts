import { db, eq } from '@allotech/db';
import { equipements } from '@allotech/db/schema';

export interface ProvisionEquipementInput {
  ticket: {
    reference: string;
    clientId: string;
    equipementId: string | null;
    typeDemande: string;
    adresseSite: string;
    equipementsDescription: string | null;
    categoriePanne?: string | null;
    description?: string | null;
  };
  equipementInstallation?: {
    modele?: string;
    numeroSerie?: string;
    typeActif?: 'MATERIEL' | 'LOGICIEL';
    editeur?: string | null;
    version?: string | null;
  };
}

export interface ProvisionEquipementResult {
  updatedEquipementId: string | null;
  nouvelEquipementCree: {
    id: string;
    modele: string;
    numeroSerie: string;
    typeActif: 'MATERIEL' | 'LOGICIEL';
  } | null;
}

/**
 * Nettoie le nom du modèle en supprimant les balises de préfixe
 * ex: "[INSTALLATION LOGICIELLE] Suite Microsoft 365" -> "Suite Microsoft 365"
 * ex: "[INSTALLATION MATÉRIELLE] Switch Cisco 24P" -> "Switch Cisco 24P"
 */
export function sanitizeModeleName(rawName: string): string {
  return rawName
    .replace(/^\[INSTALLATION\s+(?:MAT[EÉ]RIEL(?:LE)?|LOGICIEL(?:LE)?)\s*\]\s*/i, '')
    .trim();
}

/**
 * Détecte intelligemment si l'actif à provisionner est un MATERIEL ou un LOGICIEL
 */
export function detectTypeActif(
  explicitType?: 'MATERIEL' | 'LOGICIEL',
  equipementsDescription?: string | null,
  description?: string | null,
  categoriePanne?: string | null,
): 'MATERIEL' | 'LOGICIEL' {
  if (explicitType === 'MATERIEL' || explicitType === 'LOGICIEL') {
    return explicitType;
  }

  const combinedText = `${equipementsDescription ?? ''} ${description ?? ''}`.toUpperCase();

  if (
    combinedText.includes('[INSTALLATION LOGICIELLE]') ||
    combinedText.includes('[INSTALLATION LOGICIEL]') ||
    categoriePanne === 'LOGICIEL'
  ) {
    return 'LOGICIEL';
  }

  return 'MATERIEL';
}

/**
 * Service de provisionnement d'équipements CMDB lors d'une installation
 */
export async function provisionEquipementInstallation(
  input: ProvisionEquipementInput,
): Promise<ProvisionEquipementResult> {
  const { ticket, equipementInstallation } = input;
  let updatedEquipementId = ticket.equipementId;
  let nouvelEquipementCree: {
    id: string;
    modele: string;
    numeroSerie: string;
    typeActif: 'MATERIEL' | 'LOGICIEL';
  } | null = null;

  if (ticket.typeDemande === 'INSTALLATION') {
    if (!ticket.equipementId) {
      const typeActif = detectTypeActif(
        equipementInstallation?.typeActif,
        ticket.equipementsDescription,
        ticket.description,
        ticket.categoriePanne,
      );

      const rawModele =
        equipementInstallation?.modele?.trim() ||
        ticket.equipementsDescription?.trim() ||
        (typeActif === 'LOGICIEL'
          ? `Logiciel installé (${ticket.reference})`
          : `Équipement installé (${ticket.reference})`);

      const cleanedModele = sanitizeModeleName(rawModele);
      const modele =
        cleanedModele.length > 0
          ? cleanedModele
          : typeActif === 'LOGICIEL'
            ? `Logiciel installé (${ticket.reference})`
            : `Équipement installé (${ticket.reference})`;

      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const cleanRef = ticket.reference.replace(/[^a-zA-Z0-9]/g, '');
      const prefixSN = typeActif === 'LOGICIEL' ? 'LIC' : 'SN';
      const numeroSerie =
        equipementInstallation?.numeroSerie?.trim() || `${prefixSN}-${cleanRef}-${randomSuffix}`;

      const qrCodeData = `ALLOTECH-EQ-${crypto.randomUUID()}`;

      const [createdEq] = await db
        .insert(equipements)
        .values({
          clientId: ticket.clientId,
          typeActif,
          modele,
          numeroSerie,
          editeur: equipementInstallation?.editeur?.trim() || null,
          version: equipementInstallation?.version?.trim() || null,
          siteAdresse: ticket.adresseSite,
          dateInstallation: new Date(),
          statut: 'EN_SERVICE',
          qrCodeData,
        })
        .returning();

      if (createdEq) {
        updatedEquipementId = createdEq.id;
        nouvelEquipementCree = {
          id: createdEq.id,
          modele: createdEq.modele,
          numeroSerie: createdEq.numeroSerie,
          typeActif: createdEq.typeActif as 'MATERIEL' | 'LOGICIEL',
        };
      }
    } else {
      // L'équipement existait déjà (pré-assigné / en stock) : bascule officielle en EN_SERVICE
      await db
        .update(equipements)
        .set({
          statut: 'EN_SERVICE',
          dateInstallation: new Date(),
          siteAdresse: ticket.adresseSite,
          updatedAt: new Date(),
        })
        .where(eq(equipements.id, ticket.equipementId));
    }
  } else if (ticket.typeDemande === 'PANNE' && ticket.equipementId) {
    // Équipement réparé (matériel ou logiciel) : remise automatique en EN_SERVICE dans la CMDB
    await db
      .update(equipements)
      .set({
        statut: 'EN_SERVICE',
        updatedAt: new Date(),
      })
      .where(eq(equipements.id, ticket.equipementId));
  }

  return { updatedEquipementId, nouvelEquipementCree };
}

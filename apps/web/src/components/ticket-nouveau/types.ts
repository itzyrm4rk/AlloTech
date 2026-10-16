export interface Client {
  id: string;
  nom: string;
  typeClient: string;
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
}

export interface Equipement {
  id: string;
  modele: string;
  typeActif: 'MATERIEL' | 'LOGICIEL';
  numeroSerie: string;
  editeur?: string | null;
  statut: string;
}

export interface Technicien {
  id: string;
  prenom: string;
  nom: string;
  matricule: string;
  isActif: boolean;
  photoUrl?: string | null;
  user?: {
    image?: string | null;
    email?: string | null;
  } | null;
  competences?: Array<{
    competence: {
      id: string;
      libelle: string;
    };
  }>;
  disponibilites?: Array<{ dateDebut: string; dateFin: string }>;
}

export interface TicketFormState {
  clientId: string;
  equipementId: string;
  typeDemande: 'PANNE' | 'INSTALLATION';
  urgence: 'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'BASSE';
  adresseSite: string;
  latitudeSite: string;
  longitudeSite: string;
  description: string;
  dateSouhaitee: string;
  commentaire: string;
  categoriePanne: 'MATERIEL' | 'LOGICIEL' | '';
  sousTypePanneMat: string;
  sousTypePanneLog: string;
  equipementsDescription: string;
}

export const URGENCE_OPTIONS = [
  {
    value: 'CRITIQUE',
    label: 'Critique',
    desc: 'Système hors service, impact majeur',
    color: 'border-red-300 bg-red-50 text-red-800 ring-2 ring-red-500/20',
  },
  {
    value: 'HAUTE',
    label: 'Haute',
    desc: 'Dégradation significative des services',
    color: 'border-orange-300 bg-orange-50 text-orange-800 ring-2 ring-orange-500/20',
  },
  {
    value: 'NORMALE',
    label: 'Normale',
    desc: 'Impact limité, opérations possibles',
    color: 'border-sky-300 bg-sky-50 text-sky-800 ring-2 ring-sky-500/20',
  },
  {
    value: 'BASSE',
    label: 'Basse',
    desc: 'Inconvénient mineur, pas urgent',
    color: 'border-slate-300 bg-slate-100 text-slate-800 ring-2 ring-slate-400/20',
  },
] as const;

export const SOUS_TYPE_MAT = [
  { value: 'RESEAU', label: 'Réseau & Connectivité' },
  { value: 'IMPRIMANTE', label: 'Imprimante & Périphériques' },
  { value: 'ELECTRIQUE', label: 'Problème électrique / alimentation' },
  { value: 'AUTRE_MATERIEL', label: 'Autre panne matérielle' },
];

export const SOUS_TYPE_LOG = [
  { value: 'SYSTEME_EXPLOITATION', label: "Système d'exploitation (OS)" },
  { value: 'APPLICATION', label: 'Application / Logiciel métier' },
  { value: 'SECURITE_VIRUS', label: 'Sécurité & Virus' },
  { value: 'AUTRE_LOGICIEL', label: 'Autre panne logicielle' },
];

export const PRESETS_INSTALL_MATERIEL = [
  'Postes PC portables / Bureaux',
  'Écrans & Périphériques',
  'Imprimante réseau / Multifonction',
  'Switch & Routeur Réseau',
  'Câblage & Prises RJ45',
  'Baie de brassage / Serveur physique',
  'Caméras IP & NVR Sécurité',
  'Onduleur & Protection électrique',
];

export const PRESETS_INSTALL_LOGICIEL = [
  "Système d'exploitation (Windows / Linux)",
  'Suite Bureautique (Office 365, LibreOffice)',
  'Progiciel Métier / ERP / CRM',
  'Antivirus & EDR de sécurité',
  'Solution Cloud, Sauvegarde & VPN',
  'Comptes e-mail & Messagerie',
  'Pilotes d’impression & Utilitaires',
];

export function isEnConge(tech: Technicien, date: string | null): boolean {
  if (!date || !tech.disponibilites?.length) return false;
  const d = new Date(date);
  return tech.disponibilites.some((abs) => {
    const debut = new Date(abs.dateDebut);
    const fin = new Date(abs.dateFin);
    return d >= debut && d <= fin;
  });
}

export function formatDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

export function formatFrenchDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

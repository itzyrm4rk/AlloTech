export interface Competence {
  id: string;
  libelle: string;
}

export interface NotificationState {
  type: 'success' | 'error';
  message: string;
}

export function validateCompetenceLibelle(libelle: string): string | null {
  const trimmed = libelle.trim();
  if (!trimmed || trimmed.length < 3) {
    return 'Le libellé doit contenir au moins 3 caractères.';
  }
  return null;
}

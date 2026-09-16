/**
 * AlloTech — Tokens officiels de couleur du Design System
 * Source de vérité : antigravity-04-regles-dor.md
 * Ces valeurs doivent être utilisées partout sans improvisation.
 */

export const allotechColors = {
  // Couleurs principales
  primary: {
    DEFAULT: '#1B3A5C', // Bleu profond : en-têtes, navigation, boutons principaux
    hover: '#142c46',
    foreground: '#FFFFFF',
  },
  secondary: {
    DEFAULT: '#E07A3C', // Orange terracotta : boutons d'action, accents
    hover: '#cf6b2f',
    foreground: '#FFFFFF',
  },
  // Statuts universels
  success: {
    DEFAULT: '#2E8B57', // Vert : intervention clôturée, SLA respecté
    foreground: '#FFFFFF',
    light: '#E8F5E9',
  },
  warning: {
    DEFAULT: '#E0A83C', // Jaune/ambre : intervention en pause, alerte SLA prédictive
    foreground: '#FFFFFF',
    light: '#FFF8E1',
  },
  danger: {
    DEFAULT: '#C0392B', // Rouge : urgence critique, SLA dépassé
    foreground: '#FFFFFF',
    light: '#FFEBEE',
  },
  // Neutres & Fonds
  neutral: {
    dark: '#2C2C2E', // Gris anthracite : texte principal
    light: '#F4F4F5', // Gris clair : fonds, cartes, séparateurs
  },
  background: {
    DEFAULT: '#FAFAF8', // Blanc cassé : fond général
    card: '#FFFFFF',
    muted: '#F4F4F5',
  },
  border: '#E4E4E7',
} as const;

export type AlloTechColors = typeof allotechColors;

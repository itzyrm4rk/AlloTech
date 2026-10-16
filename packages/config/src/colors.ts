/**
 * AlloTech — Tokens officiels de couleur du Design System
 */

export const allotechColors = {
  // 1. Couleurs de marque principales
  primary: {
    DEFAULT: '#31525B',
    hover: '#264047',
    light: '#EAF2F4',
    surface: '#1A2C31',
    foreground: '#FFFFFF',
  },
  secondary: {
    DEFAULT: '#FFA101',
    hover: '#E69000',
    light: '#FFF6E5',
    foreground: '#FFFFFF',
  },
  ice: {
    DEFAULT: '#B3DEE5',
    subtle: '#F0F8FA',
    border: '#98CED7',
    dark: '#457C87',
    foreground: '#163137',
  },
  sand: {
    DEFAULT: '#FAE6B1',
    light: '#FDF8EB',
    border: '#EED28B',
    dark: '#8C6C1B',
    foreground: '#47360A',
  },

  // 2. Statuts universels (SLA, tickets, alertes)
  success: {
    DEFAULT: '#288358',
    light: '#E8F6EF',
    foreground: '#FFFFFF',
  },
  warning: {
    DEFAULT: '#FFA101',
    light: '#FFF6E5',
    foreground: '#FFFFFF',
  },
  danger: {
    DEFAULT: '#D14343',
    light: '#FEECEC',
    foreground: '#FFFFFF',
  },

  // 3. Neutres & Surfaces épurées (Light & Dark)
  neutral: {
    dark: '#1A2C31',
    medium: '#688188',
    light: '#EFF4F6',
  },
  background: {
    DEFAULT: '#F8FAFB',
    card: '#FFFFFF',
    subtle: '#F0F4F6',
    muted: '#EBF1F3',
  },
  dark: {
    bg: '#0E1A1D',
    card: '#16272C',
    border: '#233F47',
    hover: '#2A4B54',
    text: '#F1F7F8',
    muted: '#8BA6AD',
  },
  border: '#E2ECF0',
} as const;

export type AlloTechColors = typeof allotechColors;

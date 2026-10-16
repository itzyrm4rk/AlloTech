import { allotechColors } from './colors';

/**
 * Configuration partagée de Tailwind CSS pour Web (Next.js) et Mobile (NativeWind)
 */
export const tailwindThemeConfig = {
  colors: {
    primary: allotechColors.primary,
    secondary: allotechColors.secondary,
    ice: allotechColors.ice,
    sand: allotechColors.sand,
    success: allotechColors.success,
    warning: allotechColors.warning,
    danger: allotechColors.danger,
    neutral: allotechColors.neutral,
    'neutral-dark': allotechColors.neutral.dark,
    'neutral-light': allotechColors.neutral.light,
    'bg-main': allotechColors.background.DEFAULT,
    'bg-card': allotechColors.background.card,
    'bg-subtle': allotechColors.background.subtle,
    'bg-muted': allotechColors.background.muted,
    'dark-bg': allotechColors.dark.bg,
    'dark-card': allotechColors.dark.card,
    'dark-border': allotechColors.dark.border,
    'dark-hover': allotechColors.dark.hover,
  },
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
  },
};

export { allotechColors };

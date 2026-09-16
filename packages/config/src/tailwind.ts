import { allotechColors } from './colors';

/**
 * Configuration partagée de Tailwind CSS pour Web (Next.js) et Mobile (NativeWind)
 */
export const tailwindThemeConfig = {
  colors: {
    primary: allotechColors.primary,
    secondary: allotechColors.secondary,
    success: allotechColors.success,
    warning: allotechColors.warning,
    danger: allotechColors.danger,
    'neutral-dark': allotechColors.neutral.dark,
    'neutral-light': allotechColors.neutral.light,
    'bg-main': allotechColors.background.DEFAULT,
    'bg-card': allotechColors.background.card,
    'bg-muted': allotechColors.background.muted,
  },
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
  },
};

export { allotechColors };

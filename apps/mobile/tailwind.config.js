const { tailwindThemeConfig } = require('@allotech/config');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    '../../packages/ui/src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: tailwindThemeConfig.colors,
      fontFamily: tailwindThemeConfig.fontFamily,
    },
  },
  plugins: [],
};

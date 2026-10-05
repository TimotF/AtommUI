import { createVuetify, type ThemeDefinition } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { en, fr } from 'vuetify/locale';

/** Neutral atomm palette. No font, icon or runtime resource is fetched remotely. */
export const atommTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#e7e8ea', surface: '#ffffff', 'surface-light': '#f6f6f7',
    primary: '#292a2d', secondary: '#3d3e42', 'on-surface': '#171719',
    error: '#ec221f', info: '#3170d5', success: '#16b364', warning: '#ff6500',
  },
};

/** One plugin per Vue app. Components are imported explicitly by the wrappers. */
export function createAtommVuetify(locale: 'fr' | 'en' = 'fr') {
  return createVuetify({
    theme: { defaultTheme: 'atomm', themes: { atomm: atommTheme } },
    icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
    locale: { locale, fallback: 'en', messages: { en, fr }, rtl: { ar: true, he: true, fa: true } },
    defaults: {
      VBtn: { density: 'comfortable', elevation: 0, rounded: 'lg', ripple: false },
      VTextField: { density: 'compact', variant: 'outlined', hideDetails: true, rounded: 'lg' },
      VSelect: { density: 'compact', variant: 'outlined', hideDetails: true, rounded: 'lg' },
      VCheckbox: { density: 'compact', hideDetails: true, color: 'primary', ripple: false },
      VSlider: { density: 'compact', hideDetails: true, color: 'primary', thumbSize: 12, trackSize: 3, ripple: false },
    },
  });
}

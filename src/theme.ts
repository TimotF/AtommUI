import { createVuetify, type ThemeDefinition } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { en, fr } from 'vuetify/locale';

/** Shared palette tokens. No font, icon or runtime resource is fetched remotely. */
const sharedColors = {
  primary: '#E5534B',
  // White (3.70:1) and on-surface (4.19:1) fail AA on the exact coral.
  // This darker neutral keeps small primary-action text at 4.94:1.
  'on-primary': '#11151D',
  'on-dark': '#FFFFFF',
};

const sharedVariables = {
  'border-opacity': 1,
  'high-emphasis-opacity': 1,
  'medium-emphasis-opacity': 1,
  'hover-opacity': 0.04,
  'focus-opacity': 0.08,
  'selected-opacity': 0.08,
  'activated-opacity': 0.08,
};

export const atommTheme: ThemeDefinition = {
  dark: false,
  colors: {
    ...sharedColors,
    background: '#F5F6F8', surface: '#FFFFFF', 'surface-bright': '#FFFFFF',
    'scene-start': '#F3F5F8', 'scene-end': '#E4E8EE',
    'scene-ground': '#C3CBD6', 'scene-grid': '#7E8B9C',
    'surface-light': '#F0F1F4', 'surface-subtle': '#FAFBFC', control: '#ECEEF2',
    'on-background': '#1F2430', 'on-surface': '#1F2430',
    secondary: '#5B6472', 'on-secondary': '#FFFFFF', 'text-secondary': '#5B6472',
    border: '#E6E8EC', 'border-strong': '#A6AFBC',
    'surface-variant': '#1F2430', 'on-surface-variant': '#FFFFFF',
    'segment-selected': '#FFFFFF', 'on-segment-selected': '#1F2430',
    error: '#B42318', 'on-error': '#FFFFFF', info: '#5B6472', 'on-info': '#FFFFFF',
    success: '#326441', 'on-success': '#FFFFFF', warning: '#8A5715', 'on-warning': '#FFFFFF',
    'warning-border': '#D8BD84',
  },
  variables: { ...sharedVariables, 'border-color': '#E6E8EC', 'shadow-color': '#101828' },
};

/** Optional dark theme, registered without adding an application setting. */
export const atommDarkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    ...sharedColors,
    background: '#171B23', surface: '#1F2530', 'surface-bright': '#282F3B',
    'scene-start': '#303947', 'scene-end': '#1F2733',
    'scene-ground': '#202733', 'scene-grid': '#657285',
    'surface-light': '#252C38', 'surface-subtle': '#1C222C', control: '#2B3340',
    'on-background': '#ECEEF3', 'on-surface': '#ECEEF3',
    secondary: '#AEB7C6', 'on-secondary': '#11151D', 'text-secondary': '#AEB7C6',
    border: '#353D4B', 'border-strong': '#778294',
    'surface-variant': '#ECEEF3', 'on-surface-variant': '#1F2430',
    'segment-selected': '#ECEEF3', 'on-segment-selected': '#1F2430',
    error: '#FF9C95', 'on-error': '#11151D', info: '#AEB7C6', 'on-info': '#11151D',
    success: '#94CCA5', 'on-success': '#11151D', warning: '#E8B65C', 'on-warning': '#11151D',
    'warning-border': '#655331',
  },
  variables: { ...sharedVariables, 'border-color': '#353D4B', 'shadow-color': '#000000' },
};

/** One plugin per Vue app. Components are imported explicitly by the wrappers. */
export function createAtommVuetify(locale: 'fr' | 'en' = 'fr') {
  return createVuetify({
    theme: { defaultTheme: 'atomm', themes: { atomm: atommTheme, 'atomm-dark': atommDarkTheme } },
    icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
    locale: { locale, fallback: 'en', messages: { en, fr }, rtl: { ar: true, he: true, fa: true } },
    defaults: {
      VBtn: { density: 'comfortable', variant: 'tonal', elevation: 0, rounded: 'lg', ripple: false },
      VCard: { variant: 'flat', elevation: 0, rounded: 'xl', border: true },
      VTextField: { density: 'comfortable', variant: 'outlined', hideDetails: 'auto', rounded: 'lg', color: 'primary' },
      VSelect: { density: 'comfortable', variant: 'outlined', hideDetails: 'auto', rounded: 'lg', color: 'primary' },
      VBtnToggle: { density: 'comfortable', variant: 'text', rounded: 'pill', elevation: 0, divided: false },
      VTabs: { density: 'comfortable', bgColor: 'surface-light', color: 'on-segment-selected', hideSlider: true },
      VTooltip: { contentClass: 'au-overlay au-help-popover' },
      VCheckbox: { density: 'compact', hideDetails: true, color: 'primary', ripple: false },
      VSlider: { density: 'compact', hideDetails: true, color: 'primary', thumbSize: 12, trackSize: 3, ripple: false },
    },
  });
}

import { Themes } from 'types';

// Enhance contrast by using white and black text with reduced opacity over
// colored backgrounds instead of gray.
// https://m2.material.io/design/color/text-legibility.html#text-backgrounds
export const themes: Themes = {
  dark: {
    key: 'dark',
    primaryTextColor: '#e6f1ff',
    secondaryTextColor: '#ccd6f6',
    tertiaryTextColor: '#8892b0',
    background: '#0a192f',
    gridColor: 'rgba(100, 255, 218, 0.07)',
    spotlightColor: 'rgba(100, 255, 218, 0.12)',
    shadowColor: '#0000007f',
  },
  light: {
    key: 'light',
    primaryTextColor: '#0a192f',
    secondaryTextColor: '#1e3a5f',
    tertiaryTextColor: '#475569',
    background: '#f8fafc',
    gridColor: 'rgba(10, 25, 47, 0.08)',
    spotlightColor: 'rgba(14, 116, 144, 0.14)',
    shadowColor: '#ffffff7f',
  },
};

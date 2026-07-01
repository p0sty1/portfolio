import { Themes } from 'types';

// Dark glass social-app palette.
export const themes: Themes = {
  dark: {
    key: 'dark',
    primaryTextColor: '#f8fafc',
    secondaryTextColor: '#cbd5e1',
    tertiaryTextColor: '#94a3b8',
    background: '#05070d',
    accentColor: '#7dd3fc',
    cardBackground: 'rgba(7, 11, 20, 0.42)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    cardHoverBorder: 'rgba(255, 255, 255, 0.18)',
    glassBackground: 'rgba(6, 10, 18, 0.58)',
    glassBackgroundHover: 'rgba(255, 255, 255, 0.075)',
    glassBorder: 'rgba(255, 255, 255, 0.11)',
    glassShadow:
      '0 1px 0 rgba(255, 255, 255, 0.07) inset, 0 16px 44px rgba(0, 0, 0, 0.34)',
    glassShadowHover:
      '0 1px 0 rgba(255, 255, 255, 0.11) inset, 0 20px 58px rgba(0, 0, 0, 0.42)',
    glassShadowActive: '0 0 0 1px rgba(125, 211, 252, 0.24) inset',
    glassInsetHighlight:
      'linear-gradient(135deg, rgba(255, 255, 255, 0.08), transparent 44%)',
    iconGlassBackground: 'rgba(255, 255, 255, 0.055)',
    gridColor: 'rgba(255, 255, 255, 0.05)',
    spotlightColor: 'rgba(125, 211, 252, 0.1)',
    shadowColor: 'rgba(0, 0, 0, 0.58)',
  },
  light: {
    key: 'light',
    primaryTextColor: '#101010',
    secondaryTextColor: '#4f4f4f',
    tertiaryTextColor: '#8a8a8a',
    background: '#f6f7f8',
    accentColor: '#0a66ff',
    cardBackground: '#ffffff',
    cardBorder: 'rgba(15, 23, 42, 0.1)',
    cardHoverBorder: 'rgba(15, 23, 42, 0.2)',
    glassBackground: 'rgba(255, 255, 255, 0.92)',
    glassBackgroundHover: '#f2f4f7',
    glassBorder: 'rgba(15, 23, 42, 0.1)',
    glassShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
    glassShadowHover: '0 10px 24px rgba(15, 23, 42, 0.08)',
    glassShadowActive: '0 0 0 1px rgba(15, 23, 42, 0.14) inset',
    glassInsetHighlight: 'none',
    iconGlassBackground: '#f2f4f7',
    gridColor: 'rgba(15, 23, 42, 0.08)',
    spotlightColor: 'rgba(10, 102, 255, 0.1)',
    shadowColor: 'rgba(15, 23, 42, 0.08)',
  },
};

import { Themes } from 'types';

// Palette inspired by https://aakashrajbanshi.com.np/ — dark base + warm gold accent
export const themes: Themes = {
  dark: {
    key: 'dark',
    primaryTextColor: '#ffffff',
    secondaryTextColor: '#c4c4cc',
    tertiaryTextColor: '#8b8b96',
    background: '#0c0c0f',
    accentColor: '#ffdb70',
    cardBackground: '#16161d',
    cardBorder: '#2a2a35',
    cardHoverBorder: '#ffdb7066',
    glassBackground: 'rgba(255, 255, 255, 0.06)',
    glassBackgroundHover: 'rgba(255, 255, 255, 0.11)',
    glassBorder: 'rgba(255, 255, 255, 0.16)',
    glassShadow:
      '0 1px 0 rgba(255, 255, 255, 0.14) inset, 0 1px 2px rgba(0, 0, 0, 0.2), 0 8px 24px rgba(0, 0, 0, 0.35), 0 16px 40px rgba(0, 0, 0, 0.2)',
    glassShadowHover:
      '0 1px 0 rgba(255, 255, 255, 0.22) inset, 0 2px 4px rgba(0, 0, 0, 0.22), 0 12px 32px rgba(0, 0, 0, 0.4), 0 20px 48px rgba(0, 0, 0, 0.25)',
    glassShadowActive:
      '0 2px 6px rgba(0, 0, 0, 0.35) inset, 0 1px 2px rgba(0, 0, 0, 0.15)',
    glassInsetHighlight:
      'linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.03) 38%, transparent 72%)',
    iconGlassBackground: 'rgba(255, 255, 255, 0.1)',
    gridColor: 'rgba(255, 219, 112, 0.08)',
    spotlightColor: 'rgba(255, 219, 112, 0.1)',
    shadowColor: '#00000080',
  },
  light: {
    key: 'light',
    primaryTextColor: '#121218',
    secondaryTextColor: '#3f3f4a',
    tertiaryTextColor: '#6b6b78',
    background: '#f4f4f6',
    accentColor: '#c9a227',
    cardBackground: '#ffffff',
    cardBorder: '#e4e4ea',
    cardHoverBorder: '#c9a22766',
    glassBackground: 'rgba(255, 255, 255, 0.62)',
    glassBackgroundHover: 'rgba(255, 255, 255, 0.78)',
    glassBorder: 'rgba(255, 255, 255, 0.85)',
    glassShadow:
      '0 1px 0 rgba(255, 255, 255, 0.95) inset, 0 1px 2px rgba(0, 0, 0, 0.04), 0 6px 20px rgba(0, 0, 0, 0.08), 0 14px 36px rgba(0, 0, 0, 0.06)',
    glassShadowHover:
      '0 1px 0 rgba(255, 255, 255, 1) inset, 0 2px 6px rgba(0, 0, 0, 0.06), 0 10px 28px rgba(0, 0, 0, 0.1), 0 18px 44px rgba(0, 0, 0, 0.08)',
    glassShadowActive:
      '0 2px 5px rgba(0, 0, 0, 0.08) inset, 0 1px 2px rgba(0, 0, 0, 0.04)',
    glassInsetHighlight:
      'linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.35) 40%, transparent 75%)',
    iconGlassBackground: 'rgba(255, 255, 255, 0.55)',
    gridColor: 'rgba(201, 162, 39, 0.12)',
    spotlightColor: 'rgba(201, 162, 39, 0.14)',
    shadowColor: '#ffffffb3',
  },
};

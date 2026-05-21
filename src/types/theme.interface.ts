export interface Theme {
  key: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  tertiaryTextColor: string;
  background: string;
  accentColor: string;
  cardBackground: string;
  cardBorder: string;
  cardHoverBorder: string;
  glassBackground: string;
  glassBackgroundHover: string;
  glassBorder: string;
  glassShadow: string;
  glassShadowHover: string;
  glassShadowActive: string;
  glassInsetHighlight: string;
  iconGlassBackground: string;
  gridColor: string;
  spotlightColor: string;
  shadowColor: string;
}

export type Themes = Record<string, Theme>;

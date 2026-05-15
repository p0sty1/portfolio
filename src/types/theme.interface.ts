export interface Theme {
  key: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  tertiaryTextColor: string;
  background: string;
  gridColor: string;
  spotlightColor: string;
  shadowColor: string;
}

export type Themes = Record<string, Theme>;

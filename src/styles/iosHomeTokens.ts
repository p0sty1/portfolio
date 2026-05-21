/**
 * Spacing & layout tokens — Apple HIG / Design Resources
 * @see https://developer.apple.com/design/resources/
 */

/** iPhone (iOS) — 390pt logical width reference */
export const iphoneHome = {
  iconSize: '3.75rem',
  dockIconSize: '3.5rem',
  iconRadius: '22%',
  labelSize: '0.6875rem',
  labelWeight: 400,
  iconLabelGap: '0.3125rem',
  gridColumns: 4,
  gridRows: 2,
  screenPaddingX: '1.375rem',
  screenMaxWidth: '24.375rem',
  widgetToGridGap: '1.25rem',
  gridRowGap: '1.375rem',
  gridColumnGap: '1.125rem',
  dockBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))',
  dockPaddingY: '0.875rem',
  dockPaddingX: '1.125rem',
  dockRadius: '1.625rem',
  dockIconGap: '0.5rem',
  dockShowLabels: true,
  dockReserve: '5.75rem',
} as const;

/** iPad / desktop web */
export const ipadHome = {
  iconSize: '4.25rem',
  dockIconSize: '3.875rem',
  iconRadius: '22%',
  labelSize: '0.75rem',
  labelWeight: 400,
  iconLabelGap: '0.375rem',
  gridColumns: 6,
  gridRows: 2,
  screenPaddingX: '2rem',
  screenMaxWidth: '52rem',
  widgetToGridGap: '1.75rem',
  gridRowGap: '1.75rem',
  gridColumnGap: '2rem',
  dockBottom: '1.5rem',
  dockPaddingY: '1rem',
  dockPaddingX: '1.5rem',
  dockRadius: '1.75rem',
  dockIconGap: '1rem',
  dockShowLabels: true,
  dockReserve: '7.5rem',
} as const;

export type HomePlatform = typeof ipadHome | typeof iphoneHome;

export const homeForPlatform = (isMobile: boolean): HomePlatform =>
  isMobile ? iphoneHome : ipadHome;

export const iosSystemColors = {
  orange: '#ff9500',
  blue: '#007aff',
  pink: '#ff2d55',
  purple: '#af52de',
  green: '#34c759',
  yellow: '#ffcc00',
  indigo: '#5856d6',
  gray: '#8e8e93',
  dark: '#1c1c1e',
  linkedin: '#0a66c2',
  coral: '#ff3b30',
} as const;

export const homePlatformVars = (isMobile: boolean): Record<string, string> => {
  const h = homeForPlatform(isMobile);

  return {
    '--icon-size': h.iconSize,
    '--dock-icon-size': h.dockIconSize,
    '--icon-radius': h.iconRadius,
    '--label-size': h.labelSize,
    '--label-weight': String(h.labelWeight),
    '--icon-label-gap': h.iconLabelGap,
    '--grid-columns': String(h.gridColumns),
    '--screen-pad-x': h.screenPaddingX,
    '--screen-max': h.screenMaxWidth,
    '--widget-grid-gap': h.widgetToGridGap,
    '--grid-row-gap': h.gridRowGap,
    '--grid-col-gap': h.gridColumnGap,
    '--dock-bottom': h.dockBottom,
    '--dock-pad-y': h.dockPaddingY,
    '--dock-pad-x': h.dockPaddingX,
    '--dock-radius': h.dockRadius,
    '--dock-icon-gap': h.dockIconGap,
    '--dock-reserve': h.dockReserve,
  };
};

/** @deprecated */
export const iosHome = iphoneHome;

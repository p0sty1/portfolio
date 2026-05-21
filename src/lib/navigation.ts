import { AppView } from 'types';

/** Views opened by tapping a home-screen app icon */
export const viewFromHref = (href: string): AppView | null => {
  if (href === '#gallery') return 'gallery';
  if (href === '#guestbook') return 'guestbook';

  return null;
};

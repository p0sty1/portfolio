import type { JSX } from 'react';

export interface Content {
  display: string;
}

export interface Avatar {
  /** Placeholder initials when `src` is empty */
  initials: string;
  alt: string;
  /** Optional image URL, e.g. `%PUBLIC_URL%/avatar.jpg` */
  src?: string;
}

export interface DoingItem {
  name: string;
  display: string;
  description: string;
  icon: JSX.Element;
  /** iOS-style app icon background gradient */
  iconGradient: string;
  /** `#gallery` / `#guestbook` switch view; other hashes are placeholders */
  href: string;
}

export interface ContactItem {
  name: string;
  display: string;
  ariaLabel: string;
  iconGradient: string;
  href: string;
  icon: JSX.Element;
}

export interface Config {
  name: Content;
  title: Content;
  bio: Content;
  avatar: Avatar;
  doingItems: DoingItem[];
  dockItems: ContactItem[];
}

import type { JSX } from 'react';

import { AppView } from './view.interface';

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

export interface ContactItem {
  name: string;
  display: string;
  ariaLabel: string;
  iconGradient: string;
  href: string;
  icon: JSX.Element;
}

/** Primary sidebar navigation (Instagram-style). */
export interface NavItem {
  name: string;
  display: string;
  view: AppView;
  icon: JSX.Element;
}

export interface Config {
  name: Content;
  title: Content;
  bio: Content;
  avatar: Avatar;
  navItems: NavItem[];
  dockItems: ContactItem[];
  brand: {
    logoAlt: string;
    logoSrc: string;
  };
}

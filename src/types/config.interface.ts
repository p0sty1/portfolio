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
  icon: string;
  /** `#guestbook` scrolls to guestbook page; other hashes are placeholders */
  href: string;
}

export interface Config {
  name: Content;
  title: Content;
  bio: Content;
  avatar: Avatar;
  doingItems: DoingItem[];
}

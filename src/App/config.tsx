import { Email, GitHub, LinkedIn, Resume } from 'icons';
import {
  GalleryNavIcon,
  GuestbookNavIcon,
  HomeNavIcon,
  LikesNavIcon,
} from 'icons/nav';
import { iosSystemColors as C } from 'styles/iosHomeTokens';
import { Config } from 'types';

export const config: Config = {
  name: {
    display: 'Boyu Jiang',
  },
  title: {
    display: 'Full Stack Developer',
  },
  bio: {
    display:
      'Building thoughtful web experiences — from interfaces to APIs. Explore sections in the sidebar or leave a note in the guestbook.',
  },
  avatar: {
    initials: 'BJ',
    alt: 'Boyu Jiang profile photo',
    src: '/api/gallery/media/avatar/profile.jpg',
  },
  brand: {
    logoSrc: '/brand/jyangbly-logo.png',
    logoAlt: 'Jyangbly',
  },
  navItems: [
    {
      name: 'home',
      display: '主页',
      view: 'home',
      icon: <HomeNavIcon />,
    },
    {
      name: 'gallery',
      display: '画廊',
      view: 'gallery',
      icon: <GalleryNavIcon />,
    },
    {
      name: 'likes',
      display: '喜欢',
      view: 'likes',
      icon: <LikesNavIcon />,
    },
    {
      name: 'guestbook',
      display: '留言',
      view: 'guestbook',
      icon: <GuestbookNavIcon />,
    },
  ],
  dockItems: [
    {
      name: 'github',
      display: 'GitHub',
      ariaLabel: 'opens in new window',
      iconGradient: '#636366',
      href: 'https://github.com/p0sty1',
      icon: <GitHub />,
    },
    {
      name: 'linkedin',
      display: 'LinkedIn',
      ariaLabel: 'opens in new window',
      iconGradient: C.linkedin,
      href: 'https://www.linkedin.com/in/boyu-jiang-7a106b383/',
      icon: <LinkedIn />,
    },
    {
      name: 'resume',
      display: 'Resume',
      ariaLabel: 'opens in new window',
      iconGradient: C.coral,
      href: '#',
      icon: <Resume />,
    },
    {
      name: 'email',
      display: 'Email',
      ariaLabel: 'opens in new window',
      iconGradient: C.blue,
      href: 'mailto:jyangb1y@g.ucla.edu',
      icon: <Email />,
    },
  ],
};

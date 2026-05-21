import { Email, GitHub, LinkedIn, Resume } from 'icons';
import {
  BlogIcon,
  DailyIcon,
  FunnyIcon,
  GalleryIcon,
  GuestbookIcon,
  LikesIcon,
  PhotosIcon,
} from 'icons/apps';
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
      'Building thoughtful web experiences — from interfaces to APIs. Explore apps below or leave a note in the guestbook.',
  },
  avatar: {
    initials: 'BJ',
    alt: 'Boyu Jiang profile photo',
    src: '',
  },
  doingItems: [
    {
      name: 'daily',
      display: '日常',
      description: 'Life updates and little moments.',
      icon: <DailyIcon />,
      iconGradient: C.orange,
      href: '#daily',
    },
    {
      name: 'gallery',
      display: '画廊',
      description: 'Projects and visual work.',
      icon: <GalleryIcon />,
      iconGradient: C.blue,
      href: '#gallery',
    },
    {
      name: 'blog',
      display: '博客',
      description: 'Posts and stories.',
      icon: <BlogIcon />,
      iconGradient: C.pink,
      href: '#blog',
    },
    {
      name: 'likes',
      display: '喜欢',
      description: 'Books, music, and tools.',
      icon: <LikesIcon />,
      iconGradient: C.purple,
      href: '#likes',
    },
    {
      name: 'photos',
      display: '照片',
      description: 'Moments in stills.',
      icon: <PhotosIcon />,
      iconGradient: C.green,
      href: '#photos',
    },
    {
      name: 'funny',
      display: '趣味',
      description: 'Memes and side quests.',
      icon: <FunnyIcon />,
      iconGradient: C.yellow,
      href: '#funny',
    },
    {
      name: 'guestbook',
      display: '留言',
      description: 'Leave a note.',
      icon: <GuestbookIcon />,
      iconGradient: C.indigo,
      href: '#guestbook',
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

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
      'Building thoughtful web experiences — from interfaces to APIs. Explore the sections below to see what I am working on, sharing, and collecting.',
  },
  avatar: {
    initials: 'BJ',
    alt: 'Boyu Jiang profile photo',
    src: '',
  },
  doingItems: [
    {
      name: 'guestbook',
      display: '留言板',
      description: 'Leave a note or read what others wrote.',
      icon: '✎',
      href: '#guestbook',
    },
    {
      name: 'gallery',
      display: '画廊',
      description: 'Projects, experiments, and visual work.',
      icon: '◫',
      href: '#gallery',
    },
    {
      name: 'blog',
      display: '博客 / Story',
      description: 'Posts, stories, and longer-form writing.',
      icon: '¶',
      href: '#blog',
    },
    {
      name: 'likes',
      display: 'Things I Like',
      description: 'Books, music, tools, and small joys.',
      icon: '♥',
      href: '#likes',
    },
    {
      name: 'photos',
      display: '照片墙',
      description: 'Moments captured in stills.',
      icon: '▣',
      href: '#photos',
    },
    {
      name: 'funny',
      display: 'Funny Things',
      description: 'Oddities, memes, and side quests.',
      icon: '☺',
      href: '#funny',
    },
  ],
};

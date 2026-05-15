import { Email, GitHub, LinkedIn, Resume } from 'icons';
import { Config } from 'types';

export const config: Config = {
  name: {
    display: 'Boyu Jiang',
  },
  title: {
    display: 'Full Stack Developer',
  },
  buttons: [
    {
      name: 'github',
      display: 'GitHub',
      ariaLabel: 'GitHub profile (opens in new window)',
      icon: <GitHub />,
      href: 'https://github.com/p0sty1',
    },
    {
      name: 'linked-in',
      display: 'LinkedIn',
      ariaLabel: 'LinkedIn profile (opens in new window)',
      icon: <LinkedIn />,
      href: 'https://www.linkedin.com/in/boyu-jiang-7a106b383/',
    },
    {
      name: 'resume',
      display: 'Resume',
      ariaLabel: 'Resume (opens in new window)',
      icon: <Resume />,
      href: '#',
    },
    {
      name: 'email',
      display: 'Email',
      ariaLabel: 'Email contact (opens in new window)',
      icon: <Email />,
      href: 'mailto:jyangb1y@g.ucla.edu',
    },
  ],
};

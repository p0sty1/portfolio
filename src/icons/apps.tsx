/** App glyphs — bold, high-contrast on flat iOS system colors */

const P = {
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true as const,
};

const S = {
  stroke: 'currentColor',
  strokeWidth: 2.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const DailyIcon = () => (
  <svg {...P}>
    <circle cx="12" cy="12" r="4.5" {...S} />
    <path
      {...S}
      d="M12 2.5v2.5M12 19v2.5M4 12h2.5M20 12h2.5M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"
    />
  </svg>
);

export const GalleryIcon = () => (
  <svg {...P}>
    <rect x="3" y="3" width="8" height="8" rx="2" {...S} />
    <rect x="13" y="3" width="8" height="8" rx="2" {...S} />
    <rect x="3" y="13" width="8" height="8" rx="2" {...S} />
    <rect x="13" y="13" width="8" height="8" rx="2" {...S} />
  </svg>
);

export const BlogIcon = () => (
  <svg {...P}>
    <path {...S} d="M7 7h11M7 12h11M7 17h8" />
  </svg>
);

export const LikesIcon = () => (
  <svg {...P}>
    <path
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
    />
  </svg>
);

export const PhotosIcon = () => (
  <svg {...P}>
    <rect x="2" y="5" width="20" height="15" rx="2.5" {...S} />
    <circle cx="8.5" cy="10.5" r="2" fill="currentColor" />
    <path {...S} d="M2 17l6-5 4 3 5-5 5 7" />
  </svg>
);

export const FunnyIcon = () => (
  <svg {...P}>
    <circle cx="12" cy="12" r="9" {...S} />
    <circle cx="9" cy="10" r="1.35" fill="currentColor" />
    <circle cx="15" cy="10" r="1.35" fill="currentColor" />
    <path {...S} d="M8.5 14.5c1.2 2 2.5 2.5 3.5 2.5s2.3-.5 3.5-2.5" />
  </svg>
);

export const GuestbookIcon = () => (
  <svg {...P}>
    <path {...S} d="M6 4h12v14H9l-3 3V4z" />
    <path {...S} d="M9 9h9M9 13h6" />
  </svg>
);

/** Sidebar nav glyphs — Instagram-style stroke icons */

const P = {
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true as const,
};

const S = {
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const HomeNavIcon = () => (
  <svg {...P}>
    <path
      {...S}
      d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z"
    />
  </svg>
);

export const GalleryNavIcon = () => (
  <svg {...P}>
    <rect {...S} x="3" y="3" width="7" height="7" rx="1.5" />
    <rect {...S} x="14" y="3" width="7" height="7" rx="1.5" />
    <rect {...S} x="3" y="14" width="7" height="7" rx="1.5" />
    <rect {...S} x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const LikesNavIcon = () => (
  <svg {...P}>
    <path
      {...S}
      d="M12 20.5s-7-4.35-7-9.5a4 4 0 0 1 7-2.2 4 4 0 0 1 7 2.2c0 5.15-7 9.5-7 9.5z"
    />
  </svg>
);

export const GuestbookNavIcon = () => (
  <svg {...P}>
    <path {...S} d="M6 4h12v14H9l-3 3V4z" />
    <path {...S} d="M9 9h9M9 13h6" />
  </svg>
);

export const MoreNavIcon = () => (
  <svg {...P}>
    <line {...S} x1="5" y1="12" x2="19" y2="12" />
    <line {...S} x1="5" y1="6" x2="19" y2="6" />
    <line {...S} x1="5" y1="18" x2="19" y2="18" />
  </svg>
);

export const ProfileNavIcon = () => (
  <svg {...P}>
    <circle {...S} cx="12" cy="8" r="4" />
    <path {...S} d="M4.5 21a7.5 7.5 0 0 1 15 0" />
  </svg>
);

export const BlogNavIcon = () => (
  <svg {...P}>
    <path {...S} d="M5 4h10l4 4v12H5z" />
    <path {...S} d="M15 4v5h4M8 13h8M8 17h6" />
  </svg>
);

export const AskNavIcon = () => (
  <svg {...P}>
    <path {...S} d="M12 20a8 8 0 1 0-8-8" />
    <path {...S} d="M9.5 9a2.6 2.6 0 0 1 5 1.2c0 1.9-2.5 2.1-2.5 3.8" />
    <path {...S} d="M12 17h.01M4 20l2.3-2.3" />
  </svg>
);

export const FunNavIcon = () => (
  <svg {...P}>
    <path {...S} d="M7 8h10M8 16h8" />
    <path {...S} d="M9 4 7.5 8 4 9.5 7.5 11 9 15l1.5-4L14 9.5 10.5 8z" />
    <path {...S} d="M17 13l-.8 2.2L14 16l2.2.8L17 19l.8-2.2L20 16l-2.2-.8z" />
  </svg>
);

const TIMELINE_ADMIN_UNLOCK_STORAGE = 'portfolio-timeline-admin-unlocked-v1';

export const TIMELINE_SECONDARY_PASSWORD = 'Jyangb1y@';

export const isTimelineAdminUnlocked = () => {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(TIMELINE_ADMIN_UNLOCK_STORAGE) === 'yes';
  } catch {
    return false;
  }
};

export const rememberTimelineAdminUnlock = () => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(TIMELINE_ADMIN_UNLOCK_STORAGE, 'yes');
  } catch {
    // Ignore storage failures; the current session can still publish.
  }
};

export const forgetTimelineAdminUnlock = () => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(TIMELINE_ADMIN_UNLOCK_STORAGE);
  } catch {
    // Ignore storage failures.
  }
};

export const isTimelineAdminPassword = (password: string) =>
  password === TIMELINE_SECONDARY_PASSWORD;

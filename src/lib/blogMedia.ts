const galleryApiBase = () =>
  (process.env.REACT_APP_GALLERY_API_URL ?? '/api/gallery').replace(/\/$/, '');

const r2PublicBase = () =>
  process.env.REACT_APP_R2_PUBLIC_URL?.replace(/\/$/, '');

/** Turn markdown image paths into URLs that work in dev (CRA) and production (Worker). */
export const resolveBlogMediaUrl = (src?: string): string => {
  if (!src) return '';

  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  const toR2OrApiUrl = (objectKey: string): string => {
    const key = objectKey.replace(/^\/+/, '');
    const publicBase = r2PublicBase();
    if (publicBase) {
      return `${publicBase}/${key}`;
    }

    const apiBase = galleryApiBase();
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${apiBase}/media/${key}`;
    }

    return `${apiBase}/media/${key}`;
  };

  if (src.startsWith('/api/gallery/media/')) {
    const key = src.slice('/api/gallery/media/'.length);
    const resolved = toR2OrApiUrl(key);

    if (
      typeof window !== 'undefined' &&
      window.location.hostname === 'localhost'
    ) {
      return `https://jyangb1y.site${galleryApiBase()}/media/${key}`;
    }

    return resolved;
  }

  if (src.startsWith('/blog/images/')) {
    const key = src.replace(/^\//, '');
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/${key}`;
    }
    return toR2OrApiUrl(key);
  }

  if (src.startsWith('/')) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${src}`;
    }
    return src;
  }

  return src;
};

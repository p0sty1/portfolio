import { galleryItems } from 'data/galleryItems';
import { GalleryItem } from 'types/gallery.interface';

interface GalleryManifest {
  items: GalleryItem[];
}

const apiBase = () =>
  (process.env.REACT_APP_GALLERY_API_URL ?? '/api/gallery').replace(/\/$/, '');

const withMediaUrls = (items: GalleryItem[]): GalleryItem[] => {
  const base = apiBase();
  const publicBase = process.env.REACT_APP_R2_PUBLIC_URL?.replace(/\/$/, '');

  return items.map((item) => {
    if (!item.imageKey) return item;

    const imageUrl = publicBase
      ? `${publicBase}/${item.imageKey}`
      : `${base}/media/${item.imageKey}`;

    return { ...item, imageUrl };
  });
};

const normalizeManifestItems = (items: GalleryItem[]): GalleryItem[] =>
  items.map((item) => ({
    ...item,
    imageKey: item.imageKey ?? `gallery/${item.id}.jpg`,
  }));

/** Load gallery from R2 manifest API, fallback to local seed data. */
export const fetchGalleryItems = async (): Promise<{
  fromR2: boolean;
  items: GalleryItem[];
}> => {
  const base = apiBase();

  try {
    const response = await fetch(base, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Gallery API ${String(response.status)}`);
    }

    const data = (await response.json()) as GalleryManifest;
    const items = normalizeManifestItems(data.items ?? []);

    if (items.length === 0) {
      return { items: withMediaUrls(galleryItems), fromR2: false };
    }

    return { items: withMediaUrls(items), fromR2: true };
  } catch {
    return { items: withMediaUrls(galleryItems), fromR2: false };
  }
};

export type GalleryAspectRatio = '1/1' | '3/4' | '4/3';

export interface GalleryItem {
  id: string;
  title: string;
  caption?: string;
  tags: string[];
  aspectRatio: GalleryAspectRatio;
  /** Object key in R2 bucket, e.g. gallery/g1.jpg */
  imageKey?: string;
  /** Resolved URL (from API or public R2 base); omit for placeholder */
  imageUrl?: string;
  imageAlt?: string;
  likes?: number;
}

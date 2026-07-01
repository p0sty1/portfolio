import { useContext, useEffect, useMemo, useState } from 'react';

import type { SupabaseClient } from '@supabase/supabase-js';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { galleryItems } from 'data/galleryItems';
import { fetchGalleryItems } from 'lib/galleryApi';
import { getSupabase } from 'lib/supabaseClient';
import { Theme } from 'types';
import { GalleryAspectRatio, GalleryItem } from 'types/gallery.interface';

const Page = styled.div`
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 58rem;
  margin: 0 auto;
  box-sizing: border-box;
  text-align: left;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;

  @media (width >= 769px) {
    padding: 1.35rem clamp(1.2rem, 4vw, 2.2rem) 3rem;
  }
`;

const RoomHeader = styled.header<{ $theme: Theme }>`
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  padding: 1rem 1.1rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 16px;
  background: ${({ $theme }) => $theme.cardBackground};
  box-shadow: ${({ $theme }) => $theme.glassShadow};
`;

const Eyebrow = styled.span<{ $theme: Theme }>`
  display: inline-flex;
  margin-bottom: 0.35rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.74rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Heading = styled.h1<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: clamp(1.35rem, 4vw, 2rem);
  font-weight: 820;
  line-height: 1.08;
  letter-spacing: 0;
`;

const EmptyText = styled.p<{ $theme: Theme }>`
  margin: 1rem 0 0;
  font-size: 0.88rem;
  line-height: 1.55;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
`;

const ScrollBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 0.5rem;
  -webkit-overflow-scrolling: touch;
`;

const Masonry = styled.div`
  column-count: 2;
  column-gap: 0.65rem;

  @media only screen and (min-width: 900px) {
    column-count: 3;
    column-gap: 0.85rem;
  }
`;

const Card = styled.article<{ $theme: Theme }>`
  break-inside: avoid;
  margin-bottom: 0.65rem;
  border-radius: 12px;
  overflow: hidden;
  background: transparent;
  border: 0;
  box-shadow: none;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: none;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const Media = styled.div<{ $ratio: GalleryAspectRatio; $theme: Theme }>`
  position: relative;
  aspect-ratio: ${({ $ratio }) => $ratio.replace('/', ' / ')};
  background: linear-gradient(
    145deg,
    ${({ $theme }) => $theme.iconGlassBackground} 0%,
    ${({ $theme }) => $theme.cardBackground} 55%,
    ${({ $theme }) => $theme.spotlightColor} 100%
  );
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const PlaceholderLabel = styled.span<{ $theme: Theme }>`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  text-align: center;
  font-size: 0.72rem;
  line-height: 1.4;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  pointer-events: none;
`;

const CardBody = styled.div`
  padding: 0.55rem 0.15rem 0.75rem;
`;

const CardTitle = styled.h2<{ $theme: Theme }>`
  margin: 0 0 0.45rem;
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.35;
  color: ${({ $theme }) => $theme.primaryTextColor};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  min-width: 0;
`;

const Tag = styled.span<{ $theme: Theme }>`
  padding: 0.12rem 0;
  border-radius: 4px;
  font-size: 0.62rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
`;

const LikeButton = styled.button<{ $liked: boolean; $theme: Theme }>`
  flex-shrink: 0;
  min-width: 2.65rem;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.2rem;
  padding: 0.2rem 0;
  border: 0;
  background: transparent;
  font-size: 0.68rem;
  line-height: 1;
  color: ${({ $liked, $theme }) =>
    $liked ? '#ff4d64' : $theme.tertiaryTextColor};
  cursor: pointer;
  transition:
    color 0.18s ease,
    transform 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    color: #ff4d64;
  }

  &:disabled {
    cursor: default;
    opacity: 0.65;
  }

  span {
    font-size: 0.62rem;
  }
`;

const GALLERY_CLIENT_ID_KEY = 'portfolio.gallery.likeClientId';
const GALLERY_LIKED_ITEMS_KEY = 'portfolio.gallery.likedItems';

interface GalleryLikeCountRow {
  item_id: string;
  likes_count: number;
}

const formatLikes = (n?: number) => {
  if (n === undefined) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;

  return String(n);
};

const fallbackUuid = () => {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes).map((byte) =>
    byte.toString(16).padStart(2, '0'),
  );

  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
    .slice(6, 8)
    .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
};

const getGalleryClientId = () => {
  const existing = window.localStorage.getItem(GALLERY_CLIENT_ID_KEY);
  if (existing) return existing;

  const next =
    typeof window.crypto.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : fallbackUuid();
  window.localStorage.setItem(GALLERY_CLIENT_ID_KEY, next);

  return next;
};

const readLikedGalleryItems = () => {
  try {
    const raw = window.localStorage.getItem(GALLERY_LIKED_ITEMS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];

    return new Set<string>(
      Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [],
    );
  } catch {
    return new Set<string>();
  }
};

const persistLikedGalleryItems = (itemIds: Set<string>) => {
  window.localStorage.setItem(
    GALLERY_LIKED_ITEMS_KEY,
    JSON.stringify(Array.from(itemIds)),
  );
};

const mergeGalleryLikes = (
  sourceItems: GalleryItem[],
  rows: GalleryLikeCountRow[],
) => {
  const counts = new Map(rows.map((row) => [row.item_id, row.likes_count]));

  return sourceItems.map((item) => ({
    ...item,
    likes: counts.get(item.id) ?? item.likes ?? 0,
  }));
};

const fetchGalleryLikeCounts = async (
  client: SupabaseClient,
  itemIds: string[],
) => {
  if (itemIds.length === 0) return [];

  const result = await client.rpc('get_gallery_like_counts', {
    p_item_ids: itemIds,
  });

  if (result.error) throw result.error;

  return (result.data ?? []) as GalleryLikeCountRow[];
};

const GalleryCard = ({
  item,
  liked,
  liking,
  onLike,
  theme,
}: {
  item: GalleryItem;
  liked: boolean;
  liking: boolean;
  onLike: (itemId: string) => void;
  theme: Theme;
}) => {
  const [imageBroken, setImageBroken] = useState(false);
  const imageUrl = item.imageUrl?.trim();
  const showImage = Boolean(imageUrl) && !imageBroken;

  return (
    <Card
      $theme={theme}
      data-v2={`gallery-card-${item.id}`}
      aria-label={item.title}
    >
      <Media $ratio={item.aspectRatio} $theme={theme}>
        {showImage ? (
          <img
            src={imageUrl}
            alt={item.imageAlt ?? item.title}
            loading="lazy"
            onError={() => {
              setImageBroken(true);
            }}
          />
        ) : (
          <PlaceholderLabel $theme={theme}>
            {item.imageKey ? `R2 path ${item.imageKey}` : 'Image pending'}
          </PlaceholderLabel>
        )}
      </Media>
      <CardBody>
        <CardTitle $theme={theme}>{item.title}</CardTitle>
        <CardMeta>
          <TagRow>
            {item.tags.slice(0, 2).map((tag) => (
              <Tag key={tag} $theme={theme}>
                {tag}
              </Tag>
            ))}
          </TagRow>
          <LikeButton
            type="button"
            $liked={liked}
            $theme={theme}
            aria-label={`${liked ? 'Liked' : 'Like'} ${item.title}`}
            disabled={liked || liking}
            onClick={(event) => {
              event.stopPropagation();
              onLike(item.id);
            }}
          >
            <span aria-hidden="true">♥</span>
            {liking ? '...' : formatLikes(item.likes)}
          </LikeButton>
        </CardMeta>
      </CardBody>
    </Card>
  );
};

export const Gallery = () => {
  const { theme } = useContext(AppContext);
  const client = useMemo(() => getSupabase(), []);
  const [items, setItems] = useState<GalleryItem[]>(galleryItems);
  const [likedItemIds, setLikedItemIds] = useState<Set<string>>(
    readLikedGalleryItems,
  );
  const [likingItemIds, setLikingItemIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const loadItems = async () => {
      const result = await fetchGalleryItems();
      let nextItems = result.items;

      if (client) {
        try {
          const rows = await fetchGalleryLikeCounts(
            client,
            nextItems.map((item) => item.id),
          );
          nextItems = mergeGalleryLikes(nextItems, rows);
        } catch {
          nextItems = result.items;
        }
      }

      if (!cancelled) {
        setItems(nextItems);
      }
    };

    void loadItems();

    return () => {
      cancelled = true;
    };
  }, [client]);

  const onLike = async (itemId: string) => {
    if (!client || likedItemIds.has(itemId) || likingItemIds.has(itemId)) {
      return;
    }

    setLikingItemIds((current) => new Set(current).add(itemId));

    try {
      const result = await client.rpc('like_gallery_item', {
        p_client_id: getGalleryClientId(),
        p_item_id: itemId,
      });

      if (result.error) throw result.error;

      const nextLiked = new Set(likedItemIds).add(itemId);
      const nextLikeCount: unknown = result.data;
      setLikedItemIds(nextLiked);
      persistLikedGalleryItems(nextLiked);

      setItems((current) =>
        current.map((item) =>
          item.id === itemId
            ? {
                ...item,
                likes:
                  typeof nextLikeCount === 'number'
                    ? nextLikeCount
                    : (item.likes ?? 0) + 1,
              }
            : item,
        ),
      );
    } finally {
      setLikingItemIds((current) => {
        const next = new Set(current);
        next.delete(itemId);

        return next;
      });
    }
  };

  return (
    <Page data-page-root data-v2="gallery">
      <RoomHeader $theme={theme}>
        <Eyebrow $theme={theme}>Gallery / Images</Eyebrow>
        <Heading $theme={theme}>画廊</Heading>
      </RoomHeader>
      <ScrollBody>
        <Masonry>
          {items.map((item) => (
            <GalleryCard
              key={item.id}
              item={item}
              liked={likedItemIds.has(item.id)}
              liking={likingItemIds.has(item.id)}
              onLike={(itemId) => {
                void onLike(itemId);
              }}
              theme={theme}
            />
          ))}
        </Masonry>
        {items.length === 0 ? (
          <EmptyText $theme={theme}>No gallery items yet.</EmptyText>
        ) : null}
      </ScrollBody>
    </Page>
  );
};

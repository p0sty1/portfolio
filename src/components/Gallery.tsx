import { useContext, useEffect, useMemo, useState } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import {
  type GalleryFilter,
  galleryFilters,
  galleryItems,
} from 'data/galleryItems';
import { fetchGalleryItems } from 'lib/galleryApi';
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

const FilterRow = styled.div`
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.35rem;
  margin: 1rem 0;
  flex-shrink: 0;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const FilterChip = styled.button<{ $active: boolean; $theme: Theme }>`
  flex-shrink: 0;
  padding: 0.45rem 0.95rem;
  border-radius: 999px;
  border: 1px solid
    ${({ $active, $theme }) =>
      $active ? $theme.primaryTextColor : $theme.glassBorder};
  background: ${({ $active, $theme }) =>
    $active ? $theme.primaryTextColor : $theme.cardBackground};
  color: ${({ $active, $theme }) =>
    $active ? $theme.cardBackground : $theme.secondaryTextColor};
  font-size: 0.8rem;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
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
  border-radius: 16px;
  overflow: hidden;
  background: ${({ $theme }) => $theme.cardBackground};
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  box-shadow: ${({ $theme }) => $theme.glassShadow};
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ $theme }) => $theme.glassShadowHover};
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
  padding: 0.65rem 0.7rem 0.75rem;
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
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  font-size: 0.62rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  background: ${({ $theme }) => $theme.spotlightColor};
`;

const Likes = styled.span<{ $theme: Theme }>`
  flex-shrink: 0;
  font-size: 0.68rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};

  &::before {
    content: '♥ ';
    color: #ff6b6b;
    font-size: 0.62rem;
  }
`;

const formatLikes = (n?: number) => {
  if (n === undefined) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;

  return String(n);
};

const matchesFilter = (item: GalleryItem, filter: GalleryFilter) => {
  if (filter === '全部') return true;

  return item.tags.includes(filter);
};

const GalleryCard = ({ item, theme }: { item: GalleryItem; theme: Theme }) => {
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
            {item.imageKey ? `R2 · ${item.imageKey}` : '图片待上传'}
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
          <Likes $theme={theme}>{formatLikes(item.likes)}</Likes>
        </CardMeta>
      </CardBody>
    </Card>
  );
};

export const Gallery = () => {
  const { theme } = useContext(AppContext);
  const [filter, setFilter] = useState<GalleryFilter>('全部');
  const [items, setItems] = useState<GalleryItem[]>(galleryItems);

  useEffect(() => {
    let cancelled = false;

    void fetchGalleryItems().then((result) => {
      if (cancelled) return;
      setItems(result.items);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleItems = useMemo(
    () => items.filter((item) => matchesFilter(item, filter)),
    [items, filter],
  );

  return (
    <Page data-page-root data-v2="gallery">
      <RoomHeader $theme={theme}>
        <Eyebrow $theme={theme}>Gallery / Images</Eyebrow>
        <Heading $theme={theme}>画廊</Heading>
      </RoomHeader>
      <FilterRow role="tablist" aria-label="画廊分类">
        {galleryFilters.map((chip) => (
          <FilterChip
            key={chip}
            type="button"
            role="tab"
            aria-selected={filter === chip}
            $active={filter === chip}
            $theme={theme}
            data-v2={`gallery-filter-${chip}`}
            onClick={() => {
              setFilter(chip);
            }}
          >
            {chip}
          </FilterChip>
        ))}
      </FilterRow>
      <ScrollBody>
        <Masonry>
          {visibleItems.map((item) => (
            <GalleryCard key={item.id} item={item} theme={theme} />
          ))}
        </Masonry>
        {visibleItems.length === 0 ? (
          <EmptyText $theme={theme}>该分类暂无内容。</EmptyText>
        ) : null}
      </ScrollBody>
    </Page>
  );
};

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
  z-index: 1;
  width: 100%;
  max-width: 56rem;
  margin: 0 auto;
  box-sizing: border-box;

  @media (width >= 769px) {
    padding: 2rem clamp(1.25rem, 4vw, 2rem) 1.5rem;
  }
  text-align: left;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
`;

const TopBar = styled.div`
  margin-bottom: 1.25rem;
  flex-shrink: 0;
`;

const Heading = styled.h1<{ $theme: Theme }>`
  margin: 0;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 600;
  color: ${({ $theme }) => $theme.accentColor};
`;

const Subtitle = styled.p<{ $theme: Theme }>`
  margin: 0 0 1rem;
  font-size: 0.88rem;
  line-height: 1.55;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  flex-shrink: 0;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.35rem;
  margin-bottom: 1rem;
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
      $active ? $theme.accentColor : $theme.glassBorder};
  background: ${({ $active, $theme }) =>
    $active ? $theme.spotlightColor : $theme.glassBackground};
  color: ${({ $active, $theme }) =>
    $active ? $theme.accentColor : $theme.secondaryTextColor};
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
  border-radius: 14px;
  overflow: hidden;
  background: ${({ $theme }) => $theme.cardBackground};
  border: 1px solid ${({ $theme }) => $theme.glassBorder};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
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
  const [fromR2, setFromR2] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void fetchGalleryItems().then((result) => {
      if (cancelled) return;
      setItems(result.items);
      setFromR2(result.fromR2);
      setLoading(false);
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
      <TopBar>
        <Heading $theme={theme}>画廊</Heading>
      </TopBar>
      <Subtitle $theme={theme}>
        {loading
          ? '正在加载画廊…'
          : fromR2
            ? '图片来自 Cloudflare R2（portfolio-gallery）'
            : '本地示例数据；部署 Worker 后将从 R2 读取 manifest'}
      </Subtitle>
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
          <Subtitle $theme={theme} style={{ marginTop: '1rem' }}>
            该分类暂无内容。
          </Subtitle>
        ) : null}
      </ScrollBody>
    </Page>
  );
};

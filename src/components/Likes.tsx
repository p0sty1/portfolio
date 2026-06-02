import { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { getSupabase } from 'lib/supabaseClient';
import { Theme } from 'types';
import {
  FAVORITE_CATEGORIES,
  type FavoriteCategory,
  type FavoriteFilter,
  favoriteFilters,
  type FavoriteItem,
} from 'types/favorites.interface';

const TABLE = 'portfolio_favorites';

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

const CategoryBlock = styled.section`
  margin-bottom: 1.75rem;
`;

const CategoryTitle = styled.h2<{ $theme: Theme }>`
  margin: 0 0 0.75rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8.25rem, 1fr));
  gap: 0.75rem;
  width: 100%;

  @media (width >= 769px) {
    grid-template-columns: repeat(auto-fill, minmax(9rem, 10.5rem));
  }
`;

const Card = styled.a<{ $clickable: boolean; $theme: Theme }>`
  width: 100%;
  min-width: 0;
  text-decoration: none;
  color: inherit;
  border-radius: 16px;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  background: ${({ $theme }) => $theme.cardBackground};
  overflow: hidden;
  box-shadow: ${({ $theme }) => $theme.glassShadow};
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  pointer-events: ${({ $clickable }) => ($clickable ? 'auto' : 'none')};
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: ${({ $clickable }) =>
      $clickable ? 'translateY(-2px)' : 'none'};
    box-shadow: ${({ $clickable, $theme }) =>
      $clickable ? $theme.glassShadowHover : $theme.glassShadow};
  }

  &:active {
    transform: ${({ $clickable }) => ($clickable ? 'scale(0.98)' : 'none')};
  }
`;

const CardImageWrap = styled.div<{ $theme: Theme }>`
  position: relative;
  aspect-ratio: 5 / 7;
  background: ${({ $theme }) => $theme.iconGlassBackground};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const ImagePlaceholder = styled.span<{ $theme: Theme }>`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.62rem;
  line-height: 1.35;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
`;

const CardBody = styled.div`
  padding: 0.55rem 0.6rem 0.65rem;
`;

const CardTitle = styled.div<{ $theme: Theme }>`
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.3;
  color: ${({ $theme }) => $theme.primaryTextColor};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardSubtitle = styled.div<{ $theme: Theme }>`
  margin-top: 0.2rem;
  font-size: 0.65rem;
  color: ${({ $theme }) => $theme.secondaryTextColor};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardNote = styled.span<{ $theme: Theme }>`
  display: inline-block;
  margin-top: 0.3rem;
  padding: 0.12rem 0.4rem;
  border-radius: 4px;
  font-size: 0.58rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  background: ${({ $theme }) => $theme.spotlightColor};
`;

const isExternalLink = (url: string) =>
  url.startsWith('http://') || url.startsWith('https://');

const placeholderImage = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/560`;

/** Site-local posters in /public/favorites, R2 keys, or absolute URLs. */
const resolveFavoriteImageUrl = (imageUrl: string): string => {
  const raw = imageUrl.trim();
  if (!raw) return '';

  if (raw.startsWith('/')) {
    const base = process.env.PUBLIC_URL ?? '';
    return `${base}${raw}`;
  }

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }

  const base = (
    process.env.REACT_APP_GALLERY_API_URL ?? '/api/gallery'
  ).replace(/\/$/, '');
  return `${base}/media/${raw}`;
};

const filterToCategory = (filter: FavoriteFilter): FavoriteCategory | null => {
  if (filter === '全部') return null;

  return FAVORITE_CATEGORIES.find((c) => c.filterLabel === filter)?.id ?? null;
};

const FavoriteCard = ({
  item,
  theme,
}: {
  item: FavoriteItem;
  theme: Theme;
}) => {
  const href = isExternalLink(item.link_url) ? item.link_url : undefined;
  const imageSrc =
    resolveFavoriteImageUrl(item.image_url) || placeholderImage(item.id);
  const [imageBroken, setImageBroken] = useState(false);

  return (
    <Card
      key={item.id}
      $clickable={Boolean(href)}
      $theme={theme}
      data-v2={`likes-card-${item.id}`}
      href={href ?? '#'}
      rel={href ? 'noopener noreferrer' : undefined}
      target={href ? '_blank' : undefined}
      onClick={(event) => {
        if (!href) event.preventDefault();
      }}
    >
      <CardImageWrap $theme={theme}>
        {!imageBroken ? (
          <img
            src={imageSrc}
            alt={item.title}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => {
              setImageBroken(true);
            }}
          />
        ) : (
          <ImagePlaceholder $theme={theme} role="img" aria-label={item.title}>
            海报加载失败
          </ImagePlaceholder>
        )}
      </CardImageWrap>
      <CardBody>
        <CardTitle $theme={theme}>{item.title}</CardTitle>
        {item.subtitle ? (
          <CardSubtitle $theme={theme}>{item.subtitle}</CardSubtitle>
        ) : null}
        {item.note ? <CardNote $theme={theme}>{item.note}</CardNote> : null}
      </CardBody>
    </Card>
  );
};

export const Likes = () => {
  const { theme } = useContext(AppContext);
  const client = getSupabase();

  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [filter, setFilter] = useState<FavoriteFilter>('全部');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);

  const load = useCallback(async () => {
    if (!client) {
      setLoading(false);

      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await client
      .from(TABLE)
      .select(
        'id, category, title, subtitle, link_url, image_url, note, sort_order, created_at',
      )
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    setLoading(false);

    if (fetchError) {
      setError(fetchError.message);

      return;
    }

    setItems((data ?? []) as FavoriteItem[]);
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const sections = useMemo(() => {
    const activeCategory = filterToCategory(filter);

    const buckets = FAVORITE_CATEGORIES.map(({ id, label }) => ({
      id,
      label,
      items: [] as FavoriteItem[],
    }));

    for (const item of items) {
      const bucket = buckets.find((b) => b.id === item.category);
      if (bucket) bucket.items.push(item);
    }

    const filled = buckets.filter((b) => b.items.length > 0);

    if (activeCategory) {
      return filled.filter((b) => b.id === activeCategory);
    }

    return filled;
  }, [items, filter]);

  return (
    <Page data-page-root data-v2="likes">
      <RoomHeader $theme={theme}>
        <Eyebrow $theme={theme}>Likes / Collection</Eyebrow>
        <Heading $theme={theme}>喜欢</Heading>
      </RoomHeader>
      <FilterRow role="tablist" aria-label="喜欢分类">
        {favoriteFilters.map((chip) => (
          <FilterChip
            key={chip}
            type="button"
            role="tab"
            aria-selected={filter === chip}
            $active={filter === chip}
            $theme={theme}
            data-v2={`likes-filter-${chip}`}
            onClick={() => {
              setFilter(chip);
            }}
          >
            {chip}
          </FilterChip>
        ))}
      </FilterRow>
      <ScrollBody>
        {error ? <EmptyText $theme={theme}>{error}</EmptyText> : null}
        {sections.length === 0 && !loading ? (
          <EmptyText $theme={theme}>暂无收藏内容。</EmptyText>
        ) : (
          sections.map((section) => (
            <CategoryBlock
              key={section.id}
              data-v2={`likes-section-${section.id}`}
            >
              {filter === '全部' ? (
                <CategoryTitle $theme={theme}>{section.label}</CategoryTitle>
              ) : null}
              <CardGrid>
                {section.items.map((item) => (
                  <FavoriteCard key={item.id} item={item} theme={theme} />
                ))}
              </CardGrid>
            </CategoryBlock>
          ))
        )}
      </ScrollBody>
    </Page>
  );
};

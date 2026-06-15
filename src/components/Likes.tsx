import {
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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

const FlowShell = styled.div`
  position: relative;
  width: 100%;
`;

const FlowViewport = styled.div<{ $dragging: boolean; $theme: Theme }>`
  --likes-flow-cover-width: clamp(7.5rem, 20vw, 12.25rem);
  --likes-flow-spacing: clamp(5.4rem, 15vw, 10.25rem);

  position: relative;
  height: clamp(19rem, 38vw, 26rem);
  overflow: hidden;
  outline: none;
  user-select: none;
  touch-action: pan-y;
  cursor: ${({ $dragging }) => ($dragging ? 'grabbing' : 'grab')};
  perspective: 1500px;
  perspective-origin: center 42%;

  &::after {
    content: '';
    position: absolute;
    left: 8%;
    right: 8%;
    bottom: 1.45rem;
    height: 34%;
    border-radius: 50%;
    background: radial-gradient(
      ellipse at center,
      ${({ $theme }) => $theme.shadowColor} 0%,
      transparent 68%
    );
    opacity: 0.5;
    pointer-events: none;
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px ${({ $theme }) => $theme.accentColor};
    border-radius: 12px;
  }

  @media (width <= 768px) {
    --likes-flow-cover-width: clamp(6.6rem, 40vw, 9.25rem);
    --likes-flow-spacing: clamp(4.25rem, 28vw, 6.9rem);

    height: 18.25rem;
  }
`;

const FlowItemButton = styled.button<{ $active: boolean; $theme: Theme }>`
  position: absolute;
  top: 41%;
  left: 50%;
  width: var(--likes-flow-cover-width);
  aspect-ratio: 5 / 7;
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  transform-style: preserve-3d;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:focus {
    outline: none;
  }

  &:focus-visible > div {
    box-shadow:
      0 0 0 2px ${({ $theme }) => $theme.accentColor},
      ${({ $active }) =>
        $active
          ? '0 24px 60px rgba(0, 0, 0, 0.36)'
          : '0 18px 42px rgba(0, 0, 0, 0.24)'};
  }
`;

const FlowCover = styled.div<{ $active: boolean; $theme: Theme }>`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  transform-style: preserve-3d;
  box-shadow: ${({ $active }) =>
    $active
      ? '0 24px 60px rgba(0, 0, 0, 0.36)'
      : '0 18px 42px rgba(0, 0, 0, 0.24)'};
  transition: box-shadow 0.24s ease;
`;

const CoverSurface = styled.div<{ $active: boolean; $theme: Theme }>`
  position: absolute;
  inset: 0;
  overflow: hidden;
  border: 1px solid
    ${({ $active, $theme }) =>
      $active ? $theme.cardHoverBorder : $theme.cardBorder};
  border-radius: inherit;
  background: ${({ $theme }) => $theme.iconGlassBackground};
`;

const CoverImage = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  user-select: none;
  -webkit-user-drag: none;
`;

const CoverSheen = styled.span`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.18) 0%,
    rgba(255, 255, 255, 0.05) 26%,
    transparent 48%,
    rgba(0, 0, 0, 0.1) 100%
  );
  pointer-events: none;
`;

const CoverReflection = styled.span<{ $active: boolean }>`
  position: absolute;
  top: calc(100% + 0.38rem);
  left: 0;
  width: 100%;
  height: 54%;
  border-radius: inherit;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  filter: blur(0.4px) brightness(0.72) saturate(0.9);
  opacity: ${({ $active }) => ($active ? 0.52 : 0.32)};
  pointer-events: none;
  transform: scaleY(-1);
  mask-image: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.72) 0%,
    rgba(0, 0, 0, 0.28) 42%,
    transparent 82%
  );
  -webkit-mask-image: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.72) 0%,
    rgba(0, 0, 0, 0.28) 42%,
    transparent 82%
  );
`;

const ImagePlaceholder = styled.span<{ $theme: Theme }>`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem;
  text-align: center;
  font-size: 0.68rem;
  line-height: 1.35;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
`;

const ActiveMarker = styled.span<{ $theme: Theme }>`
  position: absolute;
  top: 0.55rem;
  right: 0.55rem;
  width: 0.48rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background: ${({ $theme }) => $theme.primaryTextColor};
  box-shadow: 0 0 16px ${({ $theme }) => $theme.shadowColor};
  pointer-events: none;
`;

const FlowInfo = styled.div`
  min-height: 4.6rem;
  margin-top: -0.25rem;
  text-align: center;
`;

const FlowTitle = styled.a<{ $clickable: boolean; $theme: Theme }>`
  display: inline-block;
  max-width: min(30rem, 100%);
  width: 100%;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: clamp(0.96rem, 2.4vw, 1.16rem);
  font-weight: 700;
  line-height: 1.28;
  text-decoration: none;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  pointer-events: ${({ $clickable }) => ($clickable ? 'auto' : 'none')};

  &:hover {
    text-decoration: ${({ $clickable }) => ($clickable ? 'underline' : 'none')};
  }
`;

const FlowSubtitle = styled.div<{ $theme: Theme }>`
  margin: 0.28rem auto 0;
  max-width: min(28rem, 100%);
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font-size: 0.78rem;
  line-height: 1.4;
`;

const FlowNote = styled.span<{ $theme: Theme }>`
  display: inline-flex;
  margin-top: 0.48rem;
  padding: 0.16rem 0.48rem;
  border-radius: 6px;
  font-size: 0.62rem;
  line-height: 1.4;
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

const clampIndex = (index: number, length: number) =>
  Math.min(Math.max(index, 0), Math.max(length - 1, 0));

const filterToCategory = (filter: FavoriteFilter): FavoriteCategory | null => {
  if (filter === '全部') return null;

  return FAVORITE_CATEGORIES.find((c) => c.filterLabel === filter)?.id ?? null;
};

const getFavoriteHref = (item: FavoriteItem) =>
  isExternalLink(item.link_url) ? item.link_url : undefined;

const getFlowTransform = (
  index: number,
  currentIndex: number,
  dragOffset: number,
  dragging: boolean,
) => {
  const offset = index - currentIndex + (dragging ? dragOffset / 120 : 0);
  const distance = Math.abs(offset);
  const direction = distance === 0 ? 0 : offset / distance;
  const xMultiplier = offset * (distance < 1 ? 0.9 : 1);
  const rotation = distance < 0.08 ? 0 : -direction * 56;
  const z = distance < 0.08 ? 220 : -82 * distance;
  const scale = distance < 0.08 ? 1.18 : Math.max(0.72, 1.05 - distance * 0.06);
  const opacity = distance <= 3 ? 1 : Math.max(0, 1 - (distance - 3) * 0.35);

  return {
    opacity,
    transform: [
      'translate(-50%, -50%)',
      `translateX(calc(${String(xMultiplier)} * var(--likes-flow-spacing)))`,
      `translateZ(${String(z)}px)`,
      `rotateY(${String(rotation)}deg)`,
      `scale(${String(scale)})`,
    ].join(' '),
    zIndex: Math.max(1, 1000 - Math.round(distance * 100)),
  };
};

const FavoriteCoverImage = ({
  item,
  active,
  theme,
}: {
  active: boolean;
  item: FavoriteItem;
  theme: Theme;
}) => {
  const imageSrc =
    resolveFavoriteImageUrl(item.image_url) || placeholderImage(item.id);
  const [imageBroken, setImageBroken] = useState(false);
  const backgroundImage = `url(${JSON.stringify(imageSrc)})`;

  useEffect(() => {
    setImageBroken(false);
  }, [imageSrc]);

  return (
    <FlowCover $active={active} $theme={theme}>
      <CoverSurface $active={active} $theme={theme}>
        {!imageBroken ? (
          <CoverImage
            src={imageSrc}
            alt={item.title}
            loading="lazy"
            decoding="async"
            draggable={false}
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
        <CoverSheen />
        {active ? <ActiveMarker $theme={theme} /> : null}
      </CoverSurface>
      {!imageBroken ? (
        <CoverReflection
          $active={active}
          aria-hidden="true"
          style={{ backgroundImage }}
        />
      ) : null}
    </FlowCover>
  );
};

const FavoriteCoverFlow = ({
  items,
  label,
  sectionId,
  theme,
}: {
  items: FavoriteItem[];
  label: string;
  sectionId: FavoriteCategory;
  theme: Theme;
}) => {
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.floor(items.length / 2),
  );
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const draggingRef = useRef(false);
  const dragStartRef = useRef(0);
  const didDragRef = useRef(false);
  const lastOffsetRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    setCurrentIndex((index) => clampIndex(index, items.length));
  }, [items.length]);

  const currentItem = items[currentIndex];
  const currentHref = currentItem ? getFavoriteHref(currentItem) : undefined;
  const visibleItems = items
    .map((item, index) => ({ index, item }))
    .filter(({ index }) => Math.abs(index - currentIndex) <= 5);

  const openItem = (item: FavoriteItem) => {
    const href = getFavoriteHref(item);
    if (href) window.open(href, '_blank', 'noopener,noreferrer');
  };

  const moveTo = (index: number) => {
    setCurrentIndex(clampIndex(index, items.length));
  };

  const moveBy = (delta: number) => {
    setCurrentIndex((index) => clampIndex(index + delta, items.length));
  };

  const startDrag = (clientX: number) => {
    draggingRef.current = true;
    didDragRef.current = false;
    dragStartRef.current = clientX;
    lastOffsetRef.current = 0;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    setDragOffset(0);
    setDragging(true);
  };

  const updateDrag = (clientX: number) => {
    if (!draggingRef.current) return;

    const now = performance.now();
    const nextOffset = clientX - dragStartRef.current;
    const elapsed = Math.max(now - lastTimeRef.current, 1);

    velocityRef.current = (nextOffset - lastOffsetRef.current) / elapsed;
    lastOffsetRef.current = nextOffset;
    lastTimeRef.current = now;
    didDragRef.current = didDragRef.current || Math.abs(nextOffset) > 5;
    setDragOffset(nextOffset);
  };

  const endDrag = () => {
    if (!draggingRef.current) return;

    draggingRef.current = false;
    setDragging(false);

    const dragDistance = Math.abs(dragOffset);
    const dragVelocity = Math.abs(velocityRef.current);
    const threshold = 46;
    const velocityThreshold = 0.42;

    if (dragDistance > threshold || dragVelocity > velocityThreshold) {
      const direction =
        dragOffset < 0 || velocityRef.current < -velocityThreshold ? 1 : -1;
      const distanceJumps = Math.floor(dragDistance / 125);
      const velocityJumps = Math.floor(dragVelocity / 1.35);
      const jumpCount = Math.min(3, Math.max(1, distanceJumps, velocityJumps));

      setCurrentIndex((index) =>
        clampIndex(index + direction * jumpCount, items.length),
      );
    }

    setDragOffset(0);
    velocityRef.current = 0;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    startDrag(event.clientX);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    if (Math.abs(event.clientX - dragStartRef.current) > 5) {
      event.preventDefault();
    }
    updateDrag(event.clientX);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveBy(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveBy(1);
    } else if (event.key === 'Enter' && currentItem) {
      event.preventDefault();
      openItem(currentItem);
    }
  };

  if (items.length === 0 || !currentItem) return null;

  return (
    <FlowShell data-v2={`likes-flow-${sectionId}`}>
      <FlowViewport
        $dragging={dragging}
        $theme={theme}
        aria-label={`${label}收藏滑动展示`}
        role="group"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerCancel={endDrag}
        onPointerDown={handlePointerDown}
        onPointerLeave={endDrag}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
      >
        {visibleItems.map(({ index, item }) => {
          const active = index === currentIndex;
          const flowStyle = getFlowTransform(
            index,
            currentIndex,
            dragOffset,
            dragging,
          );

          return (
            <FlowItemButton
              key={item.id}
              $active={active}
              $theme={theme}
              aria-label={active ? `${item.title}，当前` : item.title}
              data-v2={`likes-flow-card-${item.id}`}
              style={{
                opacity: flowStyle.opacity,
                pointerEvents:
                  Math.abs(index - currentIndex) <= 4 ? 'auto' : 'none',
                transform: flowStyle.transform,
                transition: dragging
                  ? 'none'
                  : 'opacity 360ms ease, transform 420ms cubic-bezier(0.23, 1, 0.32, 1)',
                zIndex: flowStyle.zIndex,
              }}
              type="button"
              onClick={() => {
                if (didDragRef.current) {
                  didDragRef.current = false;

                  return;
                }

                if (active) {
                  openItem(item);
                } else {
                  moveTo(index);
                }
              }}
            >
              <FavoriteCoverImage active={active} item={item} theme={theme} />
            </FlowItemButton>
          );
        })}
      </FlowViewport>
      <FlowInfo>
        <FlowTitle
          $clickable={Boolean(currentHref)}
          $theme={theme}
          href={currentHref ?? '#'}
          rel={currentHref ? 'noopener noreferrer' : undefined}
          target={currentHref ? '_blank' : undefined}
          onClick={(event) => {
            if (!currentHref) event.preventDefault();
          }}
        >
          {currentItem.title}
        </FlowTitle>
        {currentItem.subtitle ? (
          <FlowSubtitle $theme={theme}>{currentItem.subtitle}</FlowSubtitle>
        ) : null}
        {currentItem.note ? (
          <FlowNote $theme={theme}>{currentItem.note}</FlowNote>
        ) : null}
      </FlowInfo>
    </FlowShell>
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
              <FavoriteCoverFlow
                items={section.items}
                label={section.label}
                sectionId={section.id}
                theme={theme}
              />
            </CategoryBlock>
          ))
        )}
      </ScrollBody>
    </Page>
  );
};

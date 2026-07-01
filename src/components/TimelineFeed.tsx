import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import styled, { keyframes } from 'styled-components';

import { AppContext } from 'App/AppContext';
import { getSupabase } from 'lib/supabaseClient';
import { TIMELINE_SECONDARY_PASSWORD } from 'lib/timelineAdminAuth';
import { Theme } from 'types';

const TABLE = 'portfolio_timeline_posts';
const COMMENTS_TABLE = 'portfolio_timeline_comments';
const MEDIA_BUCKET = 'portfolio-feed-media';
const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
const TIMELINE_CLIENT_ID_STORAGE = 'portfolio-timeline-client-id-v1';
const TIMELINE_POST_SELECT =
  'id, body, media_url, media_type, created_at, is_featured';
const LEGACY_TIMELINE_POST_SELECT =
  'id, body, media_url, media_type, created_at';

type TimelineMediaType = 'image' | 'video';
type TimelineTimeFilter = 'all' | 'beforeDate';
type TimelineTypeFilter = 'all' | 'featured' | 'text' | TimelineMediaType;

interface DateParts {
  day: number;
  month: number;
  year: number;
}

interface DateWheelOption {
  label: string;
  value: number;
}

interface TimelinePostRow {
  id: string;
  body: string;
  media_url: null | string;
  media_type: null | TimelineMediaType;
  created_at: string;
  is_featured: boolean;
  likes_count: number;
  liked_by_client: boolean;
  comments_count: number;
  views_count: number;
}

interface TimelineCommentRow {
  id: string;
  post_id: string;
  parent_id: null | string;
  author_name: string;
  body: string;
  created_at: string;
}

interface TimelineEngagementRow {
  post_id: string;
  likes_count: number;
  liked_by_client: boolean;
  views_count: number;
}

const TYPE_FILTER_OPTIONS: {
  id: TimelineTypeFilter;
  label: string;
}[] = [
  { id: 'all', label: '全部' },
  { id: 'featured', label: '精选' },
  { id: 'image', label: '图片' },
  { id: 'video', label: '视频' },
  { id: 'text', label: '纯文字' },
];

interface TimelineFeedProps {
  requirePublishPassword?: boolean;
  showComposer?: boolean;
  title?: string;
}

const HeartGlyph = ({ filled }: { filled: boolean }) => (
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
    <path
      d="M12 20.25c-.3 0-.58-.1-.82-.3C6.18 15.76 3 12.92 3 8.96 3 6.33 5.02 4.25 7.54 4.25c1.53 0 3 .73 3.91 1.92.91-1.19 2.38-1.92 3.91-1.92C17.98 4.25 20 6.33 20 8.96c0 3.96-3.18 6.8-8.18 10.99-.24.2-.52.3-.82.3Z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

const CommentGlyph = () => (
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
    <path
      d="M7.2 5.35h9.6c1.58 0 2.85 1.23 2.85 2.75v5.25c0 1.52-1.27 2.75-2.85 2.75h-4.26L8.1 19.25v-3.15h-.9c-1.58 0-2.85-1.23-2.85-2.75V8.1c0-1.52 1.27-2.75 2.85-2.75Z"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      d="M8.15 9.4h7.7M8.15 12.15h5.3"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.55"
    />
  </svg>
);

const ViewGlyph = () => (
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
    <path
      d="M5.75 17.8V12m6.25 5.8V6.2m6.25 11.6v-8"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.9"
    />
  </svg>
);

const FeaturedGlyph = ({ filled }: { filled: boolean }) => (
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
    <path
      d="m12 3.9 2.26 4.58 5.05.73-3.65 3.56.86 5.03L12 15.42 7.48 17.8l.86-5.03L4.69 9.21l5.05-.73L12 3.9Z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.75"
    />
  </svg>
);

const SendGlyph = () => (
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
    <path
      d="M4.7 11.55 19.35 4.7c.62-.29 1.26.35.97.97l-6.85 14.65c-.29.62-1.19.55-1.38-.11l-1.72-5.98-5.98-1.72c-.66-.19-.73-1.09.11-1.38Z"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.85"
    />
    <path
      d="m10.58 14.02 3.18-3.18"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.85"
    />
  </svg>
);

const isTimelineMediaType = (value: unknown): value is TimelineMediaType =>
  value === 'image' || value === 'video';

const makeRandomId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${String(Date.now())}-${Math.random().toString(16).slice(2)}`;

const getTimelineClientId = () => {
  if (typeof window === 'undefined') return `timeline-${makeRandomId()}`;

  try {
    const stored = window.localStorage.getItem(TIMELINE_CLIENT_ID_STORAGE);
    if (stored) return stored;

    const next = `timeline-${makeRandomId()}`;
    window.localStorage.setItem(TIMELINE_CLIENT_ID_STORAGE, next);

    return next;
  } catch {
    return `timeline-${makeRandomId()}`;
  }
};

const normalizePosts = (rows: unknown): TimelinePostRow[] => {
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row): TimelinePostRow[] => {
    if (!row || typeof row !== 'object') return [];

    const record = row as Record<string, unknown>;
    const id = record.id;
    const body = record.body;
    const mediaUrl = record.media_url;
    const mediaType = record.media_type;
    const createdAt = record.created_at;
    const isFeatured = record.is_featured;

    if (typeof id !== 'string' || typeof createdAt !== 'string') return [];

    return [
      {
        id,
        body: typeof body === 'string' ? body : '',
        media_url: typeof mediaUrl === 'string' ? mediaUrl : null,
        media_type: isTimelineMediaType(mediaType) ? mediaType : null,
        created_at: createdAt,
        is_featured: typeof isFeatured === 'boolean' ? isFeatured : false,
        likes_count: 0,
        liked_by_client: false,
        comments_count: 0,
        views_count: 0,
      },
    ];
  });
};

const normalizeComments = (rows: unknown): TimelineCommentRow[] => {
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row): TimelineCommentRow[] => {
    if (!row || typeof row !== 'object') return [];

    const record = row as Record<string, unknown>;
    const id = record.id;
    const postId = record.post_id;
    const parentId = record.parent_id;
    const authorName = record.author_name;
    const body = record.body;
    const createdAt = record.created_at;

    if (
      typeof id !== 'string' ||
      typeof postId !== 'string' ||
      typeof body !== 'string' ||
      typeof createdAt !== 'string'
    ) {
      return [];
    }

    return [
      {
        id,
        post_id: postId,
        parent_id: typeof parentId === 'string' ? parentId : null,
        author_name: typeof authorName === 'string' ? authorName : '访客',
        body,
        created_at: createdAt,
      },
    ];
  });
};

const normalizeEngagement = (rows: unknown): TimelineEngagementRow[] => {
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row): TimelineEngagementRow[] => {
    if (!row || typeof row !== 'object') return [];

    const record = row as Record<string, unknown>;
    const postId = record.post_id;
    const likesCount = record.likes_count;
    const likedByClient = record.liked_by_client;
    const viewsCount = record.views_count;

    if (typeof postId !== 'string') return [];

    return [
      {
        post_id: postId,
        likes_count: typeof likesCount === 'number' ? likesCount : 0,
        liked_by_client:
          typeof likedByClient === 'boolean' ? likedByClient : false,
        views_count: typeof viewsCount === 'number' ? viewsCount : 0,
      },
    ];
  });
};

const groupCommentsByPost = (comments: TimelineCommentRow[]) =>
  comments.reduce<Record<string, TimelineCommentRow[]>>((grouped, comment) => {
    grouped[comment.post_id] = [...(grouped[comment.post_id] ?? []), comment];

    return grouped;
  }, {});

const groupRepliesByParent = (comments: TimelineCommentRow[]) =>
  comments.reduce<{
    repliesByParent: Record<string, TimelineCommentRow[]>;
    roots: TimelineCommentRow[];
  }>(
    (grouped, comment) => {
      if (comment.parent_id) {
        grouped.repliesByParent[comment.parent_id] = [
          ...(grouped.repliesByParent[comment.parent_id] ?? []),
          comment,
        ];
      } else {
        grouped.roots.push(comment);
      }

      return grouped;
    },
    { repliesByParent: {}, roots: [] },
  );

const parseLikeToggle = (
  data: unknown,
  fallback: Pick<TimelinePostRow, 'liked_by_client' | 'likes_count'>,
) => {
  const row: unknown = Array.isArray(data)
    ? (data as readonly unknown[])[0]
    : data;

  if (!row || typeof row !== 'object') {
    return {
      liked: !fallback.liked_by_client,
      likesCount: fallback.likes_count + (fallback.liked_by_client ? -1 : 1),
    };
  }

  const record = row as Record<string, unknown>;
  const liked = record.liked;
  const likesCount = record.likes_count;

  return {
    liked: typeof liked === 'boolean' ? liked : !fallback.liked_by_client,
    likesCount:
      typeof likesCount === 'number' ? likesCount : fallback.likes_count,
  };
};

const withUpdatedPost = (
  posts: TimelinePostRow[],
  postId: string,
  updater: (post: TimelinePostRow) => TimelinePostRow,
) => posts.map((post) => (post.id === postId ? updater(post) : post));

const formatTime = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const formatMetricCount = (value: number) => {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;

  return String(value);
};

const getTodayDateParts = (): DateParts => {
  const now = new Date();

  return {
    day: now.getDate(),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
};

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month, 0).getDate();

const clampDateParts = (date: DateParts): DateParts => ({
  ...date,
  day: Math.min(date.day, getDaysInMonth(date.year, date.month)),
});

const getDateFilterEnd = ({ day, month, year }: DateParts) =>
  new Date(year, month - 1, day, 23, 59, 59, 999);

const formatDateParts = ({ day, month, year }: DateParts) =>
  `${String(year)}年${String(month)}月${String(day)}日`;

const makeDateWheelOptions = (
  start: number,
  end: number,
  suffix: string,
): DateWheelOption[] =>
  Array.from({ length: end - start + 1 }, (_, index) => {
    const value = start + index;

    return {
      label: `${String(value)}${suffix}`,
      value,
    };
  });

const MONTH_OPTIONS = makeDateWheelOptions(1, 12, '月');

const DateWheelColumn = ({
  ariaLabel,
  onSelect,
  options,
  theme,
  value,
}: {
  ariaLabel: string;
  onSelect: (value: number) => void;
  options: DateWheelOption[];
  theme: Theme;
  value: number;
}) => {
  const columnRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const scrollTimerRef = useRef<null | number>(null);

  useEffect(() => {
    optionRefs.current[value]?.scrollIntoView({
      block: 'center',
      inline: 'nearest',
    });
  }, [options.length, value]);

  useEffect(
    () => () => {
      if (scrollTimerRef.current !== null) {
        window.clearTimeout(scrollTimerRef.current);
      }
    },
    [],
  );

  const selectNearestOption = useCallback(() => {
    const column = columnRef.current;
    if (!column) return;

    const center =
      column.getBoundingClientRect().top +
      column.getBoundingClientRect().height / 2;
    let nearest = options[0]?.value ?? value;
    let nearestDistance = Number.POSITIVE_INFINITY;

    options.forEach((option) => {
      const node = optionRefs.current[option.value];
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - center);

      if (distance < nearestDistance) {
        nearest = option.value;
        nearestDistance = distance;
      }
    });

    if (nearest !== value) {
      onSelect(nearest);
    }
  }, [onSelect, options, value]);

  return (
    <DateWheelColumnShell
      ref={columnRef}
      $theme={theme}
      aria-label={ariaLabel}
      role="listbox"
      tabIndex={0}
      onScroll={() => {
        if (scrollTimerRef.current !== null) {
          window.clearTimeout(scrollTimerRef.current);
        }

        scrollTimerRef.current = window.setTimeout(selectNearestOption, 120);
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <DateWheelOptionButton
            key={option.value}
            ref={(node) => {
              optionRefs.current[option.value] = node;
            }}
            type="button"
            $selected={selected}
            $theme={theme}
            aria-selected={selected}
            role="option"
            onClick={() => {
              onSelect(option.value);
            }}
          >
            {option.label}
          </DateWheelOptionButton>
        );
      })}
    </DateWheelColumnShell>
  );
};

const matchesTypeFilter = (
  post: TimelinePostRow,
  filter: TimelineTypeFilter,
) => {
  if (filter === 'all') return true;
  if (filter === 'featured') return post.is_featured;
  if (filter === 'text') return !post.media_url && !post.media_type;

  return post.media_type === filter;
};

const mediaTypeFromFile = (file: File): null | TimelineMediaType => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';

  return null;
};

const safeExtension = (file: File, mediaType: TimelineMediaType) => {
  const fallback = mediaType === 'image' ? 'jpg' : 'mp4';
  const extension = file.name.split('.').pop()?.toLowerCase();
  const sanitized = extension?.replace(/[^a-z0-9]/g, '');

  return sanitized && sanitized.length > 0 ? sanitized : fallback;
};

const makeMediaPath = (file: File, mediaType: TimelineMediaType) => {
  return `feed/${makeRandomId()}.${safeExtension(file, mediaType)}`;
};

const friendlySupabaseError = (message: string) => {
  if (message.includes('portfolio_timeline_posts')) {
    return '动态表还没有创建，请先执行 Supabase timeline 迁移。';
  }

  if (
    message.includes('portfolio_timeline_comments') ||
    message.includes('portfolio_timeline_post_likes') ||
    message.includes('portfolio_timeline_post_views') ||
    message.includes('get_timeline_post_engagement') ||
    message.includes('record_timeline_post_views') ||
    message.includes('toggle_timeline_post_like')
  ) {
    return '动态互动表还没有创建，请先执行 Supabase timeline engagement 迁移。';
  }

  if (message.includes(MEDIA_BUCKET)) {
    return '动态媒体 bucket 还没有配置好。';
  }

  if (message.toLowerCase().includes('row-level security')) {
    return '动态的 Supabase 权限还没有配置好，请执行 timeline 迁移。';
  }

  return message;
};

const loadingSpin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const LoadingRing = styled.span<{ $size?: string }>`
  display: inline-block;
  width: ${({ $size }) => $size ?? '1rem'};
  aspect-ratio: 1;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 999px;
  flex: 0 0 auto;
  opacity: 0.84;
  animation: ${loadingSpin} 0.78s linear infinite;
`;

const Shell = styled.section<{ $theme: Theme }>`
  display: grid;
  gap: 0;
  overflow: hidden;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 16px;
  background:
    ${({ $theme }) => $theme.glassInsetHighlight},
    ${({ $theme }) => $theme.glassBackground};
  box-shadow: ${({ $theme }) => $theme.glassShadow};
  backdrop-filter: blur(26px) saturate(145%);
  -webkit-backdrop-filter: blur(26px) saturate(145%);

  @media (width <= 768px) {
    border-radius: 0;
    border-inline: 0;
  }
`;

const FeedTop = styled.header<{ $theme: Theme }>`
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  min-height: 3.35rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid ${({ $theme }) => $theme.cardBorder};
  background: ${({ $theme }) => $theme.cardBackground};
`;

const FeedTitle = styled.h1<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: 1.18rem;
  font-weight: 820;
  letter-spacing: 0;
`;

const Composer = styled.form<{ $theme: Theme }>`
  display: grid;
  gap: 0.8rem;
  padding: 1rem;
  border: 0;
  border-bottom: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 0;
  background: ${({ $theme }) => $theme.cardBackground};
  box-shadow: none;
`;

const ComposerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Avatar = styled.div<{ $hasImage: boolean; $theme: Theme }>`
  display: grid;
  width: 2.85rem;
  aspect-ratio: 1;
  flex: 0 0 auto;
  place-items: center;
  overflow: hidden;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 50%;
  background: ${({ $hasImage, $theme }) =>
    $hasImage ? 'transparent' : $theme.iconGlassBackground};
  color: ${({ $theme }) => $theme.accentColor};
  font-size: 0.78rem;
  font-weight: 760;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ComposerMeta = styled.div`
  display: grid;
  min-width: 0;
  gap: 0.1rem;
`;

const Name = styled.span<{ $theme: Theme }>`
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: 0.94rem;
  font-weight: 760;
`;

const Handle = styled.span<{ $theme: Theme }>`
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.76rem;
`;

const Textarea = styled.textarea<{ $theme: Theme }>`
  min-height: 6.6rem;
  resize: vertical;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font: inherit;
  font-size: 1rem;
  line-height: 1.62;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: ${({ $theme }) => $theme.tertiaryTextColor};
  }
`;

const Preview = styled.div<{ $theme: Theme }>`
  position: relative;
  overflow: hidden;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 14px;
  background: ${({ $theme }) => $theme.spotlightColor};

  img,
  video {
    display: block;
    width: 100%;
    max-height: min(64vh, 34rem);
    object-fit: contain;
    background: #050505;
  }
`;

const RemoveMedia = styled.button<{ $theme: Theme }>`
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  width: 2rem;
  height: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.58);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 1.1rem;
  line-height: 1;
`;

const ComposerActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
`;

const ActionGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
`;

const GhostButton = styled.button<{ $theme: Theme }>`
  padding: 0.56rem 0.85rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 999px;
  background: ${({ $theme }) => $theme.iconGlassBackground};
  color: ${({ $theme }) => $theme.primaryTextColor};
  cursor: pointer;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;

  &:hover {
    color: ${({ $theme }) => $theme.primaryTextColor};
    background: ${({ $theme }) => $theme.glassBackgroundHover};
  }
`;

const SubmitButton = styled.button<{ $theme: Theme }>`
  min-width: 5.2rem;
  padding: 0.62rem 1.05rem;
  border: 1px solid ${({ $theme }) => $theme.primaryTextColor};
  border-radius: 999px;
  background: ${({ $theme }) => $theme.primaryTextColor};
  color: ${({ $theme }) => $theme.cardBackground};
  cursor: pointer;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 780;

  &:disabled {
    opacity: 0.46;
    cursor: not-allowed;
  }
`;

const HelperText = styled.p<{ $danger?: boolean; $theme: Theme }>`
  margin: 0;
  color: ${({ $danger, $theme }) =>
    $danger ? '#dc2626' : $theme.tertiaryTextColor};
  font-size: 0.78rem;
  line-height: 1.5;
`;

const FilterShell = styled.section<{ $theme: Theme }>`
  position: relative;
  padding: 0.92rem 1rem 1rem;
  border-bottom: 1px solid ${({ $theme }) => $theme.cardBorder};
  background: ${({ $theme }) => $theme.cardBackground};
`;

const FilterToolbar = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.62rem;
  max-width: 58rem;
  margin: 0 auto;
  align-items: end;

  @media (max-width: 520px) {
    gap: 0.4rem;
  }
`;

const FilterField = styled.label<{ $theme: Theme }>`
  display: grid;
  gap: 0.38rem;
`;

const FilterLabel = styled.span<{ $theme: Theme }>`
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.72rem;
  font-weight: 760;
`;

const FilterSelect = styled.select<{ $theme: Theme }>`
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0.74rem 2rem 0.74rem 0.85rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 12px;
  background-color: ${({ $theme }) => $theme.iconGlassBackground};
  background-image:
    linear-gradient(45deg, transparent 50%, currentColor 50%),
    linear-gradient(135deg, currentColor 50%, transparent 50%);
  background-position:
    calc(100% - 1.15rem) calc(50% - 0.1rem),
    calc(100% - 0.88rem) calc(50% - 0.1rem);
  background-repeat: no-repeat;
  background-size:
    0.34rem 0.34rem,
    0.34rem 0.34rem;
  color: ${({ $theme }) => $theme.primaryTextColor};
  cursor: pointer;
  font: inherit;
  font-size: 0.88rem;
  line-height: 1.2;
  appearance: none;
  -webkit-appearance: none;

  &:hover {
    border-color: ${({ $theme }) => $theme.cardHoverBorder};
    background-color: ${({ $theme }) => $theme.glassBackgroundHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ $theme }) => $theme.accentColor};
    outline-offset: 2px;
  }
`;

const FilterMenuField = styled.div<{ $theme: Theme }>`
  position: relative;
  display: grid;
  gap: 0.38rem;
`;

const FilterMenuButton = styled.button<{
  $active: boolean;
  $theme: Theme;
}>`
  position: relative;
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 2.72rem;
  box-sizing: border-box;
  gap: 0.4rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.68rem 1.75rem 0.68rem 0.78rem;
  border: 1px solid
    ${({ $active, $theme }) =>
      $active ? $theme.cardHoverBorder : $theme.cardBorder};
  border-radius: 12px;
  background: ${({ $active, $theme }) =>
    $active ? $theme.glassBackgroundHover : $theme.iconGlassBackground};
  color: ${({ $theme }) => $theme.primaryTextColor};
  cursor: pointer;
  font: inherit;
  font-size: 0.88rem;
  line-height: 1.2;
  text-align: left;

  &::after {
    position: absolute;
    top: calc(50% - 0.2rem);
    right: 0.88rem;
    width: 0.42rem;
    height: 0.42rem;
    border-right: 1.5px solid currentColor;
    border-bottom: 1.5px solid currentColor;
    content: '';
    transform: ${({ $active }) =>
      $active
        ? 'rotate(225deg) translate(-0.12rem, -0.12rem)'
        : 'rotate(45deg)'};
    transform-origin: center;
  }

  &:hover {
    border-color: ${({ $theme }) => $theme.cardHoverBorder};
    background: ${({ $theme }) => $theme.glassBackgroundHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ $theme }) => $theme.accentColor};
    outline-offset: 2px;
  }

  @media (max-width: 520px) {
    min-height: 2.48rem;
    padding: 0.62rem 1.45rem 0.62rem 0.62rem;
    font-size: 0.8rem;

    &::after {
      right: 0.64rem;
    }
  }
`;

const FilterMenuValue = styled.span`
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DateFilterPopover = styled.div<{ $theme: Theme }>`
  position: absolute;
  z-index: 10;
  top: calc(100% + 0.5rem);
  left: 50%;
  display: grid;
  width: min(22rem, calc(100vw - 2rem));
  gap: 0.68rem;
  box-sizing: border-box;
  padding: 0.72rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 12px;
  background: ${({ $theme }) => $theme.cardBackground};
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.16);
  transform: translateX(-50%);
`;

const DateFilterMenuHeader = styled.div`
  display: flex;
  gap: 0.7rem;
  align-items: center;
  justify-content: space-between;
`;

const DateFilterMenuTitle = styled.p<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: 0.84rem;
  font-weight: 780;
  line-height: 1.35;
`;

const DateFilterActions = styled.div`
  display: flex;
  gap: 0.48rem;
  align-items: center;
`;

const DateFilterActionButton = styled.button<{
  $primary?: boolean;
  $theme: Theme;
}>`
  flex: 0 0 auto;
  min-height: 2.12rem;
  padding: 0 0.76rem;
  border: 1px solid
    ${({ $primary, $theme }) =>
      $primary ? $theme.primaryTextColor : $theme.cardBorder};
  border-radius: 999px;
  background: ${({ $primary, $theme }) =>
    $primary ? $theme.primaryTextColor : $theme.iconGlassBackground};
  color: ${({ $primary, $theme }) =>
    $primary ? $theme.cardBackground : $theme.secondaryTextColor};
  cursor: pointer;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 760;

  &:hover {
    border-color: ${({ $theme }) => $theme.cardHoverBorder};
    color: ${({ $primary, $theme }) =>
      $primary ? $theme.cardBackground : $theme.primaryTextColor};
  }

  &:focus-visible {
    outline: 2px solid ${({ $theme }) => $theme.accentColor};
    outline-offset: 2px;
  }
`;

const DateWheel = styled.div<{ $theme: Theme }>`
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 12px;
  background: ${({ $theme }) => $theme.iconGlassBackground};

  &::before {
    position: absolute;
    z-index: 0;
    top: 50%;
    right: 0.45rem;
    left: 0.45rem;
    height: 2.26rem;
    border-block: 1px solid ${({ $theme }) => $theme.cardHoverBorder};
    background: ${({ $theme }) => $theme.cardBackground};
    content: '';
    opacity: 0.72;
    pointer-events: none;
    transform: translateY(-50%);
  }
`;

const DateWheelColumnShell = styled.div<{ $theme: Theme }>`
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.18rem;
  height: 10.7rem;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 4.22rem 0.28rem;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  & + & {
    border-left: 1px solid ${({ $theme }) => $theme.gridColor};
  }

  &:focus-visible {
    outline: 2px solid ${({ $theme }) => $theme.accentColor};
    outline-offset: -2px;
  }
`;

const DateWheelOptionButton = styled.button<{
  $selected: boolean;
  $theme: Theme;
}>`
  min-width: 0;
  height: 2.1rem;
  padding: 0 0.3rem;
  border: 0;
  border-radius: 8px;
  background: ${({ $selected, $theme }) =>
    $selected ? $theme.glassBackgroundHover : 'transparent'};
  color: ${({ $selected, $theme }) =>
    $selected ? $theme.primaryTextColor : $theme.tertiaryTextColor};
  cursor: pointer;
  font: inherit;
  font-size: ${({ $selected }) => ($selected ? '0.98rem' : '0.86rem')};
  font-weight: ${({ $selected }) => ($selected ? 820 : 680)};
  line-height: 1;
  scroll-snap-align: center;

  &:hover {
    color: ${({ $theme }) => $theme.primaryTextColor};
    background: ${({ $theme }) => $theme.glassBackgroundHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ $theme }) => $theme.accentColor};
    outline-offset: -2px;
  }
`;

const PostList = styled.div`
  display: grid;
  gap: 0;
`;

const PostCard = styled.article<{ $featured?: boolean; $theme: Theme }>`
  overflow: hidden;
  border: 0;
  border-bottom: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 0;
  background: ${({ $theme }) => $theme.cardBackground};
  box-shadow: none;

  &:last-child {
    border-bottom: 0;
  }
`;

const PostHeader = styled.header`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
`;

const PostBody = styled.p<{ $theme: Theme }>`
  white-space: pre-wrap;
  margin: 0;
  padding: 0 1rem 0.9rem;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: clamp(0.96rem, 1.7vw, 1.04rem);
  line-height: 1.72;
  text-wrap: pretty;
`;

const PostMedia = styled.div<{ $loading?: boolean }>`
  position: relative;
  overflow: hidden;
  margin: 0 1rem 0.85rem;
  min-height: ${({ $loading }) => ($loading ? 'min(54vw, 17rem)' : '0')};
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  background: #050505;

  img,
  video {
    display: block;
    width: 100%;
    max-height: 68vh;
    object-fit: contain;
  }
`;

const PostImage = styled.img<{ $loaded: boolean }>`
  opacity: ${({ $loaded }) => ($loaded ? 1 : 0)};
  transition: opacity 0.22s ease;
`;

const MediaLoadingLayer = styled.div<{ $visible: boolean }>`
  position: absolute;
  inset: 0;
  display: grid;
  min-height: inherit;
  place-items: center;
  background:
    radial-gradient(
      circle at 50% 44%,
      rgba(255, 255, 255, 0.1),
      transparent 38%
    ),
    #050505;
  color: rgba(255, 255, 255, 0.82);
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: none;
  transition:
    opacity 0.18s ease,
    visibility 0.18s ease;
  visibility: ${({ $visible }) => ($visible ? 'visible' : 'hidden')};
`;

const PostFooter = styled.footer<{ $theme: Theme }>`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.72rem 1rem 0.9rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.76rem;
`;

const PostActions = styled.div<{ $theme: Theme }>`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.15rem;
  align-items: center;
  padding: 0.1rem 0.84rem 0.38rem;
`;

const EngagementButton = styled.button<{
  $active?: boolean;
  $featured?: boolean;
  $selected?: boolean;
  $theme: Theme;
}>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.24rem;
  width: 100%;
  min-width: 0;
  min-height: 2.22rem;
  padding: 0 0.35rem;
  border: 0;
  border-radius: 8px;
  background: ${({ $selected, $theme }) =>
    $selected ? $theme.glassBackgroundHover : 'transparent'};
  color: ${({ $active, $featured, $selected, $theme }) =>
    $active
      ? $featured
        ? '#d89b0d'
        : '#ff4d64'
      : $selected
        ? $theme.primaryTextColor
        : $theme.secondaryTextColor};
  cursor: pointer;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 720;
  line-height: 1;
  transform: translateY(0);
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;

  > span {
    position: relative;
    z-index: 1;
  }

  &:hover:not(:disabled) {
    background: ${({ $theme }) => $theme.glassBackgroundHover};
    color: ${({ $active, $featured, $theme }) =>
      $active ? ($featured ? '#d89b0d' : '#ff4d64') : $theme.primaryTextColor};
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: 2px solid
      ${({ $active, $theme }) => ($active ? '#ff4d64' : $theme.accentColor)};
    outline-offset: 3px;
  }

  &:disabled {
    opacity: 0.48;
    cursor: not-allowed;
    transform: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const EngagementIcon = styled.span<{
  $active?: boolean;
  $featured?: boolean;
  $selected?: boolean;
  $theme: Theme;
}>`
  display: grid;
  flex: 0 0 auto;
  width: 1.35rem;
  height: 1.35rem;
  place-items: center;
  color: ${({ $active, $featured, $selected, $theme }) =>
    $active
      ? $featured
        ? '#d89b0d'
        : '#ff4d64'
      : $selected
        ? $theme.primaryTextColor
        : $theme.tertiaryTextColor};
  transition:
    color 0.18s ease,
    transform 0.18s ease;

  ${EngagementButton}:hover:not(:disabled) & {
    color: ${({ $active, $featured, $theme }) =>
      $active ? ($featured ? '#d89b0d' : '#ff4d64') : $theme.primaryTextColor};
    transform: scale(1.04);
  }

  svg {
    display: block;
    width: 1.08rem;
    height: 1.08rem;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const EngagementCount = styled.span`
  min-width: 1ch;
  font-variant-numeric: tabular-nums;
`;

const EngagementMetric = styled.span<{
  $active?: boolean;
  $featured?: boolean;
  $theme: Theme;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.24rem;
  width: 100%;
  min-width: 0;
  min-height: 2.22rem;
  padding: 0 0.35rem;
  box-sizing: border-box;
  color: ${({ $active, $featured, $theme }) =>
    $active ? ($featured ? '#d89b0d' : '#ff4d64') : $theme.secondaryTextColor};
  font-size: 0.78rem;
  font-weight: 720;
  line-height: 1;

  ${EngagementIcon} {
    color: ${({ $active, $featured, $theme }) =>
      $active ? ($featured ? '#d89b0d' : '#ff4d64') : $theme.tertiaryTextColor};
  }
`;

const CommentPreviewButton = styled.button<{ $theme: Theme }>`
  display: inline-flex;
  width: fit-content;
  margin: 0 1rem 0.78rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  cursor: pointer;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 680;
  line-height: 1.3;

  &:hover {
    color: ${({ $theme }) => $theme.primaryTextColor};
  }

  &:focus-visible {
    outline: 2px solid ${({ $theme }) => $theme.accentColor};
    outline-offset: 3px;
  }
`;

const CommentsPanel = styled.section<{ $theme: Theme }>`
  display: grid;
  gap: 0.76rem;
  padding: 0.82rem 1rem 0.95rem;
  border-top: 1px solid ${({ $theme }) => $theme.gridColor};
  background: ${({ $theme }) => $theme.cardBackground};
`;

const CommentForm = styled.form<{ $compact?: boolean; $theme: Theme }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 2.15rem;
  gap: 0.5rem;
  align-items: center;
  min-height: 2.65rem;
  margin-top: ${({ $compact }) => ($compact ? '0.6rem' : '0')};
  padding: 0.26rem 0.32rem 0.26rem 0.76rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 999px;
  background: ${({ $theme }) => $theme.iconGlassBackground};
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset;

  &:focus-within {
    border-color: ${({ $theme }) => $theme.cardHoverBorder};
    background: ${({ $theme }) => $theme.cardBackground};
  }
`;

const CommentInput = styled.input<{ $theme: Theme }>`
  display: block;
  width: 100%;
  min-width: 0;
  height: 2.05rem;
  box-sizing: border-box;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font: inherit;
  font-size: 0.86rem;
  line-height: 2.05rem;

  &:focus {
    outline: 0;
  }

  &::placeholder {
    color: ${({ $theme }) => $theme.tertiaryTextColor};
  }
`;

const CommentSubmit = styled.button<{ $theme: Theme }>`
  display: grid;
  width: 2.15rem;
  height: 2.15rem;
  min-height: 0;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(15, 23, 42, 0.92);
  border-radius: 999px;
  background: #111827;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  overflow: hidden;
  transition:
    border-color 0.18s ease,
    opacity 0.18s ease,
    transform 0.18s ease;

  &:hover:not(:disabled) {
    border-color: rgba(15, 23, 42, 1);
    background: #020617;
    transform: scale(1.03);
  }

  &:focus-visible {
    outline: 2px solid ${({ $theme }) => $theme.accentColor};
    outline-offset: 3px;
  }

  &:disabled {
    opacity: 0.34;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    display: block;
    width: 1.05rem;
    height: 1.05rem;
    transform: translateX(0.04rem);
  }
`;

const CommentSubmitSpinner = styled(LoadingRing)`
  color: currentColor;
  width: 1rem;
  opacity: 0.7;
`;

const CommentEmptyHint = styled.p<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.8rem;
  line-height: 1.45;
`;

const CommentList = styled.ul`
  display: grid;
  gap: 0.72rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const CommentItem = styled.li<{ $depth: number; $theme: Theme }>`
  min-width: 0;
  margin-left: ${({ $depth }) => ($depth > 0 ? '1.85rem' : '0')};
  padding-left: ${({ $depth }) => ($depth > 0 ? '0.78rem' : '0')};
  border-left: ${({ $depth, $theme }) =>
    $depth > 0 ? `2px solid ${$theme.gridColor}` : '0'};
`;

const CommentBubble = styled.div<{ $theme: Theme }>`
  display: grid;
  gap: 0.26rem;
  min-width: 0;
  padding: 0.66rem 0.76rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.iconGlassBackground};
`;

const CommentMeta = styled.div<{ $theme: Theme }>`
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
  align-items: center;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.74rem;

  strong {
    color: ${({ $theme }) => $theme.primaryTextColor};
    font-size: 0.78rem;
  }
`;

const CommentBody = styled.p<{ $theme: Theme }>`
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  margin: 0;
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font-size: 0.86rem;
  line-height: 1.58;
`;

const CommentTools = styled.div`
  display: flex;
  gap: 0.42rem;
  align-items: center;
`;

const CommentToolButton = styled.button<{ $theme: Theme }>`
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  cursor: pointer;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 720;

  &:hover {
    color: ${({ $theme }) => $theme.primaryTextColor};
  }
`;

const EmptyState = styled.div<{ $theme: Theme }>`
  padding: 1.25rem;
  border: 0;
  border-bottom: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 0;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  text-align: center;
`;

const EmptyStateContent = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
`;

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.34);
  backdrop-filter: blur(14px);
`;

const ConfirmPanel = styled.form<{ $theme: Theme }>`
  width: min(100%, 26rem);
  padding: 1.25rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.cardBackground};
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.2);
`;

const ConfirmTitle = styled.h2<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: 1.28rem;
  line-height: 1.25;
  letter-spacing: 0;
`;

const ConfirmCopy = styled.p<{ $theme: Theme }>`
  margin: 0.55rem 0 1rem;
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font-size: 0.94rem;
  line-height: 1.65;
`;

const PasswordInput = styled.input<{ $theme: Theme }>`
  width: 100%;
  box-sizing: border-box;
  padding: 0.9rem 1rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.iconGlassBackground};
  color: ${({ $theme }) => $theme.primaryTextColor};
  font: inherit;
  font-size: 1rem;

  &:focus {
    outline: 2px solid ${({ $theme }) => $theme.accentColor};
    outline-offset: 2px;
  }
`;

const ConfirmActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  margin-top: 1rem;
`;

const TimelinePostImage = ({ src }: { src: string }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <PostMedia $loading={!loaded}>
      <PostImage
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        $loaded={loaded}
        onLoad={() => {
          setLoaded(true);
        }}
        onError={() => {
          setLoaded(true);
        }}
      />
      <MediaLoadingLayer $visible={!loaded} aria-hidden={loaded}>
        <LoadingRing $size="1.6rem" aria-hidden="true" />
      </MediaLoadingLayer>
    </PostMedia>
  );
};

export const TimelineFeed = ({
  requirePublishPassword = true,
  showComposer = false,
  title = '动态',
}: TimelineFeedProps = {}) => {
  const { config, theme } = useContext(AppContext);
  const client = getSupabase();
  const inputRef = useRef<HTMLInputElement>(null);
  const dateMenuRef = useRef<HTMLDivElement | null>(null);
  const avatarSrc = config.avatar.src?.trim();
  const [clientId] = useState(getTimelineClientId);
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<null | string>(null);
  const [posts, setPosts] = useState<TimelinePostRow[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, TimelineCommentRow[]>
  >({});
  const [expandedCommentPostIds, setExpandedCommentPostIds] = useState<
    Record<string, boolean>
  >({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {},
  );
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyTargets, setReplyTargets] = useState<
    Record<string, null | string>
  >({});
  const [likingPostIds, setLikingPostIds] = useState<Record<string, boolean>>(
    {},
  );
  const [submittingCommentKey, setSubmittingCommentKey] = useState<
    null | string
  >(null);
  const [loading, setLoading] = useState(Boolean(client));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<null | string>(null);
  const [timeFilter, setTimeFilter] = useState<TimelineTimeFilter>('all');
  const [selectedDate, setSelectedDate] = useState(getTodayDateParts);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TimelineTypeFilter>('all');

  const selectedMediaType = file ? mediaTypeFromFile(file) : null;
  const canSubmit =
    Boolean(client) && !submitting && (body.trim().length > 0 || Boolean(file));
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const postYears = posts.flatMap((post) => {
      const parsed = new Date(post.created_at);

      return Number.isNaN(parsed.getTime()) ? [] : [parsed.getFullYear()];
    });
    const minYear = Math.min(currentYear, selectedDate.year, ...postYears);
    const maxYear = Math.max(currentYear, selectedDate.year, ...postYears);

    return Array.from({ length: maxYear - minYear + 1 }, (_, index) => {
      const value = maxYear - index;

      return {
        label: `${String(value)}年`,
        value,
      };
    });
  }, [posts, selectedDate.year]);
  const dayOptions = useMemo(
    () =>
      makeDateWheelOptions(
        1,
        getDaysInMonth(selectedDate.year, selectedDate.month),
        '日',
      ),
    [selectedDate.month, selectedDate.year],
  );
  const dateFilterLabel =
    timeFilter === 'beforeDate'
      ? `${formatDateParts(selectedDate)}及之前`
      : '全部时间';
  const filteredPosts = useMemo(() => {
    const end =
      timeFilter === 'beforeDate' ? getDateFilterEnd(selectedDate) : null;

    return posts.filter((post) => {
      if (end) {
        const createdAt = new Date(post.created_at);

        if (
          Number.isNaN(createdAt.getTime()) ||
          createdAt.getTime() > end.getTime()
        ) {
          return false;
        }
      }

      return matchesTypeFilter(post, typeFilter);
    });
  }, [posts, selectedDate, timeFilter, typeFilter]);

  const selectDateFilter = (nextDatePart: Partial<DateParts>) => {
    setSelectedDate((current) =>
      clampDateParts({
        ...current,
        ...nextDatePart,
      }),
    );
    setTimeFilter('beforeDate');
  };

  useEffect(() => {
    if (!isDateMenuOpen) return undefined;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (
        target instanceof Node &&
        dateMenuRef.current &&
        !dateMenuRef.current.contains(target)
      ) {
        setIsDateMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDateMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isDateMenuOpen]);

  const loadPosts = useCallback(async () => {
    if (!client) {
      setLoading(false);

      return;
    }

    setLoading(true);
    setError(null);

    const postsWithFeaturedResult = await client
      .from(TABLE)
      .select(TIMELINE_POST_SELECT)
      .order('created_at', { ascending: false })
      .limit(80);

    const postsResult = postsWithFeaturedResult.error?.message.includes(
      'is_featured',
    )
      ? await client
          .from(TABLE)
          .select(LEGACY_TIMELINE_POST_SELECT)
          .order('created_at', { ascending: false })
          .limit(80)
      : postsWithFeaturedResult;

    if (postsResult.error) {
      setLoading(false);
      setError(friendlySupabaseError(postsResult.error.message));

      return;
    }

    const basePosts = normalizePosts(postsResult.data);
    const postIds = basePosts.map((post) => post.id);

    if (postIds.length === 0) {
      setCommentsByPost({});
      setPosts([]);
      setLoading(false);

      return;
    }

    await client.rpc('record_timeline_post_views', {
      p_client_id: clientId,
      p_post_ids: postIds,
    });

    const [engagementResult, commentsResult] = await Promise.all([
      client.rpc('get_timeline_post_engagement', {
        p_client_id: clientId,
      }),
      client
        .from(COMMENTS_TABLE)
        .select('id, post_id, parent_id, author_name, body, created_at')
        .in('post_id', postIds)
        .order('created_at', { ascending: true })
        .limit(500),
    ]);

    setLoading(false);

    if (engagementResult.error) {
      setCommentsByPost({});
      setPosts(basePosts);
      setError(friendlySupabaseError(engagementResult.error.message));

      return;
    }

    const engagementByPost = new Map(
      normalizeEngagement(engagementResult.data).map((row) => [
        row.post_id,
        row,
      ]),
    );

    if (commentsResult.error) {
      setCommentsByPost({});
      setPosts(
        basePosts.map((post) => {
          const engagement = engagementByPost.get(post.id);

          return {
            ...post,
            liked_by_client: engagement?.liked_by_client ?? false,
            likes_count: engagement?.likes_count ?? 0,
            views_count: engagement?.views_count ?? 0,
          };
        }),
      );
      setError(friendlySupabaseError(commentsResult.error.message));

      return;
    }

    const groupedComments = groupCommentsByPost(
      normalizeComments(commentsResult.data),
    );

    setCommentsByPost(groupedComments);
    setPosts(
      basePosts.map((post) => {
        const engagement = engagementByPost.get(post.id);
        const comments = groupedComments[post.id] ?? [];

        return {
          ...post,
          comments_count: comments.length,
          liked_by_client: engagement?.liked_by_client ?? false,
          likes_count: engagement?.likes_count ?? 0,
          views_count: engagement?.views_count ?? 0,
        };
      }),
    );
  }, [client, clientId]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);

      return undefined;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    event.target.value = '';

    if (!nextFile) return;

    const mediaType = mediaTypeFromFile(nextFile);

    if (!mediaType) {
      setError('只能发布图片或视频。');

      return;
    }

    if (nextFile.size > MAX_MEDIA_BYTES) {
      setError('媒体文件需要小于 50 MB。');

      return;
    }

    setError(null);
    setFile(nextFile);
  };

  const uploadMedia = async (mediaFile: File, mediaType: TimelineMediaType) => {
    if (!client) throw new Error('Supabase 未连接。');

    const path = makeMediaPath(mediaFile, mediaType);
    const { error: uploadError } = await client.storage
      .from(MEDIA_BUCKET)
      .upload(path, mediaFile, {
        cacheControl: '31536000',
        contentType: mediaFile.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = client.storage.from(MEDIA_BUCKET).getPublicUrl(path);

    return {
      path,
      url: data.publicUrl,
    };
  };

  const publishPost = async () => {
    if (!client) return;

    setSubmitting(true);
    setError(null);

    try {
      let mediaUrl: null | string = null;
      let mediaPath: null | string = null;
      let mediaType: null | TimelineMediaType = null;

      if (file && selectedMediaType) {
        const uploaded = await uploadMedia(file, selectedMediaType);
        mediaUrl = uploaded.url;
        mediaPath = uploaded.path;
        mediaType = selectedMediaType;
      }

      const { data, error: insertError } = await client
        .from(TABLE)
        .insert({
          body: body.trim(),
          media_path: mediaPath,
          media_type: mediaType,
          media_url: mediaUrl,
        })
        .select('id, body, media_url, media_type, created_at')
        .single();

      if (insertError) throw insertError;

      const [inserted] = normalizePosts([data]);
      if (inserted) setPosts((current) => [inserted, ...current]);
      setBody('');
      setFile(null);
      setPassword('');
      setPasswordError(null);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? friendlySupabaseError(submitError.message)
          : '发布失败，请稍后再试。',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!client || !canSubmit) return;

    if (!requirePublishPassword) {
      void publishPost();

      return;
    }

    setPassword('');
    setPasswordError(null);
    setConfirmOpen(true);
  };

  const onConfirmSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    if (password !== TIMELINE_SECONDARY_PASSWORD) {
      setPasswordError('密码不正确，请重新输入。');

      return;
    }

    setConfirmOpen(false);
    await publishPost();
  };

  const onToggleLike = async (post: TimelinePostRow) => {
    if (!client || likingPostIds[post.id]) return;

    setLikingPostIds((current) => ({ ...current, [post.id]: true }));
    setError(null);

    const rpcResult = await client.rpc('toggle_timeline_post_like', {
      p_client_id: clientId,
      p_post_id: post.id,
    });

    setLikingPostIds((current) => ({ ...current, [post.id]: false }));

    if (rpcResult.error) {
      setError(friendlySupabaseError(rpcResult.error.message));

      return;
    }

    const next = parseLikeToggle(rpcResult.data, post);
    setPosts((current) =>
      withUpdatedPost(current, post.id, (row) => ({
        ...row,
        liked_by_client: next.liked,
        likes_count: Math.max(0, next.likesCount),
      })),
    );
  };

  const onSubmitComment = async (
    event: FormEvent,
    postId: string,
    parentId: null | string,
  ) => {
    event.preventDefault();
    if (!client || submittingCommentKey) return;

    const key = parentId ? `reply-${parentId}` : `comment-${postId}`;
    const value = parentId
      ? replyDrafts[parentId]?.trim()
      : commentDrafts[postId]?.trim();

    if (!value) return;

    setSubmittingCommentKey(key);
    setError(null);

    const { data, error: insertError } = await client
      .from(COMMENTS_TABLE)
      .insert({
        author_name: '访客',
        body: value,
        parent_id: parentId,
        post_id: postId,
      })
      .select('id, post_id, parent_id, author_name, body, created_at')
      .single();

    setSubmittingCommentKey(null);

    if (insertError) {
      setError(friendlySupabaseError(insertError.message));

      return;
    }

    const [inserted] = normalizeComments([data]);
    if (!inserted) return;

    setCommentsByPost((current) => ({
      ...current,
      [postId]: [...(current[postId] ?? []), inserted],
    }));
    setPosts((current) =>
      withUpdatedPost(current, postId, (row) => ({
        ...row,
        comments_count: row.comments_count + 1,
      })),
    );

    if (parentId) {
      setReplyDrafts((current) => ({ ...current, [parentId]: '' }));
      setReplyTargets((current) => ({ ...current, [postId]: null }));
    } else {
      setCommentDrafts((current) => ({ ...current, [postId]: '' }));
    }
  };

  const renderComment = (
    postId: string,
    comment: TimelineCommentRow,
    repliesByParent: Record<string, TimelineCommentRow[]>,
    depth = 0,
  ) => {
    const replyKey = `reply-${comment.id}`;
    const isReplying = replyTargets[postId] === comment.id;
    const replies = repliesByParent[comment.id] ?? [];
    const replyDraft = replyDrafts[comment.id] ?? '';

    return (
      <CommentItem key={comment.id} $theme={theme} $depth={Math.min(depth, 3)}>
        <CommentBubble $theme={theme}>
          <CommentMeta $theme={theme}>
            <strong>{comment.author_name}</strong>
            <span>{formatTime(comment.created_at)}</span>
          </CommentMeta>
          <CommentBody $theme={theme}>{comment.body}</CommentBody>
          <CommentTools>
            <CommentToolButton
              type="button"
              $theme={theme}
              onClick={() => {
                setReplyTargets((current) => ({
                  ...current,
                  [postId]: isReplying ? null : comment.id,
                }));
              }}
            >
              {isReplying ? '取消回复' : '回复'}
            </CommentToolButton>
          </CommentTools>
        </CommentBubble>

        {isReplying ? (
          <CommentForm
            $compact
            $theme={theme}
            onSubmit={(event) => {
              void onSubmitComment(event, postId, comment.id);
            }}
          >
            <CommentInput
              $theme={theme}
              aria-label="回复评论"
              maxLength={500}
              placeholder="写回复…"
              value={replyDraft}
              onChange={(event) => {
                setReplyDrafts((current) => ({
                  ...current,
                  [comment.id]: event.target.value,
                }));
              }}
            />
            <CommentSubmit
              type="submit"
              $theme={theme}
              aria-label="发送回复"
              disabled={!replyDraft.trim() || submittingCommentKey === replyKey}
              title="发送回复"
            >
              {submittingCommentKey === replyKey ? (
                <CommentSubmitSpinner aria-hidden="true" />
              ) : (
                <SendGlyph />
              )}
            </CommentSubmit>
          </CommentForm>
        ) : null}

        {replies.length > 0 ? (
          <CommentList>
            {replies.map((reply) =>
              renderComment(postId, reply, repliesByParent, depth + 1),
            )}
          </CommentList>
        ) : null}
      </CommentItem>
    );
  };

  return (
    <Shell $theme={theme} data-v2="timeline-feed">
      <FeedTop $theme={theme}>
        <FeedTitle $theme={theme}>{title}</FeedTitle>
      </FeedTop>
      {showComposer ? (
        <Composer
          $theme={theme}
          data-v2="timeline-composer"
          onSubmit={(event) => {
            onSubmit(event);
          }}
        >
          <ComposerHeader>
            <Avatar
              $theme={theme}
              $hasImage={Boolean(avatarSrc)}
              aria-hidden="true"
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="" />
              ) : (
                config.avatar.initials
              )}
            </Avatar>
            <ComposerMeta>
              <Name $theme={theme}>{config.name.display}</Name>
              <Handle $theme={theme}>Amateur In Everything</Handle>
            </ComposerMeta>
          </ComposerHeader>

          <Textarea
            $theme={theme}
            aria-label="动态文案"
            maxLength={2000}
            placeholder="今天发生了什么？"
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
            }}
          />

          {previewUrl && selectedMediaType ? (
            <Preview $theme={theme}>
              {selectedMediaType === 'image' ? (
                <img src={previewUrl} alt="待发布媒体预览" />
              ) : (
                <video src={previewUrl} controls muted />
              )}
              <RemoveMedia
                type="button"
                $theme={theme}
                aria-label="移除媒体"
                onClick={() => {
                  setFile(null);
                }}
              >
                ×
              </RemoveMedia>
            </Preview>
          ) : null}

          {error ? (
            <HelperText $theme={theme} $danger>
              {error}
            </HelperText>
          ) : !client ? (
            <HelperText $theme={theme}>
              未连接 Supabase，动态暂时只能浏览。
            </HelperText>
          ) : null}

          <ComposerActions>
            <ActionGroup>
              <GhostButton
                type="button"
                $theme={theme}
                onClick={() => inputRef.current?.click()}
              >
                图片/视频
              </GhostButton>
              <input
                ref={inputRef}
                type="file"
                accept="image/*,video/*"
                hidden
                onChange={onFileChange}
              />
            </ActionGroup>
            <SubmitButton type="submit" $theme={theme} disabled={!canSubmit}>
              {submitting ? '发布中' : '发布'}
            </SubmitButton>
          </ComposerActions>
        </Composer>
      ) : error ? (
        <EmptyState $theme={theme}>{error}</EmptyState>
      ) : null}

      {confirmOpen ? (
        <ConfirmOverlay role="presentation">
          <ConfirmPanel
            $theme={theme}
            aria-label="发布动态二级确认"
            onSubmit={(event) => {
              void onConfirmSubmit(event);
            }}
          >
            <ConfirmTitle $theme={theme}>确认发布动态</ConfirmTitle>
            <ConfirmCopy $theme={theme}>
              请输入二级密码，验证通过后才会把这条动态发布到主页。
            </ConfirmCopy>
            <PasswordInput
              $theme={theme}
              aria-label="二级密码"
              autoFocus
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError(null);
              }}
            />
            {passwordError ? (
              <HelperText $theme={theme} $danger>
                {passwordError}
              </HelperText>
            ) : null}
            <ConfirmActions>
              <GhostButton
                type="button"
                $theme={theme}
                onClick={() => {
                  setConfirmOpen(false);
                  setPassword('');
                  setPasswordError(null);
                }}
              >
                取消
              </GhostButton>
              <SubmitButton
                type="submit"
                $theme={theme}
                disabled={submitting || password.length === 0}
              >
                {submitting ? '发布中' : '确认发布'}
              </SubmitButton>
            </ConfirmActions>
          </ConfirmPanel>
        </ConfirmOverlay>
      ) : null}

      {posts.length > 0 ? (
        <FilterShell $theme={theme} data-v2="timeline-filters">
          <FilterToolbar>
            <FilterField $theme={theme}>
              <FilterLabel $theme={theme}>精选</FilterLabel>
              <FilterSelect
                $theme={theme}
                value={typeFilter === 'featured' ? 'featured' : 'all'}
                onChange={(event) => {
                  const next = event.target.value as 'all' | 'featured';
                  setTypeFilter(next === 'featured' ? 'featured' : 'all');
                }}
              >
                <option value="all">全部内容</option>
                <option value="featured">只看精选</option>
              </FilterSelect>
            </FilterField>

            <FilterMenuField ref={dateMenuRef} $theme={theme}>
              <FilterLabel $theme={theme}>时间</FilterLabel>
              <FilterMenuButton
                type="button"
                $theme={theme}
                $active={isDateMenuOpen}
                aria-expanded={isDateMenuOpen}
                aria-haspopup="dialog"
                onClick={() => {
                  setIsDateMenuOpen((current) => !current);
                }}
              >
                <FilterMenuValue>{dateFilterLabel}</FilterMenuValue>
              </FilterMenuButton>

              {isDateMenuOpen ? (
                <DateFilterPopover
                  $theme={theme}
                  role="dialog"
                  aria-label="选择时间"
                >
                  <DateFilterMenuHeader>
                    <DateFilterMenuTitle $theme={theme}>
                      {dateFilterLabel}
                    </DateFilterMenuTitle>
                    <DateFilterActions>
                      <DateFilterActionButton
                        type="button"
                        $theme={theme}
                        onClick={() => {
                          setTimeFilter('all');
                        }}
                      >
                        全部
                      </DateFilterActionButton>
                      <DateFilterActionButton
                        type="button"
                        $theme={theme}
                        $primary
                        onClick={() => {
                          setIsDateMenuOpen(false);
                        }}
                      >
                        完成
                      </DateFilterActionButton>
                    </DateFilterActions>
                  </DateFilterMenuHeader>
                  <DateWheel $theme={theme}>
                    <DateWheelColumn
                      ariaLabel="年份"
                      options={yearOptions}
                      theme={theme}
                      value={selectedDate.year}
                      onSelect={(year) => {
                        selectDateFilter({ year });
                      }}
                    />
                    <DateWheelColumn
                      ariaLabel="月份"
                      options={MONTH_OPTIONS}
                      theme={theme}
                      value={selectedDate.month}
                      onSelect={(month) => {
                        selectDateFilter({ month });
                      }}
                    />
                    <DateWheelColumn
                      ariaLabel="日期"
                      options={dayOptions}
                      theme={theme}
                      value={selectedDate.day}
                      onSelect={(day) => {
                        selectDateFilter({ day });
                      }}
                    />
                  </DateWheel>
                </DateFilterPopover>
              ) : null}
            </FilterMenuField>

            <FilterField $theme={theme}>
              <FilterLabel $theme={theme}>类型</FilterLabel>
              <FilterSelect
                $theme={theme}
                value={typeFilter === 'featured' ? 'all' : typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value as TimelineTypeFilter);
                }}
              >
                {TYPE_FILTER_OPTIONS.filter(
                  (option) => option.id !== 'featured',
                ).map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </FilterSelect>
            </FilterField>
          </FilterToolbar>
        </FilterShell>
      ) : null}

      <PostList aria-live="polite" aria-busy={loading}>
        {loading ? (
          <EmptyState $theme={theme}>
            <EmptyStateContent>
              <LoadingRing aria-hidden="true" />
              动态加载中
            </EmptyStateContent>
          </EmptyState>
        ) : posts.length === 0 ? (
          <EmptyState $theme={theme}>还没有动态</EmptyState>
        ) : filteredPosts.length === 0 ? (
          <EmptyState $theme={theme}>没有符合筛选的动态</EmptyState>
        ) : (
          filteredPosts.map((post) => {
            const comments = commentsByPost[post.id] ?? [];
            const { repliesByParent, roots } = groupRepliesByParent(comments);
            const commentDraft = commentDrafts[post.id] ?? '';
            const commentKey = `comment-${post.id}`;
            const commentsPanelId = `timeline-comments-${post.id}`;
            const commentInputId = `timeline-comment-${post.id}`;
            const isCommentsOpen = Boolean(expandedCommentPostIds[post.id]);
            const viewsLabel = formatMetricCount(post.views_count);

            return (
              <PostCard
                key={post.id}
                $featured={post.is_featured}
                $theme={theme}
                data-v2="timeline-post"
              >
                <PostHeader>
                  <Avatar
                    $theme={theme}
                    $hasImage={Boolean(avatarSrc)}
                    aria-hidden="true"
                  >
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="" />
                    ) : (
                      config.avatar.initials
                    )}
                  </Avatar>
                  <ComposerMeta>
                    <Name $theme={theme}>{config.name.display}</Name>
                    <Handle $theme={theme}>
                      {formatTime(post.created_at)}
                    </Handle>
                  </ComposerMeta>
                </PostHeader>
                {post.media_url && post.media_type ? (
                  post.media_type === 'image' ? (
                    <TimelinePostImage src={post.media_url} />
                  ) : (
                    <PostMedia>
                      <video src={post.media_url} controls preload="metadata" />
                    </PostMedia>
                  )
                ) : null}
                {post.body ? (
                  <PostBody $theme={theme}>{post.body}</PostBody>
                ) : null}
                <PostFooter $theme={theme}>
                  <span>动态</span>
                  <span>{formatTime(post.created_at)}</span>
                </PostFooter>
                <PostActions $theme={theme}>
                  <EngagementButton
                    type="button"
                    $theme={theme}
                    $selected={isCommentsOpen}
                    aria-label="评论"
                    aria-controls={commentsPanelId}
                    aria-expanded={isCommentsOpen}
                    disabled={!client}
                    onClick={() => {
                      setExpandedCommentPostIds((current) => ({
                        ...current,
                        [post.id]: !current[post.id],
                      }));

                      if (!isCommentsOpen) {
                        window.requestAnimationFrame(() => {
                          document.getElementById(commentInputId)?.focus();
                        });
                      }
                    }}
                  >
                    <EngagementIcon $theme={theme} $selected={isCommentsOpen}>
                      <CommentGlyph />
                    </EngagementIcon>
                    <EngagementCount>
                      {formatMetricCount(post.comments_count)}
                    </EngagementCount>
                  </EngagementButton>
                  <EngagementButton
                    type="button"
                    $theme={theme}
                    $active={post.liked_by_client}
                    aria-label={post.liked_by_client ? '取消收藏' : '收藏'}
                    aria-pressed={post.liked_by_client}
                    title={post.liked_by_client ? '取消收藏' : '收藏'}
                    disabled={!client || Boolean(likingPostIds[post.id])}
                    onClick={() => {
                      void onToggleLike(post);
                    }}
                  >
                    <EngagementIcon
                      $theme={theme}
                      $active={post.liked_by_client}
                    >
                      <HeartGlyph filled={post.liked_by_client} />
                    </EngagementIcon>
                    <EngagementCount>
                      {formatMetricCount(post.likes_count)}
                    </EngagementCount>
                  </EngagementButton>
                  <EngagementMetric
                    $theme={theme}
                    aria-label={`${viewsLabel} 次浏览`}
                    role="img"
                  >
                    <EngagementIcon $theme={theme}>
                      <ViewGlyph />
                    </EngagementIcon>
                    <EngagementCount>{viewsLabel}</EngagementCount>
                  </EngagementMetric>
                  <EngagementMetric
                    $theme={theme}
                    $active={post.is_featured}
                    $featured
                    aria-label={post.is_featured ? '已精选' : '未精选'}
                    role="img"
                    title="精选由管理员设置"
                  >
                    <EngagementIcon
                      $theme={theme}
                      $active={post.is_featured}
                      $featured
                    >
                      <FeaturedGlyph filled={post.is_featured} />
                    </EngagementIcon>
                  </EngagementMetric>
                </PostActions>
                {!isCommentsOpen && post.comments_count > 0 ? (
                  <CommentPreviewButton
                    type="button"
                    $theme={theme}
                    aria-controls={commentsPanelId}
                    aria-expanded={false}
                    onClick={() => {
                      setExpandedCommentPostIds((current) => ({
                        ...current,
                        [post.id]: true,
                      }));
                    }}
                  >
                    查看 {post.comments_count} 条评论
                  </CommentPreviewButton>
                ) : null}
                {isCommentsOpen ? (
                  <CommentsPanel
                    id={commentsPanelId}
                    $theme={theme}
                    aria-label="评论"
                  >
                    {roots.length > 0 ? (
                      <CommentList>
                        {roots.map((comment) =>
                          renderComment(post.id, comment, repliesByParent),
                        )}
                      </CommentList>
                    ) : (
                      <CommentEmptyHint $theme={theme}>
                        还没有评论
                      </CommentEmptyHint>
                    )}
                    <CommentForm
                      $theme={theme}
                      onSubmit={(event) => {
                        void onSubmitComment(event, post.id, null);
                      }}
                    >
                      <CommentInput
                        id={commentInputId}
                        $theme={theme}
                        aria-label="评论内容"
                        maxLength={500}
                        placeholder="写评论…"
                        value={commentDraft}
                        onChange={(event) => {
                          setCommentDrafts((current) => ({
                            ...current,
                            [post.id]: event.target.value,
                          }));
                        }}
                      />
                      <CommentSubmit
                        type="submit"
                        $theme={theme}
                        aria-label="发送评论"
                        disabled={
                          !commentDraft.trim() ||
                          submittingCommentKey === commentKey
                        }
                        title="发送评论"
                      >
                        {submittingCommentKey === commentKey ? (
                          <CommentSubmitSpinner aria-hidden="true" />
                        ) : (
                          <SendGlyph />
                        )}
                      </CommentSubmit>
                    </CommentForm>
                  </CommentsPanel>
                ) : null}
              </PostCard>
            );
          })
        )}
      </PostList>
    </Shell>
  );
};

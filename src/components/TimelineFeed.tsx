import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useContext,
  useEffect,
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

type TimelineMediaType = 'image' | 'video';

interface TimelinePostRow {
  id: string;
  body: string;
  media_url: null | string;
  media_type: null | TimelineMediaType;
  created_at: string;
  likes_count: number;
  liked_by_client: boolean;
  comments_count: number;
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
}

interface TimelineFeedProps {
  requirePublishPassword?: boolean;
  showComposer?: boolean;
  title?: string;
}

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

    if (typeof id !== 'string' || typeof createdAt !== 'string') return [];

    return [
      {
        id,
        body: typeof body === 'string' ? body : '',
        media_url: typeof mediaUrl === 'string' ? mediaUrl : null,
        media_type: isTimelineMediaType(mediaType) ? mediaType : null,
        created_at: createdAt,
        likes_count: 0,
        liked_by_client: false,
        comments_count: 0,
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

    if (typeof postId !== 'string') return [];

    return [
      {
        post_id: postId,
        likes_count: typeof likesCount === 'number' ? likesCount : 0,
        liked_by_client:
          typeof likedByClient === 'boolean' ? likedByClient : false,
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
    message.includes('get_timeline_post_engagement') ||
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

const Shell = styled.section`
  display: grid;
  gap: 0;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  background: #fff;

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

const PostList = styled.div`
  display: grid;
  gap: 0;
`;

const PostCard = styled.article<{ $theme: Theme }>`
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
  font-size: 0.95rem;
  line-height: 1.68;
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
    radial-gradient(circle at 50% 44%, rgba(255, 255, 255, 0.1), transparent 38%),
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
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
  padding: 0.1rem 1rem 0.85rem;
  border-bottom: 1px solid ${({ $theme }) => $theme.gridColor};
`;

const EngagementButton = styled.button<{
  $active?: boolean;
  $theme: Theme;
}>`
  display: inline-flex;
  align-items: center;
  gap: 0.36rem;
  min-height: 2rem;
  padding: 0.42rem 0.72rem;
  border: 1px solid
    ${({ $active, $theme }) =>
      $active ? $theme.accentColor : $theme.cardBorder};
  border-radius: 999px;
  background: ${({ $active, $theme }) =>
    $active ? $theme.spotlightColor : $theme.iconGlassBackground};
  color: ${({ $active, $theme }) =>
    $active ? $theme.accentColor : $theme.secondaryTextColor};
  cursor: pointer;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 760;

  &:hover {
    border-color: ${({ $theme }) => $theme.cardHoverBorder};
    color: ${({ $theme }) => $theme.primaryTextColor};
    background: ${({ $theme }) => $theme.glassBackgroundHover};
  }

  &:disabled {
    opacity: 0.48;
    cursor: not-allowed;
  }
`;

const CommentsPanel = styled.section<{ $theme: Theme }>`
  display: grid;
  gap: 0.85rem;
  padding: 0.9rem 1rem 1rem;
  background: ${({ $theme }) => $theme.cardBackground};
`;

const CommentForm = styled.form<{ $compact?: boolean }>`
  display: flex;
  gap: 0.55rem;
  align-items: flex-start;
  margin-top: ${({ $compact }) => ($compact ? '0.55rem' : '0')};

  @media (width <= 520px) {
    flex-direction: column;
  }
`;

const CommentInput = styled.textarea<{ $theme: Theme }>`
  flex: 1;
  min-width: 0;
  min-height: 2.45rem;
  max-height: 9rem;
  resize: vertical;
  box-sizing: border-box;
  padding: 0.7rem 0.8rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.iconGlassBackground};
  color: ${({ $theme }) => $theme.primaryTextColor};
  font: inherit;
  font-size: 0.86rem;
  line-height: 1.5;

  &:focus {
    outline: 2px solid ${({ $theme }) => $theme.accentColor};
    outline-offset: 2px;
  }

  &::placeholder {
    color: ${({ $theme }) => $theme.tertiaryTextColor};
  }
`;

const CommentSubmit = styled.button<{ $theme: Theme }>`
  flex: 0 0 auto;
  min-height: 2.45rem;
  padding: 0.58rem 0.82rem;
  border: 1px solid ${({ $theme }) => $theme.primaryTextColor};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.primaryTextColor};
  color: ${({ $theme }) => $theme.cardBackground};
  cursor: pointer;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 760;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
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
  const avatarSrc = config.avatar.src?.trim();
  const [clientId] = useState(getTimelineClientId);
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<null | string>(null);
  const [posts, setPosts] = useState<TimelinePostRow[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, TimelineCommentRow[]>
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

  const selectedMediaType = file ? mediaTypeFromFile(file) : null;
  const canSubmit =
    Boolean(client) && !submitting && (body.trim().length > 0 || Boolean(file));

  const loadPosts = useCallback(async () => {
    if (!client) {
      setLoading(false);

      return;
    }

    setLoading(true);
    setError(null);

    const postsResult = await client
      .from(TABLE)
      .select('id, body, media_url, media_type, created_at')
      .order('created_at', { ascending: false })
      .limit(80);

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
              disabled={!replyDraft.trim() || submittingCommentKey === replyKey}
            >
              {submittingCommentKey === replyKey ? '发送中' : '发送'}
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
    <Shell data-v2="timeline-feed">
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
        ) : (
          posts.map((post) => {
            const comments = commentsByPost[post.id] ?? [];
            const { repliesByParent, roots } = groupRepliesByParent(comments);
            const commentDraft = commentDrafts[post.id] ?? '';
            const commentKey = `comment-${post.id}`;

            return (
              <PostCard key={post.id} $theme={theme} data-v2="timeline-post">
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
                    $active={post.liked_by_client}
                    aria-label={post.liked_by_client ? '取消点赞' : '点赞'}
                    aria-pressed={post.liked_by_client}
                    disabled={!client || Boolean(likingPostIds[post.id])}
                    onClick={() => {
                      void onToggleLike(post);
                    }}
                  >
                    <span aria-hidden="true">♥</span>
                    <span>{post.likes_count}</span>
                  </EngagementButton>
                  <EngagementButton
                    type="button"
                    $theme={theme}
                    aria-label="评论"
                    disabled={!client}
                    onClick={() => {
                      const field = document.getElementById(
                        `timeline-comment-${post.id}`,
                      );
                      field?.focus();
                    }}
                  >
                    <span aria-hidden="true">💬</span>
                    <span>{post.comments_count}</span>
                  </EngagementButton>
                </PostActions>
                <CommentsPanel $theme={theme} aria-label="评论">
                  <CommentForm
                    onSubmit={(event) => {
                      void onSubmitComment(event, post.id, null);
                    }}
                  >
                    <CommentInput
                      id={`timeline-comment-${post.id}`}
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
                      disabled={
                        !commentDraft.trim() ||
                        submittingCommentKey === commentKey
                      }
                    >
                      {submittingCommentKey === commentKey ? '发送中' : '发送'}
                    </CommentSubmit>
                  </CommentForm>
                  {roots.length > 0 ? (
                    <CommentList>
                      {roots.map((comment) =>
                        renderComment(post.id, comment, repliesByParent),
                      )}
                    </CommentList>
                  ) : null}
                </CommentsPanel>
              </PostCard>
            );
          })
        )}
      </PostList>
    </Shell>
  );
};

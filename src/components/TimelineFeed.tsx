import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { getSupabase } from 'lib/supabaseClient';
import { Theme } from 'types';

const TABLE = 'portfolio_timeline_posts';
const MEDIA_BUCKET = 'portfolio-feed-media';
const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
const TIMELINE_SECONDARY_PASSWORD = 'Jyangb1y@';

type TimelineMediaType = 'image' | 'video';

interface TimelinePostRow {
  id: string;
  body: string;
  media_url: null | string;
  media_type: null | TimelineMediaType;
  created_at: string;
}

const isTimelineMediaType = (value: unknown): value is TimelineMediaType =>
  value === 'image' || value === 'video';

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
      },
    ];
  });
};

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
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${String(Date.now())}-${Math.random().toString(16).slice(2)}`;

  return `feed/${id}.${safeExtension(file, mediaType)}`;
};

const friendlySupabaseError = (message: string) => {
  if (message.includes('portfolio_timeline_posts')) {
    return '动态表还没有创建，请先执行 Supabase timeline 迁移。';
  }

  if (message.includes(MEDIA_BUCKET)) {
    return '动态媒体 bucket 还没有配置好。';
  }

  if (message.toLowerCase().includes('row-level security')) {
    return '动态的 Supabase 权限还没有配置好，请执行 timeline 迁移。';
  }

  return message;
};

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

const PostMedia = styled.div`
  overflow: hidden;
  margin: 0 1rem 0.85rem;
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

const PostFooter = styled.footer<{ $theme: Theme }>`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.72rem 1rem 0.9rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.76rem;
`;

const EmptyState = styled.div<{ $theme: Theme }>`
  padding: 1.25rem;
  border: 0;
  border-bottom: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 0;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  text-align: center;
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

export const TimelineFeed = () => {
  const { config, theme } = useContext(AppContext);
  const client = getSupabase();
  const inputRef = useRef<HTMLInputElement>(null);
  const avatarSrc = config.avatar.src?.trim();
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<null | string>(null);
  const [posts, setPosts] = useState<TimelinePostRow[]>([]);
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

    const { data, error: fetchError } = await client
      .from(TABLE)
      .select('id, body, media_url, media_type, created_at')
      .order('created_at', { ascending: false })
      .limit(80);

    setLoading(false);

    if (fetchError) {
      setError(friendlySupabaseError(fetchError.message));

      return;
    }

    setPosts(normalizePosts(data));
  }, [client]);

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

  return (
    <Shell data-v2="timeline-feed">
      <FeedTop $theme={theme}>
        <FeedTitle $theme={theme}>动态</FeedTitle>
      </FeedTop>
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
          <EmptyState $theme={theme}>动态加载中</EmptyState>
        ) : posts.length === 0 ? (
          <EmptyState $theme={theme}>还没有动态</EmptyState>
        ) : (
          posts.map((post) => (
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
                  <Handle $theme={theme}>{formatTime(post.created_at)}</Handle>
                </ComposerMeta>
              </PostHeader>
              {post.media_url && post.media_type ? (
                <PostMedia>
                  {post.media_type === 'image' ? (
                    <img src={post.media_url} alt="" loading="lazy" />
                  ) : (
                    <video src={post.media_url} controls preload="metadata" />
                  )}
                </PostMedia>
              ) : null}
              {post.body ? (
                <PostBody $theme={theme}>{post.body}</PostBody>
              ) : null}
              <PostFooter $theme={theme}>
                <span>动态</span>
                <span>{formatTime(post.created_at)}</span>
              </PostFooter>
            </PostCard>
          ))
        )}
      </PostList>
    </Shell>
  );
};

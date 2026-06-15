import {
  ChangeEvent,
  FormEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import {
  AdminBlogComment,
  AdminGuestbookNote,
  AdminOverview,
  AdminQuestion,
  AdminResource,
  AdminTimelineComment,
  AdminTimelinePost,
  answerQuestion,
  createAdminSite,
  createTimelinePost,
  deleteAdminResource,
  fetchAdminList,
  fetchOverview,
  setQuestionVisibility,
  setResourceVisibility,
  setTimelinePostFeatured,
  updateAdminSite,
} from 'lib/adminApi';
import { getSupabase } from 'lib/supabaseClient';
import { Theme } from 'types';

type AdminTab =
  | 'blog-comments'
  | 'guestbook'
  | 'questions'
  | 'sites'
  | 'timeline-comments'
  | 'timeline-posts';

type TimelineMediaType = 'image' | 'video';

const ADMIN_PASSWORD_STORAGE = 'portfolio-admin-password-v1';
const MEDIA_BUCKET = 'portfolio-feed-media';
const MAX_MEDIA_BYTES = 50 * 1024 * 1024;

const tabs: {
  id: AdminTab;
  label: string;
  metric?: keyof AdminOverview['counts'];
}[] = [
  { id: 'questions', label: '提问', metric: 'pendingQuestions' },
  { id: 'guestbook', label: '留言', metric: 'guestbook' },
  { id: 'timeline-posts', label: '动态', metric: 'timelinePosts' },
  { id: 'timeline-comments', label: '动态评论', metric: 'timelineComments' },
  { id: 'blog-comments', label: '博客评论', metric: 'blogComments' },
  { id: 'sites', label: '主页' },
];

const Page = styled.main`
  position: relative;
  z-index: 2;
  display: grid;
  gap: 1rem;
  width: min(100%, 74rem);
  margin: 0 auto;
  box-sizing: border-box;
  padding: 1.1rem 1rem 3rem;

  @media (width >= 769px) {
    padding: 1.45rem clamp(1.2rem, 3vw, 2rem) 3.4rem;
  }
`;

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`;

const HeaderText = styled.div`
  display: grid;
  gap: 0.28rem;
  min-width: 0;
`;

const Eyebrow = styled.p<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.74rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Title = styled.h1<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: clamp(1.45rem, 5vw, 2.2rem);
  line-height: 1.08;
  letter-spacing: 0;
`;

const Copy = styled.p<{ $theme: Theme }>`
  max-width: 42rem;
  margin: 0.35rem 0 0;
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font-size: 0.92rem;
  line-height: 1.58;
`;

const HeaderActions = styled.div`
  display: flex;
  flex-shrink: 0;
  gap: 0.5rem;
`;

const LinkButton = styled.a<{ $theme: Theme }>`
  display: inline-grid;
  min-height: 2.35rem;
  place-items: center;
  padding: 0 0.86rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.cardBackground};
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: 0.82rem;
  font-weight: 760;
  text-decoration: none;
`;

const Gate = styled.form<{ $theme: Theme }>`
  display: grid;
  gap: 0.9rem;
  max-width: 28rem;
  padding: 1rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.cardBackground};
`;

const Input = styled.input<{ $theme: Theme }>`
  width: 100%;
  min-height: 2.65rem;
  box-sizing: border-box;
  padding: 0.72rem 0.82rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.iconGlassBackground};
  color: ${({ $theme }) => $theme.primaryTextColor};
  font: inherit;
  font-size: 0.9rem;

  &:focus {
    outline: 2px solid ${({ $theme }) => $theme.accentColor};
    outline-offset: 2px;
  }
`;

const Textarea = styled.textarea<{ $theme: Theme }>`
  width: 100%;
  min-height: 5.2rem;
  resize: vertical;
  box-sizing: border-box;
  padding: 0.78rem 0.85rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.iconGlassBackground};
  color: ${({ $theme }) => $theme.primaryTextColor};
  font: inherit;
  font-size: 0.9rem;
  line-height: 1.48;

  &:focus {
    outline: 2px solid ${({ $theme }) => $theme.accentColor};
    outline-offset: 2px;
  }
`;

const Select = styled.select<{ $theme: Theme }>`
  min-height: 2.4rem;
  padding: 0 0.72rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.cardBackground};
  color: ${({ $theme }) => $theme.primaryTextColor};
  font: inherit;
  font-size: 0.84rem;
`;

const Button = styled.button<{
  $theme: Theme;
  $tone?: 'danger' | 'ghost' | 'primary';
}>`
  min-height: 2.35rem;
  padding: 0.62rem 0.8rem;
  border: 1px solid
    ${({ $theme, $tone }) =>
      $tone === 'primary' ? $theme.primaryTextColor : $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme, $tone }) =>
    $tone === 'primary' ? $theme.primaryTextColor : $theme.cardBackground};
  color: ${({ $theme, $tone }) =>
    $tone === 'danger'
      ? '#dc2626'
      : $tone === 'primary'
        ? $theme.cardBackground
        : $theme.primaryTextColor};
  cursor: pointer;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 760;

  &:disabled {
    opacity: 0.48;
    cursor: not-allowed;
  }
`;

const HelperText = styled.p<{ $danger?: boolean; $theme: Theme }>`
  margin: 0;
  color: ${({ $danger, $theme }) =>
    $danger ? '#dc2626' : $theme.tertiaryTextColor};
  font-size: 0.8rem;
  line-height: 1.55;
`;

const Toolbar = styled.div<{ $theme: Theme }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.cardBackground};
`;

const ToolbarGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem;
`;

const MetricGrid = styled.section`
  display: grid;
  gap: 0.72rem;
  grid-template-columns: repeat(auto-fit, minmax(8.8rem, 1fr));
`;

const Metric = styled.div<{ $theme: Theme }>`
  display: grid;
  gap: 0.2rem;
  min-height: 4.6rem;
  box-sizing: border-box;
  padding: 0.85rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.cardBackground};
`;

const MetricValue = styled.strong<{ $theme: Theme }>`
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: 1.45rem;
  line-height: 1;
`;

const MetricLabel = styled.span<{ $theme: Theme }>`
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.76rem;
  font-weight: 760;
`;

const Workbench = styled.div`
  display: grid;
  gap: 1rem;

  @media (width >= 900px) {
    grid-template-columns: 13rem minmax(0, 1fr);
    align-items: start;
  }
`;

const TabList = styled.nav<{ $theme: Theme }>`
  display: grid;
  gap: 0.45rem;
  padding: 0.45rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.cardBackground};
`;

const TabButton = styled.button<{ $active?: boolean; $theme: Theme }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 2.45rem;
  padding: 0 0.72rem;
  border: 1px solid
    ${({ $active, $theme }) =>
      $active ? $theme.primaryTextColor : 'transparent'};
  border-radius: 8px;
  background: ${({ $active, $theme }) =>
    $active ? $theme.iconGlassBackground : 'transparent'};
  color: ${({ $theme }) => $theme.primaryTextColor};
  cursor: pointer;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 760;
  text-align: left;
`;

const TabCount = styled.span<{ $theme: Theme }>`
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.72rem;
`;

const Content = styled.section`
  display: grid;
  gap: 0.8rem;
  min-width: 0;
`;

const SectionHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
`;

const SectionTitle = styled.h2<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: 1.05rem;
  letter-spacing: 0;
`;

const Stack = styled.div`
  display: grid;
  gap: 0.68rem;
`;

const Item = styled.article<{ $theme: Theme }>`
  display: grid;
  gap: 0.66rem;
  padding: 0.85rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.cardBackground};
`;

const Meta = styled.div<{ $theme: Theme }>`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.74rem;
  font-weight: 720;
`;

const Body = styled.p<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: 0.92rem;
  line-height: 1.55;
  overflow-wrap: anywhere;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Composer = styled.form<{ $theme: Theme }>`
  display: grid;
  gap: 0.7rem;
  padding: 0.85rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.cardBackground};
`;

const InlineForm = styled.form`
  display: grid;
  gap: 0.55rem;
`;

const FormRow = styled.div`
  display: grid;
  gap: 0.5rem;

  @media (width >= 700px) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  }
`;

const UploadInput = styled.input<{ $theme: Theme }>`
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font: inherit;
  font-size: 0.82rem;
`;

const Empty = styled.div<{ $theme: Theme }>`
  padding: 1rem;
  border: 1px dashed ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.86rem;
`;

const Pill = styled.span<{
  $kind?: 'featured' | 'hidden' | 'live' | 'pending';
  $theme: Theme;
}>`
  display: inline-flex;
  align-items: center;
  min-height: 1.45rem;
  padding: 0 0.5rem;
  border: 1px solid
    ${({ $kind, $theme }) =>
      $kind === 'pending'
        ? $theme.accentColor
        : $kind === 'featured'
          ? 'rgba(216, 155, 13, 0.45)'
          : $theme.cardBorder};
  border-radius: 999px;
  color: ${({ $kind, $theme }) =>
    $kind === 'hidden'
      ? '#dc2626'
      : $kind === 'pending'
        ? $theme.accentColor
        : $kind === 'featured'
          ? '#d89b0d'
          : $theme.secondaryTextColor};
  font-size: 0.72rem;
  font-weight: 760;
`;

const formatTime = (iso: null | string) => {
  if (!iso) return '未记录';

  try {
    return new Date(iso).toLocaleString('zh-CN', {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: '2-digit',
    });
  } catch {
    return iso;
  }
};

const getStoredPassword = () => {
  if (typeof window === 'undefined') return '';

  try {
    return window.sessionStorage.getItem(ADMIN_PASSWORD_STORAGE) ?? '';
  } catch {
    return '';
  }
};

const rememberPassword = (password: string) => {
  try {
    window.sessionStorage.setItem(ADMIN_PASSWORD_STORAGE, password);
  } catch {
    // The active React state still keeps the current admin session usable.
  }
};

const forgetPassword = () => {
  try {
    window.sessionStorage.removeItem(ADMIN_PASSWORD_STORAGE);
  } catch {
    // Ignore storage failures.
  }
};

const mediaTypeFromFile = (file: File): null | TimelineMediaType => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';

  return null;
};

const makeMediaPath = (file: File) => {
  const timestamp = String(Date.now());
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const randomId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : timestamp;

  return `feed/admin/${timestamp}-${randomId}-${safeName || 'media'}`;
};

const statusLabel = (status: string) => {
  if (status === 'answered') return '已回答';
  if (status === 'hidden') return '已隐藏';
  if (status === 'pending') return '待处理';
  if (status === 'deleted') return '已删除';

  return '公开';
};

const statusKind = (status: string): 'hidden' | 'live' | 'pending' => {
  if (status === 'hidden' || status === 'deleted') return 'hidden';
  if (status === 'pending') return 'pending';

  return 'live';
};

export const AdminScreen = () => {
  const { theme } = useContext(AppContext);
  const [sessionPassword, setSessionPassword] = useState(getStoredPassword);
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('questions');
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [guestbook, setGuestbook] = useState<AdminGuestbookNote[]>([]);
  const [timelinePosts, setTimelinePosts] = useState<AdminTimelinePost[]>([]);
  const [timelineComments, setTimelineComments] = useState<
    AdminTimelineComment[]
  >([]);
  const [blogComments, setBlogComments] = useState<AdminBlogComment[]>([]);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [timelineBody, setTimelineBody] = useState('');
  const [timelineFile, setTimelineFile] = useState<File | null>(null);
  const [siteForm, setSiteForm] = useState({
    description: '',
    slug: '',
    title: '',
  });
  const [loading, setLoading] = useState(false);
  const [operationKey, setOperationKey] = useState<null | string>(null);
  const [error, setError] = useState<null | string>(null);

  const currentSiteId =
    selectedSiteId === 'all' ? undefined : selectedSiteId || undefined;

  const defaultSite = useMemo(
    () => overview?.sites.find((site) => site.is_default) ?? overview?.sites[0],
    [overview],
  );

  const loadCurrent = useCallback(async () => {
    if (!sessionPassword) return;

    setLoading(true);
    setError(null);

    try {
      const nextOverview = await fetchOverview(sessionPassword, currentSiteId);
      setOverview(nextOverview);

      if (activeTab === 'questions') {
        const items = await fetchAdminList<AdminQuestion>(
          sessionPassword,
          'questions',
          currentSiteId,
        );
        setQuestions(items);
        setAnswerDrafts((current) => {
          const next = { ...current };
          items.forEach((item) => {
            if (typeof next[item.id] === 'undefined') {
              next[item.id] = item.answer ?? '';
            }
          });

          return next;
        });
      }

      if (activeTab === 'guestbook') {
        setGuestbook(
          await fetchAdminList<AdminGuestbookNote>(
            sessionPassword,
            'guestbook',
            currentSiteId,
          ),
        );
      }

      if (activeTab === 'timeline-posts') {
        setTimelinePosts(
          await fetchAdminList<AdminTimelinePost>(
            sessionPassword,
            'timeline-posts',
            currentSiteId,
          ),
        );
      }

      if (activeTab === 'timeline-comments') {
        setTimelineComments(
          await fetchAdminList<AdminTimelineComment>(
            sessionPassword,
            'timeline-comments',
            currentSiteId,
          ),
        );
      }

      if (activeTab === 'blog-comments') {
        setBlogComments(
          await fetchAdminList<AdminBlogComment>(
            sessionPassword,
            'blog-comments',
            currentSiteId,
          ),
        );
      }
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : '后台加载失败。';
      setError(message);

      if (message.includes('密码')) {
        forgetPassword();
        setSessionPassword('');
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentSiteId, sessionPassword]);

  useEffect(() => {
    void loadCurrent();
  }, [loadCurrent]);

  const runOperation = async (key: string, operation: () => Promise<void>) => {
    if (!sessionPassword) return;

    setOperationKey(key);
    setError(null);

    try {
      await operation();
      await loadCurrent();
    } catch (operationError) {
      setError(
        operationError instanceof Error ? operationError.message : '操作失败。',
      );
    } finally {
      setOperationKey(null);
    }
  };

  const login = (event: FormEvent) => {
    event.preventDefault();
    const nextPassword = passwordInput.trim();
    if (!nextPassword) return;

    rememberPassword(nextPassword);
    setSessionPassword(nextPassword);
    setPasswordInput('');
  };

  const logout = () => {
    forgetPassword();
    setSessionPassword('');
    setOverview(null);
  };

  const submitTimelinePost = async (event: FormEvent) => {
    event.preventDefault();
    if (!sessionPassword || operationKey) return;

    await runOperation('timeline-create', async () => {
      let mediaPath: null | string = null;
      let mediaType: null | TimelineMediaType = null;
      let mediaUrl: null | string = null;

      if (timelineFile) {
        const detectedType = mediaTypeFromFile(timelineFile);
        if (!detectedType) throw new Error('只能上传图片或视频。');
        if (timelineFile.size > MAX_MEDIA_BYTES) {
          throw new Error('媒体文件需要小于 50 MB。');
        }

        const client = getSupabase();
        if (!client) throw new Error('Supabase 浏览器客户端未连接。');

        const path = makeMediaPath(timelineFile);
        const { error: uploadError } = await client.storage
          .from(MEDIA_BUCKET)
          .upload(path, timelineFile, {
            cacheControl: '31536000',
            contentType: timelineFile.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = client.storage.from(MEDIA_BUCKET).getPublicUrl(path);
        mediaPath = path;
        mediaType = detectedType;
        mediaUrl = data.publicUrl;
      }

      await createTimelinePost(sessionPassword, {
        body: timelineBody,
        mediaPath,
        mediaType,
        mediaUrl,
        siteId: currentSiteId ?? defaultSite?.id,
      });
      setTimelineBody('');
      setTimelineFile(null);
    });
  };

  const createSite = async (event: FormEvent) => {
    event.preventDefault();
    if (!sessionPassword) return;

    await runOperation('site-create', async () => {
      await createAdminSite(sessionPassword, siteForm);
      setSiteForm({ description: '', slug: '', title: '' });
    });
  };

  const renderQuestions = () => (
    <Stack>
      {questions.length === 0 ? (
        <Empty $theme={theme}>当前没有需要展示的提问。</Empty>
      ) : (
        questions.map((question) => {
          const draft = answerDrafts[question.id] ?? '';
          const busy = operationKey === `answer-${question.id}`;

          return (
            <Item key={question.id} $theme={theme}>
              <Meta $theme={theme}>
                <Pill $theme={theme} $kind={statusKind(question.status)}>
                  {statusLabel(question.status)}
                </Pill>
                <span>提问于 {formatTime(question.created_at)}</span>
                {question.answered_at ? (
                  <span>回答于 {formatTime(question.answered_at)}</span>
                ) : null}
              </Meta>
              <Body $theme={theme}>{question.question}</Body>
              <InlineForm
                onSubmit={(event) => {
                  event.preventDefault();
                  void runOperation(`answer-${question.id}`, async () => {
                    await answerQuestion(sessionPassword, question.id, draft);
                  });
                }}
              >
                <Textarea
                  $theme={theme}
                  aria-label="回答提问"
                  maxLength={2000}
                  value={draft}
                  onChange={(event) => {
                    setAnswerDrafts((current) => ({
                      ...current,
                      [question.id]: event.target.value,
                    }));
                  }}
                />
                <Actions>
                  <Button
                    type="submit"
                    $theme={theme}
                    $tone="primary"
                    disabled={busy || !draft.trim()}
                  >
                    {busy ? '保存中' : '保存回答'}
                  </Button>
                  <Button
                    type="button"
                    $theme={theme}
                    disabled={Boolean(operationKey)}
                    onClick={() => {
                      void runOperation(`hide-${question.id}`, async () => {
                        await setQuestionVisibility(
                          sessionPassword,
                          question.id,
                          question.status === 'hidden' ? 'restore' : 'hide',
                          draft,
                        );
                      });
                    }}
                  >
                    {question.status === 'hidden' ? '恢复' : '隐藏'}
                  </Button>
                  <Button
                    type="button"
                    $theme={theme}
                    $tone="danger"
                    disabled={Boolean(operationKey)}
                    onClick={() => {
                      void runOperation(`delete-${question.id}`, async () => {
                        await deleteAdminResource<AdminQuestion>(
                          sessionPassword,
                          'questions',
                          question.id,
                        );
                      });
                    }}
                  >
                    删除
                  </Button>
                </Actions>
              </InlineForm>
            </Item>
          );
        })
      )}
    </Stack>
  );

  const renderGuestbook = () => (
    <Stack>
      {guestbook.length === 0 ? (
        <Empty $theme={theme}>当前没有留言。</Empty>
      ) : (
        guestbook.map((note) => (
          <Item key={note.id} $theme={theme}>
            <Meta $theme={theme}>
              <Pill $theme={theme} $kind={statusKind(note.status)}>
                {statusLabel(note.status)}
              </Pill>
              <span>{formatTime(note.created_at)}</span>
            </Meta>
            <Body $theme={theme}>{note.body}</Body>
            <Actions>
              <Button
                type="button"
                $theme={theme}
                disabled={Boolean(operationKey)}
                onClick={() => {
                  void runOperation(`guestbook-hide-${note.id}`, async () => {
                    await setResourceVisibility<AdminGuestbookNote>(
                      sessionPassword,
                      'guestbook',
                      note.id,
                      note.status === 'hidden' ? 'restore' : 'hide',
                    );
                  });
                }}
              >
                {note.status === 'hidden' ? '恢复' : '隐藏'}
              </Button>
              <Button
                type="button"
                $theme={theme}
                $tone="danger"
                disabled={Boolean(operationKey)}
                onClick={() => {
                  void runOperation(`guestbook-delete-${note.id}`, async () => {
                    await deleteAdminResource<AdminGuestbookNote>(
                      sessionPassword,
                      'guestbook',
                      note.id,
                    );
                  });
                }}
              >
                删除
              </Button>
            </Actions>
          </Item>
        ))
      )}
    </Stack>
  );

  const renderTimelinePosts = () => (
    <Stack>
      <Composer
        $theme={theme}
        onSubmit={(event) => void submitTimelinePost(event)}
      >
        <SectionTitle $theme={theme}>发布动态</SectionTitle>
        <Textarea
          $theme={theme}
          aria-label="动态正文"
          maxLength={2000}
          placeholder="写一条新的主页动态"
          value={timelineBody}
          onChange={(event) => {
            setTimelineBody(event.target.value);
          }}
        />
        <UploadInput
          $theme={theme}
          accept="image/*,video/*"
          type="file"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setTimelineFile(event.target.files?.[0] ?? null);
          }}
        />
        <Actions>
          <Button
            type="submit"
            $theme={theme}
            $tone="primary"
            disabled={
              operationKey === 'timeline-create' ||
              (!timelineBody.trim() && !timelineFile)
            }
          >
            {operationKey === 'timeline-create' ? '发布中' : '发布'}
          </Button>
          {timelineFile ? (
            <Button
              type="button"
              $theme={theme}
              onClick={() => {
                setTimelineFile(null);
              }}
            >
              移除媒体
            </Button>
          ) : null}
        </Actions>
      </Composer>

      {timelinePosts.length === 0 ? (
        <Empty $theme={theme}>当前没有动态。</Empty>
      ) : (
        timelinePosts.map((post) => (
          <Item key={post.id} $theme={theme}>
            <Meta $theme={theme}>
              <Pill $theme={theme} $kind={statusKind(post.status)}>
                {statusLabel(post.status)}
              </Pill>
              {post.is_featured ? (
                <Pill $theme={theme} $kind="featured">
                  精选
                </Pill>
              ) : null}
              <span>{formatTime(post.created_at)}</span>
              {post.media_type ? <span>{post.media_type}</span> : null}
            </Meta>
            <Body $theme={theme}>{post.body || '仅媒体动态'}</Body>
            {post.media_url ? (
              <HelperText $theme={theme}>媒体：{post.media_url}</HelperText>
            ) : null}
            <Actions>
              <Button
                type="button"
                $theme={theme}
                disabled={Boolean(operationKey)}
                onClick={() => {
                  void runOperation(`post-feature-${post.id}`, async () => {
                    await setTimelinePostFeatured(
                      sessionPassword,
                      post.id,
                      !post.is_featured,
                    );
                  });
                }}
              >
                {post.is_featured ? '取消精选' : '设为精选'}
              </Button>
              <Button
                type="button"
                $theme={theme}
                disabled={Boolean(operationKey)}
                onClick={() => {
                  void runOperation(`post-hide-${post.id}`, async () => {
                    await setResourceVisibility<AdminTimelinePost>(
                      sessionPassword,
                      'timeline-posts',
                      post.id,
                      post.status === 'hidden' ? 'restore' : 'hide',
                    );
                  });
                }}
              >
                {post.status === 'hidden' ? '恢复' : '隐藏'}
              </Button>
              <Button
                type="button"
                $theme={theme}
                $tone="danger"
                disabled={Boolean(operationKey)}
                onClick={() => {
                  void runOperation(`post-delete-${post.id}`, async () => {
                    await deleteAdminResource<AdminTimelinePost>(
                      sessionPassword,
                      'timeline-posts',
                      post.id,
                    );
                  });
                }}
              >
                删除
              </Button>
            </Actions>
          </Item>
        ))
      )}
    </Stack>
  );

  const renderTimelineComments = () => (
    <CommentList
      emptyLabel="当前没有动态评论。"
      items={timelineComments}
      resource="timeline-comments"
      renderMeta={(comment) => (
        <>
          <span>{comment.author_name}</span>
          <span>动态 {comment.post_id.slice(0, 8)}</span>
        </>
      )}
    />
  );

  const renderBlogComments = () => (
    <CommentList
      emptyLabel="当前没有博客评论。"
      items={blogComments}
      resource="blog-comments"
      renderMeta={(comment) => <span>文章 {comment.post_id}</span>}
    />
  );

  function CommentList<T extends AdminBlogComment | AdminTimelineComment>({
    emptyLabel,
    items,
    renderMeta,
    resource,
  }: {
    emptyLabel: string;
    items: T[];
    renderMeta: (item: T) => ReactNode;
    resource: Exclude<
      AdminResource,
      'guestbook' | 'questions' | 'timeline-posts'
    >;
  }) {
    return (
      <Stack>
        {items.length === 0 ? (
          <Empty $theme={theme}>{emptyLabel}</Empty>
        ) : (
          items.map((comment) => (
            <Item key={comment.id} $theme={theme}>
              <Meta $theme={theme}>
                <Pill $theme={theme} $kind={statusKind(comment.status)}>
                  {statusLabel(comment.status)}
                </Pill>
                <span>{formatTime(comment.created_at)}</span>
                {renderMeta(comment)}
              </Meta>
              <Body $theme={theme}>{comment.body}</Body>
              <Actions>
                <Button
                  type="button"
                  $theme={theme}
                  disabled={Boolean(operationKey)}
                  onClick={() => {
                    void runOperation(
                      `${resource}-hide-${comment.id}`,
                      async () => {
                        await setResourceVisibility<T>(
                          sessionPassword,
                          resource,
                          comment.id,
                          comment.status === 'hidden' ? 'restore' : 'hide',
                        );
                      },
                    );
                  }}
                >
                  {comment.status === 'hidden' ? '恢复' : '隐藏'}
                </Button>
                <Button
                  type="button"
                  $theme={theme}
                  $tone="danger"
                  disabled={Boolean(operationKey)}
                  onClick={() => {
                    void runOperation(
                      `${resource}-delete-${comment.id}`,
                      async () => {
                        await deleteAdminResource<T>(
                          sessionPassword,
                          resource,
                          comment.id,
                        );
                      },
                    );
                  }}
                >
                  删除
                </Button>
              </Actions>
            </Item>
          ))
        )}
      </Stack>
    );
  }

  const renderSites = () => (
    <Stack>
      <Composer $theme={theme} onSubmit={(event) => void createSite(event)}>
        <SectionTitle $theme={theme}>新增主页</SectionTitle>
        <FormRow>
          <Input
            $theme={theme}
            aria-label="主页标识"
            maxLength={80}
            placeholder="slug，比如 notes"
            value={siteForm.slug}
            onChange={(event) => {
              setSiteForm((current) => ({
                ...current,
                slug: event.target.value,
              }));
            }}
          />
          <Input
            $theme={theme}
            aria-label="主页名称"
            maxLength={120}
            placeholder="主页名称"
            value={siteForm.title}
            onChange={(event) => {
              setSiteForm((current) => ({
                ...current,
                title: event.target.value,
              }));
            }}
          />
        </FormRow>
        <Input
          $theme={theme}
          aria-label="主页描述"
          maxLength={500}
          placeholder="描述"
          value={siteForm.description}
          onChange={(event) => {
            setSiteForm((current) => ({
              ...current,
              description: event.target.value,
            }));
          }}
        />
        <Actions>
          <Button
            type="submit"
            $theme={theme}
            $tone="primary"
            disabled={
              operationKey === 'site-create' ||
              !siteForm.slug.trim() ||
              !siteForm.title.trim()
            }
          >
            {operationKey === 'site-create' ? '创建中' : '创建主页'}
          </Button>
        </Actions>
      </Composer>

      {(overview?.sites ?? []).map((site) => (
        <Item key={site.id} $theme={theme}>
          <Meta $theme={theme}>
            <Pill $theme={theme} $kind={site.is_active ? 'live' : 'hidden'}>
              {site.is_active ? '启用' : '停用'}
            </Pill>
            {site.is_default ? <span>默认主页</span> : null}
            <span>{site.slug}</span>
          </Meta>
          <Body $theme={theme}>{site.title}</Body>
          {site.description ? (
            <HelperText $theme={theme}>{site.description}</HelperText>
          ) : null}
          <Actions>
            <Button
              type="button"
              $theme={theme}
              disabled={Boolean(operationKey) || site.is_default}
              onClick={() => {
                void runOperation(`site-toggle-${site.id}`, async () => {
                  await updateAdminSite(sessionPassword, site.id, {
                    is_active: !site.is_active,
                  });
                });
              }}
            >
              {site.is_active ? '停用' : '启用'}
            </Button>
          </Actions>
        </Item>
      ))}
    </Stack>
  );

  const renderActiveTab = () => {
    if (activeTab === 'questions') return renderQuestions();
    if (activeTab === 'guestbook') return renderGuestbook();
    if (activeTab === 'timeline-posts') return renderTimelinePosts();
    if (activeTab === 'timeline-comments') return renderTimelineComments();
    if (activeTab === 'blog-comments') return renderBlogComments();

    return renderSites();
  };

  return (
    <Page data-page-root data-v2="admin-screen" aria-label="管理后台">
      <Header>
        <HeaderText>
          <Eyebrow $theme={theme}>Admin</Eyebrow>
          <Title $theme={theme}>主页管理台</Title>
          <Copy $theme={theme}>
            管理多个主页的动态、提问、留言和评论。访客入口只展示公开内容，删除和隐藏会从前台移除。
          </Copy>
        </HeaderText>
        <HeaderActions>
          <LinkButton $theme={theme} href="/">
            主页
          </LinkButton>
        </HeaderActions>
      </Header>

      {!sessionPassword ? (
        <Gate $theme={theme} data-v2="admin-gate" onSubmit={login}>
          <HelperText $theme={theme}>
            输入 Worker 后台密码后，本标签页会保持管理会话。
          </HelperText>
          <Input
            $theme={theme}
            aria-label="管理密码"
            autoFocus
            type="password"
            value={passwordInput}
            onChange={(event) => {
              setPasswordInput(event.target.value);
              setError(null);
            }}
          />
          {error ? (
            <HelperText $theme={theme} $danger>
              {error}
            </HelperText>
          ) : null}
          <Button
            type="submit"
            $theme={theme}
            $tone="primary"
            disabled={!passwordInput.trim()}
          >
            进入后台
          </Button>
        </Gate>
      ) : (
        <>
          <Toolbar $theme={theme}>
            <ToolbarGroup>
              <Select
                $theme={theme}
                aria-label="选择主页"
                value={selectedSiteId}
                onChange={(event) => {
                  setSelectedSiteId(event.target.value);
                }}
              >
                <option value="all">全部主页</option>
                {(overview?.sites ?? []).map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.title}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                $theme={theme}
                disabled={loading}
                onClick={() => {
                  void loadCurrent();
                }}
              >
                {loading ? '刷新中' : '刷新'}
              </Button>
            </ToolbarGroup>
            <ToolbarGroup>
              <HelperText $theme={theme}>
                {defaultSite ? `默认：${defaultSite.title}` : '正在读取主页'}
              </HelperText>
              <Button type="button" $theme={theme} onClick={logout}>
                退出
              </Button>
            </ToolbarGroup>
          </Toolbar>

          <MetricGrid aria-label="后台概览">
            <Metric $theme={theme}>
              <MetricValue $theme={theme}>
                {overview?.counts.pendingQuestions ?? 0}
              </MetricValue>
              <MetricLabel $theme={theme}>待回答提问</MetricLabel>
            </Metric>
            <Metric $theme={theme}>
              <MetricValue $theme={theme}>
                {overview?.counts.guestbook ?? 0}
              </MetricValue>
              <MetricLabel $theme={theme}>留言</MetricLabel>
            </Metric>
            <Metric $theme={theme}>
              <MetricValue $theme={theme}>
                {overview?.counts.timelinePosts ?? 0}
              </MetricValue>
              <MetricLabel $theme={theme}>动态</MetricLabel>
            </Metric>
            <Metric $theme={theme}>
              <MetricValue $theme={theme}>
                {overview?.counts.timelineComments ?? 0}
              </MetricValue>
              <MetricLabel $theme={theme}>动态评论</MetricLabel>
            </Metric>
            <Metric $theme={theme}>
              <MetricValue $theme={theme}>
                {overview?.counts.blogComments ?? 0}
              </MetricValue>
              <MetricLabel $theme={theme}>博客评论</MetricLabel>
            </Metric>
          </MetricGrid>

          {error ? (
            <HelperText $theme={theme} $danger>
              {error}
            </HelperText>
          ) : null}

          <Workbench>
            <TabList $theme={theme} aria-label="后台模块">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  type="button"
                  $theme={theme}
                  $active={activeTab === tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.metric ? (
                    <TabCount $theme={theme}>
                      {overview?.counts[tab.metric] ?? 0}
                    </TabCount>
                  ) : null}
                </TabButton>
              ))}
            </TabList>

            <Content>
              <SectionHeader>
                <div>
                  <SectionTitle $theme={theme}>
                    {tabs.find((tab) => tab.id === activeTab)?.label}
                  </SectionTitle>
                  <HelperText $theme={theme}>
                    {selectedSiteId === 'all'
                      ? '正在查看全部主页'
                      : (overview?.sites.find(
                          (site) => site.id === selectedSiteId,
                        )?.title ?? '当前主页')}
                  </HelperText>
                </div>
                {loading ? (
                  <HelperText $theme={theme}>正在加载数据</HelperText>
                ) : null}
              </SectionHeader>
              {renderActiveTab()}
            </Content>
          </Workbench>
        </>
      )}
    </Page>
  );
};

import { FormEvent, useCallback, useContext, useEffect, useState } from 'react';

import styled, { css } from 'styled-components';

import { AppContext } from 'App/AppContext';
import { getSupabase } from 'lib/supabaseClient';
import { Theme } from 'types';

const ASK_TABLE = 'portfolio_anonymous_questions';

interface AnonymousQuestionRow {
  id: string;
  question: string;
  answer: null | string;
  created_at: string;
  answered_at: null | string;
}

const formatAskTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const isAnswered = (row: AnonymousQuestionRow) => Boolean(row.answer?.trim());

type RoomKind = 'ask' | 'blog' | 'fun' | 'profile';

const feedPosts = [
  {
    id: 'pinned',
    kind: 'Pinned Thought',
    title: '这个站点更像我的互联网房间',
    body: '不是简历，也不是 dashboard。它应该能放照片、碎碎念、技术笔记、音乐、陌生人的留言，以及一些暂时解释不清但很喜欢的小东西。',
    mood: 'soft chaos',
    time: '置顶',
  },
  {
    id: 'photo-note',
    kind: 'Daily Feed',
    title: '今天想把界面做得更像手帐',
    body: '圆角可以更软，卡片可以更像纸张，信息可以不那么整齐。个人网站不需要一直证明自己专业，它也可以表达一个人的口味。',
    mood: 'warm',
    time: '20:18',
  },
  {
    id: 'tiny-code',
    kind: 'Code Diary',
    title: '小型系统也需要情绪',
    body: '导航、留言、喜欢、画廊这些模块如果只是功能，会很快变冷。加入状态、语气和社交信号后，它们才像一个正在生长的空间。',
    mood: 'thinking',
    time: '昨天',
  },
];

interface FunItem {
  id: string;
  title: string;
  href: string;
  description: string;
  tag: string;
  coverImage: string;
}

const FUN_COVER_ASPECT = 1024 / 629;

const funCoverUrl = `${process.env.PUBLIC_URL ?? ''}/fun/black-and-white-cover.png`;

const funItems: FunItem[] = [
  {
    id: 'nus-unity-coop',
    title: 'Black And White双人小游戏',
    href: 'https://play.unity.com/en/games/5d7116f5-5be9-46e6-ab80-e2842f0c97d9/5paw5bu65pah5lu25as5',
    description:
      '2024年夏天，在NUS暑校，四个人使用Unity做的双人合作&竞争小游戏，记得使用电脑打开',
    tag: 'Unity · 2024',
    coverImage: funCoverUrl,
  },
];

const Page = styled.main`
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 58rem;
  margin: 0 auto;
  box-sizing: border-box;
  text-align: left;

  @media (width >= 769px) {
    padding: 1.35rem clamp(1.2rem, 4vw, 2.2rem) 3rem;
  }
`;

const RoomHeader = styled.header<{ $kind: RoomKind; $theme: Theme }>`
  position: relative;
  overflow: hidden;
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

const Title = styled.h1<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: clamp(1.35rem, 4vw, 2rem);
  font-weight: 820;
  line-height: 1.08;
  letter-spacing: 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(16rem, 0.55fr);
  gap: 0.9rem;
  margin-top: 1rem;

  @media (width <= 860px) {
    grid-template-columns: 1fr;
  }
`;

const Stack = styled.div`
  display: grid;
  gap: 1rem;
`;

const cardSurface = css<{ $theme: Theme }>`
  position: relative;
  overflow: hidden;
  padding: 1.1rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 16px;
  background: ${({ $theme }) => $theme.cardBackground};
  box-shadow: ${({ $theme }) => $theme.glassShadow};
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ $theme }) => $theme.glassShadowHover};
  }
`;

const Card = styled.article<{ $theme: Theme }>`
  ${cardSurface}
`;

const FunList = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  width: 100%;
  margin-top: 1rem;
`;

const FunHeroCard = styled.a<{ $cover: string; $theme: Theme }>`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  aspect-ratio: ${FUN_COVER_ASPECT};
  overflow: hidden;
  padding: clamp(1.25rem, 4vw, 2rem);
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 16px;
  background:
    linear-gradient(
      180deg,
      rgba(8, 8, 8, 0.08) 0%,
      rgba(8, 8, 8, 0.42) 48%,
      rgba(8, 8, 8, 0.82) 100%
    ),
    url(${({ $cover }) => $cover}) center / cover no-repeat;
  box-shadow: ${({ $theme }) => $theme.glassShadow};
  text-decoration: none;
  color: #f7f7f7;
  cursor: pointer;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ $theme }) => $theme.glassShadowHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ $theme }) => $theme.accentColor};
    outline-offset: 3px;
  }
`;

const FunHeroMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.65rem;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.74rem;
`;

const FunHeroPill = styled.span`
  display: inline-flex;
  padding: 0.3rem 0.62rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  font-weight: 700;
  backdrop-filter: blur(8px);
`;

const FunHeroTitle = styled.h2`
  margin: 0;
  max-width: 28rem;
  color: #fff;
  font-size: clamp(1.55rem, 4.5vw, 2.35rem);
  font-weight: 780;
  line-height: 1.08;
  letter-spacing: -0.04em;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.45);
`;

const FunHeroBody = styled.p`
  max-width: 36rem;
  margin: 0.65rem 0 0;
  color: rgba(255, 255, 255, 0.88);
  font-size: clamp(0.88rem, 2.2vw, 1rem);
  line-height: 1.65;
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.4);
`;

const PostMeta = styled.div<{ $theme: Theme }>`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
  margin-bottom: 0.75rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.72rem;
`;

const Pill = styled.span<{ $theme: Theme }>`
  display: inline-flex;
  padding: 0.28rem 0.58rem;
  border-radius: 999px;
  background: ${({ $theme }) => $theme.spotlightColor};
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-weight: 700;
`;

const CardTitle = styled.h2<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: clamp(1.05rem, 3vw, 1.35rem);
  line-height: 1.18;
  letter-spacing: 0;
`;

const Body = styled.p<{ $theme: Theme }>`
  margin: 0.7rem 0 0;
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font-size: 0.92rem;
  line-height: 1.7;
`;

const ReactionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.9rem;
`;

const Reaction = styled.button<{ $theme: Theme }>`
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 999px;
  background: ${({ $theme }) => $theme.glassBackground};
  color: ${({ $theme }) => $theme.secondaryTextColor};
  cursor: pointer;
  font: inherit;
  font-size: 0.78rem;
  padding: 0.42rem 0.66rem;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;

  &:hover {
    background: ${({ $theme }) => $theme.primaryTextColor};
    color: ${({ $theme }) => $theme.cardBackground};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ProfilePanel = styled(Card)`
  min-height: 14rem;
`;

const TagCloud = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ContactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 1rem;

  @media (width <= 520px) {
    grid-template-columns: 1fr;
  }
`;

const ContactLink = styled.a<{ $theme: Theme }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 3.35rem;
  padding: 0.72rem 0.78rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 12px;
  background: ${({ $theme }) => $theme.glassBackground};
  color: ${({ $theme }) => $theme.primaryTextColor};
  text-decoration: none;
  transition:
    background 0.16s ease,
    border-color 0.16s ease,
    transform 0.16s ease;

  &:hover {
    border-color: ${({ $theme }) => $theme.cardHoverBorder};
    background: ${({ $theme }) => $theme.glassBackgroundHover};
    transform: translateY(-2px);
  }

  svg {
    width: 1.35rem;
    height: 1.35rem;
    flex: 0 0 auto;
  }

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.9rem;
    font-weight: 740;
  }
`;

const Form = styled.form`
  display: grid;
  gap: 0.7rem;
  margin-top: 1rem;
`;

const TextArea = styled.textarea<{ $theme: Theme }>`
  min-height: 9rem;
  resize: vertical;
  padding: 1rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 14px;
  background: ${({ $theme }) => $theme.iconGlassBackground};
  color: ${({ $theme }) => $theme.primaryTextColor};
  font: inherit;
  line-height: 1.6;

  &::placeholder {
    color: ${({ $theme }) => $theme.tertiaryTextColor};
  }
`;

const Submit = styled.button<{ $theme: Theme }>`
  justify-self: start;
  padding: 0.8rem 1.1rem;
  border: 1px solid ${({ $theme }) => $theme.primaryTextColor};
  border-radius: 999px;
  background: ${({ $theme }) => $theme.primaryTextColor};
  color: ${({ $theme }) => $theme.cardBackground};
  cursor: pointer;
  font: inherit;
  font-weight: 740;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.p`
  margin: 0.75rem 0 0;
  font-size: 0.8rem;
  color: #f87171;
`;

const Muted = styled.p<{ $theme: Theme }>`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
`;

const AnswerBlock = styled.div<{ $answered?: boolean; $theme: Theme }>`
  margin-top: 1rem;
  padding: 0.85rem 0.95rem;
  border-radius: 14px;
  border: 1px solid
    ${({ $answered, $theme }) =>
      $answered ? $theme.cardBorder : $theme.spotlightColor};
  background: ${({ $answered, $theme }) =>
    $answered ? $theme.glassBackground : $theme.spotlightColor};
`;

const AnswerLabel = styled.span<{ $answered?: boolean; $theme: Theme }>`
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: ${({ $answered, $theme }) =>
    $answered ? $theme.accentColor : $theme.tertiaryTextColor};
`;

const AnswerBody = styled.p<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font-size: 0.9rem;
  line-height: 1.65;
`;

export const MoodBadge = ({ children }: { children: string }) => {
  const { theme } = useContext(AppContext);

  return <Pill $theme={theme}>{children}</Pill>;
};

export const ReactionButtons = () => {
  const { theme } = useContext(AppContext);

  return (
    <ReactionRow aria-label="情绪反馈">
      {['喜欢这个', '有共鸣', '想多看', '很像你'].map((label) => (
        <Reaction key={label} type="button" $theme={theme}>
          {label}
        </Reaction>
      ))}
    </ReactionRow>
  );
};

export const PostCard = ({
  body,
  kind,
  mood,
  time,
  title,
}: {
  body: string;
  kind: string;
  mood: string;
  time: string;
  title: string;
}) => {
  const { theme } = useContext(AppContext);

  return (
    <Card $theme={theme} data-v2="post-card">
      <PostMeta $theme={theme}>
        <MoodBadge>{kind}</MoodBadge>
        <span>{time}</span>
        <span>{mood}</span>
      </PostMeta>
      <CardTitle $theme={theme}>{title}</CardTitle>
      <Body $theme={theme}>{body}</Body>
      <ReactionButtons />
    </Card>
  );
};

const AskQuestionCard = ({ row }: { row: AnonymousQuestionRow }) => {
  const { theme } = useContext(AppContext);
  const answered = isAnswered(row);

  return (
    <Card $theme={theme} data-v2={`ask-card-${row.id}`}>
      <PostMeta $theme={theme}>
        <MoodBadge>提问</MoodBadge>
        <span>提问 · {formatAskTime(row.created_at)}</span>
      </PostMeta>
      <CardTitle $theme={theme}>{row.question}</CardTitle>
      <AnswerBlock $answered={answered} $theme={theme}>
        <AnswerLabel $answered={answered} $theme={theme}>
          {answered ? '已回答' : '还没有做出回答'}
        </AnswerLabel>
        {answered ? (
          <>
            <AnswerBody $theme={theme}>{row.answer?.trim()}</AnswerBody>
            {row.answered_at ? (
              <PostMeta
                $theme={theme}
                style={{ marginTop: '0.55rem', marginBottom: 0 }}
              >
                <span>回答 · {formatAskTime(row.answered_at)}</span>
              </PostMeta>
            ) : null}
          </>
        ) : (
          <AnswerBody $theme={theme}>
            问题已收到，等我回复后会显示在这里。
          </AnswerBody>
        )}
      </AnswerBlock>
    </Card>
  );
};

export const AnonymousInputBox = ({
  onSubmitted,
}: {
  onSubmitted?: () => void;
}) => {
  const { theme } = useContext(AppContext);
  const client = getSupabase();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!client || !message.trim()) return;

    setLoading(true);
    setError(null);

    const { error: insertError } = await client.from(ASK_TABLE).insert({
      question: message.trim(),
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      setSent(false);

      return;
    }

    setSent(true);
    setMessage('');
    onSubmitted?.();
  };

  if (!client) {
    return (
      <Card $theme={theme} data-v2="anonymous-input-box">
        <CardTitle $theme={theme}>提问</CardTitle>
        <Muted $theme={theme}>
          未连接 Supabase：请在 .env.local 配置
          REACT_APP_SUPABASE_*，并在数据库执行 portfolio_anonymous_questions
          迁移。
        </Muted>
      </Card>
    );
  }

  return (
    <Card $theme={theme} data-v2="anonymous-input-box">
      <CardTitle $theme={theme}>提问</CardTitle>
      <Body $theme={theme}>
        写一个问题、一个推荐、一个秘密，或者一句没有上下文的话。
      </Body>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Form onSubmit={(event) => void onSubmit(event)}>
        <TextArea
          $theme={theme}
          aria-label="提问"
          maxLength={1000}
          placeholder="比如：最近在听什么？"
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setSent(false);
          }}
        />
        <Submit
          type="submit"
          $theme={theme}
          disabled={loading || !message.trim()}
        >
          {loading ? '发送中…' : sent ? '已提交' : '发送提问'}
        </Submit>
      </Form>
    </Card>
  );
};

export const ProfileRoom = () => {
  const { config, theme } = useContext(AppContext);
  const hobbies = ['摄影', '画画', '游泳', '骑行', '散步', 'Vibe Coding'];

  return (
    <Page data-page-root data-v2="profile-room">
      <RoomHeader $kind="profile" $theme={theme}>
        <Eyebrow $theme={theme}>Profile / Identity</Eyebrow>
        <Title $theme={theme}>Amateur In Everything</Title>
      </RoomHeader>
      <Grid>
        <ProfilePanel $theme={theme}>
          <PostMeta $theme={theme}>{config.name.display}</PostMeta>
          <CardTitle $theme={theme}>个人身份</CardTitle>
        </ProfilePanel>
        <Stack>
          <Card $theme={theme}>
            <PostMeta $theme={theme}>联系</PostMeta>
            <ContactGrid>
              {config.dockItems.map(
                ({ ariaLabel, display, href, icon, name }) => (
                  <ContactLink
                    key={name}
                    data-v2={`profile-${name}`}
                    $theme={theme}
                    href={href}
                    aria-label={`${display}，${ariaLabel}`}
                    rel="noopener noreferrer"
                    target={
                      href.startsWith('mailto:') || href === '#'
                        ? undefined
                        : '_blank'
                    }
                  >
                    {icon}
                    <span>{display}</span>
                  </ContactLink>
                ),
              )}
            </ContactGrid>
          </Card>
          <Card $theme={theme}>
            <PostMeta $theme={theme}>业余爱好</PostMeta>
            <TagCloud>
              {hobbies.map((tag) => (
                <MoodBadge key={tag}>{tag}</MoodBadge>
              ))}
            </TagCloud>
          </Card>
        </Stack>
      </Grid>
    </Page>
  );
};

export const AskRoom = () => {
  const { theme } = useContext(AppContext);
  const client = getSupabase();
  const [rows, setRows] = useState<AnonymousQuestionRow[]>([]);
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
      .from(ASK_TABLE)
      .select('id, question, answer, created_at, answered_at')
      .order('created_at', { ascending: false })
      .limit(80);

    setLoading(false);

    if (fetchError) {
      setError(fetchError.message);

      return;
    }

    setRows((data ?? []) as AnonymousQuestionRow[]);
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Page data-page-root data-v2="ask-room">
      <RoomHeader $kind="ask" $theme={theme}>
        <Eyebrow $theme={theme}>Ask Me Anything</Eyebrow>
        <Title $theme={theme}>提问</Title>
      </RoomHeader>
      <Grid>
        <AnonymousInputBox
          onSubmitted={() => {
            void load();
          }}
        />
        <Stack aria-label="提问列表">
          {error ? <ErrorText>{error}</ErrorText> : null}
          {loading ? (
            <Muted $theme={theme}>正在加载提问…</Muted>
          ) : rows.length === 0 ? (
            <Muted $theme={theme}>还没有提问，来做第一个吧。</Muted>
          ) : (
            rows.map((row) => <AskQuestionCard key={row.id} row={row} />)
          )}
        </Stack>
      </Grid>
    </Page>
  );
};

export const FunRoom = () => {
  const { theme } = useContext(AppContext);

  return (
    <Page data-page-root data-v2="fun-room">
      <RoomHeader $kind="fun" $theme={theme}>
        <Eyebrow $theme={theme}>Fun / Experiments</Eyebrow>
        <Title $theme={theme}>玩具</Title>
      </RoomHeader>
      <FunList>
        {funItems.map((item) => (
          <FunHeroCard
            key={item.id}
            $cover={item.coverImage}
            $theme={theme}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${item.title}，在新标签页打开`}
          >
            <FunHeroMeta>
              <FunHeroPill>{item.tag}</FunHeroPill>
              <span>点击打开 ↗</span>
            </FunHeroMeta>
            <FunHeroTitle>{item.title}</FunHeroTitle>
            <FunHeroBody>{item.description}</FunHeroBody>
          </FunHeroCard>
        ))}
      </FunList>
    </Page>
  );
};

export const feedRoomPosts = feedPosts;

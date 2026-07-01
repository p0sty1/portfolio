import { FormEvent, useCallback, useContext, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import remarkGfm from 'remark-gfm';
import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { type BlogPost, blogPosts, getBlogPost } from 'data/blogPosts';
import { resolveBlogMediaUrl } from 'lib/blogMedia';
import { getSupabase } from 'lib/supabaseClient';
import { Theme } from 'types';

interface BlogCommentRow {
  id: string;
  body: string;
  created_at: string;
}

const Page = styled.main`
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 76rem;
  margin: 0 auto;
  box-sizing: border-box;
  text-align: left;

  @media (width >= 769px) {
    padding: clamp(1.5rem, 3vw, 2.4rem) clamp(1.5rem, 4vw, 3rem) 4rem;
  }
`;

const RoomHeader = styled.header<{ $theme: Theme }>`
  position: relative;
  overflow: hidden;
  padding: clamp(1.35rem, 4vw, 2.8rem);
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.cardBackground};
  box-shadow: ${({ $theme }) => $theme.glassShadow};

  &::after {
    content: '';
    position: absolute;
    inset: auto clamp(1.35rem, 4vw, 2.8rem) clamp(1.35rem, 4vw, 2.8rem) auto;
    width: min(18rem, 34vw);
    height: 0.18rem;
    border-radius: 999px;
    background: rgba(248, 250, 252, 0.52);
  }
`;

const Eyebrow = styled.span<{ $theme: Theme }>`
  display: inline-flex;
  margin-bottom: 0.75rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.78rem;
  font-weight: 760;
  letter-spacing: 0;
  text-transform: uppercase;
`;

const Title = styled.h1<{ $theme: Theme }>`
  max-width: 12ch;
  margin: 0;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: clamp(2.7rem, 9vw, 6rem);
  font-weight: 820;
  line-height: 0.98;
  letter-spacing: 0;
`;

const ThemeBand = styled.div<{ $theme: Theme }>`
  display: inline-flex;
  margin-top: clamp(1.2rem, 3vw, 2rem);
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font-size: 0.92rem;
  font-weight: 760;
`;

const Stack = styled.div`
  display: grid;
  gap: 0;
  margin-top: 1.25rem;
`;

const PostLink = styled.button<{ $theme: Theme }>`
  width: 100%;
  min-height: 0;
  display: grid;
  align-content: space-between;
  gap: 1.1rem;
  padding: clamp(1.2rem, 3vw, 1.8rem) 0;
  border: 0;
  border-bottom: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    transform: translateX(0.18rem);
    border-color: ${({ $theme }) => $theme.cardHoverBorder};
    box-shadow: none;
  }

  &:active {
    transform: translateX(0.08rem);
  }
`;

const PostMeta = styled.div<{ $theme: Theme }>`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.8rem;
  font-weight: 720;
`;

const PostTitle = styled.h2<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: clamp(1.9rem, 5vw, 3.6rem);
  line-height: 1.03;
  letter-spacing: 0;
`;

const Excerpt = styled.p<{ $theme: Theme }>`
  max-width: 48rem;
  margin: 1rem 0 0;
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font-size: clamp(1rem, 2vw, 1.18rem);
  line-height: 1.7;
`;

const ThemeLine = styled.p<{ $theme: Theme }>`
  margin: 0 0 0.8rem;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: 0.92rem;
  font-weight: 780;
`;

const ReadMore = styled.span<{ $theme: Theme }>`
  justify-self: start;
  display: inline-flex;
  align-items: center;
  padding: 0;
  border-radius: 999px;
  background: transparent;
  color: ${({ $theme }) => $theme.accentColor};
  font-size: 0.9rem;
  font-weight: 780;
`;

const BackButton = styled.button<{ $theme: Theme }>`
  margin-bottom: 1.15rem;
  padding: 0.72rem 1rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 999px;
  background: ${({ $theme }) => $theme.cardBackground};
  color: ${({ $theme }) => $theme.secondaryTextColor};
  cursor: pointer;
  font: inherit;
  font-size: 0.92rem;
  font-weight: 720;
`;

const Article = styled.article<{ $theme: Theme }>`
  padding: clamp(1.3rem, 4vw, 3rem);
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.cardBackground};
  box-shadow: ${({ $theme }) => $theme.glassShadow};
`;

const ArticleHeader = styled.header<{ $theme: Theme }>`
  padding-bottom: clamp(1.25rem, 3vw, 2rem);
  border-bottom: 1px solid ${({ $theme }) => $theme.gridColor};
`;

const ArticleTitle = styled.h1<{ $theme: Theme }>`
  max-width: 13ch;
  margin: 0.9rem 0 0;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: clamp(2.35rem, 8vw, 5.25rem);
  font-weight: 840;
  line-height: 0.98;
  letter-spacing: 0;
`;

const MarkdownBody = styled.div<{ $theme: Theme }>`
  max-width: 58rem;
  margin-top: clamp(1.4rem, 4vw, 2.4rem);
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font-size: clamp(1.02rem, 1.5vw, 1.14rem);
  line-height: 1.92;

  h2 {
    margin: 2.6rem 0 0.9rem;
    color: ${({ $theme }) => $theme.primaryTextColor};
    font-size: clamp(1.55rem, 3vw, 2.1rem);
    font-weight: 820;
    line-height: 1.2;
    letter-spacing: 0;
  }

  h3 {
    margin: 1.6rem 0 0.65rem;
    color: ${({ $theme }) => $theme.primaryTextColor};
    font-size: clamp(1.2rem, 2vw, 1.45rem);
    font-weight: 780;
  }

  p {
    margin: 0 0 1.2rem;
  }

  ul {
    margin: 0 0 1.25rem;
    padding-left: 1.35rem;
  }

  ol {
    margin: 0 0 1.25rem;
    padding-left: 1.35rem;
  }

  li {
    margin-bottom: 0.55rem;
  }

  a {
    color: ${({ $theme }) => $theme.accentColor};
    text-decoration: underline;
  }

  img {
    width: 100%;
    max-width: 100%;
    border-radius: 8px;
    border: 1px solid ${({ $theme }) => $theme.cardBorder};
    display: block;
    margin: 0 0 clamp(1.25rem, 3vw, 2rem);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 1rem;
    overflow: hidden;
    border-radius: 12px;
  }

  th,
  td {
    border: 1px solid ${({ $theme }) => $theme.cardBorder};
    padding: 0.5rem 0.65rem;
    text-align: left;
  }

  th {
    color: ${({ $theme }) => $theme.primaryTextColor};
    background: ${({ $theme }) => $theme.iconGlassBackground};
  }

  code {
    padding: 0.12rem 0.35rem;
    border-radius: 6px;
    background: ${({ $theme }) => $theme.spotlightColor};
    color: ${({ $theme }) => $theme.accentColor};
    font-size: 0.88em;
  }

  pre {
    margin: 0 0 1.45rem;
    padding: 1.05rem;
    overflow-x: auto;
    border-radius: 8px;
    background: ${({ $theme }) => $theme.iconGlassBackground};
    border: 1px solid ${({ $theme }) => $theme.cardBorder};

    code {
      padding: 0;
      background: transparent;
      color: ${({ $theme }) => $theme.primaryTextColor};
      font-size: 0.85rem;
      line-height: 1.55;
    }
  }

  strong {
    color: ${({ $theme }) => $theme.primaryTextColor};
    font-weight: 700;
  }
`;

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
};

const formatCommentTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const resolveMarkdownCandidates = (path: string): string[] => {
  const candidates = [path];
  const basename = path.split('/').pop();
  if (basename && path.startsWith('/api/gallery/media/blog/markdown/')) {
    candidates.push(`/blog/${basename}`);
  }

  const galleryBase = process.env.REACT_APP_GALLERY_API_URL?.replace(/\/$/, '');
  if (galleryBase && path.startsWith('/api/gallery/')) {
    candidates.push(path.replace('/api/gallery', galleryBase));
  }

  return Array.from(new Set(candidates));
};

const Engagement = styled.section<{ $theme: Theme }>`
  max-width: 58rem;
  margin-top: clamp(2rem, 4vw, 3rem);
  padding-top: clamp(1.5rem, 3vw, 2rem);
  border-top: 1px solid ${({ $theme }) => $theme.gridColor};
`;

const EngagementRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1.4rem;
`;

const LikeButton = styled.button<{ $theme: Theme }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.7rem 1.05rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 999px;
  background: ${({ $theme }) => $theme.spotlightColor};
  color: ${({ $theme }) => $theme.accentColor};
  cursor: pointer;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  transition:
    transform 0.15s ease,
    background 0.15s ease;

  &:hover {
    background: ${({ $theme }) => $theme.primaryTextColor};
    color: ${({ $theme }) => $theme.cardBackground};
  }

  &:active {
    transform: scale(0.96);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CommentHeading = styled.h2<{ $theme: Theme }>`
  margin: 0 0 1rem;
  font-size: 1.25rem;
  font-weight: 800;
  color: ${({ $theme }) => $theme.primaryTextColor};
`;

const CommentForm = styled.form`
  display: flex;
  gap: 0.65rem;
  align-items: stretch;
  margin-bottom: 1rem;

  @media (width <= 520px) {
    flex-direction: column;
  }
`;

const CommentInput = styled.input<{ $theme: Theme }>`
  flex: 1;
  min-width: 0;
  padding: 0.9rem 1rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.065);
  color: ${({ $theme }) => $theme.primaryTextColor};
  font: inherit;
  font-size: 0.95rem;

  &::placeholder {
    color: ${({ $theme }) => $theme.tertiaryTextColor};
  }
`;

const CommentSubmit = styled.button<{ $theme: Theme }>`
  padding: 0.9rem 1.15rem;
  border: 0;
  border-radius: 999px;
  background: ${({ $theme }) => $theme.primaryTextColor};
  color: ${({ $theme }) => $theme.cardBackground};
  cursor: pointer;
  font: inherit;
  font-weight: 700;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const CommentList = styled.ul<{ $theme: Theme }>`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const CommentItem = styled.li<{ $theme: Theme }>`
  padding: 1rem 0;
  border-bottom: 1px solid ${({ $theme }) => $theme.gridColor};
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font-size: 0.98rem;
  line-height: 1.7;

  &:last-child {
    border-bottom: none;
  }
`;

const CommentTime = styled.span<{ $theme: Theme }>`
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.78rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
`;

const Muted = styled.p<{ $theme: Theme }>`
  margin: 0;
  font-size: 0.92rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
`;

const ErrorText = styled.p`
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: #f87171;
`;

const BlogArticlePanel = ({ post }: { post: BlogPost }) => {
  const { theme } = useContext(AppContext);
  const client = getSupabase();
  const [markdownContent, setMarkdownContent] = useState(post.markdown ?? '');
  const [markdownLoading, setMarkdownLoading] = useState(
    Boolean(post.markdownFile),
  );
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState<BlogCommentRow[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [markdownError, setMarkdownError] = useState<null | string>(null);

  const loadEngagement = useCallback(async () => {
    if (!client) {
      setLoading(false);

      return;
    }

    setLoading(true);
    setError(null);

    const [metaResult, commentsResult] = await Promise.all([
      client
        .from('portfolio_blog_posts_meta')
        .select('likes_count')
        .eq('post_id', post.id)
        .maybeSingle(),
      client
        .from('portfolio_blog_comments')
        .select('id, body, created_at')
        .eq('post_id', post.id)
        .order('created_at', { ascending: false })
        .limit(80),
    ]);

    setLoading(false);

    if (metaResult.error) {
      setError(metaResult.error.message);

      return;
    }

    if (commentsResult.error) {
      setError(commentsResult.error.message);

      return;
    }

    const metaData = metaResult.data as null | { likes_count?: unknown };
    setLikes(
      typeof metaData?.likes_count === 'number' ? metaData.likes_count : 0,
    );
    setComments((commentsResult.data ?? []) as BlogCommentRow[]);
  }, [client, post.id]);

  useEffect(() => {
    void loadEngagement();
  }, [loadEngagement]);

  useEffect(() => {
    let cancelled = false;

    if (post.markdown) {
      setMarkdownContent(post.markdown);
      setMarkdownLoading(false);
      setMarkdownError(null);
      return () => {
        cancelled = true;
      };
    }

    if (!post.markdownFile) {
      setMarkdownContent('');
      setMarkdownLoading(false);
      setMarkdownError(null);
      return () => {
        cancelled = true;
      };
    }
    const markdownFile = post.markdownFile;

    setMarkdownLoading(true);
    setMarkdownError(null);

    void (async () => {
      const candidates = resolveMarkdownCandidates(markdownFile);
      let loadedText: null | string = null;

      for (const url of candidates) {
        const response = await fetch(url, {
          headers: { Accept: 'text/markdown, text/plain' },
        });
        if (!response.ok) {
          continue;
        }
        loadedText = await response.text();
        break;
      }

      if (cancelled) return;

      if (loadedText) {
        setMarkdownContent(loadedText);
        setMarkdownError(null);
      } else {
        setMarkdownContent('');
        setMarkdownError('博客内容加载失败，请稍后重试。');
      }
    })()
      .catch(() => {
        if (!cancelled) {
          setMarkdownContent('');
          setMarkdownError('博客内容加载失败，请稍后重试。');
        }
      })
      .finally(() => {
        if (!cancelled) setMarkdownLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [post.markdown, post.markdownFile]);

  const onLike = async () => {
    if (!client || liking) return;

    setLiking(true);
    setError(null);

    const rpcResult = await client.rpc('increment_blog_likes', {
      p_post_id: post.id,
    });

    setLiking(false);

    if (rpcResult.error) {
      setError(rpcResult.error.message);

      return;
    }

    const nextLikes = rpcResult.data as unknown;
    setLikes(typeof nextLikes === 'number' ? nextLikes : likes + 1);
  };

  const onSubmitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!client || !commentBody.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await client
      .from('portfolio_blog_comments')
      .insert({
        post_id: post.id,
        body: commentBody.trim(),
      });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);

      return;
    }

    setCommentBody('');
    await loadEngagement();
  };

  return (
    <Article $theme={theme}>
      <ArticleHeader $theme={theme}>
        <PostMeta $theme={theme}>
          <span>{post.meta}</span>
          <span>{formatDate(post.publishedAt)}</span>
        </PostMeta>
        <ArticleTitle $theme={theme}>{post.title}</ArticleTitle>
        <ThemeBand $theme={theme}>{post.theme}</ThemeBand>
      </ArticleHeader>
      <MarkdownBody $theme={theme}>
        {markdownError ? <ErrorText>{markdownError}</ErrorText> : null}
        {markdownLoading ? (
          <Muted $theme={theme}>加载文章中…</Muted>
        ) : markdownContent ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ alt, src }) => (
                <img
                  alt={alt ?? ''}
                  loading="lazy"
                  src={resolveBlogMediaUrl(
                    typeof src === 'string' ? src : undefined,
                  )}
                />
              ),
            }}
          >
            {markdownContent}
          </ReactMarkdown>
        ) : (
          <Muted $theme={theme}>暂无正文内容。</Muted>
        )}
      </MarkdownBody>

      <Engagement $theme={theme} aria-label="点赞与评论">
        {error ? <ErrorText>{error}</ErrorText> : null}
        <EngagementRow>
          <LikeButton
            type="button"
            $theme={theme}
            disabled={!client || liking || loading}
            aria-label="点赞"
            onClick={() => {
              void onLike();
            }}
          >
            ♥ {loading ? '…' : likes}
          </LikeButton>
          <Muted $theme={theme} as="span">
            {comments.length} 条评论
          </Muted>
        </EngagementRow>

        {!client ? (
          <Muted $theme={theme}>未连接 Supabase，无法点赞或评论。</Muted>
        ) : (
          <>
            <CommentHeading $theme={theme}>评论</CommentHeading>
            <CommentForm onSubmit={(event) => void onSubmitComment(event)}>
              <CommentInput
                $theme={theme}
                aria-label="评论内容"
                maxLength={500}
                placeholder="写一句评论…"
                type="text"
                value={commentBody}
                onChange={(event) => {
                  setCommentBody(event.target.value);
                }}
              />
              <CommentSubmit
                type="submit"
                $theme={theme}
                disabled={submitting || !commentBody.trim()}
              >
                {submitting ? '发送中…' : '发送'}
              </CommentSubmit>
            </CommentForm>
            <CommentList $theme={theme}>
              {loading ? (
                <CommentItem $theme={theme}>
                  <Muted $theme={theme} as="span">
                    加载评论…
                  </Muted>
                </CommentItem>
              ) : comments.length === 0 ? (
                <CommentItem $theme={theme}>
                  <Muted $theme={theme} as="span">
                    还没有评论，来做第一个吧。
                  </Muted>
                </CommentItem>
              ) : (
                comments.map((row) => (
                  <CommentItem key={row.id} $theme={theme}>
                    <CommentTime $theme={theme}>
                      {formatCommentTime(row.created_at)}
                    </CommentTime>
                    {row.body}
                  </CommentItem>
                ))
              )}
            </CommentList>
          </>
        )}
      </Engagement>
    </Article>
  );
};

export const BlogRoom = () => {
  const { theme } = useContext(AppContext);
  const [activePostId, setActivePostId] = useState<null | string>(null);
  const activePost = activePostId ? getBlogPost(activePostId) : undefined;

  if (activePost) {
    return (
      <Page data-page-root data-v2="blog-article">
        <BackButton
          type="button"
          $theme={theme}
          onClick={() => {
            setActivePostId(null);
          }}
        >
          ← 返回博客列表
        </BackButton>
        <BlogArticlePanel post={activePost} />
      </Page>
    );
  }

  return (
    <Page data-page-root data-v2="blog-room">
      <RoomHeader $theme={theme}>
        <Eyebrow $theme={theme}>Blog / Field Notes</Eyebrow>
        <Title $theme={theme}>博客</Title>
        <ThemeBand $theme={theme}>当前文章：如何做一个个人网站</ThemeBand>
      </RoomHeader>
      <Stack aria-label="博客列表">
        {blogPosts.map((post) => (
          <PostLink
            key={post.id}
            type="button"
            data-v2={`blog-card-${post.id}`}
            $theme={theme}
            onClick={() => {
              setActivePostId(post.id);
            }}
          >
            <div>
              <PostMeta $theme={theme}>
                <span>{post.meta}</span>
                <span>{formatDate(post.publishedAt)}</span>
              </PostMeta>
              <ThemeLine $theme={theme}>{post.theme}</ThemeLine>
              <PostTitle $theme={theme}>{post.title}</PostTitle>
              <Excerpt $theme={theme}>{post.excerpt}</Excerpt>
            </div>
            <ReadMore $theme={theme}>阅读文章</ReadMore>
          </PostLink>
        ))}
      </Stack>
    </Page>
  );
};

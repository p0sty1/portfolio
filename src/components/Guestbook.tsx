import { FormEvent, useCallback, useContext, useEffect, useState } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { getSupabase } from 'lib/supabaseClient';
import { Theme } from 'types';

interface GuestbookRow {
  id: string;
  body: string;
  created_at: string;
}

const TABLE = 'portfolio_demo_notes';

const scrollToHome = () => {
  document
    .getElementById('home')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const Page = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 56rem;
  margin: 0 auto;
  text-align: left;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const BackButton = styled.button<{ $theme: Theme }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.9rem;
  border: 1px solid ${({ $theme }) => $theme.glassBorder};
  border-radius: 999px;
  background: ${({ $theme }) => $theme.glassBackground};
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font-size: 0.8rem;
  cursor: pointer;
  box-shadow: ${({ $theme }) => $theme.glassShadow};
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  transition: color 0.2s ease, transform 0.2s ease;

  &:hover {
    color: ${({ $theme }) => $theme.accentColor};
    transform: translateX(-2px);
  }
`;

const Heading = styled.h1<{ $theme: Theme }>`
  margin: 0;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 600;
  color: ${({ $theme }) => $theme.accentColor};
`;

const Subtitle = styled.p<{ $theme: Theme }>`
  margin: 0 0 1.75rem;
  font-size: 0.95rem;
  line-height: 1.6;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
`;

const Panel = styled.div<{ $theme: Theme }>`
  padding: clamp(1.25rem, 3vw, 1.75rem);
  border: 1px solid ${({ $theme }) => $theme.glassBorder};
  border-radius: 20px;
  background: ${({ $theme }) => $theme.glassBackground};
  box-shadow: ${({ $theme }) => $theme.glassShadow};
  backdrop-filter: blur(22px) saturate(165%);
  -webkit-backdrop-filter: blur(22px) saturate(165%);
`;

const Muted = styled.p<{ $theme: Theme }>`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
`;

const ErrorText = styled.p<{ $theme: Theme }>`
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  color: #f87171;
`;

const Form = styled.form`
  display: flex;
  gap: 0.65rem;
  align-items: stretch;
  margin-bottom: 1.25rem;
`;

const Input = styled.input<{ $theme: Theme }>`
  flex: 1;
  min-width: 0;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid ${({ $theme }) => $theme.glassBorder};
  background: ${({ $theme }) => $theme.iconGlassBackground};
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: 0.9rem;
  backdrop-filter: blur(12px);
  &::placeholder {
    color: ${({ $theme }) => $theme.tertiaryTextColor};
    opacity: 0.85;
  }
`;

const SubmitButton = styled.button<{ $theme: Theme }>`
  cursor: pointer;
  padding: 0.75rem 1.15rem;
  border-radius: 12px;
  border: 1px solid ${({ $theme }) => $theme.glassBorder};
  background: ${({ $theme }) => $theme.iconGlassBackground};
  color: ${({ $theme }) => $theme.accentColor};
  font-size: 0.9rem;
  font-weight: 500;
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const List = styled.ul<{ $theme: Theme }>`
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: min(52vh, 28rem);
  overflow-y: auto;
  font-size: 0.9rem;
  line-height: 1.55;
  color: ${({ $theme }) => $theme.secondaryTextColor};
`;

const Item = styled.li<{ $theme: Theme }>`
  padding: 0.85rem 0;
  border-bottom: 1px solid ${({ $theme }) => $theme.gridColor};
  &:last-child {
    border-bottom: none;
  }
`;

const Time = styled.span<{ $theme: Theme }>`
  display: block;
  font-size: 0.7rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  margin-bottom: 0.25rem;
`;

const formatTime = (iso: string) => {
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

export const Guestbook = () => {
  const { theme } = useContext(AppContext);
  const client = getSupabase();

  const [rows, setRows] = useState<GuestbookRow[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);

  const load = useCallback(async () => {
    if (!client) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await client
      .from(TABLE)
      .select('id, body, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    setLoading(false);

    if (fetchError) {
      setError(fetchError.message);

      return;
    }

    setRows((data ?? []) as GuestbookRow[]);
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    if (!client || !body.trim()) return;

    setLoading(true);
    setError(null);

    const { error: insertError } = await client.from(TABLE).insert({
      body: body.trim(),
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);

      return;
    }

    setBody('');
    await load();
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit();
  };

  if (!client) {
    return (
      <Page data-v2="guestbook">
        <TopBar>
          <BackButton
            type="button"
            $theme={theme}
            aria-label="返回首页"
            onClick={scrollToHome}
          >
            ← 首页
          </BackButton>
          <Heading $theme={theme}>留言板</Heading>
        </TopBar>
        <Panel $theme={theme}>
          <Muted $theme={theme}>未连接 Supabase，请在 .env 中配置。</Muted>
        </Panel>
      </Page>
    );
  }

  return (
    <Page data-v2="guestbook">
      <TopBar>
        <BackButton
          type="button"
          $theme={theme}
          aria-label="返回首页"
          onClick={scrollToHome}
        >
          ← 首页
        </BackButton>
        <Heading $theme={theme}>留言板</Heading>
      </TopBar>
      <Subtitle $theme={theme}>
        写下你想说的话，或看看其他人的留言。
      </Subtitle>
      <Panel $theme={theme}>
        {error ? <ErrorText $theme={theme}>{error}</ErrorText> : null}
        <Form onSubmit={onSubmit}>
          <Input
            $theme={theme}
            aria-label="留言内容"
            maxLength={500}
            placeholder="写一句留言…"
            type="text"
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
            }}
          />
          <SubmitButton
            $theme={theme}
            disabled={loading || !body.trim()}
            type="submit"
          >
            {loading ? '…' : '发送'}
          </SubmitButton>
        </Form>
        <List $theme={theme}>
          {rows.length === 0 ? (
            <Item $theme={theme}>
              <Muted $theme={theme} as="span">
                暂无留言，来做第一个吧。
              </Muted>
            </Item>
          ) : (
            rows.map((row) => (
              <Item key={row.id} $theme={theme}>
                <Time $theme={theme}>{formatTime(row.created_at)}</Time>
                {row.body}
              </Item>
            ))
          )}
        </List>
      </Panel>
    </Page>
  );
};

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

const Page = styled.div`
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 48rem;
  margin: 0 auto;
  box-sizing: border-box;
  text-align: left;
  display: flex;
  flex-direction: column;
  min-height: 0;

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

const Panel = styled.div<{ $theme: Theme }>`
  margin-top: 1rem;
  padding: clamp(1.25rem, 3vw, 1.75rem);
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 16px;
  background: ${({ $theme }) => $theme.cardBackground};
  box-shadow: ${({ $theme }) => $theme.glassShadow};
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
  border-radius: 999px;
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
  border-radius: 999px;
  border: 1px solid ${({ $theme }) => $theme.glassBorder};
  background: ${({ $theme }) => $theme.primaryTextColor};
  color: ${({ $theme }) => $theme.cardBackground};
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
      <Page data-page-root data-v2="guestbook">
        <RoomHeader $theme={theme}>
          <Eyebrow $theme={theme}>Guestbook / Notes</Eyebrow>
          <Heading $theme={theme}>留言板</Heading>
        </RoomHeader>
        <Panel $theme={theme}>
          <Muted $theme={theme}>
            未连接 Supabase：本地在 .env.local 配置
            REACT_APP_SUPABASE_*；线上需带环境变量 重新构建部署。
          </Muted>
        </Panel>
      </Page>
    );
  }

  return (
    <Page data-page-root data-v2="guestbook">
      <RoomHeader $theme={theme}>
        <Eyebrow $theme={theme}>Guestbook / Notes</Eyebrow>
        <Heading $theme={theme}>留言板</Heading>
      </RoomHeader>
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

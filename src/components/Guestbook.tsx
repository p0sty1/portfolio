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

const Section = styled.section<{ $theme: Theme }>`
  position: relative;
  z-index: 1;
  width: min(92vw, 28rem);
  margin: 0;
  padding: 1.25rem 0 0;
  text-align: left;
  border-top: 1px solid ${({ $theme }) => $theme.gridColor};
`;

const Heading = styled.h2<{ $theme: Theme }>`
  margin: 0 0 1rem;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
`;

const Muted = styled.p<{ $theme: Theme }>`
  margin: 0;
  font-size: 0.8rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
`;

const ErrorText = styled.p<{ $theme: Theme }>`
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  color: #f87171;
`;

const Form = styled.form`
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
  margin-bottom: 1rem;
`;

const Input = styled.input<{ $theme: Theme }>`
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.65rem;
  border-radius: 4px;
  border: 1px solid ${({ $theme }) => $theme.gridColor};
  background: ${({ $theme }) => $theme.background};
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: 0.85rem;
  &::placeholder {
    color: ${({ $theme }) => $theme.tertiaryTextColor};
    opacity: 0.85;
  }
`;

const Button = styled.button<{ $theme: Theme }>`
  cursor: pointer;
  padding: 0.5rem 0.85rem;
  border-radius: 4px;
  border: 1px solid ${({ $theme }) => $theme.gridColor};
  background: transparent;
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font-size: 0.8rem;
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const List = styled.ul<{ $theme: Theme }>`
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: min(42vh, 20rem);
  overflow-y: auto;
  font-size: 0.85rem;
  line-height: 1.45;
  color: ${({ $theme }) => $theme.secondaryTextColor};
`;

const Item = styled.li<{ $theme: Theme }>`
  padding: 0.65rem 0;
  border-bottom: 1px solid ${({ $theme }) => $theme.gridColor};
  &:last-child {
    border-bottom: none;
  }
`;

const Time = styled.span<{ $theme: Theme }>`
  display: block;
  font-size: 0.65rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  margin-bottom: 0.2rem;
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
      <Section data-v2="guestbook" $theme={theme}>
        <Heading $theme={theme}>留言</Heading>
        <Muted $theme={theme}>未连接</Muted>
      </Section>
    );
  }

  return (
    <Section data-v2="guestbook" $theme={theme}>
      <Heading $theme={theme}>留言</Heading>
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
        <Button $theme={theme} disabled={loading || !body.trim()} type="submit">
          {loading ? '…' : '发送'}
        </Button>
      </Form>
      <List $theme={theme}>
        {rows.length === 0 ? (
          <Item $theme={theme}>
            <Muted $theme={theme} as="span">
              暂无留言
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
    </Section>
  );
};

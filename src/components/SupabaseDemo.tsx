import { FormEvent, useCallback, useContext, useEffect, useState } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { getSupabase } from 'lib/supabaseClient';
import { Theme } from 'types';

interface DemoNote {
  id: string;
  body: string;
  created_at: string;
}

const DEMO_TABLE = 'portfolio_demo_notes';

const Wrap = styled.section<{ $theme: Theme }>`
  position: relative;
  z-index: 1;
  width: min(90vw, 26rem);
  max-height: 28vh;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid ${({ $theme }) => $theme.gridColor};
  background: ${({ $theme }) =>
    $theme.key === 'dark'
      ? 'rgba(10, 25, 47, 0.72)'
      : 'rgba(248, 250, 252, 0.85)'};
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
  overflow: hidden;
`;

const Title = styled.h3<{ $theme: Theme }>`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ $theme }) => $theme.secondaryTextColor};
`;

const Hint = styled.p<{ $theme: Theme }>`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  line-height: 1.35;
`;

const ErrorText = styled.p<{ $theme: Theme }>`
  margin: 0;
  font-size: 0.8rem;
  color: #f87171;
`;

const List = styled.ul<{ $theme: Theme }>`
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  font-size: 0.8rem;
  color: ${({ $theme }) => $theme.secondaryTextColor};
`;

const Item = styled.li<{ $theme: Theme }>`
  padding: 0.35rem 0;
  border-bottom: 1px solid ${({ $theme }) => $theme.gridColor};
  &:last-child {
    border-bottom: none;
  }
`;

const Meta = styled.span<{ $theme: Theme }>`
  display: block;
  font-size: 0.65rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  margin-bottom: 0.15rem;
`;

const Form = styled.form`
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
`;

const Input = styled.input<{ $theme: Theme }>`
  flex: 1;
  min-width: 0;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  border: 1px solid ${({ $theme }) => $theme.gridColor};
  background: ${({ $theme }) => $theme.background};
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: 0.8rem;
`;

const Button = styled.button<{ $theme: Theme }>`
  cursor: pointer;
  padding: 0.4rem 0.65rem;
  border-radius: 6px;
  border: 1px solid ${({ $theme }) => $theme.gridColor};
  background: transparent;
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font-size: 0.75rem;
  white-space: nowrap;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const formatTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

export const SupabaseDemo = () => {
  const { theme } = useContext(AppContext);
  const client = getSupabase();

  const [notes, setNotes] = useState<DemoNote[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);

  const loadNotes = useCallback(async () => {
    if (!client) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await client
      .from(DEMO_TABLE)
      .select('id, body, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    setLoading(false);

    if (fetchError) {
      setError(fetchError.message);

      return;
    }

    setNotes((data ?? []) as DemoNote[]);
  }, [client]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const submitNote = async () => {
    if (!client || !body.trim()) return;

    setLoading(true);
    setError(null);

    const { error: insertError } = await client.from(DEMO_TABLE).insert({
      body: body.trim(),
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);

      return;
    }

    setBody('');
    await loadNotes();
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitNote();
  };

  if (!client) {
    return (
      <Wrap data-v2="supabase-demo" $theme={theme}>
        <Title $theme={theme}>Supabase 演示</Title>
        <Hint $theme={theme}>
          在项目根目录创建 <code>.env.local</code>，填入{' '}
          <code>REACT_APP_SUPABASE_URL</code> 与{' '}
          <code>REACT_APP_SUPABASE_ANON_KEY</code>（Supabase 控制台 → Project
          Settings → API），保存后重启 <code>npm start</code>。
        </Hint>
      </Wrap>
    );
  }

  return (
    <Wrap data-v2="supabase-demo" $theme={theme}>
      <Title $theme={theme}>Supabase 演示（最小读写）</Title>
      <Hint $theme={theme}>
        写入表 <code>{DEMO_TABLE}</code>，仅供本地试连库；上线前请收紧 RLS
        与校验逻辑。
      </Hint>
      {error ? <ErrorText $theme={theme}>{error}</ErrorText> : null}
      <Form onSubmit={onSubmit}>
        <Input
          $theme={theme}
          aria-label="Demo note text"
          maxLength={500}
          placeholder="写一句话写入数据库…"
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
        {notes.length === 0 ? (
          <Item $theme={theme}>暂无记录，先发一条试试。</Item>
        ) : (
          notes.map((note) => (
            <Item key={note.id} $theme={theme}>
              <Meta $theme={theme}>{formatTime(note.created_at)}</Meta>
              {note.body}
            </Item>
          ))
        )}
      </List>
    </Wrap>
  );
};

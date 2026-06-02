import { ReactNode } from 'react';

const inlinePattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;

const renderInline = (text: string, keyPrefix: string): ReactNode[] => {
  const parts = text.split(inlinePattern).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${keyPrefix}-b-${String(index)}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={`${keyPrefix}-c-${String(index)}`}>{part.slice(1, -1)}</code>
      );
    }

    return <span key={`${keyPrefix}-t-${String(index)}`}>{part}</span>;
  });
};

export const renderBlogMarkdown = (markdown: string): ReactNode[] => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const nodes: ReactNode[] = [];
  let index = 0;
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let codeLines: string[] = [];
  let inCode = false;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join(' ').trim();
    paragraph = [];
    if (!text) return;
    nodes.push(
      <p key={`p-${String(index++)}`}>
        {renderInline(text, `p-${String(index)}`)}
      </p>,
    );
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={`ul-${String(index++)}`}>
        {listItems.map((item) => (
          <li key={`li-${item}`}>{renderInline(item, `li-${item}`)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  const flushCode = () => {
    if (codeLines.length === 0) return;
    nodes.push(
      <pre key={`pre-${String(index++)}`}>
        <code>{codeLines.join('\n')}</code>
      </pre>,
    );
    codeLines = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      flushParagraph();
      flushList();
      inCode = !inCode;
      if (!inCode) flushCode();
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      nodes.push(
        <h3 key={`h3-${String(index++)}`}>
          {renderInline(line.slice(4), `h3-${String(index)}`)}
        </h3>,
      );
      continue;
    }

    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      nodes.push(
        <h2 key={`h2-${String(index++)}`}>
          {renderInline(line.slice(3), `h2-${String(index)}`)}
        </h2>,
      );
      continue;
    }

    if (line.startsWith('|')) {
      flushParagraph();
      flushList();
      nodes.push(
        <p key={`table-${String(index++)}`}>
          <code>{line}</code>
        </p>,
      );
      continue;
    }

    if (line.startsWith('- ')) {
      flushParagraph();
      listItems.push(line.slice(2));
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  if (inCode) flushCode();

  return nodes;
};

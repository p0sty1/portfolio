import { useContext } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { Theme } from 'types';

const Hint = styled.button<{ $theme: Theme }>`
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2.5rem;
  padding: 0.65rem 1.1rem;
  border: 1px solid ${({ $theme }) => $theme.glassBorder};
  border-radius: 999px;
  background: ${({ $theme }) => $theme.glassBackground};
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font-size: 0.85rem;
  cursor: pointer;
  box-shadow: ${({ $theme }) => $theme.glassShadow};
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;

  &:hover {
    color: ${({ $theme }) => $theme.accentColor};
    transform: translateY(2px);
    box-shadow: ${({ $theme }) => $theme.glassShadowHover};
  }
`;

const Arrow = styled.span<{ $theme: Theme }>`
  color: ${({ $theme }) => $theme.accentColor};
  font-size: 1rem;
  line-height: 1;
  animation: bounce 2s ease-in-out infinite;

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(4px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const scrollToGuestbook = () => {
  document
    .getElementById('guestbook')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const ScrollHint = () => {
  const { theme } = useContext(AppContext);

  return (
    <Hint
      type="button"
      data-v2="scroll-hint"
      $theme={theme}
      aria-label="下滑查看留言板"
      onClick={scrollToGuestbook}
    >
      <span>下滑查看留言</span>
      <Arrow $theme={theme} aria-hidden="true">
        ↓
      </Arrow>
    </Hint>
  );
};

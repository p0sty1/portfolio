import { useCallback, useContext } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { Theme } from 'types';

const S = {
  Section: styled.section`
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 56rem;
    margin-top: 2.75rem;
    text-align: left;
  `,
  Heading: styled.h2<{ $theme: Theme }>`
    margin: 0 0 1.5rem;
    font-size: 1.35rem;
    font-weight: 600;
    color: ${({ $theme }) => $theme.accentColor};
    letter-spacing: 0.01em;

    &::after {
      content: '';
      display: block;
      width: 2.5rem;
      height: 3px;
      margin-top: 0.5rem;
      border-radius: 2px;
      background: ${({ $theme }) => $theme.accentColor};
      opacity: 0.85;
    }
  `,
  Grid: styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.25rem;

    @media only screen and (max-width: 900px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media only screen and (max-width: 520px) {
      grid-template-columns: 1fr;
    }
  `,
  Card: styled.button<{ $theme: Theme }>`
    position: relative;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.65rem;
    width: 100%;
    padding: 1.35rem 1.25rem;
    text-align: left;
    cursor: pointer;
    overflow: hidden;
    border: 1px solid ${({ $theme }) => $theme.glassBorder};
    border-radius: 20px;
    background: ${({ $theme }) => $theme.glassBackground};
    color: ${({ $theme }) => $theme.primaryTextColor};
    box-shadow: ${({ $theme }) => $theme.glassShadow};
    backdrop-filter: blur(22px) saturate(165%);
    -webkit-backdrop-filter: blur(22px) saturate(165%);
    transition:
      transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94),
      box-shadow 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94),
      background 0.35s ease,
      border-color 0.35s ease;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: ${({ $theme }) => $theme.glassInsetHighlight};
      pointer-events: none;
      z-index: 0;
    }

    &::after {
      content: '';
      position: absolute;
      inset: 1px;
      border-radius: calc(20px - 1px);
      border: 1px solid transparent;
      background: linear-gradient(
          145deg,
          rgba(255, 255, 255, 0.22) 0%,
          transparent 42%
        )
        border-box;
      -webkit-mask:
        linear-gradient(#fff 0 0) padding-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      z-index: 0;
      opacity: 0.7;
    }

    & > * {
      position: relative;
      z-index: 1;
    }

    &:hover {
      background: ${({ $theme }) => $theme.glassBackgroundHover};
      border-color: ${({ $theme }) => $theme.cardHoverBorder};
      transform: translateY(-3px) scale(1.01);
      box-shadow: ${({ $theme }) => $theme.glassShadowHover};
    }

    &:active {
      transform: translateY(0) scale(0.985);
      box-shadow: ${({ $theme }) => $theme.glassShadowActive};
      transition-duration: 0.12s;
    }

    @media (prefers-reduced-motion: reduce) {
      transition:
        background 0.35s ease,
        border-color 0.35s ease;

      &:hover,
      &:active {
        transform: none;
      }
    }
  `,
  Icon: styled.span<{ $theme: Theme }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 14px;
    font-size: 1.25rem;
    line-height: 1;
    color: ${({ $theme }) => $theme.accentColor};
    background: ${({ $theme }) => $theme.iconGlassBackground};
    border: 1px solid ${({ $theme }) => $theme.glassBorder};
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.12) inset,
      0 4px 12px rgba(0, 0, 0, 0.12);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  `,
  Title: styled.span<{ $theme: Theme }>`
    font-size: 1.05rem;
    font-weight: 600;
    color: ${({ $theme }) => $theme.primaryTextColor};
    letter-spacing: -0.01em;
  `,
  Description: styled.span<{ $theme: Theme }>`
    font-size: 0.85rem;
    line-height: 1.5;
    color: ${({ $theme }) => $theme.tertiaryTextColor};
  `,
};

const scrollToGuestbook = () => {
  document
    .getElementById('guestbook')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const DoingSection = () => {
  const { config, theme } = useContext(AppContext);

  const handleClick = useCallback((href: string) => {
    if (href === '#guestbook') {
      scrollToGuestbook();
      return;
    }
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <S.Section data-v2="doing-section">
      <S.Heading $theme={theme}>What i&apos;m doing</S.Heading>
      <S.Grid>
        {config.doingItems.map(({ name, display, description, icon, href }) => {
          return (
            <S.Card
              key={name}
              type="button"
              data-v2={`doing-${name}`}
              aria-label={display}
              $theme={theme}
              onClick={() => {
                handleClick(href);
              }}
            >
              <S.Icon $theme={theme} aria-hidden="true">
                {icon}
              </S.Icon>
              <S.Title $theme={theme}>{display}</S.Title>
              <S.Description $theme={theme}>{description}</S.Description>
            </S.Card>
          );
        })}
      </S.Grid>
    </S.Section>
  );
};

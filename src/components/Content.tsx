import { useContext } from 'react';

import styled, { css } from 'styled-components';

import { AppContext } from 'App/AppContext';
import { Theme } from 'types';

const sharedStyles = css`
  transition: color 0.5s linear;
  font-weight: normal;
  position: relative;
  z-index: 1;
`;

const MOBILE_MAX = '720px';
const DESKTOP_MIN = '721px';

const C = {
  Wrapper: styled.header`
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 56rem;
    text-align: left;
  `,
  HeroRow: styled.div`
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: stretch;
    column-gap: clamp(1rem, 3vw, 2.5rem);
  `,
  Avatar: styled.div<{ $hasImage?: boolean; $theme: Theme }>`
    position: relative;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1 / 1;
    border-radius: clamp(1.35rem, 2.8vw, 2rem);
    overflow: hidden;
    border: 1px solid ${({ $theme }) => $theme.glassBorder};
    background: ${({ $theme, $hasImage }) =>
      $hasImage ? 'transparent' : $theme.glassBackground};
    box-shadow: ${({ $theme }) => $theme.glassShadow};
    backdrop-filter: blur(20px) saturate(165%);
    -webkit-backdrop-filter: blur(20px) saturate(165%);

    /* Web: square side = height of name + title + bio */
    @media only screen and (min-width: ${DESKTOP_MIN}) {
      height: 100%;
      width: auto;
      min-width: 0;
      min-height: 8rem;
    }

    /* Mobile: fixed square, row layout (avatar left) */
    @media only screen and (max-width: ${MOBILE_MAX}) {
      align-self: start;
      width: clamp(5.75rem, 26vw, 7.25rem);
      height: auto;
    }

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: ${({ $theme }) => $theme.glassInsetHighlight};
      pointer-events: none;
      z-index: 1;
    }

    img {
      position: relative;
      z-index: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  `,
  Initials: styled.span<{ $theme: Theme }>`
    position: relative;
    z-index: 2;
    font-size: clamp(1.65rem, 4.5vw, 3rem);
    font-weight: 600;
    letter-spacing: 0.04em;
    color: ${({ $theme }) => $theme.accentColor};
    user-select: none;
  `,
  Identity: styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.35rem;
    min-width: 0;
  `,
  Name: styled.h1<{ $theme: Theme }>`
    ${sharedStyles};
    font-size: clamp(1.85rem, 6vw, 4.5rem);
    font-weight: 600;
    margin: 0;
    line-height: 1.1;
    color: ${({ $theme }) => $theme.primaryTextColor};
  `,
  Title: styled.p<{ $theme: Theme }>`
    ${sharedStyles};
    font-size: clamp(0.95rem, 2.5vw, 1.35rem);
    margin: 0 0 0.35rem;
    color: ${({ $theme }) => $theme.accentColor};
    letter-spacing: 0.02em;
  `,
  Bio: styled.p<{ $theme: Theme }>`
    ${sharedStyles};
    font-size: clamp(0.875rem, 2.2vw, 1rem);
    line-height: 1.65;
    margin: 0;
    color: ${({ $theme }) => $theme.secondaryTextColor};
  `,
};

export const Content = () => {
  const { config, theme } = useContext(AppContext);
  const avatarSrc = config.avatar.src?.trim();

  return (
    <C.Wrapper>
      <C.HeroRow>
        <C.Avatar
          data-v2="avatar"
          $theme={theme}
          $hasImage={Boolean(avatarSrc)}
          role="img"
          aria-label={config.avatar.alt}
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt={config.avatar.alt} />
          ) : (
            <C.Initials $theme={theme} aria-hidden="true">
              {config.avatar.initials}
            </C.Initials>
          )}
        </C.Avatar>
        <C.Identity>
          <C.Name data-v2="name" $theme={theme}>
            {config.name.display}
          </C.Name>
          <C.Title data-v2="title" $theme={theme}>
            {config.title.display}
          </C.Title>
          <C.Bio data-v2="bio" $theme={theme}>
            {config.bio.display}
          </C.Bio>
        </C.Identity>
      </C.HeroRow>
    </C.Wrapper>
  );
};

import { useContext } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { Theme } from 'types';

const Widget = styled.section<{ $compact?: boolean; $theme: Theme }>`
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: 100%;
  padding: ${({ $compact }) => ($compact ? '0.85rem 1rem' : '1.1rem 1.35rem')};
  border-radius: ${({ $compact }) => ($compact ? '20px' : '24px')};
  border: 1px solid ${({ $theme }) => $theme.glassBorder};
  background: ${({ $theme }) => $theme.glassBackground};
  box-shadow: ${({ $theme }) => $theme.glassShadow};
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  text-align: left;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: ${({ $theme }) => $theme.glassInsetHighlight};
    pointer-events: none;
  }
`;

const Inner = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: clamp(0.85rem, 2.5vw, 1.25rem);
`;

const Avatar = styled.div<{ $hasImage?: boolean; $theme: Theme }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(4.5rem, 18vw, 5.75rem);
  aspect-ratio: 1;
  border-radius: 22%;
  overflow: hidden;
  border: 1px solid ${({ $theme }) => $theme.glassBorder};
  background: ${({ $theme, $hasImage }) =>
    $hasImage ? 'transparent' : $theme.iconGlassBackground};
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const Initials = styled.span<{ $theme: Theme }>`
  font-size: clamp(1.5rem, 5vw, 2rem);
  font-weight: 600;
  color: ${({ $theme }) => $theme.accentColor};
`;

const Text = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
`;

const Name = styled.h1<{ $theme: Theme }>`
  margin: 0;
  font-size: clamp(1.35rem, 4.5vw, 1.85rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: ${({ $theme }) => $theme.primaryTextColor};
`;

const Title = styled.p<{ $theme: Theme }>`
  margin: 0;
  font-size: clamp(0.82rem, 2.5vw, 1rem);
  font-weight: 500;
  color: ${({ $theme }) => $theme.accentColor};
`;

const Bio = styled.p<{ $theme: Theme }>`
  margin: 0;
  font-size: clamp(0.75rem, 2.2vw, 0.88rem);
  line-height: 1.5;
  color: ${({ $theme }) => $theme.secondaryTextColor};
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

interface ProfileWidgetProps {
  compact?: boolean;
}

export const ProfileWidget = ({ compact = true }: ProfileWidgetProps) => {
  const { config, theme } = useContext(AppContext);
  const avatarSrc = config.avatar.src?.trim();

  return (
    <Widget
      data-v2="profile-widget"
      $theme={theme}
      $compact={compact}
      aria-label="Profile"
    >
      <Inner>
        <Avatar
          data-v2="avatar"
          $theme={theme}
          $hasImage={Boolean(avatarSrc)}
          role="img"
          aria-label={config.avatar.alt}
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt={config.avatar.alt} />
          ) : (
            <Initials $theme={theme} aria-hidden="true">
              {config.avatar.initials}
            </Initials>
          )}
        </Avatar>
        <Text>
          <Name data-v2="name" $theme={theme}>
            {config.name.display}
          </Name>
          <Title data-v2="title" $theme={theme}>
            {config.title.display}
          </Title>
          <Bio data-v2="bio" $theme={theme}>
            {config.bio.display}
          </Bio>
        </Text>
      </Inner>
    </Widget>
  );
};

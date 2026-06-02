import { useContext } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { Theme } from 'types';

const Widget = styled.section<{ $compact?: boolean; $theme: Theme }>`
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: 100%;
  padding: ${({ $compact }) => ($compact ? '0.9rem 1rem' : '1.05rem 1.15rem')};
  border-radius: 16px;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  background: ${({ $theme }) => $theme.cardBackground};
  box-shadow: ${({ $theme }) => $theme.glassShadow};
  text-align: left;
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
  width: clamp(3.6rem, 16vw, 4.6rem);
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  background: ${({ $theme, $hasImage }) =>
    $hasImage ? 'transparent' : $theme.iconGlassBackground};
  box-shadow: none;

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
  font-size: clamp(1.05rem, 4vw, 1.25rem);
  font-weight: 780;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: ${({ $theme }) => $theme.primaryTextColor};
`;

const Title = styled.p<{ $theme: Theme }>`
  margin: 0;
  font-size: clamp(0.78rem, 2.5vw, 0.9rem);
  font-weight: 540;
  color: ${({ $theme }) => $theme.secondaryTextColor};
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
  const bio = config.bio.display.trim();

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
          {bio ? (
            <Bio data-v2="bio" $theme={theme}>
              {bio}
            </Bio>
          ) : null}
        </Text>
      </Inner>
    </Widget>
  );
};

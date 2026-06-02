import { useContext } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { AppView, Theme } from 'types';

import { BrandLogo } from './BrandLogo';

const Aside = styled.aside<{ $theme: Theme }>`
  position: relative;
  z-index: 3;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width, 16.25rem);
  height: 100%;
  padding: 1.25rem 0.9rem 1rem;
  box-sizing: border-box;
  border-right: 1px solid ${({ $theme }) => $theme.cardBorder};
  background: ${({ $theme }) => $theme.cardBackground};
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  padding: 0.15rem 0.55rem 1.75rem;
  min-height: 4.15rem;
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  min-height: 0;
`;

const NavButton = styled.button<{ $active: boolean; $theme: Theme }>`
  display: flex;
  align-items: center;
  gap: 0.95rem;
  width: 100%;
  min-height: 3rem;
  padding: 0.68rem 0.8rem;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  text-align: left;
  font: inherit;
  font-size: 0.98rem;
  font-weight: ${({ $active }) => ($active ? 760 : 560)};
  color: ${({ $active, $theme }) =>
    $active ? $theme.primaryTextColor : $theme.secondaryTextColor};
  background: ${({ $active, $theme }) =>
    $active ? $theme.iconGlassBackground : 'transparent'};
  transition:
    background 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;

  &:hover {
    background: ${({ $theme }) => $theme.glassBackgroundHover};
    color: ${({ $theme }) => $theme.primaryTextColor};
  }

  &:active {
    transform: scale(0.98);
  }

  svg {
    width: 1.45rem;
    height: 1.45rem;
    flex-shrink: 0;
    stroke-width: ${({ $active }) => ($active ? 2.35 : 2)};
  }
`;

const ProfileFooter = styled.div<{ $theme: Theme }>`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: auto;
  padding: 0.85rem 0.65rem 0.25rem;
  border-top: 1px solid ${({ $theme }) => $theme.cardBorder};
`;

const ProfileAvatar = styled.div<{ $hasImage?: boolean; $theme: Theme }>`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  background: ${({ $theme, $hasImage }) =>
    $hasImage ? 'transparent' : $theme.iconGlassBackground};
  display: grid;
  place-items: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ $theme }) => $theme.primaryTextColor};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ProfileMeta = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

const ProfileName = styled.span<{ $theme: Theme }>`
  font-size: 0.88rem;
  font-weight: 600;
  color: ${({ $theme }) => $theme.primaryTextColor};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProfileTitle = styled.span<{ $theme: Theme }>`
  font-size: 0.72rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Sidebar = () => {
  const { config, theme, activeView, setActiveView } = useContext(AppContext);
  const logoSrc = `${process.env.PUBLIC_URL ?? ''}${config.brand.logoSrc}`;
  const avatarSrc = config.avatar.src?.trim();

  const go = (view: AppView) => {
    setActiveView(view);
  };

  return (
    <Aside data-v2="sidebar" $theme={theme} aria-label="主导航">
      <LogoRow>
        <BrandLogo alt={config.brand.logoAlt} src={logoSrc} variant="sidebar" />
      </LogoRow>

      <Nav aria-label="页面">
        {config.navItems.map(({ name, display, view, icon }) => (
          <NavButton
            key={name}
            type="button"
            data-v2={`nav-${name}`}
            $active={activeView === view}
            $theme={theme}
            aria-current={activeView === view ? 'page' : undefined}
            onClick={() => {
              go(view);
            }}
          >
            {icon}
            {display}
          </NavButton>
        ))}
      </Nav>

      <ProfileFooter $theme={theme}>
        <ProfileAvatar
          $theme={theme}
          $hasImage={Boolean(avatarSrc)}
          data-v2="sidebar-avatar"
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt={config.avatar.alt} />
          ) : (
            config.avatar.initials
          )}
        </ProfileAvatar>
        <ProfileMeta>
          <ProfileName $theme={theme}>{config.name.display}</ProfileName>
          <ProfileTitle $theme={theme}>{config.title.display}</ProfileTitle>
        </ProfileMeta>
      </ProfileFooter>
    </Aside>
  );
};

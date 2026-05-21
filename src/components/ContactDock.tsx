import { useContext } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { Theme } from 'types';

import { AppIcon } from './AppIcon';

const Dock = styled.nav<{ $theme: Theme }>`
  position: relative;
  z-index: 1;
  width: 100%;
  padding: var(--dock-pad-y, 0.875rem) var(--dock-pad-x, 1.125rem);
  border-radius: var(--dock-radius, 1.625rem);
  border: 1px solid ${({ $theme }) => $theme.glassBorder};
  background: ${({ $theme }) =>
    $theme.key === 'dark'
      ? 'rgba(40, 40, 48, 0.82)'
      : 'rgba(255, 255, 255, 0.65)'};
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.32);
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  gap: var(--dock-icon-gap, 0.5rem);
`;

const DockLink = styled.a`
  display: flex;
  flex: 1;
  justify-content: center;
  min-width: 0;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.75;
    transform: scale(0.9);
  }
`;

interface ContactDockProps {
  showLabels?: boolean;
}

export const ContactDock = ({ showLabels = true }: ContactDockProps) => {
  const { config, theme } = useContext(AppContext);
  const items = config.dockItems ?? [];

  if (items.length === 0) return null;

  return (
    <Dock data-v2="contact-dock" $theme={theme} aria-label="Contact">
      <Row>
        {items.map(({ name, display, ariaLabel, iconGradient, href, icon }) => (
          <DockLink
            key={name}
            data-v2={`dock-${name}`}
            href={href}
            aria-label={`${display}，${ariaLabel}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <AppIcon
              gradient={iconGradient}
              label={display}
              size="dock"
              hideLabel={!showLabels}
            >
              {icon}
            </AppIcon>
          </DockLink>
        ))}
      </Row>
    </Dock>
  );
};

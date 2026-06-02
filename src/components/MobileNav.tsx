import { useContext } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { AppView, Theme } from 'types';

const Bar = styled.nav<{ $theme: Theme }>`
  position: relative;
  z-index: 5;
  flex-shrink: 0;
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
  gap: 0.15rem;
  width: 100%;
  min-height: calc(4.2rem + env(safe-area-inset-bottom, 0px));
  margin: 0;
  padding: 0.35rem 0.55rem calc(0.45rem + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  overflow-x: auto;
  border-top: 1px solid ${({ $theme }) => $theme.cardBorder};
  background: ${({ $theme }) => $theme.cardBackground};
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Tab = styled.button<{ $active: boolean; $theme: Theme }>`
  flex: 0 0 4.05rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.24rem;
  min-width: 0;
  min-height: 3rem;
  padding: 0.35rem 0.2rem;
  border: none;
  border-radius: 16px;
  background: ${({ $active, $theme }) =>
    $active ? $theme.iconGlassBackground : 'transparent'};
  cursor: pointer;
  font: inherit;
  font-size: clamp(0.58rem, 2.8vw, 0.68rem);
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  color: ${({ $active, $theme }) =>
    $active ? $theme.primaryTextColor : $theme.tertiaryTextColor};
  -webkit-tap-highlight-color: transparent;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    transform 0.12s ease;

  &:active {
    transform: scale(0.94);
  }

  svg {
    width: clamp(1.35rem, 5.5vw, 1.55rem);
    height: clamp(1.35rem, 5.5vw, 1.55rem);
    flex-shrink: 0;
  }

  span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const MobileNav = () => {
  const { config, theme, activeView, setActiveView } = useContext(AppContext);

  const go = (view: AppView) => {
    setActiveView(view);
  };

  return (
    <Bar data-v2="mobile-nav" $theme={theme} aria-label="底部导航">
      {config.navItems.map(({ name, display, view, icon }) => (
        <Tab
          key={name}
          type="button"
          data-v2={`nav-${name}`}
          $active={activeView === view}
          $theme={theme}
          aria-current={activeView === view ? 'page' : undefined}
          aria-label={display}
          onClick={() => {
            go(view);
          }}
        >
          {icon}
          <span>{display}</span>
        </Tab>
      ))}
    </Bar>
  );
};

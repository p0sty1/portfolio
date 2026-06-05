import { useContext } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { AppView, Theme } from 'types';

const Bar = styled.nav<{ $theme: Theme }>`
  position: relative;
  z-index: 5;
  flex-shrink: 0;
  width: 100%;
  min-height: calc(6.35rem + env(safe-area-inset-bottom, 0px));
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  border-top: 1px solid ${({ $theme }) => $theme.cardBorder};
  background: ${({ $theme }) => $theme.cardBackground};
  isolation: isolate;

  &::before {
    position: absolute;
    left: 50%;
    bottom: calc(-20.7rem + env(safe-area-inset-bottom, 0px));
    z-index: 0;
    width: 24rem;
    aspect-ratio: 1;
    border: 1px solid ${({ $theme }) => $theme.cardBorder};
    border-radius: 50%;
    background: ${({ $theme }) => $theme.iconGlassBackground};
    content: '';
    pointer-events: none;
    transform: translateX(-50%);
  }
`;

const Wheel = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
`;

const Tab = styled.button<{
  $active: boolean;
  $distant: boolean;
  $theme: Theme;
}>`
  position: absolute;
  left: 50%;
  bottom: calc(0.66rem + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.24rem;
  width: 3.9rem;
  min-width: 0;
  min-height: 3.38rem;
  padding: 0.36rem 0.22rem;
  border: 1px solid
    ${({ $active, $theme }) =>
      $active ? $theme.cardHoverBorder : 'transparent'};
  border-radius: 999px;
  background: ${({ $active, $theme }) =>
    $active ? $theme.iconGlassBackground : $theme.cardBackground};
  box-shadow: ${({ $active, $theme }) =>
    $active ? $theme.glassShadow : 'none'};
  cursor: pointer;
  font: inherit;
  font-size: 0.64rem;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  color: ${({ $active, $theme }) =>
    $active ? $theme.primaryTextColor : $theme.tertiaryTextColor};
  -webkit-tap-highlight-color: transparent;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    color 0.15s ease,
    opacity 0.28s ease,
    transform 0.46s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;

  &:active {
    filter: brightness(0.98);
  }

  svg {
    width: ${({ $active }) => ($active ? '1.5rem' : '1.34rem')};
    height: ${({ $active }) => ($active ? '1.5rem' : '1.34rem')};
    flex-shrink: 0;
    transition:
      width 0.2s ease,
      height 0.2s ease;
  }

  span {
    display: ${({ $distant }) => ($distant ? 'none' : 'block')};
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    transition:
      background 0.15s ease,
      border-color 0.15s ease,
      box-shadow 0.15s ease,
      color 0.15s ease;
  }
`;

const getSignedOffset = (index: number, activeIndex: number, count: number) => {
  const raw = index - activeIndex;
  const half = count / 2;

  if (raw > half) return raw - count;
  if (raw < -half) return raw + count;

  return raw;
};

const getWheelStyle = (offset: number) => {
  const distance = Math.min(Math.abs(offset), 4);
  const clampedOffset = Math.max(-4, Math.min(4, offset));
  const x = clampedOffset * 3.12;
  const y = -2.16 + distance * 0.62 + (distance === 4 ? 0.15 : 0);
  const scale = Math.max(0.62, 1 - distance * 0.09);
  const opacity = distance === 4 ? 0.36 : Math.max(0.62, 1 - distance * 0.12);

  return {
    opacity,
    transform: `translate(calc(-50% + ${x.toFixed(2)}rem), ${y.toFixed(
      2,
    )}rem) scale(${scale.toFixed(2)})`,
    zIndex: 20 - distance,
  };
};

export const MobileNav = () => {
  const { config, theme, activeView, setActiveView } = useContext(AppContext);
  const activeNavView = activeView === 'ideal-test' ? 'fun' : activeView;
  const activeIndex = Math.max(
    0,
    config.navItems.findIndex(({ view }) => view === activeNavView),
  );

  const go = (view: AppView) => {
    setActiveView(view);
  };

  return (
    <Bar data-v2="mobile-nav" $theme={theme} aria-label="底部导航">
      <Wheel>
        {config.navItems.map(({ name, display, view, icon }, index) => {
          const offset = getSignedOffset(
            index,
            activeIndex,
            config.navItems.length,
          );
          const distance = Math.abs(offset);
          const active = activeNavView === view;

          return (
            <Tab
              key={name}
              type="button"
              data-v2={`nav-${name}`}
              $active={active}
              $distant={distance >= 4}
              $theme={theme}
              aria-current={active ? 'page' : undefined}
              aria-label={display}
              style={getWheelStyle(offset)}
              onClick={() => {
                go(view);
              }}
            >
              {icon}
              <span>{display}</span>
            </Tab>
          );
        })}
      </Wheel>
    </Bar>
  );
};

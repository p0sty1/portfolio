import { useContext, useEffect, useMemo, useState } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { AppView, Theme } from 'types';

const QUEUE_RADIUS = 3;
const QUEUE_SPACING_REM = 4.18;

const Bar = styled.nav<{ $theme: Theme }>`
  position: relative;
  z-index: 5;
  flex-shrink: 0;
  width: 100%;
  min-height: calc(4.2rem + env(safe-area-inset-bottom, 0px));
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  border-top: 1px solid ${({ $theme }) => $theme.cardBorder};
  background: ${({ $theme }) => $theme.cardBackground};
`;

const Track = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
`;

const Tab = styled.button<{
  $active: boolean;
  $hiddenLabel: boolean;
  $theme: Theme;
}>`
  position: absolute;
  left: 50%;
  bottom: calc(0.46rem + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.24rem;
  width: 4.05rem;
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
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    opacity 0.22s ease,
    transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;

  &:active {
    filter: brightness(0.98);
  }

  svg {
    width: clamp(1.35rem, 5.5vw, 1.55rem);
    height: clamp(1.35rem, 5.5vw, 1.55rem);
    flex-shrink: 0;
  }

  span {
    display: ${({ $hiddenLabel }) => ($hiddenLabel ? 'none' : 'block')};
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    transition:
      background 0.15s ease,
      color 0.15s ease,
      opacity 0.15s ease;
  }
`;

const getQueueStyle = (offset: number) => {
  const distance = Math.min(Math.abs(offset), 4);
  const x = offset * QUEUE_SPACING_REM;
  const scale = Math.max(0.74, 1 - distance * 0.06);
  const opacity = distance >= 4 ? 0.24 : Math.max(0.54, 1 - distance * 0.13);

  return {
    opacity,
    transform: `translateX(calc(-50% + ${x.toFixed(
      2,
    )}rem)) scale(${scale.toFixed(2)})`,
    zIndex: 20 - distance,
  };
};

const positiveModulo = (value: number, count: number) =>
  ((value % count) + count) % count;

const getNearestQueueIndex = (
  currentIndex: number,
  targetItemIndex: number,
  itemCount: number,
) => {
  if (itemCount <= 0) return currentIndex;

  const currentItemIndex = positiveModulo(currentIndex, itemCount);
  const forwardOffset = positiveModulo(
    targetItemIndex - currentItemIndex,
    itemCount,
  );
  const backwardOffset = forwardOffset === 0 ? 0 : forwardOffset - itemCount;
  const nextOffset =
    Math.abs(forwardOffset) <= Math.abs(backwardOffset)
      ? forwardOffset
      : backwardOffset;

  return currentIndex + nextOffset;
};

export const MobileNav = () => {
  const { config, theme, activeView, setActiveView } = useContext(AppContext);
  const activeNavView = activeView === 'ideal-test' ? 'fun' : activeView;
  const itemCount = config.navItems.length;
  const activeIndex = Math.max(
    0,
    config.navItems.findIndex(({ view }) => view === activeNavView),
  );
  const [virtualActiveIndex, setVirtualActiveIndex] = useState(activeIndex);

  useEffect(() => {
    setVirtualActiveIndex((currentIndex) =>
      getNearestQueueIndex(currentIndex, activeIndex, itemCount),
    );
  }, [activeIndex, itemCount]);

  const queueItems = useMemo(() => {
    if (itemCount === 0) return [];

    return Array.from({ length: QUEUE_RADIUS * 2 + 1 }, (_, slotIndex) => {
      const offset = slotIndex - QUEUE_RADIUS;
      const queueIndex = virtualActiveIndex + offset;
      const itemIndex = positiveModulo(queueIndex, itemCount);
      const item = config.navItems[itemIndex];

      return {
        ...item,
        itemIndex,
        offset,
        queueIndex,
      };
    });
  }, [config.navItems, itemCount, virtualActiveIndex]);

  const go = (view: AppView, queueIndex: number) => {
    setVirtualActiveIndex(queueIndex);
    setActiveView(view);
  };

  return (
    <Bar data-v2="mobile-nav" $theme={theme} aria-label="底部导航">
      <Track>
        {queueItems.map(({ name, display, view, icon, offset, queueIndex }) => {
          const distance = Math.abs(offset);
          const active = queueIndex === virtualActiveIndex;

          return (
            <Tab
              key={`${name}-${String(queueIndex)}`}
              type="button"
              data-v2={`nav-${name}`}
              $active={active}
              $hiddenLabel={distance >= 3}
              $theme={theme}
              aria-current={active ? 'page' : undefined}
              aria-label={display}
              style={getQueueStyle(offset)}
              onPointerDown={(event) => {
                if (event.pointerType !== 'touch') return;

                event.preventDefault();
                go(view, queueIndex);
              }}
              onClick={() => {
                go(view, queueIndex);
              }}
            >
              {icon}
              <span>{display}</span>
            </Tab>
          );
        })}
      </Track>
    </Bar>
  );
};

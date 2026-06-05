import {
  PointerEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { AppView, Theme } from 'types';

const QUEUE_RADIUS = 3;
const QUEUE_SPACING_REM = 4.18;
const DRAG_ACTIVATION_PX = 8;
const FLING_VELOCITY_PX_PER_MS = 0.42;

interface DragState {
  active: boolean;
  moved: boolean;
  pointerId: null | number;
  startTime: number;
  startX: number;
}

const EMPTY_DRAG_STATE: DragState = {
  active: false,
  moved: false,
  pointerId: null,
  startTime: 0,
  startX: 0,
};

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
  touch-action: pan-y;
`;

const Tab = styled.button<{
  $active: boolean;
  $dragging: boolean;
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
  touch-action: pan-y;
  -webkit-tap-highlight-color: transparent;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    opacity 0.22s ease,
    ${({ $dragging }) =>
      $dragging
        ? 'none'
        : 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)'};
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

const getQueueStyle = (offset: number, dragOffset: number) => {
  const visualOffset = offset + dragOffset;
  const distance = Math.min(Math.abs(visualOffset), 4);
  const x = visualOffset * QUEUE_SPACING_REM;
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

const isDragPointerType = (pointerType: string) =>
  pointerType === 'mouse' || pointerType === 'touch';

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
  const [dragOffset, setDragOffset] = useState(0);
  const [dragState, setDragState] = useState<DragState>(EMPTY_DRAG_STATE);
  const dragStateRef = useRef<DragState>(EMPTY_DRAG_STATE);
  const suppressNextClickRef = useRef(false);
  const dragging = dragState.active && dragState.moved;

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

  const updateDragState = (nextDragState: DragState) => {
    dragStateRef.current = nextDragState;
    setDragState(nextDragState);
  };

  const clearDrag = () => {
    setDragOffset(0);
    updateDragState(EMPTY_DRAG_STATE);
  };

  const go = (view: AppView, queueIndex: number) => {
    clearDrag();
    setVirtualActiveIndex(queueIndex);
    setActiveView(view);
  };

  const settleDrag = (event: PointerEvent<HTMLElement>) => {
    const currentDragState = dragStateRef.current;

    if (
      !currentDragState.active ||
      currentDragState.pointerId !== event.pointerId
    )
      return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!currentDragState.moved) {
      clearDrag();

      return;
    }

    suppressNextClickRef.current = true;

    const elapsed = Math.max(1, event.timeStamp - currentDragState.startTime);
    const deltaX = event.clientX - currentDragState.startX;
    const velocity = deltaX / elapsed;
    const distanceSlots = -deltaX / (QUEUE_SPACING_REM * 16);
    const velocitySlots =
      Math.abs(velocity) >= FLING_VELOCITY_PX_PER_MS
        ? -Math.sign(velocity)
        : 0;
    const slotOffset =
      velocitySlots ||
      Math.max(
        -QUEUE_RADIUS,
        Math.min(QUEUE_RADIUS, Math.round(distanceSlots)),
      );
    const nextQueueIndex = virtualActiveIndex + slotOffset;
    const nextItem =
      itemCount > 0
        ? config.navItems[positiveModulo(nextQueueIndex, itemCount)]
        : undefined;

    clearDrag();

    if (!nextItem || slotOffset === 0) return;

    setVirtualActiveIndex(nextQueueIndex);
    setActiveView(nextItem.view);
  };

  return (
    <Bar data-v2="mobile-nav" $theme={theme} aria-label="底部导航">
      <Track
        onPointerDown={(event) => {
          if (!isDragPointerType(event.pointerType)) return;

          event.currentTarget.setPointerCapture(event.pointerId);
          setDragOffset(0);
          updateDragState({
            active: true,
            moved: false,
            pointerId: event.pointerId,
            startTime: event.timeStamp,
            startX: event.clientX,
          });
        }}
        onPointerMove={(event) => {
          const currentDragState = dragStateRef.current;

          if (
            !currentDragState.active ||
            currentDragState.pointerId !== event.pointerId
          )
            return;

          const deltaX = event.clientX - currentDragState.startX;
          const moved =
            currentDragState.moved || Math.abs(deltaX) >= DRAG_ACTIVATION_PX;

          if (!moved) return;

          event.preventDefault();
          setDragOffset(deltaX / (QUEUE_SPACING_REM * 16));
          updateDragState({
            ...currentDragState,
            moved,
          });
        }}
        onPointerCancel={settleDrag}
        onPointerUp={settleDrag}
      >
        {queueItems.map(({ name, display, view, icon, offset, queueIndex }) => {
          const distance = Math.abs(offset);
          const active = queueIndex === virtualActiveIndex;

          return (
            <Tab
              key={`${name}-${String(queueIndex)}`}
              type="button"
              data-v2={`nav-${name}`}
              $active={active}
              $dragging={dragging}
              $hiddenLabel={distance >= 3}
              $theme={theme}
              aria-current={active ? 'page' : undefined}
              aria-label={display}
              style={getQueueStyle(offset, dragOffset)}
              onPointerUp={(event) => {
                const currentDragState = dragStateRef.current;

                if (
                  !isDragPointerType(event.pointerType) ||
                  !currentDragState.active ||
                  currentDragState.pointerId !== event.pointerId ||
                  currentDragState.moved
                )
                  return;

                suppressNextClickRef.current = true;
                event.preventDefault();
                go(view, queueIndex);
              }}
              onClick={(event) => {
                if (suppressNextClickRef.current) {
                  suppressNextClickRef.current = false;
                  event.preventDefault();

                  return;
                }

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

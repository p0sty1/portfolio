import { useContext, useEffect, useState } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { Theme } from 'types';

const B = {
  Container: styled.div<{ $theme: Theme }>`
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    transition: background-color 0.5s linear;
    background-color: ${({ $theme }) => $theme.background};
  `,
  Grid: styled.div<{ $theme: Theme }>`
    position: absolute;
    inset: 0;
    opacity: ${({ $theme }) => ($theme.key === 'dark' ? 0.35 : 0.5)};
    background-image:
      linear-gradient(${({ $theme }) => $theme.gridColor} 1px, transparent 1px),
      linear-gradient(
        90deg,
        ${({ $theme }) => $theme.gridColor} 1px,
        transparent 1px
      );
    background-size: 48px 48px;
    mask-image: radial-gradient(
      ellipse 80% 60% at 50% 50%,
      black 20%,
      transparent 100%
    );
  `,
  Spotlight: styled.div<{ $theme: Theme; $x: number; $y: number }>`
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(
      600px circle at ${({ $x }) => $x}px ${({ $y }) => $y}px,
      ${({ $theme }) => $theme.spotlightColor},
      transparent 42%
    );
    transition: background-color 0.5s linear;
  `,
};

export const Background = () => {
  const { theme } = useContext(AppContext);
  const [position, setPosition] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  });

  useEffect(() => {
    const updatePosition = (x: number, y: number) => {
      setPosition({ x, y });
    };

    const onMouseMove = (event: MouseEvent) => {
      updatePosition(event.clientX, event.clientY);
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) updatePosition(touch.clientX, touch.clientY);
    };

    const onResize = () => {
      updatePosition(window.innerWidth / 2, window.innerHeight / 2);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <B.Container data-v2="background" $theme={theme} aria-hidden="true">
      <B.Grid $theme={theme} />
      <B.Spotlight $x={position.x} $y={position.y} $theme={theme} />
    </B.Container>
  );
};

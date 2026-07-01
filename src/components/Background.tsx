import { useContext, useEffect, useRef, useState } from 'react';

import styled, { css, keyframes } from 'styled-components';

import { AppContext } from 'App/AppContext';
import { AppView } from 'types';

interface GradientScene {
  background: string;
}

interface GradientLayer {
  active: boolean;
  id: number;
  scene: GradientScene;
  view: AppView;
}

const gradientScenes: Record<AppView, GradientScene> = {
  home: {
    background: `
      linear-gradient(128deg, rgb(0 0 0 / 0.92) 0%, rgb(0 0 0 / 0.22) 34%, rgb(255 255 255 / 0) 68%),
      linear-gradient(118deg, #020403 0%, #042b2b 28%, #0c6264 54%, #8aa75a 80%, #eff8d3 100%)
    `,
  },
  profile: {
    background: `
      linear-gradient(132deg, rgb(0 0 0 / 0.86) 0%, rgb(0 0 0 / 0.18) 38%, rgb(255 255 255 / 0) 72%),
      linear-gradient(116deg, #041018 0%, #0a4855 36%, #b77d58 72%, #f4d6b4 100%)
    `,
  },
  likes: {
    background: `
      linear-gradient(130deg, rgb(8 2 8 / 0.9) 0%, rgb(42 13 30 / 0.38) 40%, rgb(255 255 255 / 0) 78%),
      linear-gradient(112deg, #080207 0%, #52213c 34%, #c96872 68%, #efd07b 100%)
    `,
  },
  gallery: {
    background: `
      linear-gradient(126deg, rgb(0 0 0 / 0.88) 0%, rgb(8 20 35 / 0.28) 36%, rgb(255 255 255 / 0) 74%),
      linear-gradient(118deg, #020510 0%, #10294a 35%, #2d8d9d 66%, #d8f4e8 100%)
    `,
  },
  fun: {
    background: `
      linear-gradient(130deg, rgb(0 0 0 / 0.9) 0%, rgb(12 22 14 / 0.3) 42%, rgb(255 255 255 / 0) 76%),
      linear-gradient(115deg, #050609 0%, #263a17 32%, #78bf45 66%, #18a4d8 100%)
    `,
  },
  blog: {
    background: `
      linear-gradient(130deg, rgb(0 0 0 / 0.88) 0%, rgb(21 24 18 / 0.32) 38%, rgb(255 255 255 / 0) 74%),
      linear-gradient(116deg, #060705 0%, #26382f 36%, #9a8548 70%, #eee0b8 100%)
    `,
  },
  ask: {
    background: `
      linear-gradient(132deg, rgb(0 0 0 / 0.9) 0%, rgb(10 18 38 / 0.34) 40%, rgb(255 255 255 / 0) 78%),
      linear-gradient(116deg, #030409 0%, #18223f 34%, #5d8587 68%, #efd9ad 100%)
    `,
  },
  guestbook: {
    background: `
      linear-gradient(128deg, rgb(0 0 0 / 0.9) 0%, rgb(12 25 17 / 0.3) 38%, rgb(255 255 255 / 0) 76%),
      linear-gradient(116deg, #050706 0%, #21382b 36%, #718874 70%, #d8e7df 100%)
    `,
  },
  'ideal-test': {
    background: `
      linear-gradient(130deg, rgb(0 0 0 / 0.9) 0%, rgb(49 18 30 / 0.35) 40%, rgb(255 255 255 / 0) 78%),
      linear-gradient(114deg, #090306 0%, #603344 34%, #df8868 68%, #f1e1bc 100%)
    `,
  },
};

const grainImage =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.48'/%3E%3C/svg%3E\")";

const gradientReveal = keyframes`
  from {
    opacity: 0;
    transform: scale(1.025);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const Container = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: #05070d;
`;

const Layer = styled.div<{ $active: boolean; $background: string }>`
  position: absolute;
  inset: -1.5%;
  background: ${({ $background }) => $background};
  opacity: ${({ $active }) => ($active ? 1 : 0)};
  transform: ${({ $active }) => ($active ? 'scale(1)' : 'scale(1.025)')};
  transition:
    opacity 0.95s cubic-bezier(0.22, 1, 0.36, 1),
    transform 1.25s cubic-bezier(0.22, 1, 0.36, 1);
  ${({ $active }) =>
    $active
      ? css`
          animation: ${gradientReveal} 0.95s cubic-bezier(0.22, 1, 0.36, 1) both;
        `
      : ''}
  will-change: opacity, transform;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: opacity 0.16s ease;
    transform: none;
  }
`;

const Finish = styled.div`
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 80% 70%, rgb(0 0 0 / 0), rgb(0 0 0 / 0.24) 72%),
    linear-gradient(90deg, rgb(0 0 0 / 0.48), rgb(0 0 0 / 0.08) 48%),
    linear-gradient(
      180deg,
      rgb(0 0 0 / 0.34),
      rgb(0 0 0 / 0.08) 34%,
      rgb(0 0 0 / 0.2)
    );
  pointer-events: none;
`;

const Grain = styled.div`
  position: absolute;
  inset: 0;
  background-image: ${grainImage};
  background-size: 180px 180px;
  mix-blend-mode: soft-light;
  opacity: 0.17;
  pointer-events: none;
`;

const CurrentTint = styled.div`
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 0.2);
  pointer-events: none;
`;

export const Background = () => {
  const { activeView } = useContext(AppContext);
  const nextLayerId = useRef(1);
  const [layers, setLayers] = useState<GradientLayer[]>(() => [
    {
      active: true,
      id: 0,
      scene: gradientScenes[activeView],
      view: activeView,
    },
  ]);

  useEffect(() => {
    setLayers((currentLayers) => {
      const currentActiveLayer = currentLayers.find((layer) => layer.active);

      if (currentActiveLayer?.view === activeView) return currentLayers;

      const nextLayer: GradientLayer = {
        active: true,
        id: nextLayerId.current,
        scene: gradientScenes[activeView],
        view: activeView,
      };

      nextLayerId.current += 1;

      return [
        ...currentLayers.slice(-1).map((layer) => ({
          ...layer,
          active: false,
        })),
        nextLayer,
      ];
    });

    const cleanupTimer = window.setTimeout(() => {
      setLayers((currentLayers) =>
        currentLayers.filter((layer) => layer.active),
      );
    }, 1100);

    return () => {
      window.clearTimeout(cleanupTimer);
    };
  }, [activeView]);

  return (
    <Container
      data-gradient-view={activeView}
      data-v2="background"
      aria-hidden="true"
    >
      {layers.map((layer) => (
        <Layer
          key={layer.id}
          $active={layer.active}
          $background={layer.scene.background}
          data-active={layer.active ? 'true' : 'false'}
          data-gradient-layer={layer.view}
        />
      ))}
      <Finish />
      <Grain />
      <CurrentTint />
    </Container>
  );
};

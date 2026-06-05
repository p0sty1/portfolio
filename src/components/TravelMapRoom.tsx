import {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';

import styled, { keyframes } from 'styled-components';

import { AppContext } from 'App/AppContext';

import { travelCities, type TravelCity } from '../data/travelCities';
import travelRegions from '../data/travelRegions.json';

type TravelRegionKind = 'country' | 'province';

interface TravelRegionGeometry {
  coordinates: number[];
  type: string;
}

interface TravelRegionProperties {
  id: string;
  kind: TravelRegionKind;
  name: string;
}

interface TravelRegionFeature {
  geometry: TravelRegionGeometry;
  properties: TravelRegionProperties;
  type: 'Feature';
}

interface TravelRegionCollection {
  features: TravelRegionFeature[];
  type: 'FeatureCollection';
}

interface GlobeSize {
  height: number;
  width: number;
}

interface GlobeControlApi {
  autoRotate: boolean;
  autoRotateSpeed: number;
  dampingFactor: number;
  enableDamping: boolean;
  maxDistance: number;
  minDistance: number;
}

const MAP_ASSET_BASE = `${process.env.PUBLIC_URL ?? ''}/maps`;
const EARTH_TEXTURE = `${MAP_ASSET_BASE}/earth-contrast-v2.jpg`;
const EARTH_BUMP = `${MAP_ASSET_BASE}/earth-topology.png`;

const DEFAULT_GLOBE_SIZE: GlobeSize = {
  height: 640,
  width: 960,
};

const DEFAULT_VIEW = {
  altitude: 1.2,
  lat: 34,
  lng: 108,
};

const REGION_COLORS = {
  countryCap: 'rgba(132, 226, 255, 0.24)',
  countryStroke: 'rgba(154, 232, 255, 0.72)',
  provinceCap: 'rgba(54, 205, 255, 0.32)',
  provinceStroke: 'rgba(84, 215, 255, 0.9)',
};

const MARKER_COLORS = {
  default: 'rgba(244, 252, 255, 0.92)',
  selected: 'rgba(255, 232, 128, 1)',
};

const CITY_POINT_ALTITUDE = 0.018;

const DESKTOP_RENDERER_CONFIG = {
  alpha: true,
  antialias: true,
  preserveDrawingBuffer: true,
};

const MOBILE_RENDERER_CONFIG = {
  alpha: true,
  antialias: false,
  preserveDrawingBuffer: false,
};

const COMPACT_REGION_IDS = new Set([
  'country-singapore',
  'province-hong-kong',
  'province-macau',
]);

const travelRegionFeatures = (
  travelRegions as unknown as TravelRegionCollection
).features;

const progressSweep = keyframes`
  0% {
    transform: translateX(-72%) scaleX(0.28);
  }

  45% {
    transform: translateX(-18%) scaleX(0.72);
  }

  100% {
    transform: translateX(118%) scaleX(0.36);
  }
`;

const statusPulse = keyframes`
  0%,
  100% {
    opacity: 0.56;
  }

  50% {
    opacity: 1;
  }
`;

const Page = styled.main`
  position: relative;
  z-index: 2;
  width: 100%;
  min-height: min(48rem, calc(100dvh - 2rem));
  margin: 0 auto;
  box-sizing: border-box;

  @media (width >= 769px) {
    padding: 1rem clamp(1rem, 3vw, 2rem) 2rem;
  }
`;

const GlobeStage = styled.section`
  position: relative;
  width: 100%;
  height: clamp(34rem, 76vh, 52rem);
  min-height: 0;
  overflow: hidden;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(3, 5, 10, 0.16), rgba(3, 5, 10, 0.58)), #03050a;
  color: #fff;
  isolation: isolate;

  &::after {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    content: '';
    background:
      linear-gradient(
        90deg,
        rgba(3, 5, 10, 0.14) 0%,
        transparent 28%,
        transparent 72%,
        rgba(3, 5, 10, 0.12) 100%
      ),
      linear-gradient(180deg, transparent 68%, rgba(3, 5, 10, 0.1) 100%);
  }

  canvas {
    display: block;
    cursor: grab;
  }

  canvas:active {
    cursor: grabbing;
  }

  @media (width <= 768px) {
    height: clamp(19rem, 50dvh, 28rem);
    border-radius: 14px;
  }
`;

const GlobeLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
`;

const GlobeLoadingOverlay = styled.div<{ $visible: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: radial-gradient(
    circle at 50% 42%,
    rgba(71, 205, 255, 0.18),
    rgba(3, 5, 10, 0.2) 34%,
    rgba(3, 5, 10, 0.58) 100%
  );
  color: #f8fdff;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: none;
  transition:
    opacity 0.35s ease,
    visibility 0.35s ease;
  visibility: ${({ $visible }) => ($visible ? 'visible' : 'hidden')};
`;

const GlobeLoadingStatus = styled.div`
  display: grid;
  width: min(18rem, 78vw);
  gap: 0.75rem;
  justify-items: center;
  text-align: center;
`;

const GlobeLoadingTitle = styled.p`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 780;
  letter-spacing: 0;
  text-shadow: 0 0.35rem 1.4rem rgba(0, 0, 0, 0.55);
`;

const GlobeLoadingCopy = styled.p`
  margin: 0;
  color: rgba(248, 253, 255, 0.72);
  font-size: 0.76rem;
  font-weight: 640;
  letter-spacing: 0;
  animation: ${statusPulse} 1.35s ease-in-out infinite;
`;

const GlobeLoadingBar = styled.div`
  position: relative;
  width: 100%;
  height: 0.42rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);

  &::before {
    position: absolute;
    inset: 0;
    width: 72%;
    border-radius: inherit;
    background: linear-gradient(
      90deg,
      rgba(84, 215, 255, 0.12),
      rgba(244, 252, 255, 0.92),
      rgba(255, 232, 128, 0.9)
    );
    box-shadow: 0 0 1.1rem rgba(84, 215, 255, 0.58);
    content: '';
    transform-origin: left center;
    animation: ${progressSweep} 1.55s cubic-bezier(0.45, 0, 0.2, 1) infinite;
  }
`;

const ControlDock = styled.div`
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  z-index: 2;
  display: flex;
  gap: 0.45rem;

  @media (width <= 520px) {
    right: 0.75rem;
    bottom: 0.75rem;
  }
`;

const ControlButton = styled.button`
  display: grid;
  place-items: center;
  width: 2.4rem;
  aspect-ratio: 1;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(8, 10, 18, 0.62);
  color: #f8fbff;
  cursor: pointer;
  font: inherit;
  font-size: 1rem;
  font-weight: 820;
  line-height: 1;
  backdrop-filter: blur(14px);
  transition:
    background 0.16s ease,
    border-color 0.16s ease,
    transform 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(255, 255, 255, 0.42);
    background: rgba(20, 28, 44, 0.78);
  }
`;

const SelectedCityPanel = styled.div`
  position: absolute;
  left: 1rem;
  bottom: 1rem;
  z-index: 2;
  max-width: min(15rem, calc(100% - 8.5rem));
  padding: 0.58rem 0.72rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  background: rgba(5, 10, 18, 0.68);
  color: #f8fdff;
  font-size: 0.78rem;
  font-weight: 760;
  line-height: 1.15;
  pointer-events: none;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.45);

  @media (width <= 520px) {
    left: 0.75rem;
    bottom: 0.75rem;
    max-width: min(12rem, calc(100% - 8rem));
  }
`;

const pickRegion = (item: object) => item as TravelRegionFeature;

const pickCity = (item: object) => item as TravelCity;

const getControls = (globe: GlobeMethods) =>
  globe.controls() as unknown as GlobeControlApi;

const getRegionGeometry = (item: object) => pickRegion(item).geometry;

const getRegionFillColor = (item: object) =>
  pickRegion(item).properties.kind === 'province'
    ? REGION_COLORS.provinceCap
    : REGION_COLORS.countryCap;

const getRegionStrokeColor = (item: object) =>
  pickRegion(item).properties.kind === 'province'
    ? REGION_COLORS.provinceStroke
    : REGION_COLORS.countryStroke;

const getRegionHexResolution = (item: object) => {
  const region = pickRegion(item);

  if (COMPACT_REGION_IDS.has(region.properties.id)) return 5;

  return region.properties.kind === 'province' ? 4 : 3;
};

const getMobileRegionHexResolution = (item: object) => {
  const region = pickRegion(item);

  if (COMPACT_REGION_IDS.has(region.properties.id)) return 4;

  return region.properties.kind === 'province' ? 3 : 2;
};

const getCityLabel = (city: TravelCity) => `${city.country}-${city.city}`;

const getPointAltitude = () => CITY_POINT_ALTITUDE;

const getEmptyTooltip = () => '';

export const TravelMapRoom = ({ children }: { children?: ReactNode }) => {
  const { isMobile } = useContext(AppContext);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const stageRef = useRef<HTMLDivElement>(null);
  const [globeSize, setGlobeSize] = useState<GlobeSize>(DEFAULT_GLOBE_SIZE);
  const [ready, setReady] = useState(false);
  const [selectedCity, setSelectedCity] = useState<null | TravelCity>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const updateSize = () => {
      const nextWidth = Math.max(320, Math.round(stage.clientWidth));
      const measuredHeight = Math.round(stage.clientHeight);
      const nextHeight = Math.max(
        260,
        measuredHeight || DEFAULT_GLOBE_SIZE.height,
      );

      setGlobeSize({ height: nextHeight, width: nextWidth });
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateSize);

      return () => {
        window.removeEventListener('resize', updateSize);
      };
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(stage);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const globe = globeRef.current;
    if (!ready || !globe) return;

    const controls = getControls(globe);
    controls.autoRotate = !isMobile;
    controls.autoRotateSpeed = isMobile ? 0.18 : 0.42;
    controls.enableDamping = true;
    controls.dampingFactor = isMobile ? 0.12 : 0.08;
    controls.minDistance = 170;
    controls.maxDistance = 470;

    globe.pointOfView(DEFAULT_VIEW, isMobile ? 560 : 900);
  }, [isMobile, ready]);

  const zoomBy = useCallback((delta: number) => {
    const globe = globeRef.current;
    if (!globe) return;

    const pov = globe.pointOfView();
    const altitude = Math.min(3.6, Math.max(0.95, pov.altitude + delta));
    globe.pointOfView({ altitude }, 360);
  }, []);

  const handleCityClick = useCallback(
    (item: object) => {
      const city = pickCity(item);
      const globe = globeRef.current;

      setSelectedCity(city);

      if (!globe) return;

      const controls = getControls(globe);
      controls.autoRotate = false;
      globe.pointOfView(
        { altitude: isMobile ? 1.18 : 1.08, lat: city.lat, lng: city.lng },
        isMobile ? 420 : 560,
      );
    },
    [isMobile],
  );

  const resetGlobe = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const controls = getControls(globe);
    controls.autoRotate = !isMobile;
    setSelectedCity(null);
    globe.pointOfView(DEFAULT_VIEW, isMobile ? 480 : 700);
  }, [isMobile]);

  const getPointColor = useCallback(
    (item: object) =>
      pickCity(item).id === selectedCity?.id
        ? MARKER_COLORS.selected
        : MARKER_COLORS.default,
    [selectedCity?.id],
  );

  const getPointRadius = useCallback(
    (item: object) => {
      const selected = pickCity(item).id === selectedCity?.id;

      if (isMobile) return selected ? 0.34 : 0.24;

      return selected ? 0.28 : 0.18;
    },
    [isMobile, selectedCity?.id],
  );

  return (
    <Page data-page-root data-v2="travel-map-room">
      <GlobeStage ref={stageRef} data-v2="travel-globe-stage">
        <GlobeLayer data-v2="travel-globe-layer">
          <Globe
            ref={globeRef}
            width={globeSize.width}
            height={globeSize.height}
            backgroundColor="rgba(0,0,0,0)"
            backgroundImageUrl={null}
            globeImageUrl={EARTH_TEXTURE}
            bumpImageUrl={isMobile ? null : EARTH_BUMP}
            rendererConfig={
              isMobile ? MOBILE_RENDERER_CONFIG : DESKTOP_RENDERER_CONFIG
            }
            showAtmosphere={false}
            animateIn={!isMobile}
            waitForGlobeReady={true}
            polygonsData={travelRegionFeatures}
            polygonGeoJsonGeometry={getRegionGeometry}
            polygonAltitude={0.006}
            polygonCapColor={() => ''}
            polygonSideColor={() => ''}
            polygonStrokeColor={getRegionStrokeColor}
            polygonsTransitionDuration={isMobile ? 0 : 700}
            hexPolygonsData={isMobile ? [] : travelRegionFeatures}
            hexPolygonGeoJsonGeometry={getRegionGeometry}
            hexPolygonResolution={
              isMobile ? getMobileRegionHexResolution : getRegionHexResolution
            }
            hexPolygonMargin={isMobile ? 0.08 : 0.05}
            hexPolygonAltitude={0.008}
            hexPolygonColor={getRegionFillColor}
            hexPolygonCurvatureResolution={isMobile ? 1 : 3}
            hexPolygonsTransitionDuration={isMobile ? 0 : 700}
            hexPolygonLabel={() => ''}
            pointsData={travelCities}
            pointLat="lat"
            pointLng="lng"
            pointAltitude={getPointAltitude}
            pointRadius={getPointRadius}
            pointResolution={isMobile ? 8 : 18}
            pointColor={getPointColor}
            pointLabel={getEmptyTooltip}
            pointsMerge={false}
            pointsTransitionDuration={isMobile ? 0 : 180}
            onPointClick={handleCityClick}
            onGlobeReady={() => {
              setReady(true);
            }}
          />
        </GlobeLayer>
        <GlobeLoadingOverlay
          $visible={!ready}
          aria-hidden={ready}
          aria-live="polite"
          role="status"
        >
          <GlobeLoadingStatus>
            <GlobeLoadingTitle>足迹正在加载中</GlobeLoadingTitle>
            <GlobeLoadingBar aria-hidden="true" />
            <GlobeLoadingCopy>正在点亮去过的城市</GlobeLoadingCopy>
          </GlobeLoadingStatus>
        </GlobeLoadingOverlay>
        {selectedCity ? (
          <SelectedCityPanel>{getCityLabel(selectedCity)}</SelectedCityPanel>
        ) : null}
        <ControlDock aria-label="Globe controls">
          <ControlButton
            type="button"
            aria-label="Zoom in"
            onClick={() => {
              zoomBy(-0.42);
            }}
          >
            +
          </ControlButton>
          <ControlButton
            type="button"
            aria-label="Zoom out"
            onClick={() => {
              zoomBy(0.42);
            }}
          >
            -
          </ControlButton>
          <ControlButton
            type="button"
            aria-label="Reset globe"
            onClick={resetGlobe}
          >
            1x
          </ControlButton>
        </ControlDock>
      </GlobeStage>
      {children}
    </Page>
  );
};

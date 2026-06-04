import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';

import styled from 'styled-components';

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

interface TravelCityMarker extends TravelCity {
  isSelected: boolean;
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

const RENDERER_CONFIG = {
  alpha: true,
  antialias: true,
  preserveDrawingBuffer: true,
};

const COMPACT_REGION_IDS = new Set([
  'country-singapore',
  'province-hong-kong',
  'province-macau',
]);

const travelRegionFeatures = (
  travelRegions as unknown as TravelRegionCollection
).features;

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

  .travel-city-marker {
    position: relative;
    display: grid;
    place-items: center;
    pointer-events: auto;
    transform: translate(-50%, -50%);
  }

  .travel-city-marker__dot {
    width: 0.62rem;
    aspect-ratio: 1;
    padding: 0;
    border: 1px solid rgba(5, 14, 22, 0.72);
    border-radius: 999px;
    background: ${MARKER_COLORS.default};
    box-shadow:
      0 0 0 3px rgba(84, 215, 255, 0.22),
      0 0 16px rgba(84, 215, 255, 0.42);
    cursor: pointer;
    transition:
      background 0.16s ease,
      box-shadow 0.16s ease,
      transform 0.16s ease,
      width 0.16s ease;
  }

  .travel-city-marker__dot:hover,
  .travel-city-marker--selected .travel-city-marker__dot {
    width: 0.82rem;
    background: ${MARKER_COLORS.selected};
    box-shadow:
      0 0 0 4px rgba(255, 232, 128, 0.2),
      0 0 18px rgba(255, 232, 128, 0.5);
    transform: translateY(-1px);
  }

  .travel-city-marker__label {
    position: absolute;
    bottom: calc(100% + 0.42rem);
    left: 50%;
    padding: 0.28rem 0.48rem;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 999px;
    background: rgba(5, 10, 18, 0.8);
    box-shadow: 0 0.65rem 1.4rem rgba(0, 0, 0, 0.28);
    color: #f8fdff;
    font-size: 0.72rem;
    font-weight: 760;
    line-height: 1;
    pointer-events: none;
    text-shadow: 0 1px 5px rgba(0, 0, 0, 0.55);
    transform: translateX(-50%);
    white-space: nowrap;
  }

  @media (width <= 768px) {
    height: min(72vh, 38rem);
    border-radius: 14px;
  }
`;

const GlobeLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
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

const pickRegion = (item: object) => item as TravelRegionFeature;

const pickCity = (item: object) => item as TravelCity;

const pickCityMarker = (item: object) => item as TravelCityMarker;

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

const getCityLabel = (city: TravelCity) => `${city.country}-${city.city}`;

export const TravelMapRoom = ({ children }: { children?: ReactNode }) => {
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
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.42;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 170;
    controls.maxDistance = 470;

    globe.pointOfView(DEFAULT_VIEW, 900);
  }, [ready]);

  const zoomBy = useCallback((delta: number) => {
    const globe = globeRef.current;
    if (!globe) return;

    const pov = globe.pointOfView();
    const altitude = Math.min(3.6, Math.max(0.95, pov.altitude + delta));
    globe.pointOfView({ altitude }, 360);
  }, []);

  const handleCityClick = useCallback((item: object) => {
    const city = pickCity(item);
    const globe = globeRef.current;

    setSelectedCity(city);

    if (!globe) return;

    const controls = getControls(globe);
    controls.autoRotate = false;
    globe.pointOfView({ altitude: 1.08, lat: city.lat, lng: city.lng }, 560);
  }, []);

  const resetGlobe = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const controls = getControls(globe);
    controls.autoRotate = true;
    setSelectedCity(null);
    globe.pointOfView(DEFAULT_VIEW, 700);
  }, []);

  const cityMarkerData = useMemo(
    () =>
      travelCities.map((city) => ({
        ...city,
        isSelected: city.id === selectedCity?.id,
      })),
    [selectedCity?.id],
  );

  const createCityMarker = useCallback(
    (item: object) => {
      const city = pickCityMarker(item);
      const marker = document.createElement('div');
      marker.className = `travel-city-marker${
        city.isSelected ? ' travel-city-marker--selected' : ''
      }`;

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'travel-city-marker__dot';
      dot.setAttribute('aria-label', getCityLabel(city));
      dot.addEventListener('click', (event) => {
        event.stopPropagation();
        handleCityClick(city);
      });
      marker.appendChild(dot);

      if (city.isSelected) {
        const label = document.createElement('span');
        label.className = 'travel-city-marker__label';
        label.textContent = getCityLabel(city);
        marker.appendChild(label);
      }

      return marker;
    },
    [handleCityClick],
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
            bumpImageUrl={EARTH_BUMP}
            rendererConfig={RENDERER_CONFIG}
            showAtmosphere={false}
            animateIn={true}
            waitForGlobeReady={true}
            polygonsData={travelRegionFeatures}
            polygonGeoJsonGeometry={getRegionGeometry}
            polygonAltitude={0.006}
            polygonCapColor={() => ''}
            polygonSideColor={() => ''}
            polygonStrokeColor={getRegionStrokeColor}
            polygonsTransitionDuration={700}
            hexPolygonsData={travelRegionFeatures}
            hexPolygonGeoJsonGeometry={getRegionGeometry}
            hexPolygonResolution={getRegionHexResolution}
            hexPolygonMargin={0.05}
            hexPolygonAltitude={0.008}
            hexPolygonColor={getRegionFillColor}
            hexPolygonCurvatureResolution={3}
            hexPolygonsTransitionDuration={700}
            hexPolygonLabel={() => ''}
            htmlElementsData={cityMarkerData}
            htmlLat="lat"
            htmlLng="lng"
            htmlAltitude={0.055}
            htmlElement={createCityMarker}
            htmlElementVisibilityModifier={(element, isVisible) => {
              element.style.opacity = isVisible ? '1' : '0';
              element.style.pointerEvents = isVisible ? 'auto' : 'none';
            }}
            htmlTransitionDuration={180}
            onGlobeReady={() => {
              setReady(true);
            }}
          />
        </GlobeLayer>
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

type TravelGlobeModule = typeof import('react-globe.gl');

let travelGlobePromise: Promise<TravelGlobeModule> | undefined;

export const loadTravelGlobe = () => {
  travelGlobePromise ??= import('react-globe.gl');

  return travelGlobePromise;
};

export const preloadTravelGlobe = () => {
  void loadTravelGlobe();
};

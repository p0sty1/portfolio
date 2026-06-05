import { lazy, Suspense, useContext, useEffect, useState } from 'react';

import { Background } from 'components/Background';
import { Footer } from 'components/Footer';
import { HomeScreen } from 'components/HomeScreen';
import { MobileHeader } from 'components/MobileHeader';
import { MobileNav } from 'components/MobileNav';
import { Sidebar } from 'components/Sidebar';
import { preloadTravelGlobe } from 'components/travelGlobeLoader';
import { scheduleIdleTask } from 'lib/scheduleIdleTask';

import './App.scss';
import { AppContext, AppProvider } from './AppContext';
import { config } from './config';

const AskRoom = lazy(() =>
  import('components/SocialRooms').then((module) => ({
    default: module.AskRoom,
  })),
);
const BlogRoom = lazy(() =>
  import('components/BlogRoom').then((module) => ({
    default: module.BlogRoom,
  })),
);
const FunRoom = lazy(() =>
  import('components/SocialRooms').then((module) => ({
    default: module.FunRoom,
  })),
);
const Gallery = lazy(() =>
  import('components/Gallery').then((module) => ({
    default: module.Gallery,
  })),
);
const Guestbook = lazy(() =>
  import('components/Guestbook').then((module) => ({
    default: module.Guestbook,
  })),
);
const IdealTypeTestRoom = lazy(() =>
  import('components/SocialRooms').then((module) => ({
    default: module.IdealTypeTestRoom,
  })),
);
const Likes = lazy(() =>
  import('components/Likes').then((module) => ({
    default: module.Likes,
  })),
);
const ProfileRoom = lazy(() =>
  import('components/SocialRooms').then((module) => ({
    default: module.ProfileRoom,
  })),
);

const ViewLoading = () => (
  <div className="app-view-loading" role="status" aria-live="polite">
    <span aria-hidden="true" />
  </div>
);

const AppViews = () => {
  const { activeView } = useContext(AppContext);

  if (activeView === 'profile') {
    return (
      <div className="app-view app-view-profile" aria-label="Profile">
        <ProfileRoom />
      </div>
    );
  }

  if (activeView === 'gallery') {
    return (
      <div className="app-view app-view-gallery" aria-label="Gallery">
        <Gallery />
      </div>
    );
  }

  if (activeView === 'guestbook') {
    return (
      <div className="app-view app-view-guestbook" aria-label="Guestbook">
        <Guestbook />
        <Footer />
      </div>
    );
  }

  if (activeView === 'blog') {
    return (
      <div className="app-view app-view-blog" aria-label="Blog">
        <BlogRoom />
      </div>
    );
  }

  if (activeView === 'ask') {
    return (
      <div className="app-view app-view-ask" aria-label="Ask">
        <AskRoom />
      </div>
    );
  }

  if (activeView === 'likes') {
    return (
      <div className="app-view app-view-likes" aria-label="Likes">
        <Likes />
      </div>
    );
  }

  if (activeView === 'fun') {
    return (
      <div className="app-view app-view-fun" aria-label="Fun">
        <FunRoom />
      </div>
    );
  }

  if (activeView === 'ideal-test') {
    return (
      <div
        className="app-view app-view-ideal-test"
        aria-label="Ideal Type Test"
      >
        <IdealTypeTestRoom />
      </div>
    );
  }

  return (
    <section id="home" className="app-view app-view-home" aria-label="Home">
      <HomeScreen />
    </section>
  );
};

export const App = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(
    () =>
      scheduleIdleTask(preloadTravelGlobe, {
        delay: 900,
        timeout: 1800,
      }),
    [],
  );

  useEffect(() => {
    const mediaQuery = '(max-width: 768px)';
    const mediaQueryList = window.matchMedia(mediaQuery);

    const updateIsMobile = () => {
      setIsMobile(mediaQueryList.matches);
    };

    updateIsMobile();
    mediaQueryList.addEventListener('change', updateIsMobile);

    return () => {
      mediaQueryList.removeEventListener('change', updateIsMobile);
    };
  }, []);

  return (
    <AppProvider config={config} isMobile={isMobile}>
      <main className="app">
        <div className={`app-shell${isMobile ? ' app-shell-mobile' : ''}`}>
          {isMobile ? <MobileHeader /> : <Sidebar />}
          <div className={`app-main${isMobile ? ' app-main-mobile' : ''}`}>
            <Suspense fallback={<ViewLoading />}>
              <AppViews />
            </Suspense>
          </div>
          {isMobile ? <MobileNav /> : null}
        </div>
        <Background />
      </main>
    </AppProvider>
  );
};

import { lazy, Suspense, useContext, useEffect, useState } from 'react';

import { AdminScreen } from 'components/AdminScreen';
import { Background } from 'components/Background';
import { Footer } from 'components/Footer';
import { HomeScreen } from 'components/HomeScreen';
import { MobileHeader } from 'components/MobileHeader';
import { MobileNav } from 'components/MobileNav';
import { Sidebar } from 'components/Sidebar';

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
    <div className="app-view-loading-card" aria-hidden="true">
      <div className="app-view-loading-heading" />
      <div className="app-view-loading-row">
        <div className="app-view-loading-avatar" />
        <div className="app-view-loading-copy">
          <div />
          <div />
        </div>
      </div>
      <div className="app-view-loading-media" />
      <div className="app-view-loading-line" />
    </div>
    <span className="app-view-loading-label">页面加载中</span>
  </div>
);

const isAdminPath = () => {
  if (typeof window === 'undefined') return false;

  return window.location.pathname.replace(/\/+$/, '') === '/admin';
};

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
  const [isAdminRoute, setIsAdminRoute] = useState(isAdminPath);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateRoute = () => {
      setIsAdminRoute(isAdminPath());
    };

    window.addEventListener('popstate', updateRoute);

    return () => {
      window.removeEventListener('popstate', updateRoute);
    };
  }, []);

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
        <div
          className={`app-shell${isMobile ? ' app-shell-mobile' : ''}${
            isAdminRoute ? ' app-shell-admin' : ''
          }`}
        >
          {isAdminRoute ? null : isMobile ? <MobileHeader /> : <Sidebar />}
          <div
            className={`app-main${isMobile ? ' app-main-mobile' : ''}${
              isAdminRoute ? ' app-main-admin' : ''
            }`}
          >
            {isAdminRoute ? (
              <div className="app-view app-view-admin" aria-label="Admin">
                <AdminScreen />
              </div>
            ) : (
              <Suspense fallback={<ViewLoading />}>
                <AppViews />
              </Suspense>
            )}
          </div>
          {isMobile && !isAdminRoute ? <MobileNav /> : null}
        </div>
        <Background />
      </main>
    </AppProvider>
  );
};

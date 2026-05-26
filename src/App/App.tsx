import { useContext, useEffect, useState } from 'react';

import {
  Background,
  Footer,
  Gallery,
  Guestbook,
  HomeScreen,
  Likes,
} from 'components';

import './App.scss';
import { AppContext, AppProvider } from './AppContext';
import { config } from './config';

const AppViews = () => {
  const { activeView } = useContext(AppContext);

  if (activeView === 'gallery') {
    return (
      <div className="app-viewport">
        <div className="app-view app-view-gallery" aria-label="Gallery">
          <Gallery />
        </div>
      </div>
    );
  }

  if (activeView === 'guestbook') {
    return (
      <div className="app-viewport">
        <div className="app-view app-view-guestbook" aria-label="Guestbook">
          <Guestbook />
          <Footer />
        </div>
      </div>
    );
  }

  if (activeView === 'likes') {
    return (
      <div className="app-viewport">
        <div className="app-view app-view-likes" aria-label="Likes">
          <Likes />
        </div>
      </div>
    );
  }

  return (
    <div className="app-viewport">
      <section id="home" className="app-page app-page-home" aria-label="Home">
        <HomeScreen />
      </section>
    </div>
  );
};

export const App = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    /** ≤768px: iPhone layout · wider: iPad / desktop web */
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
        <AppViews />
        <Background />
      </main>
    </AppProvider>
  );
};

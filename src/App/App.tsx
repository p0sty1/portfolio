import { useEffect, useState } from 'react';

import {
  Background,
  Content,
  DoingSection,
  Footer,
  Guestbook,
  ScrollHint,
  Toggle,
} from 'components';

import './App.scss';
import { AppProvider } from './AppContext';
import { config } from './config';

export const App = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery =
      '(max-device-width: 820px) and (-webkit-min-device-pixel-ratio: 2)';
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
        <Toggle />
        <div className="app-pages">
          <section
            id="home"
            className="app-page app-page-home"
            aria-label="Home"
          >
            <div className="app-hero-inner">
              <Content />
              <DoingSection />
              <ScrollHint />
            </div>
          </section>
          <section
            id="guestbook"
            className="app-page app-page-guestbook"
            aria-label="Guestbook"
          >
            <Guestbook />
          </section>
        </div>
        <Footer />
        <Background />
      </main>
    </AppProvider>
  );
};

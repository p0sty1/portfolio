import { useContext } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { homePlatformVars } from 'styles/iosHomeTokens';

import { ContactDock } from './ContactDock';
import { DoingSection } from './DoingSection';
import { ProfileWidget } from './ProfileWidget';

const Screen = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--screen-max, 24.375rem);
  height: 100%;
  min-height: 0;
  margin: 0 auto;
  padding: 0 var(--screen-pad-x, 1.375rem);
  padding-bottom: var(--dock-bottom, 0.75rem);
  box-sizing: border-box;
  overflow: visible;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display',
    system-ui, sans-serif;
`;

const Top = styled.header`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--widget-grid-gap, 1.25rem);
`;

const Wallpaper = styled.div`
  flex: 1 1 auto;
  min-height: 0.5rem;
`;

const DockWrap = styled.footer`
  flex-shrink: 0;
  width: 100%;
  margin-top: auto;
  padding-top: 0.75rem;
  position: relative;
  z-index: 10;
`;

export const HomeScreen = () => {
  const { isMobile } = useContext(AppContext);
  const platformClass = isMobile ? 'ios-home-iphone' : 'ios-home-ipad';

  return (
    <Screen
      className={`ios-home ${platformClass}`}
      data-v2="home-screen"
      style={homePlatformVars(isMobile)}
      aria-label={isMobile ? 'iPhone home' : 'iPad home'}
    >
      <Top>
        <ProfileWidget compact={isMobile} />
        <DoingSection />
      </Top>
      <Wallpaper aria-hidden="true" />
      <DockWrap style={homePlatformVars(isMobile)}>
        <ContactDock showLabels />
      </DockWrap>
    </Screen>
  );
};

import styled from 'styled-components';

import { TimelineFeed } from './TimelineFeed';

const Main = styled.main`
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 43rem;
  margin: 0 auto;
  box-sizing: border-box;

  @media (width >= 769px) {
    padding: 1.35rem clamp(1rem, 3vw, 1.6rem) 3rem;
  }
`;

const FeedColumn = styled.section`
  display: grid;
  min-width: 0;
`;

export const HomeScreen = () => (
  <Main data-page-root data-v2="home-screen" aria-label="主页">
    <FeedColumn aria-label="动态栏">
      <TimelineFeed />
    </FeedColumn>
  </Main>
);

import { useContext } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { Theme } from 'types';

import { ProfileWidget } from './ProfileWidget';

const Main = styled.main`
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 42rem;
  margin: 0 auto;
  box-sizing: border-box;

  @media (width >= 769px) {
    padding: 2rem clamp(1.25rem, 4vw, 2rem) 2.5rem;
  }
`;

const Intro = styled.p<{ $theme: Theme }>`
  margin: 1.5rem 0 0;
  font-size: 0.95rem;
  line-height: 1.65;
  color: ${({ $theme }) => $theme.secondaryTextColor};
`;

const SectionTitle = styled.h2<{ $theme: Theme }>`
  margin: 2rem 0 0.85rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
`;

const QuickGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
  gap: 0.65rem;

  @media (width <= 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;
  }
`;

const QuickCard = styled.button<{ $theme: Theme }>`
  padding: 1rem 0.85rem;
  border-radius: 14px;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  background: ${({ $theme }) => $theme.cardBackground};
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    border-color: ${({ $theme }) => $theme.cardHoverBorder};
    transform: translateY(-2px);
  }

  strong {
    display: block;
    font-size: 0.92rem;
    font-weight: 600;
    color: ${({ $theme }) => $theme.primaryTextColor};
    margin-bottom: 0.25rem;
  }

  span {
    font-size: 0.72rem;
    color: ${({ $theme }) => $theme.tertiaryTextColor};
    line-height: 1.4;
  }
`;

export const HomeScreen = () => {
  const { config, theme, setActiveView, isMobile } = useContext(AppContext);

  return (
    <Main data-page-root data-v2="home-screen" aria-label="主页">
      <ProfileWidget compact={isMobile} />
      <Intro $theme={theme}>{config.bio.display}</Intro>

      <SectionTitle $theme={theme}>快捷入口</SectionTitle>
      <QuickGrid>
        {config.navItems
          .filter((item) => item.view !== 'home')
          .map((item) => (
            <QuickCard
              key={item.name}
              type="button"
              data-v2={`quick-${item.name}`}
              $theme={theme}
              onClick={() => {
                setActiveView(item.view);
              }}
            >
              <strong>{item.display}</strong>
              <span>打开{item.display}</span>
            </QuickCard>
          ))}
      </QuickGrid>
    </Main>
  );
};

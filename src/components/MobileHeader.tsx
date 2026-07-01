import { useContext } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { Theme } from 'types';

import { BrandLogo } from './BrandLogo';

const Header = styled.header<{ $theme: Theme }>`
  position: relative;
  z-index: 5;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: calc(3.85rem + env(safe-area-inset-top, 0px));
  padding: calc(0.55rem + env(safe-area-inset-top, 0px)) 1rem 0.55rem;
  box-sizing: border-box;
  border-bottom: 1px solid ${({ $theme }) => $theme.cardBorder};
  background:
    ${({ $theme }) => $theme.glassInsetHighlight},
    ${({ $theme }) => $theme.glassBackground};
  box-shadow: ${({ $theme }) => $theme.glassShadow};
`;

export const MobileHeader = () => {
  const { config, theme } = useContext(AppContext);
  const logoSrc = `${process.env.PUBLIC_URL ?? ''}${config.brand.logoSrc}`;

  return (
    <Header data-v2="mobile-header" $theme={theme}>
      <BrandLogo alt={config.brand.logoAlt} src={logoSrc} variant="header" />
    </Header>
  );
};

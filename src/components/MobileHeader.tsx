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
  min-height: calc(4.25rem + env(safe-area-inset-top, 0px));
  padding: calc(0.75rem + env(safe-area-inset-top, 0px)) 1.25rem 0.85rem;
  box-sizing: border-box;
  border-bottom: 1px solid ${({ $theme }) => $theme.cardBorder};
  background: ${({ $theme }) =>
    $theme.key === 'dark'
      ? 'rgba(22, 22, 29, 0.92)'
      : 'rgba(255, 255, 255, 0.92)'};
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
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

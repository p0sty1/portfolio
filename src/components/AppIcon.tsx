import type { ReactNode } from 'react';

import styled from 'styled-components';

const Squircle = styled.span<{ $bg: string; $size?: 'app' | 'dock' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${({ $size }) =>
    $size === 'dock'
      ? 'var(--dock-icon-size, 3.5rem)'
      : 'var(--icon-size, 3.75rem)'};
  height: ${({ $size }) =>
    $size === 'dock'
      ? 'var(--dock-icon-size, 3.5rem)'
      : 'var(--icon-size, 3.75rem)'};
  min-width: ${({ $size }) => ($size === 'dock' ? '3.5rem' : '3.75rem')};
  min-height: ${({ $size }) => ($size === 'dock' ? '3.5rem' : '3.75rem')};
  border-radius: var(--icon-radius, 22%);
  background: ${({ $bg }) => $bg};
  color: #ffffff;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.28) inset,
    0 3px 10px rgba(0, 0, 0, 0.35);

  svg {
    width: 54%;
    height: 54%;
    min-width: 1.125rem;
    min-height: 1.125rem;
    display: block;
    flex-shrink: 0;
  }
`;

const Label = styled.span<{ $onDock?: boolean }>`
  display: block;
  width: 100%;
  max-width: ${({ $onDock }) =>
    $onDock ? '5rem' : 'calc(var(--icon-size, 3.75rem) + 0.5rem)'};
  font-family: inherit;
  font-size: var(--label-size, 0.6875rem);
  font-weight: var(--label-weight, 400);
  line-height: 1.12;
  text-align: center;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55);
`;

const Wrap = styled.span<{ $isDock?: boolean }>`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: var(--icon-label-gap, 0.3125rem);
  width: ${({ $isDock }) => ($isDock ? 'auto' : 'var(--icon-size, 3.75rem)')};
  min-width: ${({ $isDock }) =>
    $isDock ? 'var(--dock-icon-size, 3.5rem)' : 'auto'};
`;

export interface AppIconProps {
  gradient: string;
  label?: string;
  children: ReactNode;
  size?: 'app' | 'dock';
  hideLabel?: boolean;
}

export const AppIcon = ({
  gradient,
  label,
  children,
  size = 'app',
  hideLabel = false,
}: AppIconProps) => (
  <Wrap $isDock={size === 'dock'}>
    <Squircle $bg={gradient} $size={size} data-v2="app-icon-squircle">
      {children}
    </Squircle>
    {label && !hideLabel ? (
      <Label $onDock={size === 'dock'}>{label}</Label>
    ) : null}
  </Wrap>
);

export { homePlatformVars as homePlatformStyle } from 'styles/iosHomeTokens';

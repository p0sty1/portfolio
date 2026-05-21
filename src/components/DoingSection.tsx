import { useCallback, useContext } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { viewFromHref } from 'lib/navigation';

import { AppIcon } from './AppIcon';

const Section = styled.section`
  width: 100%;
`;

const Grid = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(var(--grid-columns, 4), 1fr);
  column-gap: var(--grid-col-gap, 1.125rem);
  row-gap: var(--grid-row-gap, 1.375rem);
  justify-items: center;
  align-content: start;
`;

const AppButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  max-width: calc(var(--icon-size, 3.75rem) + 0.25rem);
  margin: 0 auto;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.72;
    transform: scale(0.9);
  }

  @media (prefers-reduced-motion: reduce) {
    &:active {
      transform: none;
    }
  }
`;

export const DoingSection = () => {
  const { config, setActiveView } = useContext(AppContext);

  const handleClick = useCallback(
    (href: string) => {
      const view = viewFromHref(href);
      if (view) setActiveView(view);
    },
    [setActiveView],
  );

  return (
    <Section data-v2="doing-section" aria-label="Apps">
      <Grid>
        {config.doingItems.map(
          ({ name, display, description, icon, iconGradient, href }) => (
            <AppButton
              key={name}
              type="button"
              data-v2={`doing-${name}`}
              aria-label={`${display}，${description}`}
              onClick={() => {
                handleClick(href);
              }}
            >
              <AppIcon gradient={iconGradient} label={display}>
                {icon}
              </AppIcon>
            </AppButton>
          ),
        )}
      </Grid>
    </Section>
  );
};

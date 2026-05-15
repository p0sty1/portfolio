import { act } from 'react';

import { configure, fireEvent, render, screen } from '@testing-library/react';

import '__mocks__/matchMedia';
import { App } from 'App/App';
import { AppProvider, reducer } from 'App/AppContext';
import { themes } from 'appearance';
import { Footer } from 'components';

configure({ testIdAttribute: 'data-v2' });

const mockState = {
  config: {
    name: { display: 'Default Name' },
    title: { display: 'Default Title' },
    buttons: [
      {
        name: 'Default Button',
        display: 'Default Display',
        ariaLabel: 'Default Aria Label',
        icon: <></>,
        href: '#',
      },
    ],
  },
  isMobile: false,
  theme: themes.dark,
  setTheme: () => undefined,
};

describe('application tests', () => {
  beforeEach(async () => {
    await act(() => render(<App />));
  });

  /**
   * Check content element
   * @param {HTMLElement} element Element for the content
   * @param {RegExp} display Display value for the content
   * @param {string} link Optional link within the content
   */
  const checkContent = (
    element: HTMLElement,
    display: RegExp,
    link?: string,
    skipA11yNameCheck?: boolean,
  ) => {
    expect(element).toBeVisible();
    if (!skipA11yNameCheck) expect(element).toHaveAccessibleName();
    expect(element).toHaveTextContent(display);
    if (link) expect(element).toHaveAttribute('href', link);
  };

  /**
   * Check button element
   * @param {HTMLElement} parent Parent element for the button
   * @param {HTMLElement} child Child element for the button
   * @param {RegExp} display Display value for the button
   * @param {string} link Link within the button
   */
  const checkButton = (
    parent: HTMLElement,
    child: HTMLElement,
    display: RegExp,
    link: string,
  ) => {
    expect(child).toHaveTextContent(display);

    expect(parent).toBeVisible();
    expect(parent).toHaveAccessibleName();
    expect(parent).toHaveAttribute('href', link);
  };

  it('should render name: Your Name', () => {
    const element = screen.getByTestId('name');

    checkContent(element, /^Your Name$/, undefined, true);
  });

  it('should render title: Full Stack Developer', () => {
    const element = screen.getByTestId('title');

    checkContent(element, /^Full Stack Developer$/, undefined, true);
  });

  it('should render creator', () => {
    const element = screen.getByTestId('creator');

    checkContent(element, /^Your Name$/, '#');
  });

  it('should render link to source code', () => {
    const element = screen.getByTestId('source');

    checkContent(element, /^Source$/, '#');
  });

  it('should render GitHub button', () => {
    const parent = screen.getByTestId('button-GitHub');
    const child = screen.getByTestId('GitHub');

    checkButton(parent, child, /^GitHub$/, 'https://github.com/p0sty1');
  });

  it('should render LinkedIn button', () => {
    const parent = screen.getByTestId('button-LinkedIn');
    const child = screen.getByTestId('LinkedIn');

    checkButton(
      parent,
      child,
      /^LinkedIn$/,
      'https://www.linkedin.com/in/boyu-jiang-7a106b383/',
    );
  });

  it('should render Resume button', () => {
    const parent = screen.getByTestId('button-Resume');
    const child = screen.getByTestId('Resume');

    checkButton(parent, child, /^Resume$/, '#');
  });

  it('should render Email button', () => {
    const parent = screen.getByTestId('button-Email');
    const child = screen.getByTestId('Email');

    checkButton(parent, child, /^Email$/, 'mailto:jyangb1y@g.ucla.edu');
  });

  it('should toggle between the dark and light themes', () => {
    const toggle = screen.getByTestId('toggle');
    const particles = screen.getByTestId('particles');

    expect(toggle).toBeVisible();
    expect(toggle).toHaveAccessibleName();
    expect(toggle).toHaveAccessibleDescription();

    expect(particles).toBeVisible();

    // site should default to the dark theme
    expect(toggle).toBeChecked();
    expect(particles).toHaveStyle({ backgroundColor: '#000' });

    // click the toggle
    fireEvent.click(toggle);

    // the light theme should be visible
    expect(toggle).not.toBeChecked();
    expect(particles).toHaveStyle({ backgroundColor: '#fff' });
  });

  it('should render full footer on desktop', () => {
    const footer = screen.getByTestId('footer');

    expect(footer).toHaveTextContent(
      /^Designed and built by Your Name \| Source$/,
    );
  });
});

describe('app context tests', () => {
  it('should render partial footer on mobile', async () => {
    await act(() =>
      render(
        <AppProvider
          config={mockState.config}
          isMobile={true}
          children={<Footer />}
        />,
      ),
    );

    // partial footer should now be visible
    const footer = screen.getByTestId('footer');

    expect(footer).toHaveTextContent(/^Designed and built by Your Name$/);
  });

  describe('reducer tests', () => {
    it('should return the dark theme', () => {
      const state = reducer(mockState, { type: 'SET_THEME', value: 'dark' });

      expect(state).toEqual({ ...mockState, theme: themes.dark });
    });

    it('should return the light theme', () => {
      const state = reducer(mockState, { type: 'SET_THEME', value: 'light' });

      expect(state).toEqual({ ...mockState, theme: themes.light });
    });
  });
});

describe('local storage tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // https://testing-library.com/docs/react-testing-library/api/#rerender
  it('should persist the light theme through an app re-render', async () => {
    const { rerender } = await act(() => render(<App />));

    expect(localStorage.getItem('theme')).toBeNull();
    localStorage.setItem('theme', 'light');

    // re-render the app and check the theme
    act(() => {
      rerender(<App />);
    });
    const particles = screen.getByTestId('particles');

    expect(localStorage.getItem('theme')).toEqual('light');
    expect(particles).toHaveStyle({ backgroundColor: '#fff' });
  });

  it('should change local storage value when toggle is clicked', async () => {
    // set local storage item and render the app
    localStorage.setItem('theme', 'light');
    await act(() => render(<App />));

    // click the toggle
    const toggle = screen.getByTestId('toggle');
    fireEvent.click(toggle);

    // check that the local storage item has been changed
    expect(localStorage.getItem('theme')).toEqual('dark');
  });
});

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
    bio: { display: 'Default bio text.' },
    avatar: { initials: 'DN', alt: 'Default avatar', src: '' },
    doingItems: [
      {
        name: 'guestbook',
        display: 'Guestbook',
        description: 'Leave a note.',
        icon: '✎',
        href: '#guestbook',
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

  it('should render avatar placeholder with initials', () => {
    const avatar = screen.getByTestId('avatar');

    expect(avatar).toBeVisible();
    expect(avatar).toHaveAccessibleName(/Boyu Jiang profile photo/);
    expect(avatar).toHaveTextContent(/^BJ$/);
  });

  it('should render name: Boyu Jiang', () => {
    const element = screen.getByTestId('name');

    checkContent(element, /^Boyu Jiang$/, undefined, true);
  });

  it('should render title: Full Stack Developer', () => {
    const element = screen.getByTestId('title');

    checkContent(element, /^Full Stack Developer$/, undefined, true);
  });

  it('should render bio', () => {
    const element = screen.getByTestId('bio');

    expect(element).toBeVisible();
    expect(element).toHaveTextContent(/Building thoughtful web experiences/);
  });

  it('should render What i am doing section', () => {
    const section = screen.getByTestId('doing-section');

    expect(section).toBeVisible();
    expect(section).toHaveTextContent(/What i'm doing/);
  });

  it('should render scroll hint to guestbook', () => {
    const hint = screen.getByTestId('scroll-hint');

    expect(hint).toBeVisible();
    expect(hint).toHaveTextContent(/下滑查看留言/);
  });

  it('should render guestbook as separate page section', () => {
    const guestbookPage = document.getElementById('guestbook');

    expect(guestbookPage).toBeInTheDocument();
    expect(guestbookPage).toHaveClass('app-page-guestbook');
    expect(screen.getByTestId('guestbook')).toHaveTextContent(/留言板/);
  });

  it('should render six doing cards', () => {
    expect(screen.getByTestId('doing-guestbook')).toBeVisible();
    expect(screen.getByTestId('doing-gallery')).toBeVisible();
    expect(screen.getByTestId('doing-blog')).toBeVisible();
    expect(screen.getByTestId('doing-likes')).toBeVisible();
    expect(screen.getByTestId('doing-photos')).toBeVisible();
    expect(screen.getByTestId('doing-funny')).toBeVisible();
  });

  it('should not render social resume row buttons', () => {
    expect(screen.queryByTestId('button-GitHub')).not.toBeInTheDocument();
    expect(screen.queryByTestId('button-Resume')).not.toBeInTheDocument();
  });

  it('should render creator', () => {
    const element = screen.getByTestId('creator');

    checkContent(element, /^Boyu Jiang$/, '#');
  });

  it('should render link to source code', () => {
    const element = screen.getByTestId('source');

    checkContent(element, /^Source$/, '#');
  });

  it('should toggle between the dark and light themes', () => {
    const toggle = screen.getByTestId('toggle');
    const background = screen.getByTestId('background');

    expect(toggle).toBeVisible();
    expect(toggle).toHaveAccessibleName();
    expect(toggle).toHaveAccessibleDescription();

    expect(background).toBeVisible();

    expect(toggle).toBeChecked();
    expect(background).toHaveStyle({ backgroundColor: '#0c0c0f' });

    fireEvent.click(toggle);

    expect(toggle).not.toBeChecked();
    expect(background).toHaveStyle({ backgroundColor: '#f4f4f6' });
  });

  it('should render full footer on desktop', () => {
    const footer = screen.getByTestId('footer');

    expect(footer).toHaveTextContent(
      /^Designed and built by Boyu Jiang \| Source$/,
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

    const footer = screen.getByTestId('footer');

    expect(footer).toHaveTextContent(/^Designed and built by Boyu Jiang$/);
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

  it('should persist the light theme through an app re-render', async () => {
    const { rerender } = await act(() => render(<App />));

    expect(localStorage.getItem('theme')).toBeNull();
    localStorage.setItem('theme', 'light');

    act(() => {
      rerender(<App />);
    });
    const background = screen.getByTestId('background');

    expect(localStorage.getItem('theme')).toEqual('light');
    expect(background).toHaveStyle({ backgroundColor: '#f4f4f6' });
  });

  it('should change local storage value when toggle is clicked', async () => {
    localStorage.setItem('theme', 'light');
    await act(() => render(<App />));

    const toggle = screen.getByTestId('toggle');
    fireEvent.click(toggle);

    expect(localStorage.getItem('theme')).toEqual('dark');
  });
});

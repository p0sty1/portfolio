import { act } from 'react';

import {
  configure,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import '__mocks__/matchMedia';
import { App } from 'App/App';
import { AppProvider } from 'App/AppContext';
import { config } from 'App/config';
import { themes } from 'appearance';
import { Footer } from 'components';
import { HomeNavIcon } from 'icons/nav';

configure({ testIdAttribute: 'data-v2' });

const mockState = {
  config: {
    ...config,
    dockItems: [],
  },
  isMobile: false,
  theme: themes.dark,
  activeView: 'home' as const,
  setActiveView: () => undefined,
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

  it('should render sidebar with brand logo', () => {
    expect(screen.getByTestId('sidebar')).toBeVisible();
    expect(screen.getByAltText('Jyangbly')).toBeVisible();
  });

  it('should render sidebar navigation items', () => {
    expect(screen.getByTestId('nav-home')).toBeVisible();
    expect(screen.getByTestId('nav-gallery')).toBeVisible();
    expect(screen.getByTestId('nav-likes')).toBeVisible();
    expect(screen.getByTestId('nav-guestbook')).toBeVisible();
  });

  it('should render home screen with timeline feed', () => {
    expect(screen.getByTestId('home-screen')).toBeVisible();
    expect(screen.getByTestId('timeline-feed')).toBeVisible();
    expect(screen.getByTestId('timeline-composer')).toBeVisible();
  });

  it('should render external links in profile', () => {
    fireEvent.click(screen.getByTestId('nav-profile'));

    expect(screen.getByTestId('profile-github')).toBeVisible();
    expect(screen.getByTestId('profile-linkedin')).toBeVisible();
    expect(screen.getByTestId('profile-resume')).toBeVisible();
    expect(screen.getByTestId('profile-email')).toBeVisible();
  });

  it('should switch to guestbook from sidebar', () => {
    expect(screen.queryByTestId('guestbook')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('nav-guestbook'));
    expect(screen.getByTestId('guestbook')).toBeVisible();
    expect(screen.getByTestId('nav-guestbook')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('should return home from sidebar nav', () => {
    fireEvent.click(screen.getByTestId('nav-guestbook'));
    fireEvent.click(screen.getByTestId('nav-home'));
    expect(screen.getByTestId('home-screen')).toBeVisible();
    expect(screen.queryByTestId('guestbook')).not.toBeInTheDocument();
  });

  it('should switch to gallery from sidebar', async () => {
    expect(screen.queryByTestId('gallery')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('nav-gallery'));
    expect(screen.getByTestId('gallery')).toBeVisible();
    await waitFor(() => {
      expect(screen.getByTestId('gallery-card-g1')).toBeVisible();
    });
  });

  it('should not render legacy phone grid or contact dock', () => {
    expect(screen.queryByTestId('doing-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('contact-dock')).not.toBeInTheDocument();
    expect(screen.queryByTestId('button-GitHub')).not.toBeInTheDocument();
  });

  it('should render creator in guestbook footer', () => {
    fireEvent.click(screen.getByTestId('nav-guestbook'));
    const element = screen.getByTestId('creator');

    checkContent(element, /^Boyu Jiang$/, '#');
  });

  it('should render link to source code in guestbook footer', () => {
    fireEvent.click(screen.getByTestId('nav-guestbook'));
    const element = screen.getByTestId('source');

    checkContent(element, /^Source$/, '#');
  });

  it('should not render theme toggle', () => {
    expect(screen.queryByTestId('toggle')).not.toBeInTheDocument();
  });

  it('should use the app background', () => {
    expect(screen.getByTestId('background')).toHaveStyle({
      backgroundColor: '#f6f7f8',
    });
  });

  it('should render full footer on guestbook view', () => {
    fireEvent.click(screen.getByTestId('nav-guestbook'));
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
          config={{
            ...mockState.config,
            navItems: [
              {
                name: 'home',
                display: '主页',
                view: 'home',
                icon: <HomeNavIcon />,
              },
            ],
          }}
          isMobile={true}
          children={<Footer />}
        />,
      ),
    );

    const footer = screen.getByTestId('footer');

    expect(footer).toHaveTextContent(/^Designed and built by Boyu Jiang$/);
  });
});

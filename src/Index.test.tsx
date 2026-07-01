import { act, useContext } from 'react';

import {
  configure,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import '__mocks__/matchMedia';
import { App } from 'App/App';
import { AppContext, AppProvider } from 'App/AppContext';
import { config } from 'App/config';
import { themes } from 'appearance';
import { Footer } from 'components';
import { MobileNav } from 'components/MobileNav';
import { HomeNavIcon } from 'icons/nav';

jest.mock('react-globe.gl', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  return {
    __esModule: true,
    default: () =>
      React.createElement('canvas', { 'data-v2': 'mock-travel-globe-canvas' }),
  };
});

configure({ testIdAttribute: 'data-v2' });

Object.defineProperties(HTMLElement.prototype, {
  hasPointerCapture: {
    configurable: true,
    value: jest.fn(() => true),
  },
  releasePointerCapture: {
    configurable: true,
    value: jest.fn(),
  },
  setPointerCapture: {
    configurable: true,
    value: jest.fn(),
  },
});

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

const ActiveViewProbe = () => {
  const { activeView } = useContext(AppContext);

  return <output data-v2="active-view">{activeView}</output>;
};

const firePointer = (
  element: HTMLElement,
  type: 'pointerdown' | 'pointerup',
  options: {
    clientX: number;
    pointerId: number;
    pointerType: 'mouse' | 'touch';
  },
) => {
  const event = new Event(type, { bubbles: true, cancelable: true });

  Object.defineProperties(event, {
    clientX: {
      value: options.clientX,
    },
    pointerId: {
      value: options.pointerId,
    },
    pointerType: {
      value: options.pointerType,
    },
  });

  fireEvent(element, event);
};

describe('application tests', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    window.history.pushState({}, '', '/');
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
    expect(screen.queryByTestId('timeline-composer')).not.toBeInTheDocument();
  });

  it('should render admin gate on admin route', () => {
    act(() => {
      window.history.pushState({}, '', '/admin');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(screen.getByTestId('admin-screen')).toBeVisible();
    expect(screen.getByTestId('admin-gate')).toBeVisible();
    expect(screen.queryByTestId('timeline-composer')).not.toBeInTheDocument();
  });

  it('should render travel map in profile', async () => {
    act(() => {
      fireEvent.click(screen.getByTestId('nav-profile'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('travel-map-room')).toBeVisible();
    });
    expect(screen.getByTestId('travel-globe-stage')).toBeVisible();
    await waitFor(() => {
      expect(screen.getByTestId('mock-travel-globe-canvas')).toBeVisible();
    });
  });

  it('should switch to guestbook from sidebar', async () => {
    expect(screen.queryByTestId('guestbook')).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByTestId('nav-guestbook'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('guestbook')).toBeVisible();
    });
    expect(screen.getByTestId('nav-guestbook')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('should return home from sidebar nav', async () => {
    act(() => {
      fireEvent.click(screen.getByTestId('nav-guestbook'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('guestbook')).toBeVisible();
    });
    act(() => {
      fireEvent.click(screen.getByTestId('nav-home'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('home-screen')).toBeVisible();
    });
    expect(screen.queryByTestId('guestbook')).not.toBeInTheDocument();
  });

  it('should switch to gallery from sidebar', async () => {
    expect(screen.queryByTestId('gallery')).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByTestId('nav-gallery'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('gallery')).toBeVisible();
    });
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

  it('should transition the app background with the active view', async () => {
    const background = screen.getByTestId('background');

    expect(background).toHaveAttribute('data-gradient-view', 'home');
    expect(
      background.querySelector('[data-gradient-layer="home"]'),
    ).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByTestId('nav-likes'));
    });

    await waitFor(() => {
      expect(background).toHaveAttribute('data-gradient-view', 'likes');
    });
    expect(
      background.querySelector('[data-gradient-layer="likes"]'),
    ).toBeInTheDocument();
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
  it('should switch mobile nav by tapping a captured tab', async () => {
    await act(() =>
      render(
        <AppProvider config={mockState.config} isMobile={true}>
          <MobileNav />
          <ActiveViewProbe />
        </AppProvider>,
      ),
    );

    const navTrack = screen.getByTestId('mobile-nav').firstElementChild;

    expect(navTrack).toBeInstanceOf(HTMLElement);

    act(() => {
      firePointer(screen.getByTestId('nav-profile'), 'pointerdown', {
        clientX: 0,
        pointerId: 1,
        pointerType: 'touch',
      });
      firePointer(navTrack as HTMLElement, 'pointerup', {
        clientX: 0,
        pointerId: 1,
        pointerType: 'touch',
      });
    });

    expect(screen.getByTestId('active-view')).toHaveTextContent('profile');
  });

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

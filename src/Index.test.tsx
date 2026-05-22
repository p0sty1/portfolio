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
import { themes } from 'appearance';
import { Footer } from 'components';
import { DailyIcon } from 'icons/apps';

configure({ testIdAttribute: 'data-v2' });

const mockState = {
  config: {
    name: { display: 'Default Name' },
    title: { display: 'Default Title' },
    bio: { display: 'Default bio text.' },
    avatar: { initials: 'DN', alt: 'Default avatar', src: '' },
    doingItems: [
      {
        name: 'daily',
        display: '日常',
        description: 'Daily notes.',
        icon: <DailyIcon />,
        iconGradient: 'linear-gradient(145deg, #ff9f0a, #ff6b35)',
        href: '#daily',
      },
    ],
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

  it('should render avatar image from R2', () => {
    const avatar = screen.getByTestId('avatar');

    expect(avatar).toBeVisible();
    expect(avatar).toHaveAccessibleName(/Boyu Jiang profile photo/);
    const img = avatar.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/api/gallery/media/avatar/profile.jpg');
    expect(img).toHaveAttribute('alt', 'Boyu Jiang profile photo');
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

  it('should render profile widget and app grid', () => {
    expect(screen.getByTestId('profile-widget')).toBeVisible();
    expect(screen.getByTestId('doing-section')).toBeVisible();
    expect(screen.getByTestId('home-screen')).toBeVisible();
  });

  it('should render contact dock with four apps', () => {
    expect(screen.getByTestId('contact-dock')).toBeVisible();
    expect(screen.getByTestId('dock-github')).toBeVisible();
    expect(screen.getByTestId('dock-linkedin')).toBeVisible();
    expect(screen.getByTestId('dock-resume')).toBeVisible();
    expect(screen.getByTestId('dock-email')).toBeVisible();
  });

  it('should render guestbook app in the grid', () => {
    expect(screen.getByTestId('doing-guestbook')).toBeVisible();
    expect(screen.getByTestId('doing-guestbook')).toHaveTextContent(/留言/);
  });

  it('should switch to guestbook on card click', () => {
    expect(screen.queryByTestId('guestbook')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('doing-guestbook'));
    expect(screen.getByTestId('guestbook')).toBeVisible();
    expect(screen.queryByTestId('doing-section')).not.toBeInTheDocument();
  });

  it('should return home from guestbook back button', () => {
    fireEvent.click(screen.getByTestId('doing-guestbook'));
    fireEvent.click(screen.getByLabelText('返回首页'));
    expect(screen.getByTestId('doing-section')).toBeVisible();
    expect(screen.queryByTestId('guestbook')).not.toBeInTheDocument();
  });

  it('should switch to gallery on card click', async () => {
    expect(screen.queryByTestId('gallery')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('doing-gallery'));
    expect(screen.getByTestId('gallery')).toBeVisible();
    await waitFor(() => {
      expect(screen.getByTestId('gallery-card-g1')).toBeVisible();
    });
    expect(screen.queryByTestId('doing-section')).not.toBeInTheDocument();
  });

  it('should return home from gallery back button', () => {
    fireEvent.click(screen.getByTestId('doing-gallery'));
    fireEvent.click(screen.getByLabelText('返回首页'));
    expect(screen.getByTestId('doing-section')).toBeVisible();
    expect(screen.queryByTestId('gallery')).not.toBeInTheDocument();
  });

  it('should render seven doing cards', () => {
    expect(screen.getByTestId('doing-daily')).toBeVisible();
    expect(screen.getByTestId('doing-gallery')).toBeVisible();
    expect(screen.getByTestId('doing-blog')).toBeVisible();
    expect(screen.getByTestId('doing-likes')).toBeVisible();
    expect(screen.getByTestId('doing-photos')).toBeVisible();
    expect(screen.getByTestId('doing-funny')).toBeVisible();
    expect(screen.getByTestId('doing-guestbook')).toBeVisible();
  });

  it('should not render legacy social button row', () => {
    expect(screen.queryByTestId('button-GitHub')).not.toBeInTheDocument();
    expect(screen.queryByTestId('button-Resume')).not.toBeInTheDocument();
  });

  it('should render creator in guestbook footer', () => {
    fireEvent.click(screen.getByTestId('doing-guestbook'));
    const element = screen.getByTestId('creator');

    checkContent(element, /^Boyu Jiang$/, '#');
  });

  it('should render link to source code in guestbook footer', () => {
    fireEvent.click(screen.getByTestId('doing-guestbook'));
    const element = screen.getByTestId('source');

    checkContent(element, /^Source$/, '#');
  });

  it('should not render theme toggle', () => {
    expect(screen.queryByTestId('toggle')).not.toBeInTheDocument();
  });

  it('should use dark background', () => {
    expect(screen.getByTestId('background')).toHaveStyle({
      backgroundColor: '#0c0c0f',
    });
  });

  it('should render full footer on guestbook view', () => {
    fireEvent.click(screen.getByTestId('doing-guestbook'));
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
});

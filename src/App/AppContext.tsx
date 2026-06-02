import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useState,
} from 'react';

import { themes } from 'appearance';
import { AppView, Config, Theme } from 'types';

interface AppProviderInterface {
  config: Config;
  isMobile: boolean;
}

interface AppContextInterface extends AppProviderInterface {
  theme: Theme;
  activeView: AppView;
  setActiveView: Dispatch<SetStateAction<AppView>>;
}

export const AppContext = createContext<AppContextInterface>({
  config: {} as Config,
  isMobile: false,
  theme: themes.light,
  activeView: 'home',
  setActiveView: () => undefined,
});

export const AppProvider = ({
  config,
  isMobile,
  children,
}: AppProviderInterface & { children: ReactNode }) => {
  const [activeView, setActiveView] = useState<AppView>('home');

  const value: AppContextInterface = {
    config,
    isMobile,
    theme: themes.light,
    activeView,
    setActiveView,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

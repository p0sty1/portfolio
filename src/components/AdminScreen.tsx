import { FormEvent, useContext, useState } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import {
  forgetTimelineAdminUnlock,
  isTimelineAdminPassword,
  isTimelineAdminUnlocked,
  rememberTimelineAdminUnlock,
} from 'lib/timelineAdminAuth';
import { Theme } from 'types';

import { TimelineFeed } from './TimelineFeed';

const Page = styled.main`
  position: relative;
  z-index: 2;
  display: grid;
  gap: 1rem;
  width: min(100%, 43rem);
  margin: 0 auto;
  box-sizing: border-box;
  padding: 1.25rem 1rem 3rem;

  @media (width >= 769px) {
    padding-block: 1.6rem 3.4rem;
  }
`;

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`;

const HeaderText = styled.div`
  display: grid;
  gap: 0.22rem;
  min-width: 0;
`;

const Eyebrow = styled.p<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.74rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Title = styled.h1<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: clamp(1.35rem, 6vw, 2rem);
  line-height: 1.08;
  letter-spacing: 0;
`;

const Copy = styled.p<{ $theme: Theme }>`
  margin: 0.45rem 0 0;
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font-size: 0.92rem;
  line-height: 1.58;
`;

const HeaderActions = styled.div`
  display: flex;
  flex-shrink: 0;
  gap: 0.5rem;
`;

const LinkButton = styled.a<{ $theme: Theme }>`
  display: inline-grid;
  min-height: 2.35rem;
  place-items: center;
  padding: 0 0.86rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 999px;
  background: ${({ $theme }) => $theme.cardBackground};
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: 0.82rem;
  font-weight: 760;
  text-decoration: none;
`;

const Gate = styled.form<{ $theme: Theme }>`
  display: grid;
  gap: 0.9rem;
  padding: 1rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.cardBackground};
`;

const PasswordInput = styled.input<{ $theme: Theme }>`
  width: 100%;
  min-height: 3rem;
  box-sizing: border-box;
  padding: 0.82rem 0.95rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.iconGlassBackground};
  color: ${({ $theme }) => $theme.primaryTextColor};
  font: inherit;
  font-size: 1rem;

  &:focus {
    outline: 2px solid ${({ $theme }) => $theme.accentColor};
    outline-offset: 2px;
  }
`;

const PrimaryButton = styled.button<{ $theme: Theme }>`
  min-height: 2.65rem;
  padding: 0.7rem 1rem;
  border: 1px solid ${({ $theme }) => $theme.primaryTextColor};
  border-radius: 999px;
  background: ${({ $theme }) => $theme.primaryTextColor};
  color: ${({ $theme }) => $theme.cardBackground};
  cursor: pointer;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 780;

  &:disabled {
    opacity: 0.46;
    cursor: not-allowed;
  }
`;

const TextButton = styled.button<{ $theme: Theme }>`
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  cursor: pointer;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 720;
`;

const HelperText = styled.p<{ $danger?: boolean; $theme: Theme }>`
  margin: 0;
  color: ${({ $danger, $theme }) =>
    $danger ? '#dc2626' : $theme.tertiaryTextColor};
  font-size: 0.8rem;
  line-height: 1.55;
`;

export const AdminScreen = () => {
  const { theme } = useContext(AppContext);
  const [unlocked, setUnlocked] = useState(isTimelineAdminUnlocked);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<null | string>(null);

  const unlock = (event: FormEvent) => {
    event.preventDefault();

    if (!isTimelineAdminPassword(password)) {
      setError('密码不正确，请重新输入。');

      return;
    }

    rememberTimelineAdminUnlock();
    setUnlocked(true);
    setPassword('');
    setError(null);
  };

  return (
    <Page data-page-root data-v2="admin-screen" aria-label="发布管理">
      <Header>
        <HeaderText>
          <Eyebrow $theme={theme}>Admin</Eyebrow>
          <Title $theme={theme}>发布动态</Title>
          <Copy $theme={theme}>
            这里是站主入口。访客首页只展示动态流，发布工具集中在这里。
          </Copy>
        </HeaderText>
        <HeaderActions>
          <LinkButton $theme={theme} href="/">
            主页
          </LinkButton>
        </HeaderActions>
      </Header>

      {unlocked ? (
        <>
          <Gate $theme={theme} data-v2="admin-unlocked">
            <HelperText $theme={theme}>
              已解锁当前设备。发布后会直接写入主页动态。
            </HelperText>
            <TextButton
              type="button"
              $theme={theme}
              onClick={() => {
                forgetTimelineAdminUnlock();
                setUnlocked(false);
              }}
            >
              退出发布模式
            </TextButton>
          </Gate>
          <TimelineFeed
            requirePublishPassword={false}
            showComposer
            title="发布与预览"
          />
        </>
      ) : (
        <Gate $theme={theme} data-v2="admin-gate" onSubmit={unlock}>
          <HelperText $theme={theme}>
            输入二级密码后，这台设备会记住发布权限。
          </HelperText>
          <PasswordInput
            $theme={theme}
            aria-label="管理密码"
            autoFocus
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(null);
            }}
          />
          {error ? (
            <HelperText $theme={theme} $danger>
              {error}
            </HelperText>
          ) : null}
          <PrimaryButton
            type="submit"
            $theme={theme}
            disabled={password.length === 0}
          >
            解锁发布
          </PrimaryButton>
        </Gate>
      )}
    </Page>
  );
};

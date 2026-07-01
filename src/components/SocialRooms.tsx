import {
  FormEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import styled, { css } from 'styled-components';

import { AppContext } from 'App/AppContext';
import { getSupabase } from 'lib/supabaseClient';
import { Theme } from 'types';

import { TravelMapRoom } from './TravelMapRoom';

const ASK_TABLE = 'portfolio_anonymous_questions';
const ASK_PAGE_SIZE = 5;

interface AnonymousQuestionRow {
  id: string;
  question: string;
  answer: null | string;
  created_at: string;
  answered_at: null | string;
}

const formatAskTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const isAnswered = (row: AnonymousQuestionRow) => Boolean(row.answer?.trim());

type RoomKind = 'ask' | 'blog' | 'fun' | 'profile';

const feedPosts = [
  {
    id: 'pinned',
    kind: 'Pinned Thought',
    title: '这个站点更像我的互联网房间',
    body: '不是简历，也不是 dashboard。它应该能放照片、碎碎念、技术笔记、音乐、陌生人的留言，以及一些暂时解释不清但很喜欢的小东西。',
    mood: 'soft chaos',
    time: '置顶',
  },
  {
    id: 'photo-note',
    kind: 'Daily Feed',
    title: '今天想把界面做得更像手帐',
    body: '圆角可以更软，卡片可以更像纸张，信息可以不那么整齐。个人网站不需要一直证明自己专业，它也可以表达一个人的口味。',
    mood: 'warm',
    time: '20:18',
  },
  {
    id: 'tiny-code',
    kind: 'Code Diary',
    title: '小型系统也需要情绪',
    body: '导航、留言、喜欢、画廊这些模块如果只是功能，会很快变冷。加入状态、语气和社交信号后，它们才像一个正在生长的空间。',
    mood: 'thinking',
    time: '昨天',
  },
];

interface FunItem {
  id: string;
  title: string;
  href: string;
  description: string;
  tag: string;
  coverImage: string;
}

const FUN_COVER_ASPECT = 1024 / 629;

const funCoverUrl = `${process.env.PUBLIC_URL ?? ''}/fun/black-and-white-cover.png`;
const idealTypeCoverUrl = `${process.env.PUBLIC_URL ?? ''}/fun/ideal-type-cover.jpg`;

const funItems: FunItem[] = [
  {
    id: 'nus-unity-coop',
    title: 'Black And White双人小游戏',
    href: 'https://play.unity.com/en/games/5d7116f5-5be9-46e6-ab80-e2842f0c97d9/5paw5bu65pah5lu25as5',
    description:
      '2024年夏天，在NUS暑校，四个人使用Unity做的双人合作&竞争小游戏，记得使用电脑打开',
    tag: 'Unity · 2024',
    coverImage: funCoverUrl,
  },
];

type IdealTypeAxis = 'attention' | 'care' | 'energy' | 'pace';
type IdealTypeCode = 'A' | 'D' | 'F' | 'L' | 'P' | 'S' | 'T' | 'W';

interface IdealTypeOption {
  axis: IdealTypeAxis;
  code: IdealTypeCode;
  description: string;
  label: string;
  score: number;
}

interface IdealTypeQuestion {
  id: string;
  options: IdealTypeOption[];
  prompt: string;
}

const idealTypeQuestions: IdealTypeQuestion[] = [
  {
    id: 'pace',
    prompt: '刚认识时，你更舒服的相处方式是？',
    options: [
      {
        axis: 'energy',
        code: 'W',
        description: '先观察、慢慢熟，熟了以后再变得很有话说。',
        label: '慢慢靠近',
        score: 5,
      },
      {
        axis: 'energy',
        code: 'S',
        description: '一开始就能抛梗接梗，聊天像打乒乓球。',
        label: '快速来电',
        score: 4,
      },
    ],
  },
  {
    id: 'date',
    prompt: '如果一起空出一个下午，你更想要？',
    options: [
      {
        axis: 'attention',
        code: 'D',
        description: '散步、咖啡、拍照，重点是把细节记下来。',
        label: '细节型约会',
        score: 5,
      },
      {
        axis: 'attention',
        code: 'A',
        description: '临时决定路线，去一个没去过的地方。',
        label: '冒险型约会',
        score: 3,
      },
    ],
  },
  {
    id: 'care',
    prompt: '你表达喜欢时更接近哪一种？',
    options: [
      {
        axis: 'care',
        code: 'F',
        description: '会先接住情绪，再一起想下一步怎么办。',
        label: '先共情',
        score: 5,
      },
      {
        axis: 'care',
        code: 'T',
        description: '会认真分析问题，用行动把事情处理掉。',
        label: '先解决',
        score: 4,
      },
    ],
  },
  {
    id: 'rhythm',
    prompt: '关系里的日常节奏，你更喜欢？',
    options: [
      {
        axis: 'pace',
        code: 'P',
        description: '有一点计划感，重要的事提前说清楚。',
        label: '稳定计划',
        score: 4,
      },
      {
        axis: 'pace',
        code: 'L',
        description: '保留很多即兴空间，想到什么就一起去做。',
        label: '松弛随性',
        score: 5,
      },
    ],
  },
];

const defaultIdealTypeCodes: Record<IdealTypeAxis, IdealTypeCode> = {
  attention: 'D',
  care: 'F',
  energy: 'W',
  pace: 'L',
};

const idealTypeLabels: Record<IdealTypeCode, string> = {
  A: '冒险',
  D: '细节',
  F: '共情',
  L: '松弛',
  P: '稳定',
  S: '火花',
  T: '解决',
  W: '慢热',
};

const idealResultName = (code: string) => {
  if (code.includes('W') && code.includes('D') && code.includes('F')) {
    return '温柔细节型';
  }

  if (code.includes('S') && code.includes('A')) {
    return '火花冒险型';
  }

  if (code.includes('P') && code.includes('T')) {
    return '稳定行动型';
  }

  return '混合观察型';
};

const Page = styled.main`
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 58rem;
  margin: 0 auto;
  box-sizing: border-box;
  text-align: left;

  @media (width >= 769px) {
    padding: 1.35rem clamp(1.2rem, 4vw, 2.2rem) 3rem;
  }
`;

const RoomHeader = styled.header<{ $kind: RoomKind; $theme: Theme }>`
  position: relative;
  overflow: hidden;
  padding: 1rem 1.1rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 16px;
  background: ${({ $theme }) => $theme.cardBackground};
  box-shadow: ${({ $theme }) => $theme.glassShadow};
`;

const Eyebrow = styled.span<{ $theme: Theme }>`
  display: inline-flex;
  margin-bottom: 0.35rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.74rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Title = styled.h1<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: clamp(1.35rem, 4vw, 2rem);
  font-weight: 820;
  line-height: 1.08;
  letter-spacing: 0;
`;

const AskPage = styled(Page)`
  max-width: 44rem;
`;

const AskHeader = styled.header`
  padding: clamp(0.7rem, 2.5vw, 1rem) 0 0.25rem;
`;

const AskLayout = styled.div`
  display: grid;
  gap: clamp(1.1rem, 3vw, 1.55rem);
  margin-top: clamp(0.85rem, 3vw, 1.25rem);
`;

const AskComposer = styled.section<{ $theme: Theme }>`
  display: grid;
  gap: 0.85rem;
  padding: clamp(1rem, 3vw, 1.25rem) 0 clamp(1.15rem, 3vw, 1.4rem);
  border-bottom: 1px solid ${({ $theme }) => $theme.cardBorder};
`;

const AskThreadList = styled.div`
  display: grid;
  gap: 0;
`;

const AskThreadCard = styled.article<{ $theme: Theme }>`
  position: relative;
  padding: clamp(1rem, 3vw, 1.25rem) 0;
  border-bottom: 1px solid ${({ $theme }) => $theme.cardBorder};

  &:first-child {
    padding-top: 0.25rem;
  }
`;

const AskMeta = styled.div<{ $theme: Theme }>`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
  margin-bottom: 0.55rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.76rem;
`;

const AskStatus = styled.span<{ $theme: Theme }>`
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-weight: 760;
`;

const AskPrompt = styled.p<{ $theme: Theme }>`
  max-width: 34rem;
  margin: 0;
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font-size: 0.95rem;
  line-height: 1.7;
`;

const AskPager = styled.nav<{ $theme: Theme }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.9rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.78rem;
`;

const AskPagerButton = styled.button<{ $theme: Theme }>`
  padding: 0.4rem 0;
  border: 0;
  background: transparent;
  color: ${({ $theme }) => $theme.secondaryTextColor};
  cursor: pointer;
  font: inherit;
  font-weight: 760;

  &:disabled {
    color: ${({ $theme }) => $theme.tertiaryTextColor};
    cursor: not-allowed;
    opacity: 0.48;
  }
`;

const cardSurface = css<{ $theme: Theme }>`
  position: relative;
  overflow: hidden;
  padding: 1.1rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 16px;
  background: ${({ $theme }) => $theme.cardBackground};
  box-shadow: ${({ $theme }) => $theme.glassShadow};
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ $theme }) => $theme.glassShadowHover};
  }
`;

const Card = styled.article<{ $theme: Theme }>`
  ${cardSurface}
`;

const FunList = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  width: 100%;
  margin-top: 1rem;
`;

const funHeroSurface = css<{ $cover: string; $theme: Theme }>`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  min-width: 0;
  aspect-ratio: ${FUN_COVER_ASPECT};
  box-sizing: border-box;
  overflow: hidden;
  padding: clamp(1.25rem, 4vw, 2rem);
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 16px;
  background:
    linear-gradient(
      180deg,
      rgba(8, 8, 8, 0.08) 0%,
      rgba(8, 8, 8, 0.42) 48%,
      rgba(8, 8, 8, 0.82) 100%
    ),
    url(${({ $cover }) => $cover}) center / cover no-repeat;
  box-shadow: ${({ $theme }) => $theme.glassShadow};
  text-decoration: none;
  color: #f7f7f7;
  cursor: pointer;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ $theme }) => $theme.glassShadowHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ $theme }) => $theme.accentColor};
    outline-offset: 3px;
  }
`;

const FunHeroCard = styled.a<{ $cover: string; $theme: Theme }>`
  ${funHeroSurface}
  text-decoration: none;
`;

const FunHeroButton = styled.button<{ $cover: string; $theme: Theme }>`
  ${funHeroSurface}
  appearance: none;
  font: inherit;
  text-align: left;
`;

const FunHeroMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.65rem;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.74rem;
`;

const FunHeroPill = styled.span`
  display: inline-flex;
  padding: 0.3rem 0.62rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  font-weight: 700;
  backdrop-filter: blur(8px);
`;

const FunHeroTitle = styled.h2`
  margin: 0;
  max-width: 28rem;
  color: #fff;
  font-size: clamp(1.55rem, 4.5vw, 2.35rem);
  font-weight: 780;
  line-height: 1.08;
  letter-spacing: -0.04em;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.45);
`;

const FunHeroBody = styled.p`
  max-width: 36rem;
  margin: 0.65rem 0 0;
  color: rgba(255, 255, 255, 0.88);
  font-size: clamp(0.88rem, 2.2vw, 1rem);
  line-height: 1.65;
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.4);
`;

const IdealTest = styled.section<{ $theme: Theme }>`
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(14rem, 0.85fr);
  gap: 1rem;
  padding: clamp(1rem, 3vw, 1.25rem);
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 16px;
  background: ${({ $theme }) => $theme.cardBackground};
  box-shadow: ${({ $theme }) => $theme.glassShadow};

  @media (width <= 760px) {
    grid-template-columns: 1fr;
  }
`;

const QuizColumn = styled.div`
  display: grid;
  gap: 1rem;
  min-width: 0;
`;

const QuizHeader = styled.header`
  display: grid;
  gap: 0.45rem;
`;

const QuizTitle = styled.h2<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: clamp(1.18rem, 3.5vw, 1.55rem);
  font-weight: 820;
  line-height: 1.15;
  letter-spacing: 0;
`;

const QuizDeck = styled.div`
  display: grid;
  gap: 0.9rem;
`;

const QuizQuestion = styled.fieldset<{ $theme: Theme }>`
  display: grid;
  gap: 0.62rem;
  min-width: 0;
  margin: 0;
  padding: 0 0 0.9rem;
  border: 0;
  border-bottom: 1px solid ${({ $theme }) => $theme.gridColor};

  &:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }
`;

const QuestionPrompt = styled.legend<{ $theme: Theme }>`
  margin: 0;
  padding: 0;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: 0.92rem;
  font-weight: 760;
  line-height: 1.45;
`;

const OptionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;

  @media (width <= 620px) {
    grid-template-columns: 1fr;
  }
`;

const OptionButton = styled.button<{ $active: boolean; $theme: Theme }>`
  min-width: 0;
  min-height: 2.65rem;
  padding: 0.58rem 0.62rem;
  border: 1px solid
    ${({ $active, $theme }) =>
      $active ? $theme.primaryTextColor : $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $active, $theme }) =>
    $active ? $theme.primaryTextColor : $theme.iconGlassBackground};
  color: ${({ $active, $theme }) =>
    $active ? $theme.cardBackground : $theme.secondaryTextColor};
  cursor: pointer;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 720;
  line-height: 1.25;
  overflow-wrap: anywhere;
  transition:
    background 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease,
    transform 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: ${({ $theme }) => $theme.cardHoverBorder};
  }
`;

const ResultPanel = styled.aside<{ $theme: Theme }>`
  display: grid;
  align-content: space-between;
  gap: 1rem;
  min-width: 0;
  padding: 0.95rem;
  border-radius: 8px;
  background: ${({ $theme }) => $theme.iconGlassBackground};
`;

const ScoreRing = styled.div<{ $score: number; $theme: Theme }>`
  display: grid;
  place-items: center;
  width: min(9.5rem, 100%);
  aspect-ratio: 1;
  margin: 0 auto;
  border-radius: 50%;
  background:
    radial-gradient(
      circle at center,
      ${({ $theme }) => $theme.cardBackground} 0 57%,
      transparent 58%
    ),
    conic-gradient(
      ${({ $theme }) => $theme.primaryTextColor} ${({ $score }) => $score}%,
      ${({ $theme }) => $theme.gridColor} 0
    );
`;

const ScoreNumber = styled.strong<{ $theme: Theme }>`
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: clamp(1.85rem, 6vw, 2.45rem);
  font-weight: 860;
  line-height: 1;
`;

const ResultCopy = styled.div`
  display: grid;
  gap: 0.45rem;
`;

const ResultTitle = styled.h3<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: 1rem;
  font-weight: 820;
  line-height: 1.3;
`;

const ResultText = styled.p<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font-size: 0.86rem;
  line-height: 1.65;
`;

const ResetButton = styled.button<{ $theme: Theme }>`
  justify-self: start;
  min-height: 2.35rem;
  padding: 0.52rem 0.78rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 8px;
  background: ${({ $theme }) => $theme.glassBackground};
  color: ${({ $theme }) => $theme.secondaryTextColor};
  cursor: pointer;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 740;

  &:hover {
    border-color: ${({ $theme }) => $theme.cardHoverBorder};
    color: ${({ $theme }) => $theme.primaryTextColor};
  }
`;

const PostMeta = styled.div<{ $theme: Theme }>`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
  margin-bottom: 0.75rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
  font-size: 0.72rem;
`;

const Pill = styled.span<{ $theme: Theme }>`
  display: inline-flex;
  padding: 0.28rem 0.58rem;
  border-radius: 999px;
  background: ${({ $theme }) => $theme.spotlightColor};
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-weight: 700;
`;

const CardTitle = styled.h2<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.primaryTextColor};
  font-size: clamp(1.05rem, 3vw, 1.35rem);
  line-height: 1.18;
  letter-spacing: 0;
`;

const Body = styled.p<{ $theme: Theme }>`
  margin: 0.7rem 0 0;
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font-size: 0.92rem;
  line-height: 1.7;
`;

const ReactionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.9rem;
`;

const Reaction = styled.button<{ $theme: Theme }>`
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 999px;
  background: ${({ $theme }) => $theme.glassBackground};
  color: ${({ $theme }) => $theme.secondaryTextColor};
  cursor: pointer;
  font: inherit;
  font-size: 0.78rem;
  padding: 0.42rem 0.66rem;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;

  &:hover {
    background: ${({ $theme }) => $theme.primaryTextColor};
    color: ${({ $theme }) => $theme.cardBackground};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ProfileDetails = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(16rem, 0.9fr);
  gap: 0.85rem;
  margin-top: 0.85rem;

  @media (width <= 760px) {
    grid-template-columns: 1fr;
  }
`;

const TagCloud = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ContactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 1rem;

  @media (width <= 520px) {
    grid-template-columns: 1fr;
  }
`;

const ContactLink = styled.a<{ $theme: Theme }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 3.35rem;
  padding: 0.72rem 0.78rem;
  border: 1px solid ${({ $theme }) => $theme.cardBorder};
  border-radius: 12px;
  background: ${({ $theme }) => $theme.glassBackground};
  color: ${({ $theme }) => $theme.primaryTextColor};
  text-decoration: none;
  transition:
    background 0.16s ease,
    border-color 0.16s ease,
    transform 0.16s ease;

  &:hover {
    border-color: ${({ $theme }) => $theme.cardHoverBorder};
    background: ${({ $theme }) => $theme.glassBackgroundHover};
    transform: translateY(-2px);
  }

  svg {
    width: 1.35rem;
    height: 1.35rem;
    flex: 0 0 auto;
  }

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.9rem;
    font-weight: 740;
  }
`;

const Form = styled.form`
  display: grid;
  gap: 0.75rem;
`;

const TextArea = styled.textarea<{ $theme: Theme }>`
  min-height: 7.5rem;
  resize: vertical;
  padding: 1rem 1.05rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  outline: none;
  background: rgba(255, 255, 255, 0.075);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.08) inset,
    0 18px 44px rgba(0, 0, 0, 0.12);
  color: ${({ $theme }) => $theme.primaryTextColor};
  font: inherit;
  line-height: 1.6;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;

  &:focus {
    border-color: rgba(255, 255, 255, 0.24);
    background: rgba(255, 255, 255, 0.1);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.12) inset,
      0 0 0 3px rgba(125, 211, 252, 0.08),
      0 18px 44px rgba(0, 0, 0, 0.16);
  }

  &::placeholder {
    color: ${({ $theme }) => $theme.tertiaryTextColor};
  }
`;

const Submit = styled.button<{ $theme: Theme }>`
  justify-self: start;
  min-height: 2.75rem;
  padding: 0.72rem 1.05rem;
  border: 0;
  border-radius: 999px;
  background: ${({ $theme }) => $theme.primaryTextColor};
  color: ${({ $theme }) => $theme.cardBackground};
  cursor: pointer;
  font: inherit;
  font-weight: 740;
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.24);
    color: ${({ $theme }) => $theme.tertiaryTextColor};
    cursor: not-allowed;
  }
`;

const ErrorText = styled.p`
  margin: 0.75rem 0 0;
  font-size: 0.8rem;
  color: #f87171;
`;

const Muted = styled.p<{ $theme: Theme }>`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ $theme }) => $theme.tertiaryTextColor};
`;

const AnswerBlock = styled.div<{ $answered?: boolean; $theme: Theme }>`
  margin-top: 0.85rem;
  padding: 0.15rem 0 0.1rem 0.85rem;
  border-left: 2px solid
    ${({ $answered, $theme }) =>
      $answered ? $theme.accentColor : $theme.cardBorder};
`;

const AnswerLabel = styled.span<{ $answered?: boolean; $theme: Theme }>`
  display: block;
  margin-bottom: 0.28rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: ${({ $answered, $theme }) =>
    $answered ? $theme.accentColor : $theme.tertiaryTextColor};
`;

const AnswerBody = styled.p<{ $theme: Theme }>`
  margin: 0;
  color: ${({ $theme }) => $theme.secondaryTextColor};
  font-size: 0.9rem;
  line-height: 1.65;
`;

export const MoodBadge = ({ children }: { children: string }) => {
  const { theme } = useContext(AppContext);

  return <Pill $theme={theme}>{children}</Pill>;
};

export const ReactionButtons = () => {
  const { theme } = useContext(AppContext);

  return (
    <ReactionRow aria-label="情绪反馈">
      {['喜欢这个', '有共鸣', '想多看', '很像你'].map((label) => (
        <Reaction key={label} type="button" $theme={theme}>
          {label}
        </Reaction>
      ))}
    </ReactionRow>
  );
};

export const PostCard = ({
  body,
  kind,
  mood,
  time,
  title,
}: {
  body: string;
  kind: string;
  mood: string;
  time: string;
  title: string;
}) => {
  const { theme } = useContext(AppContext);

  return (
    <Card $theme={theme} data-v2="post-card">
      <PostMeta $theme={theme}>
        <MoodBadge>{kind}</MoodBadge>
        <span>{time}</span>
        <span>{mood}</span>
      </PostMeta>
      <CardTitle $theme={theme}>{title}</CardTitle>
      <Body $theme={theme}>{body}</Body>
      <ReactionButtons />
    </Card>
  );
};

const AskQuestionCard = ({ row }: { row: AnonymousQuestionRow }) => {
  const { theme } = useContext(AppContext);
  const answered = isAnswered(row);

  return (
    <AskThreadCard $theme={theme} data-v2={`ask-card-${row.id}`}>
      <AskMeta $theme={theme}>
        <AskStatus $theme={theme}>提问</AskStatus>
        <span>{formatAskTime(row.created_at)}</span>
      </AskMeta>
      <CardTitle $theme={theme}>{row.question}</CardTitle>
      <AnswerBlock $answered={answered} $theme={theme}>
        <AnswerLabel $answered={answered} $theme={theme}>
          {answered ? '已回答' : '还没有做出回答'}
        </AnswerLabel>
        {answered ? (
          <>
            <AnswerBody $theme={theme}>{row.answer?.trim()}</AnswerBody>
            {row.answered_at ? (
              <AskMeta
                $theme={theme}
                style={{ marginTop: '0.45rem', marginBottom: 0 }}
              >
                <span>回答 · {formatAskTime(row.answered_at)}</span>
              </AskMeta>
            ) : null}
          </>
        ) : (
          <AnswerBody $theme={theme}>
            问题已收到，等我回复后会显示在这里。
          </AnswerBody>
        )}
      </AnswerBlock>
    </AskThreadCard>
  );
};

export const AnonymousInputBox = ({
  onSubmitted,
}: {
  onSubmitted?: () => void;
}) => {
  const { theme } = useContext(AppContext);
  const client = getSupabase();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!client || !message.trim()) return;

    setLoading(true);
    setError(null);

    const { error: insertError } = await client.from(ASK_TABLE).insert({
      question: message.trim(),
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      setSent(false);

      return;
    }

    setSent(true);
    setMessage('');
    onSubmitted?.();
  };

  if (!client) {
    return (
      <AskComposer $theme={theme} data-v2="anonymous-input-box">
        <Muted $theme={theme}>
          未连接 Supabase：请在 .env.local 配置
          REACT_APP_SUPABASE_*，并在数据库执行 portfolio_anonymous_questions
          迁移。
        </Muted>
      </AskComposer>
    );
  }

  return (
    <AskComposer $theme={theme} data-v2="anonymous-input-box">
      <AskPrompt $theme={theme}>
        写一个问题、一个推荐、一个秘密，或者一句没有上下文的话。
      </AskPrompt>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Form onSubmit={(event) => void onSubmit(event)}>
        <TextArea
          $theme={theme}
          aria-label="提问"
          maxLength={1000}
          placeholder="比如：最近在听什么？"
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setSent(false);
          }}
        />
        <Submit
          type="submit"
          $theme={theme}
          disabled={loading || !message.trim()}
        >
          {loading ? '发送中…' : sent ? '已提交' : '发送提问'}
        </Submit>
      </Form>
    </AskComposer>
  );
};

export const ProfileRoom = () => {
  const { config, theme } = useContext(AppContext);
  const hobbies = ['摄影', '画画', '游泳', '骑行', '散步', 'Vibe Coding'];

  return (
    <TravelMapRoom>
      <ProfileDetails>
        <Card $theme={theme}>
          <PostMeta $theme={theme}>联系</PostMeta>
          <ContactGrid>
            {config.dockItems.map(
              ({ ariaLabel, display, href, icon, name }) => (
                <ContactLink
                  key={name}
                  data-v2={`profile-${name}`}
                  $theme={theme}
                  href={href}
                  aria-label={`${display}，${ariaLabel}`}
                  rel="noopener noreferrer"
                  target={
                    href.startsWith('mailto:') || href === '#'
                      ? undefined
                      : '_blank'
                  }
                >
                  {icon}
                  <span>{display}</span>
                </ContactLink>
              ),
            )}
          </ContactGrid>
        </Card>
        <Card $theme={theme}>
          <PostMeta $theme={theme}>业余爱好</PostMeta>
          <TagCloud>
            {hobbies.map((tag) => (
              <MoodBadge key={tag}>{tag}</MoodBadge>
            ))}
          </TagCloud>
        </Card>
      </ProfileDetails>
    </TravelMapRoom>
  );
};

export const AskRoom = () => {
  const { theme } = useContext(AppContext);
  const client = getSupabase();
  const [rows, setRows] = useState<AnonymousQuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [questionPage, setQuestionPage] = useState(0);

  const load = useCallback(async () => {
    if (!client) {
      setLoading(false);

      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await client
      .from(ASK_TABLE)
      .select('id, question, answer, created_at, answered_at')
      .order('created_at', { ascending: false })
      .limit(80);

    setLoading(false);

    if (fetchError) {
      setError(fetchError.message);

      return;
    }

    setRows((data ?? []) as AnonymousQuestionRow[]);
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const pageCount = Math.max(1, Math.ceil(rows.length / ASK_PAGE_SIZE));
  const visibleRows = useMemo(
    () =>
      rows.slice(
        questionPage * ASK_PAGE_SIZE,
        questionPage * ASK_PAGE_SIZE + ASK_PAGE_SIZE,
      ),
    [questionPage, rows],
  );

  useEffect(() => {
    setQuestionPage((currentPage) => Math.min(currentPage, pageCount - 1));
  }, [pageCount]);

  return (
    <AskPage data-page-root data-v2="ask-room">
      <AskHeader>
        <Eyebrow $theme={theme}>Ask Me Anything</Eyebrow>
        <Title $theme={theme}>提问</Title>
      </AskHeader>
      <AskLayout>
        <AnonymousInputBox
          onSubmitted={() => {
            setQuestionPage(0);
            void load();
          }}
        />
        <AskThreadList aria-label="提问列表">
          {error ? <ErrorText>{error}</ErrorText> : null}
          {loading ? (
            <Muted $theme={theme}>正在加载提问…</Muted>
          ) : rows.length === 0 ? (
            <Muted $theme={theme}>还没有提问，来做第一个吧。</Muted>
          ) : (
            visibleRows.map((row) => <AskQuestionCard key={row.id} row={row} />)
          )}
          {!loading && rows.length > ASK_PAGE_SIZE ? (
            <AskPager $theme={theme} aria-label="提问分页">
              <AskPagerButton
                type="button"
                $theme={theme}
                disabled={questionPage === 0}
                onClick={() => {
                  setQuestionPage((currentPage) =>
                    Math.max(0, currentPage - 1),
                  );
                }}
              >
                上一页
              </AskPagerButton>
              <span>
                第 {questionPage + 1} / {pageCount} 页
              </span>
              <AskPagerButton
                type="button"
                $theme={theme}
                disabled={questionPage >= pageCount - 1}
                onClick={() => {
                  setQuestionPage((currentPage) =>
                    Math.min(pageCount - 1, currentPage + 1),
                  );
                }}
              >
                下一页
              </AskPagerButton>
            </AskPager>
          ) : null}
        </AskThreadList>
      </AskLayout>
    </AskPage>
  );
};

export const IdealTypeTestRoom = () => {
  const { setActiveView, theme } = useContext(AppContext);
  const [idealAnswers, setIdealAnswers] = useState<
    Record<string, IdealTypeOption>
  >({});
  const answeredCount = Object.keys(idealAnswers).length;
  const selectedOptions = Object.values(idealAnswers);
  const maxScore = idealTypeQuestions.length * 5;
  const rawScore = selectedOptions.reduce(
    (sum, option) => sum + option.score,
    0,
  );
  const matchScore =
    answeredCount === 0 ? 0 : Math.round((rawScore / maxScore) * 100);
  const typeByAxis = selectedOptions.reduce<
    Record<IdealTypeAxis, IdealTypeCode>
  >(
    (current, option) => ({
      ...current,
      [option.axis]: option.code,
    }),
    defaultIdealTypeCodes,
  );
  const typeCode = [
    typeByAxis.energy,
    typeByAxis.attention,
    typeByAxis.care,
    typeByAxis.pace,
  ].join('');
  const resultTitle =
    answeredCount < idealTypeQuestions.length
      ? '等待作答'
      : `${typeCode} · ${idealResultName(typeCode)}`;
  const resultText =
    answeredCount < idealTypeQuestions.length
      ? '像 MBTI 一样，每题会落到一个维度。题目还可以继续换，结构先搭好。'
      : matchScore >= 86
        ? '这个结果偏向：节奏舒服、细节感强、会认真接住对方。'
        : matchScore >= 70
          ? '这个结果有一些合拍信号，但还需要更具体的题目拉开差异。'
          : '这个结果先保留观察，后面可以加反向题和权重题。';
  const keywords = [
    idealTypeLabels[typeByAxis.energy],
    idealTypeLabels[typeByAxis.attention],
    idealTypeLabels[typeByAxis.care],
    idealTypeLabels[typeByAxis.pace],
  ];

  return (
    <Page data-page-root data-v2="ideal-type-test-room">
      <RoomHeader $kind="fun" $theme={theme}>
        <Eyebrow $theme={theme}>Toy / Personality Test</Eyebrow>
        <Title $theme={theme}>测测你会是我的理想型吗</Title>
      </RoomHeader>
      <FunList>
        <IdealTest $theme={theme} data-v2="ideal-type-demo">
          <QuizColumn>
            <QuizHeader>
              <PostMeta $theme={theme}>
                <MoodBadge>MBTI-like</MoodBadge>
                <span>
                  {answeredCount}/{idealTypeQuestions.length} 已选择
                </span>
              </PostMeta>
              <QuizTitle $theme={theme}>先用四个维度搭一个雏形</QuizTitle>
              <Muted $theme={theme}>
                每题二选一，最后组合成一个类型码。后续可以把题目换成更私人、更好玩的版本。
              </Muted>
            </QuizHeader>
            <QuizDeck>
              {idealTypeQuestions.map((question, index) => (
                <QuizQuestion key={question.id} $theme={theme}>
                  <QuestionPrompt $theme={theme}>
                    {index + 1}. {question.prompt}
                  </QuestionPrompt>
                  <OptionGrid>
                    {question.options.map((option) => (
                      <OptionButton
                        key={option.label}
                        type="button"
                        $active={
                          idealAnswers[question.id]?.code === option.code
                        }
                        $theme={theme}
                        aria-pressed={
                          idealAnswers[question.id]?.code === option.code
                        }
                        onClick={() => {
                          setIdealAnswers((current) => ({
                            ...current,
                            [question.id]: option,
                          }));
                        }}
                      >
                        {option.label}
                        <br />
                        <small>{option.description}</small>
                      </OptionButton>
                    ))}
                  </OptionGrid>
                </QuizQuestion>
              ))}
            </QuizDeck>
          </QuizColumn>
          <ResultPanel $theme={theme}>
            <ScoreRing $score={matchScore} $theme={theme}>
              <ScoreNumber $theme={theme}>{matchScore}</ScoreNumber>
            </ScoreRing>
            <ResultCopy>
              <ResultTitle $theme={theme}>{resultTitle}</ResultTitle>
              <ResultText $theme={theme}>{resultText}</ResultText>
              <Muted $theme={theme}>
                {keywords.map((keyword) => `#${keyword}`).join(' ')}
              </Muted>
            </ResultCopy>
            <ResetButton
              type="button"
              $theme={theme}
              onClick={() => {
                setIdealAnswers({});
              }}
            >
              重新选择
            </ResetButton>
            <ResetButton
              type="button"
              $theme={theme}
              onClick={() => {
                setActiveView('fun');
              }}
            >
              返回玩具
            </ResetButton>
          </ResultPanel>
        </IdealTest>
      </FunList>
    </Page>
  );
};

export const FunRoom = () => {
  const { setActiveView, theme } = useContext(AppContext);

  return (
    <Page data-page-root data-v2="fun-room">
      <RoomHeader $kind="fun" $theme={theme}>
        <Eyebrow $theme={theme}>Fun / Experiments</Eyebrow>
        <Title $theme={theme}>玩具</Title>
      </RoomHeader>
      <FunList>
        {funItems.map((item) => (
          <FunHeroCard
            key={item.id}
            $cover={item.coverImage}
            $theme={theme}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${item.title}，在新标签页打开`}
          >
            <FunHeroMeta>
              <FunHeroPill>{item.tag}</FunHeroPill>
              <span>点击打开 →</span>
            </FunHeroMeta>
            <FunHeroTitle>{item.title}</FunHeroTitle>
            <FunHeroBody>{item.description}</FunHeroBody>
          </FunHeroCard>
        ))}
        <FunHeroButton
          type="button"
          $cover={idealTypeCoverUrl}
          $theme={theme}
          aria-label="打开理想型测试 demo"
          onClick={() => {
            setActiveView('ideal-test');
          }}
        >
          <FunHeroMeta>
            <FunHeroPill>Personality Test</FunHeroPill>
            <span>打开测试 →</span>
          </FunHeroMeta>
          <FunHeroTitle>测测你会是我的理想型吗</FunHeroTitle>
          <FunHeroBody>
            一个参考 MBTI 结构的小测试入口。现在是
            demo，等你想好题目后再替换成正式版。
          </FunHeroBody>
        </FunHeroButton>
      </FunList>
    </Page>
  );
};

export const feedRoomPosts = feedPosts;

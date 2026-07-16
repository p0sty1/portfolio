import { act } from 'react';

import { render, screen, waitFor } from '@testing-library/react';

import { AppProvider } from 'App/AppContext';
import { config } from 'App/config';
import { TimelineFeed } from 'components/TimelineFeed';
import { getSupabase } from 'lib/supabaseClient';

jest.mock('lib/supabaseClient', () => ({
  getSupabase: jest.fn(),
}));

const POST_IDS = [
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
];

const makeQuery = (data: unknown[]) => {
  const result = Promise.resolve({ data, error: null });
  const query: Record<string, unknown> = {
    then: result.then.bind(result),
  };

  ['eq', 'in', 'is', 'limit', 'lte', 'lt', 'order', 'select'].forEach(
    (method) => {
      query[method] = jest.fn(() => query);
    },
  );

  return query;
};

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly observed = new Set<Element>();

  readonly options?: IntersectionObserverInit;

  private readonly callback: IntersectionObserverCallback;

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.callback = callback;
    this.options = options;
    MockIntersectionObserver.instances.push(this);
  }

  disconnect() {
    this.observed.clear();
  }

  observe(target: Element) {
    this.observed.add(target);
  }

  takeRecords() {
    return [] as IntersectionObserverEntry[];
  }

  trigger(
    entries: Pick<
      IntersectionObserverEntry,
      'intersectionRatio' | 'isIntersecting' | 'target'
    >[],
  ) {
    this.callback(
      entries as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    );
  }

  unobserve(target: Element) {
    this.observed.delete(target);
  }
}

describe('timeline view tracking', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    MockIntersectionObserver.instances = [];
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: MockIntersectionObserver,
      writable: true,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('records visible posts only after the dwell time and batches them', async () => {
    const posts = POST_IDS.map((id, index) => ({
      body: `动态 ${String(index + 1)}`,
      created_at: new Date(2026, 6, 13, 12, index).toISOString(),
      id,
      is_featured: false,
      media_type: null,
      media_url: null,
    }));
    const rpc = jest.fn((name: string, parameters?: unknown) => {
      void parameters;

      if (name === 'record_timeline_post_views') {
        return Promise.resolve({
          data: POST_IDS.map((postId) => ({ post_id: postId, views_count: 3 })),
          error: null,
        });
      }

      return Promise.resolve({
        data: POST_IDS.map((postId) => ({
          liked_by_client: false,
          likes_count: 0,
          post_id: postId,
          views_count: 2,
        })),
        error: null,
      });
    });
    const client = {
      from: jest.fn((table: string) =>
        makeQuery(table === 'portfolio_timeline_posts' ? posts : []),
      ),
      rpc,
    };

    (getSupabase as jest.MockedFunction<typeof getSupabase>).mockReturnValue(
      client as unknown as ReturnType<typeof getSupabase>,
    );

    render(
      <AppProvider config={config} isMobile={false}>
        <TimelineFeed />
      </AppProvider>,
    );

    await waitFor(() => {
      expect(
        document.querySelectorAll('[data-v2="timeline-post"]'),
      ).toHaveLength(2);
    });
    await waitFor(() => {
      expect(
        MockIntersectionObserver.instances.some(
          (observer) => observer.options?.threshold !== undefined,
        ),
      ).toBe(true);
    });

    const cards = Array.from(
      document.querySelectorAll<HTMLElement>('[data-v2="timeline-post"]'),
    );
    const viewObserver = MockIntersectionObserver.instances.find(
      (observer) => observer.options?.threshold !== undefined,
    );

    expect(viewObserver).toBeDefined();
    expect(rpc).not.toHaveBeenCalledWith(
      'record_timeline_post_views',
      expect.anything(),
    );

    act(() => {
      viewObserver?.trigger([
        { intersectionRatio: 0.49, isIntersecting: true, target: cards[0] },
      ]);
      jest.advanceTimersByTime(2000);
    });

    expect(rpc).not.toHaveBeenCalledWith(
      'record_timeline_post_views',
      expect.anything(),
    );

    act(() => {
      viewObserver?.trigger(
        cards.map((card) => ({
          intersectionRatio: 0.5,
          isIntersecting: true,
          target: card,
        })),
      );
      jest.advanceTimersByTime(1499);
    });

    expect(rpc).not.toHaveBeenCalledWith(
      'record_timeline_post_views',
      expect.anything(),
    );

    act(() => {
      jest.advanceTimersByTime(351);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(rpc).toHaveBeenCalledTimes(2);
    const recordCall = rpc.mock.calls.find(
      ([name]) => name === 'record_timeline_post_views',
    );
    const recordParameters = recordCall?.[1] as
      | undefined
      | { p_client_id: string; p_post_ids: string[] };

    expect(recordParameters?.p_client_id).toMatch(/^timeline-/);
    expect(recordParameters?.p_post_ids).toEqual(POST_IDS);
    expect(screen.getAllByLabelText('3 次浏览')).toHaveLength(2);
  });
});

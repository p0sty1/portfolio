export type AdminResource =
  | 'blog-comments'
  | 'guestbook'
  | 'questions'
  | 'timeline-comments'
  | 'timeline-posts';

export interface AdminSite {
  created_at: string;
  description: string;
  id: string;
  is_active: boolean;
  is_default: boolean;
  slug: string;
  sort_order: number;
  title: string;
  updated_at: string;
}

export interface AdminOverview {
  counts: {
    blogComments: number;
    guestbook: number;
    pendingQuestions: number;
    timelineComments: number;
    timelinePosts: number;
  };
  sites: AdminSite[];
}

export interface AdminQuestion {
  answer: null | string;
  answered_at: null | string;
  created_at: string;
  deleted_at: null | string;
  hidden_at: null | string;
  id: string;
  moderated_at: null | string;
  question: string;
  site_id: string;
  status: 'answered' | 'deleted' | 'hidden' | 'pending';
}

export interface AdminGuestbookNote {
  body: string;
  created_at: string;
  deleted_at: null | string;
  hidden_at: null | string;
  id: string;
  moderated_at: null | string;
  site_id: string;
  status: 'deleted' | 'hidden' | 'published';
}

export interface AdminTimelinePost {
  body: string;
  created_at: string;
  deleted_at: null | string;
  hidden_at: null | string;
  id: string;
  is_featured: boolean;
  media_path: null | string;
  media_type: 'image' | 'video' | null;
  media_url: null | string;
  moderated_at: null | string;
  site_id: string;
  status: 'deleted' | 'hidden' | 'published';
}

export interface AdminTimelineComment {
  author_name: string;
  body: string;
  created_at: string;
  deleted_at: null | string;
  hidden_at: null | string;
  id: string;
  moderated_at: null | string;
  parent_id: null | string;
  post_id: string;
  site_id: string;
  status: 'deleted' | 'hidden' | 'published';
}

export interface AdminBlogComment {
  body: string;
  created_at: string;
  deleted_at: null | string;
  hidden_at: null | string;
  id: string;
  moderated_at: null | string;
  post_id: string;
  site_id: string;
  status: 'deleted' | 'hidden' | 'published';
}

export interface CreateTimelinePostInput {
  body: string;
  mediaPath?: null | string;
  mediaType?: 'image' | 'video' | null;
  mediaUrl?: null | string;
  siteId?: string;
}

const adminBase = '/api/admin';

export async function adminRequest<T>(
  password: string,
  path: string,
  options: {
    body?: unknown;
    method?: 'DELETE' | 'GET' | 'PATCH' | 'POST';
    query?: Record<string, string | undefined>;
  } = {},
): Promise<T> {
  const url = new URL(`${adminBase}${path}`, window.location.origin);
  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    body:
      typeof options.body === 'undefined'
        ? undefined
        : JSON.stringify(options.body),
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Password': password,
    },
    method: options.method ?? 'GET',
  });

  const text = await response.text();
  let payload: Record<string, unknown> = {};

  if (text) {
    try {
      payload = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error(
        '后台 API 没有返回 JSON；请确认正在通过 Cloudflare Worker 或 wrangler dev 访问。',
      );
    }
  }

  if (!response.ok) {
    const message =
      payload && typeof payload.error === 'string'
        ? payload.error
        : '后台请求失败。';

    throw new Error(message);
  }

  return payload as T;
}

export const fetchOverview = (password: string, siteId?: string) =>
  adminRequest<AdminOverview>(password, '/overview', {
    query: { siteId },
  });

export const fetchAdminList = <T>(
  password: string,
  resource: AdminResource,
  siteId?: string,
) =>
  adminRequest<{ items: T[] }>(password, `/${resource}`, {
    query: { siteId },
  }).then((payload) => payload.items);

export const answerQuestion = (
  password: string,
  questionId: string,
  answer: string,
) =>
  adminRequest<{ item: AdminQuestion }>(password, `/questions/${questionId}`, {
    body: { answer },
    method: 'PATCH',
  }).then((payload) => payload.item);

export const setQuestionVisibility = (
  password: string,
  questionId: string,
  action: 'hide' | 'restore',
  answer?: string,
) =>
  adminRequest<{ item: AdminQuestion }>(password, `/questions/${questionId}`, {
    body: { action, answer },
    method: 'PATCH',
  }).then((payload) => payload.item);

export const setResourceVisibility = <T>(
  password: string,
  resource: Exclude<AdminResource, 'questions'>,
  id: string,
  action: 'hide' | 'restore',
) =>
  adminRequest<{ item: T }>(password, `/${resource}/${id}`, {
    body: { action },
    method: 'PATCH',
  }).then((payload) => payload.item);

export const setTimelinePostFeatured = (
  password: string,
  postId: string,
  isFeatured: boolean,
) =>
  adminRequest<{ item: AdminTimelinePost }>(
    password,
    `/timeline-posts/${postId}`,
    {
      body: { isFeatured },
      method: 'PATCH',
    },
  ).then((payload) => payload.item);

export const deleteAdminResource = <T>(
  password: string,
  resource: AdminResource,
  id: string,
) =>
  adminRequest<{ item: T }>(password, `/${resource}/${id}`, {
    method: 'DELETE',
  }).then((payload) => payload.item);

export const createTimelinePost = (
  password: string,
  input: CreateTimelinePostInput,
) =>
  adminRequest<{ item: AdminTimelinePost }>(password, '/timeline-posts', {
    body: input,
    method: 'POST',
  }).then((payload) => payload.item);

export const createAdminSite = (
  password: string,
  input: Pick<AdminSite, 'description' | 'slug' | 'title'>,
) =>
  adminRequest<{ site: AdminSite }>(password, '/sites', {
    body: input,
    method: 'POST',
  }).then((payload) => payload.site);

export const updateAdminSite = (
  password: string,
  siteId: string,
  input: Partial<Pick<AdminSite, 'description' | 'is_active' | 'title'>>,
) =>
  adminRequest<{ site: AdminSite }>(password, `/sites/${siteId}`, {
    body: input,
    method: 'PATCH',
  }).then((payload) => payload.site);

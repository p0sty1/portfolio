interface Fetcher {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

interface R2ObjectBody {
  body: ReadableStream;
  httpEtag: string;
  writeHttpMetadata(headers: Headers): void;
}

interface R2Bucket {
  get(key: string): Promise<null | R2ObjectBody>;
}

interface Env {
  ADMIN_PASSWORD?: string;
  ASSETS: Fetcher;
  GALLERY: R2Bucket;
  PORTFOLIO_ADMIN_PASSWORD?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_URL?: string;
}

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type JsonRecord = Record<string, unknown>;
type QueryValue = boolean | number | string | undefined;

const manifestKey = 'gallery/manifest.json';
const jsonContentType = 'application/json; charset=utf-8';
const maxJsonBodyBytes = 64 * 1024;

const fallbackSupabaseUrl = 'https://nhwlsrnvdxzhygudhhuj.supabase.co';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

const validSiteSlug = /^[a-z0-9][a-z0-9-]*$/;
const validMediaTypes = new Set(['image', 'video']);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (url.pathname === '/api/gallery') {
        return await serveManifest(env);
      }

      const mediaPrefix = '/api/gallery/media/';
      if (url.pathname.startsWith(mediaPrefix)) {
        const key = decodeURIComponent(url.pathname.slice(mediaPrefix.length));

        return await serveMedia(env, key);
      }

      if (
        url.pathname === '/api/admin' ||
        url.pathname.startsWith('/api/admin/')
      ) {
        return await handleAdminRequest(request, env, url);
      }

      return await env.ASSETS.fetch(request);
    } catch (error) {
      if (error instanceof HttpError) {
        return json({ error: error.message }, error.status);
      }

      console.error(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          message: 'worker request failed',
          path: url.pathname,
        }),
      );

      return json({ error: '服务器暂时没有完成这次操作。' }, 500);
    }
  },
};

async function handleAdminRequest(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  await assertAdmin(request, env);

  const route = url.pathname
    .replace(/^\/api\/admin\/?/, '')
    .split('/')
    .filter(Boolean);
  const resource = route[0] ?? 'overview';
  const id = route[1];

  if (resource === 'overview' && request.method === 'GET') {
    return json(await getOverview(env, url));
  }

  if (resource === 'sites') {
    if (request.method === 'GET' && !id) {
      return json({ sites: await listSites(env) });
    }

    if (request.method === 'POST' && !id) {
      return json(
        { site: await createSite(env, await readJson(request)) },
        201,
      );
    }

    if (request.method === 'PATCH' && id) {
      return json({ site: await updateSite(env, id, await readJson(request)) });
    }
  }

  if (resource === 'questions') {
    if (request.method === 'GET' && !id) {
      return json({ items: await listRows(env, 'questions', url) });
    }

    if (request.method === 'PATCH' && id) {
      return json({
        item: await updateQuestion(env, id, await readJson(request)),
      });
    }

    if (request.method === 'DELETE' && id) {
      return json({ item: await softDelete(env, 'questions', id) });
    }
  }

  if (resource === 'guestbook') {
    if (request.method === 'GET' && !id) {
      return json({ items: await listRows(env, 'guestbook', url) });
    }

    if (request.method === 'PATCH' && id) {
      return json({
        item: await updateVisibility(
          env,
          'guestbook',
          id,
          await readJson(request),
        ),
      });
    }

    if (request.method === 'DELETE' && id) {
      return json({ item: await softDelete(env, 'guestbook', id) });
    }
  }

  if (resource === 'timeline-posts') {
    if (request.method === 'GET' && !id) {
      return json({ items: await listRows(env, 'timeline-posts', url) });
    }

    if (request.method === 'POST' && !id) {
      return json(
        { item: await createTimelinePost(env, await readJson(request)) },
        201,
      );
    }

    if (request.method === 'PATCH' && id) {
      return json({
        item: await updateVisibility(
          env,
          'timeline-posts',
          id,
          await readJson(request),
        ),
      });
    }

    if (request.method === 'DELETE' && id) {
      return json({ item: await softDelete(env, 'timeline-posts', id) });
    }
  }

  if (resource === 'timeline-comments') {
    if (request.method === 'GET' && !id) {
      return json({ items: await listRows(env, 'timeline-comments', url) });
    }

    if (request.method === 'PATCH' && id) {
      return json({
        item: await updateVisibility(
          env,
          'timeline-comments',
          id,
          await readJson(request),
        ),
      });
    }

    if (request.method === 'DELETE' && id) {
      return json({ item: await softDelete(env, 'timeline-comments', id) });
    }
  }

  if (resource === 'blog-comments') {
    if (request.method === 'GET' && !id) {
      return json({ items: await listRows(env, 'blog-comments', url) });
    }

    if (request.method === 'PATCH' && id) {
      return json({
        item: await updateVisibility(
          env,
          'blog-comments',
          id,
          await readJson(request),
        ),
      });
    }

    if (request.method === 'DELETE' && id) {
      return json({ item: await softDelete(env, 'blog-comments', id) });
    }
  }

  throw new HttpError(404, '没有找到这个后台接口。');
}

async function getOverview(env: Env, url: URL): Promise<JsonRecord> {
  const siteId = url.searchParams.get('siteId') ?? undefined;
  const siteFilter = scopedQuery(siteId);
  const [
    sites,
    pendingQuestions,
    guestbook,
    timelinePosts,
    timelineComments,
    blogComments,
  ] = await Promise.all([
    listSites(env),
    countRows(env, 'portfolio_anonymous_questions', {
      ...siteFilter,
      deleted_at: 'is.null',
      status: 'eq.pending',
    }),
    countRows(env, 'portfolio_demo_notes', {
      ...siteFilter,
      deleted_at: 'is.null',
    }),
    countRows(env, 'portfolio_timeline_posts', {
      ...siteFilter,
      deleted_at: 'is.null',
    }),
    countRows(env, 'portfolio_timeline_comments', {
      ...siteFilter,
      deleted_at: 'is.null',
    }),
    countRows(env, 'portfolio_blog_comments', {
      ...siteFilter,
      deleted_at: 'is.null',
    }),
  ]);

  return {
    counts: {
      blogComments,
      guestbook,
      pendingQuestions,
      timelineComments,
      timelinePosts,
    },
    sites,
  };
}

async function listSites(env: Env): Promise<unknown[]> {
  return await supabaseJson(env, 'portfolio_sites', {
    query: {
      order: 'sort_order.asc,created_at.asc',
      select:
        'id,slug,title,description,is_default,is_active,sort_order,created_at,updated_at',
    },
  });
}

async function createSite(env: Env, body: JsonRecord): Promise<unknown> {
  const slug = textField(body.slug, '主页标识', 80).toLowerCase();
  const title = textField(body.title, '主页名称', 120);
  const description = optionalTextField(body.description, 500);

  if (!validSiteSlug.test(slug)) {
    throw new HttpError(400, '主页标识只能使用小写字母、数字和连字符。');
  }

  const rows = await supabaseJson(env, 'portfolio_sites', {
    body: {
      description,
      slug,
      title,
    },
    method: 'POST',
    prefer: 'return=representation',
    query: {
      select:
        'id,slug,title,description,is_default,is_active,sort_order,created_at,updated_at',
    },
  });

  return firstRow(rows);
}

async function updateSite(
  env: Env,
  id: string,
  body: JsonRecord,
): Promise<unknown> {
  const update: JsonRecord = {};

  if (typeof body.title !== 'undefined') {
    update.title = textField(body.title, '主页名称', 120);
  }

  if (typeof body.description !== 'undefined') {
    update.description = optionalTextField(body.description, 500);
  }

  if (typeof body.is_active === 'boolean') {
    update.is_active = body.is_active;
  }

  if (typeof body.sort_order === 'number') {
    update.sort_order = Math.trunc(body.sort_order);
  }

  if (Object.keys(update).length === 0) {
    throw new HttpError(400, '没有可更新的主页字段。');
  }

  const rows = await supabaseJson(env, 'portfolio_sites', {
    body: update,
    method: 'PATCH',
    prefer: 'return=representation',
    query: {
      id: `eq.${id}`,
      select:
        'id,slug,title,description,is_default,is_active,sort_order,created_at,updated_at',
    },
  });

  return firstRow(rows);
}

async function listRows(
  env: Env,
  resource: string,
  url: URL,
): Promise<unknown[]> {
  const config = resourceConfig(resource);
  const siteId = url.searchParams.get('siteId') ?? undefined;
  const status = url.searchParams.get('status') ?? undefined;
  const query: Record<string, QueryValue> = {
    ...scopedQuery(siteId),
    deleted_at: 'is.null',
    limit: url.searchParams.get('limit') ?? '120',
    order: 'created_at.desc',
    select: config.select,
  };

  if (status && status !== 'all') {
    query.status = `eq.${status}`;
  }

  return await supabaseJson(env, config.table, { query });
}

async function updateQuestion(
  env: Env,
  id: string,
  body: JsonRecord,
): Promise<unknown> {
  const action = optionalTextField(body.action, 20);
  const now = new Date().toISOString();
  const update: JsonRecord = {
    moderated_at: now,
  };

  if (action === 'hide') {
    update.status = 'hidden';
    update.hidden_at = now;
  } else if (action === 'restore') {
    const answer = optionalTextField(body.answer, 2000);
    update.answer = answer || null;
    update.answered_at = answer ? now : null;
    update.hidden_at = null;
    update.deleted_at = null;
    update.status = answer ? 'answered' : 'pending';
  } else {
    const answer = textField(body.answer, '回答', 2000);
    update.answer = answer;
    update.answered_at = now;
    update.hidden_at = null;
    update.deleted_at = null;
    update.status = 'answered';
  }

  const rows = await supabaseJson(env, 'portfolio_anonymous_questions', {
    body: update,
    method: 'PATCH',
    prefer: 'return=representation',
    query: {
      id: `eq.${id}`,
      select:
        'id,site_id,question,answer,status,created_at,answered_at,hidden_at,deleted_at,moderated_at',
    },
  });

  return firstRow(rows);
}

async function updateVisibility(
  env: Env,
  resource: string,
  id: string,
  body: JsonRecord,
): Promise<unknown> {
  const config = resourceConfig(resource);
  const action = optionalTextField(body.action, 20);
  const now = new Date().toISOString();
  const update: JsonRecord = {
    moderated_at: now,
  };

  if (action === 'hide') {
    update.hidden_at = now;
    update.status = 'hidden';
  } else if (action === 'restore') {
    update.deleted_at = null;
    update.hidden_at = null;
    update.status = 'published';
  } else {
    throw new HttpError(400, '不支持的可见性操作。');
  }

  const rows = await supabaseJson(env, config.table, {
    body: update,
    method: 'PATCH',
    prefer: 'return=representation',
    query: {
      id: `eq.${id}`,
      select: config.select,
    },
  });

  return firstRow(rows);
}

async function softDelete(
  env: Env,
  resource: string,
  id: string,
): Promise<unknown> {
  const config = resourceConfig(resource);
  const now = new Date().toISOString();
  const rows = await supabaseJson(env, config.table, {
    body: {
      deleted_at: now,
      moderated_at: now,
      status: 'deleted',
    },
    method: 'PATCH',
    prefer: 'return=representation',
    query: {
      id: `eq.${id}`,
      select: config.select,
    },
  });

  return firstRow(rows);
}

async function createTimelinePost(
  env: Env,
  body: JsonRecord,
): Promise<unknown> {
  const text = optionalTextField(body.body, 2000);
  const mediaUrl = optionalTextField(body.media_url ?? body.mediaUrl, 2000);
  const mediaPath = optionalTextField(body.media_path ?? body.mediaPath, 2000);
  const mediaType = optionalTextField(body.media_type ?? body.mediaType, 20);
  const siteId = optionalTextField(body.site_id ?? body.siteId, 120);

  if (!text && !mediaUrl) {
    throw new HttpError(400, '动态需要正文或媒体。');
  }

  if (mediaType && !validMediaTypes.has(mediaType)) {
    throw new HttpError(400, '媒体类型只能是 image 或 video。');
  }

  const rows = await supabaseJson(env, 'portfolio_timeline_posts', {
    body: {
      body: text,
      media_path: mediaPath || null,
      media_type: mediaType || null,
      media_url: mediaUrl || null,
      site_id: siteId || undefined,
      status: 'published',
    },
    method: 'POST',
    prefer: 'return=representation',
    query: {
      select:
        'id,site_id,body,media_url,media_path,media_type,status,created_at,hidden_at,deleted_at,moderated_at',
    },
  });

  return firstRow(rows);
}

function resourceConfig(resource: string) {
  if (resource === 'questions') {
    return {
      select:
        'id,site_id,question,answer,status,created_at,answered_at,hidden_at,deleted_at,moderated_at',
      table: 'portfolio_anonymous_questions',
    };
  }

  if (resource === 'guestbook') {
    return {
      select:
        'id,site_id,body,status,created_at,hidden_at,deleted_at,moderated_at',
      table: 'portfolio_demo_notes',
    };
  }

  if (resource === 'timeline-posts') {
    return {
      select:
        'id,site_id,body,media_url,media_path,media_type,status,created_at,hidden_at,deleted_at,moderated_at',
      table: 'portfolio_timeline_posts',
    };
  }

  if (resource === 'timeline-comments') {
    return {
      select:
        'id,site_id,post_id,parent_id,author_name,body,status,created_at,hidden_at,deleted_at,moderated_at',
      table: 'portfolio_timeline_comments',
    };
  }

  if (resource === 'blog-comments') {
    return {
      select:
        'id,site_id,post_id,body,status,created_at,hidden_at,deleted_at,moderated_at',
      table: 'portfolio_blog_comments',
    };
  }

  throw new HttpError(404, '未知的后台资源。');
}

async function countRows(
  env: Env,
  table: string,
  query: Record<string, QueryValue>,
): Promise<number> {
  const response = await supabaseFetch(env, table, {
    method: 'GET',
    prefer: 'count=exact',
    query: {
      ...query,
      limit: 1,
      select: 'id',
    },
    range: '0-0',
  });
  const range = response.headers.get('content-range');
  const count = range?.split('/')[1];

  return count ? Number(count) || 0 : 0;
}

async function supabaseJson(
  env: Env,
  table: string,
  options: {
    body?: unknown;
    method?: string;
    prefer?: string;
    query?: Record<string, QueryValue>;
    range?: string;
  } = {},
): Promise<unknown[]> {
  const response = await supabaseFetch(env, table, options);
  const text = await response.text();
  if (!text) return [];
  const parsed = JSON.parse(text) as unknown;

  return Array.isArray(parsed) ? parsed : [parsed];
}

async function supabaseFetch(
  env: Env,
  table: string,
  {
    body,
    method = 'GET',
    prefer,
    query,
    range,
  }: {
    body?: unknown;
    method?: string;
    prefer?: string;
    query?: Record<string, QueryValue>;
    range?: string;
  },
): Promise<Response> {
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = (env.SUPABASE_URL || fallbackSupabaseUrl).replace(
    /\/$/,
    '',
  );

  if (!serviceKey) {
    throw new HttpError(
      500,
      'Worker 缺少 SUPABASE_SERVICE_ROLE_KEY，后台暂时不能写数据库。',
    );
  }

  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (typeof value !== 'undefined') {
      url.searchParams.set(key, String(value));
    }
  });

  const headers = new Headers({
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  });

  if (body !== undefined) {
    headers.set('Content-Type', jsonContentType);
  }

  if (prefer) {
    headers.set('Prefer', prefer);
  }

  if (range) {
    headers.set('Range', range);
  }

  const response = await fetch(url, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers,
    method,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = errorText || 'Supabase 请求失败。';

    try {
      const parsed = JSON.parse(errorText) as { message?: string };
      message = parsed.message || message;
    } catch {
      // Keep the plain response text.
    }

    throw new HttpError(response.status, message);
  }

  return response;
}

async function assertAdmin(request: Request, env: Env): Promise<void> {
  const expected = env.PORTFOLIO_ADMIN_PASSWORD || env.ADMIN_PASSWORD || '';
  const provided = request.headers.get('X-Admin-Password') || '';

  if (!expected) {
    throw new HttpError(
      500,
      'Worker 缺少 PORTFOLIO_ADMIN_PASSWORD，后台入口还没有配置。',
    );
  }

  if (!provided || !(await secureCompare(provided, expected))) {
    throw new HttpError(401, '后台密码不正确。');
  }
}

async function secureCompare(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(left)),
    crypto.subtle.digest('SHA-256', encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let diff = 0;

  for (let index = 0; index < leftBytes.length; index += 1) {
    diff |= leftBytes[index] ^ rightBytes[index];
  }

  return diff === 0;
}

async function readJson(request: Request): Promise<JsonRecord> {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > maxJsonBodyBytes) {
    throw new HttpError(413, '请求内容太大。');
  }

  const body = (await request.json().catch(() => null)) as null | unknown;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, '请求内容需要是 JSON 对象。');
  }

  return body as JsonRecord;
}

function scopedQuery(siteId: string | undefined): Record<string, string> {
  if (!siteId || siteId === 'all') return {};

  return { site_id: `eq.${siteId}` };
}

function firstRow(rows: unknown[]): unknown {
  if (rows.length === 0) {
    throw new HttpError(404, '没有找到对应记录。');
  }

  return rows[0];
}

function textField(value: unknown, label: string, maxLength: number): string {
  const text = optionalTextField(value, maxLength);
  if (!text) {
    throw new HttpError(400, `${label}不能为空。`);
  }

  return text;
}

function optionalTextField(value: unknown, maxLength: number): string {
  if (typeof value === 'undefined' || value === null) return '';
  if (typeof value !== 'string') {
    throw new HttpError(400, '字段格式不正确。');
  }

  const text = value.trim();
  if (text.length > maxLength) {
    throw new HttpError(400, `内容不能超过 ${maxLength} 个字符。`);
  }

  return text;
}

function json(data: unknown, status = 200): Response {
  const headers = new Headers(corsHeaders);
  headers.set('Content-Type', jsonContentType);

  return new Response(JSON.stringify(data), {
    headers,
    status,
  });
}

async function serveManifest(env: Env): Promise<Response> {
  const object = await env.GALLERY.get(manifestKey);

  if (!object) {
    return json(
      { bucket: 'portfolio-gallery', items: [], ready: false, source: 'r2' },
      200,
    );
  }

  const headers = new Headers(corsHeaders);
  headers.set('Content-Type', jsonContentType);
  headers.set('Cache-Control', 'public, max-age=60');
  object.writeHttpMetadata(headers);

  return new Response(object.body, { headers });
}

async function serveMedia(env: Env, key: string): Promise<Response> {
  if (!key || key.includes('..')) {
    return new Response('Invalid key', { status: 400 });
  }

  const object = await env.GALLERY.get(key);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers(corsHeaders);
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
}

interface Env {
  ASSETS: Fetcher;
  GALLERY: R2Bucket;
}

const manifestKey = 'gallery/manifest.json';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === '/api/gallery') {
      return serveManifest(env);
    }

    const mediaPrefix = '/api/gallery/media/';
    if (url.pathname.startsWith(mediaPrefix)) {
      const key = decodeURIComponent(url.pathname.slice(mediaPrefix.length));
      return serveMedia(env, key);
    }

    return env.ASSETS.fetch(request);
  },
};

async function serveManifest(env: Env): Promise<Response> {
  const object = await env.GALLERY.get(manifestKey);

  if (!object) {
    return Response.json(
      { items: [], source: 'r2', bucket: 'portfolio-gallery', ready: false },
      { headers: { ...corsHeaders, 'Cache-Control': 'public, max-age=30' } },
    );
  }

  const headers = new Headers(corsHeaders);
  headers.set('Content-Type', 'application/json; charset=utf-8');
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

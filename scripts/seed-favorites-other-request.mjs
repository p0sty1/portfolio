import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const envText = fs.readFileSync(path.join(root, 'social-prototype/.env'), 'utf8');
const supabaseUrl = envText.match(/SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envText.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing Supabase credentials in social-prototype/.env');
}

const sb = createClient(supabaseUrl, serviceKey);
const favoritesDir = path.join(root, 'public/favorites');

const headers = {
  Referer: 'https://www.google.com/',
  'User-Agent': 'portfolio-favorites-seed/1.0 Mozilla/5.0',
};

const entries = [
  {
    category: 'anime',
    title: '火影忍者',
    subtitle: 'Naruto',
    file: 'naruto.jpg',
    malId: 20,
  },
  {
    category: 'anime',
    title: '迷宫饭',
    subtitle: 'Delicious in Dungeon',
    file: 'dungeon-meshi.jpg',
    malId: 52701,
  },
  {
    category: 'anime',
    title: '关于前辈很烦人的事',
    subtitle: 'My Senpai Is Annoying',
    file: 'senpai-annoying.jpg',
    malId: 42351,
  },
  {
    category: 'anime',
    title: '黄金神威',
    subtitle: 'Golden Kamuy',
    file: 'golden-kamuy.jpg',
    malId: 36028,
  },
  {
    category: 'anime',
    title: '妖精的尾巴',
    subtitle: 'Fairy Tail',
    file: 'fairy-tail.jpg',
    malId: 6702,
  },
  {
    category: 'anime',
    title: '鬼灭之刃',
    subtitle: 'Demon Slayer',
    file: 'demon-slayer.jpg',
    malId: 38000,
  },
  {
    category: 'game',
    title: '阴阳师',
    subtitle: 'Onmyoji',
    linkUrl: 'https://yys.163.com/',
    imageUrl: 'https://webinput.nie.netease.com/img/yys/icon.png/128',
    file: 'onmyoji.jpg',
  },
  {
    category: 'game',
    title: '明日方舟',
    subtitle: 'Arknights',
    linkUrl: 'https://ak.hypergryph.com/',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/be/99/37/be993702-866f-c921-a7a3-f3b06d57036a/AppIcon-1x_U007emarketing-0-8-0-85-220-0.png/512x512bb.jpg',
    file: 'arknights.jpg',
  },
  {
    category: 'game',
    title: '王者荣耀',
    subtitle: 'Honor of Kings',
    linkUrl: 'https://pvp.qq.com/',
    imageUrl: 'https://game.gtimg.cn/images/yxzj/img201606/heroimg/166/166.jpg',
    file: 'honor-of-kings.jpg',
  },
  {
    category: 'game',
    title: '决战平安京',
    subtitle: 'Onmyoji Arena',
    linkUrl: 'https://www.onmyojiarena.us/',
    imageUrl: 'https://www.onmyojiarena.us/pc/gw/20190219173313/data/share1.jpg',
    file: 'onmyoji-arena.jpg',
  },
  {
    category: 'game',
    title: 'Coming Out on Top',
    subtitle: 'Visual novel · Steam',
    steamAppId: 642090,
    file: 'coming-out-on-top.jpg',
  },
  {
    category: 'game',
    title: 'Lustful Desires',
    subtitle: 'Hyao · itch.io',
    linkUrl: 'https://hyao.itch.io/lustful-desires',
    imageUrl: 'https://img.itch.zone/aW1nLzI5NTAwODcucG5n/original/Vv56%2B5.png',
    file: 'lustful-desires.jpg',
  },
  {
    category: 'game',
    title: '公寓De·M',
    subtitle: 'メゾンドエム · UGCP',
    linkUrl: 'https://ugcp.sakura.ne.jp/kouji.html#dom',
    imageUrl: 'https://ugcp.sakura.ne.jp/images/domdown.jpg',
    file: 'apartment-demo.jpg',
  },
  {
    category: 'game',
    title: '诺恩的餐厅',
    subtitle: "Norn's Dine",
    steamAppId: 3664240,
    file: 'norns-dine.jpg',
  },
  {
    category: 'celebrity',
    title: 'Lady Gaga',
    subtitle: 'Stefani Germanotta',
    wiki: 'Lady_Gaga',
    file: 'lady-gaga.jpg',
  },
  {
    category: 'celebrity',
    title: 'Olivia Rodrigo',
    subtitle: 'Singer-songwriter',
    wiki: 'Olivia_Rodrigo',
    file: 'olivia-rodrigo.jpg',
  },
  {
    category: 'celebrity',
    title: 'Chappell Roan',
    subtitle: 'Singer-songwriter',
    wiki: 'Chappell_Roan',
    file: 'chappell-roan.jpg',
  },
  {
    category: 'celebrity',
    title: 'Conan Gray',
    subtitle: 'Singer-songwriter',
    wiki: 'Conan_Gray',
    file: 'conan-gray.jpg',
  },
  {
    category: 'celebrity',
    title: '王心凌',
    subtitle: 'Cyndi Wang',
    wiki: '王心凌',
    wikiLang: 'zh',
    file: 'cyndi-wang.jpg',
  },
  {
    category: 'song',
    title: 'The Rise and Fall of a Midwest Princess',
    subtitle: 'Chappell Roan · 2023',
    spotifyUrl: 'https://open.spotify.com/album/0EiI8ylL0FmWWpgHVTsZjZ',
    file: 'midwest-princess.jpg',
  },
  {
    category: 'song',
    title: 'SOUR',
    subtitle: 'Olivia Rodrigo · 2021',
    spotifyUrl: 'https://open.spotify.com/album/6s84u2TUpR3wdUv4NgKA2j',
    file: 'sour.jpg',
  },
  {
    category: 'song',
    title: 'Kid Krow',
    subtitle: 'Conan Gray · 2020',
    spotifyUrl: 'https://open.spotify.com/album/2CMlkzFI2oDAy5MbyV7OV5',
    file: 'kid-krow.jpg',
  },
  {
    category: 'video',
    title: 'Lady Gaga 超级碗',
    subtitle: 'Super Bowl LI Halftime Show · 2017',
    linkUrl: 'https://www.youtube.com/watch?v=txXwg712zw4',
    imageUrl: 'https://i.ytimg.com/vi/txXwg712zw4/maxresdefault.jpg',
    file: 'lady-gaga-superbowl.jpg',
  },
  {
    category: 'pornstar',
    title: 'Beau Butler',
    subtitle: 'Actor · Out / IMDb',
    linkUrl: 'https://www.imdb.com/name/nm12341751/',
    imageUrl: 'https://www.out.com/media-library/beau-butler-via-instagram.jpg?id=54490491&width=980',
    file: 'beau-butler.jpg',
  },
  {
    category: 'pornstar',
    title: '黒井大河',
    subtitle: 'Kuroi Taiga · GVDB',
    linkUrl: 'https://md.gvdb.org/89962/',
    imageUrl: 'https://md.gvdb.org/wp-content/uploads/2021/09/89962.webp',
    file: 'kuroi-taiga.webp',
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function json(url) {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return response.json();
}

async function jikanAnime(id) {
  const data = await json(`https://api.jikan.moe/v4/anime/${id}`);

  return {
    imageUrl: data.data.images.jpg.large_image_url,
    linkUrl: data.data.url,
  };
}

async function spotifyAlbum(url) {
  const data = await json(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);

  return {
    imageUrl: data.thumbnail_url,
    linkUrl: url,
  };
}

async function steamApp(id) {
  const data = await json(`https://store.steampowered.com/api/appdetails?appids=${id}&filters=basic`);
  const app = data[id]?.data;

  if (!app) {
    throw new Error(`Steam app ${id} not found`);
  }

  return {
    imageUrl: app.header_image,
    linkUrl: `https://store.steampowered.com/app/${id}/`,
  };
}

async function wikiPage(title, lang = 'en') {
  const data = await json(
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
  );

  return {
    imageUrl: data.originalimage?.source ?? data.thumbnail?.source,
    linkUrl: data.content_urls.desktop.page,
  };
}

async function resolveEntry(entry) {
  if (entry.malId) return jikanAnime(entry.malId);
  if (entry.spotifyUrl) return spotifyAlbum(entry.spotifyUrl);
  if (entry.steamAppId) return steamApp(entry.steamAppId);
  if (entry.wiki) return wikiPage(entry.wiki, entry.wikiLang);

  return {
    imageUrl: entry.imageUrl,
    linkUrl: entry.linkUrl,
  };
}

async function download(url, dest) {
  const response = await fetch(url, { headers, redirect: 'follow' });

  if (!response.ok) {
    throw new Error(`download ${url}: ${response.status}`);
  }

  fs.writeFileSync(dest, Buffer.from(await response.arrayBuffer()));
}

async function findExisting(category, title) {
  const { data, error } = await sb
    .from('portfolio_favorites')
    .select('id')
    .eq('category', category)
    .eq('title', title)
    .maybeSingle();

  if (error) throw error;

  return data?.id ?? null;
}

async function main() {
  fs.mkdirSync(favoritesDir, { recursive: true });

  const orderByCategory = {};

  for (const entry of entries) {
    orderByCategory[entry.category] = (orderByCategory[entry.category] ?? 0) + 1;

    const resolved = await resolveEntry(entry);
    const dest = path.join(favoritesDir, entry.file);

    if (!entry.localFile) {
      console.log(`download ${entry.category}:${entry.title}`);
      await download(resolved.imageUrl, dest);
    }

    const row = {
      category: entry.category,
      title: entry.title,
      subtitle: entry.subtitle,
      link_url: resolved.linkUrl,
      image_url: `/favorites/${entry.file}`,
      note: '',
      sort_order: orderByCategory[entry.category],
    };

    const existingId = await findExisting(entry.category, entry.title);

    if (existingId) {
      const { error } = await sb
        .from('portfolio_favorites')
        .update(row)
        .eq('id', existingId);
      if (error) throw error;
      console.log(`updated ${entry.category}:${entry.title}`);
    } else {
      const { error } = await sb.from('portfolio_favorites').insert(row);
      if (error) throw error;
      console.log(`inserted ${entry.category}:${entry.title}`);
    }

    await sleep(650);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

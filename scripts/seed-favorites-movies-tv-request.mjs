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

const browserHeaders = {
  Referer: 'https://m.douban.com/',
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
};

const entries = [
  {
    category: 'movie',
    title: '五个扑水的少年',
    subtitle: 'Waterboys · 日本 · 2001',
    doubanId: '1301359',
    file: 'waterboys-japan.jpg',
  },
  {
    category: 'movie',
    title: '驴得水',
    subtitle: 'Mr. Donkey · 2016',
    doubanId: '25921812',
    file: 'mr-donkey.jpg',
  },
  {
    category: 'movie',
    title: '芝加哥',
    subtitle: 'Chicago · 2002',
    doubanId: '1307697',
    file: 'chicago-2002.jpg',
  },
  {
    category: 'movie',
    title: '寄生虫',
    subtitle: 'Parasite · 2019',
    doubanId: '27010768',
    file: 'parasite.jpg',
  },
  {
    category: 'movie',
    title: '喜宴',
    subtitle: 'The Wedding Banquet · 1993',
    doubanId: '1303037',
    file: 'wedding-banquet.jpg',
  },
  {
    category: 'movie',
    title: '甜蜜蜜',
    subtitle: 'Comrades: Almost a Love Story · 1996',
    doubanId: '1305164',
    file: 'comrades-love.jpg',
  },
  {
    category: 'movie',
    title: '蓝宇',
    subtitle: 'Lan Yu · 2001',
    doubanId: '1308076',
    file: 'lan-yu.jpg',
  },
  {
    category: 'movie',
    title: '爱乐之城',
    subtitle: 'La La Land · 2016',
    doubanId: '25934014',
    file: 'la-la-land.jpg',
  },
  {
    category: 'movie',
    title: '霸王别姬',
    subtitle: 'Farewell My Concubine · 1993',
    doubanId: '1291546',
    file: 'farewell-my-concubine.jpg',
  },
  {
    category: 'movie',
    title: '健听女孩',
    subtitle: 'CODA · 2021',
    doubanId: '35048413',
    file: 'coda.jpg',
  },
  {
    category: 'movie',
    title: '饮食男女',
    subtitle: 'Eat Drink Man Woman · 1994',
    doubanId: '1291818',
    file: 'eat-drink-man-woman.jpg',
  },
  {
    category: 'tv',
    title: '甄嬛传',
    subtitle: 'Empresses in the Palace · 2011',
    doubanId: '4922787',
    file: 'zhenhuan.jpg',
  },
  {
    category: 'tv',
    title: 'Emmerdale',
    subtitle: 'Robron 支线',
    linkUrl: 'https://www.imdb.com/title/tt0068069/',
    imageUrl: 'https://media.themoviedb.org/t/p/w780/6PEsHQiJ5xFdpyMrnoV7hqblrR2.jpg',
    file: 'emmerdale.jpg',
  },
  {
    category: 'tv',
    title: '漫长的季节',
    subtitle: 'The Long Season · 2023',
    doubanId: '35588177',
    file: 'long-season.jpg',
  },
  {
    category: 'tv',
    title: '心跳漏一拍',
    subtitle: 'Heartstopper · 第一季',
    doubanId: '35334903',
    file: 'heartstopper-s1.jpg',
  },
  {
    category: 'tv',
    title: '把妹大作战',
    subtitle: 'Undateable · 第二季',
    linkUrl: 'https://www.imdb.com/title/tt2788780/episodes/?season=2',
    imageUrl: 'https://image.tmdb.org/t/p/original/4f8ZWo6ROu0zs1OtqRVAZ9SzbzZ.jpg',
    file: 'undateable-s2.jpg',
  },
  {
    category: 'tv',
    title: '熊熊在哪里',
    subtitle: 'Where the Bears Are · 第一季',
    linkUrl: 'https://www.imdb.com/title/tt2298250/',
    imageUrl: 'https://image.tmdb.org/t/p/original/njoP1X7Dmy0LGtGNLAyDjaMCGfg.jpg',
    file: 'where-the-bears-are.jpg',
  },
  {
    category: 'tv',
    title: '欢乐颂',
    subtitle: 'Ode to Joy · 第一季',
    doubanId: '26430092',
    file: 'ode-to-joy-s1.jpg',
  },
  {
    category: 'tv',
    title: '以你的心诠释我的爱',
    subtitle: 'I Told Sunset About You · 第一季',
    doubanId: '34979008',
    file: 'ittays-s1.jpg',
  },
  {
    category: 'tv',
    title: '鱿鱼游戏',
    subtitle: 'Squid Game · 第一季',
    doubanId: '34812928',
    file: 'squid-game-s1.jpg',
  },
  {
    category: 'tv',
    title: '致命女人',
    subtitle: 'Why Women Kill · 第一季',
    doubanId: '30401122',
    file: 'why-women-kill-s1.jpg',
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const doubanUrl = (id) => `https://movie.douban.com/subject/${id}/`;

async function doubanPoster(id) {
  const url = `https://m.douban.com/movie/subject/${id}/`;
  const response = await fetch(url, { headers: browserHeaders });

  if (!response.ok) {
    throw new Error(`Douban ${id} returned ${response.status}`);
  }

  const html = await response.text();
  const poster =
    html.match(/https?:\/\/[^"']+\/view\/photo\/s_ratio_poster\/public\/[^"']+\.jpg/)?.[0] ??
    html.match(/https?:\/\/[^"']+\/view\/photo\/large\/public\/[^"']+\.jpg(?:\?[^"']*)?/)?.[0];

  if (!poster) {
    throw new Error(`Could not find Douban poster for ${id}`);
  }

  return poster;
}

async function download(url, dest) {
  const response = await fetch(url, { headers: browserHeaders, redirect: 'follow' });

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

  for (const [index, entry] of entries.entries()) {
    const linkUrl = entry.doubanId ? doubanUrl(entry.doubanId) : entry.linkUrl;
    const posterUrl = entry.doubanId ? await doubanPoster(entry.doubanId) : entry.imageUrl;
    const dest = path.join(favoritesDir, entry.file);

    console.log(`download ${entry.category}:${entry.title}`);
    await download(posterUrl, dest);

    const row = {
      category: entry.category,
      title: entry.title,
      subtitle: entry.subtitle,
      link_url: linkUrl,
      image_url: `/favorites/${entry.file}`,
      note: '',
      sort_order: entry.category === 'movie' ? index + 1 : index - 10,
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

    await sleep(500);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

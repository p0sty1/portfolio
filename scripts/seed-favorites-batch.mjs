import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const envText = fs.readFileSync(path.join(root, 'social-prototype/.env'), 'utf8');
const supabaseUrl = envText.match(/SUPABASE_URL=(.+)/)[1].trim();
const serviceKey = envText.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const sb = createClient(supabaseUrl, serviceKey);

const favoritesDir = path.join(root, 'public/favorites');

/** @type {{ category: 'movie'|'tv', title: string, subtitle: string, link_url: string, file: string, imageUrl: string }[]} */
const ENTRIES = [
  {
    category: 'movie',
    title: '五个扑水的少年',
    subtitle: 'Five Water Boys · 2021',
    link_url: 'https://movie.douban.com/subject/35030151/',
    file: 'five-water-boys.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/aH1lCPtAEbpdkRe10cDE4xZBJKL.jpg',
  },
  {
    category: 'movie',
    title: '驴得水',
    subtitle: 'Mr. Donkey · 2016',
    link_url: 'https://movie.douban.com/subject/25921812/',
    file: 'mr-donkey.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/isZuUeOg0zZCtqytSwJinc6N480.jpg',
  },
  {
    category: 'movie',
    title: '芝加哥',
    subtitle: 'Chicago · 2002',
    link_url: 'https://www.imdb.com/title/tt0299658/',
    file: 'chicago-2002.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/3ED8cWCXY9zkx77Sd0N5qMbsdDP.jpg',
  },
  {
    category: 'movie',
    title: '寄生虫',
    subtitle: 'Parasite · 2019',
    link_url: 'https://movie.douban.com/subject/27010768/',
    file: 'parasite.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
  },
  {
    category: 'movie',
    title: '喜宴',
    subtitle: 'The Wedding Banquet · 1993',
    link_url: 'https://movie.douban.com/subject/1296767/',
    file: 'wedding-banquet.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/o53KXHyQNeS70yRNEGf6elC1196.jpg',
  },
  {
    category: 'movie',
    title: '甜蜜蜜',
    subtitle: 'Comrades: Almost a Love Story · 1996',
    link_url: 'https://movie.douban.com/subject/1305164/',
    file: 'comrades-love.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/tANhfxk7LPf555DAP8EVjm7FqJ.jpg',
  },
  {
    category: 'movie',
    title: '蓝宇',
    subtitle: 'Lan Yu · 2001',
    link_url: 'https://movie.douban.com/subject/1308076/',
    file: 'lan-yu.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/19TErhNqVv31oypAIRt2YYgWqLi.jpg',
  },
  {
    category: 'tv',
    title: 'Emmerdale',
    subtitle: 'Robron storyline',
    link_url: 'https://www.imdb.com/title/tt0068065/',
    file: 'emmerdale.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/6PEsHQiJ5xFdpyMrnoV7hqblrR2.jpg',
  },
  {
    category: 'tv',
    title: '漫长的季节',
    subtitle: 'The Long Season · 2023',
    link_url: 'https://movie.douban.com/subject/35332237/',
    file: 'long-season.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/rM5Y0ziZbmpkqW1db2HK3xrzTXj.jpg',
  },
  {
    category: 'tv',
    title: '心跳漏一拍',
    subtitle: 'Heartstopper · Season 1',
    link_url: 'https://www.imdb.com/title/tt10638036/',
    file: 'heartstopper-s1.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/4fVddnbhcmzRZE14NJY03GKS6Fn.jpg',
  },
  {
    category: 'tv',
    title: '把妹大作战',
    subtitle: 'How I Met Your Mother · Season 2',
    link_url: 'https://www.imdb.com/title/tt0460649/',
    file: 'himym.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/b34jPzmB0wZy7EjUZoleXOl2RRI.jpg',
  },
  {
    category: 'tv',
    title: '熊熊在哪里',
    subtitle: "Where's Chicky?",
    link_url: 'https://www.imdb.com/title/tt7134904/',
    file: 'wheres-chicky.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/sALaK5hKfjrWxIl68HocZLeFQnw.jpg',
  },
  {
    category: 'tv',
    title: '欢乐颂',
    subtitle: 'Ode to Joy · Season 1',
    link_url: 'https://movie.douban.com/subject/26683706/',
    file: 'ode-to-joy-s1.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/u5rLfEd8kakXCTzRoU3dIkkEnOO.jpg',
  },
  {
    category: 'tv',
    title: '以你的心诠释我的爱',
    subtitle: 'I Told Sunset About You · Season 1',
    link_url: 'https://movie.douban.com/subject/34973463/',
    file: 'ittays-s1.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/uBFCB2TZ0H5axGoDTQ1qGhfdxkh.jpg',
  },
  {
    category: 'tv',
    title: '鱿鱼游戏',
    subtitle: 'Squid Game · Season 1',
    link_url: 'https://movie.douban.com/subject/35563253/',
    file: 'squid-game-s1.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/1QdXdRYfktUSONkl1oD5gc6Be0s.jpg',
  },
  {
    category: 'tv',
    title: '致命女人',
    subtitle: 'Why Women Kill · Season 1',
    link_url: 'https://movie.douban.com/subject/33447642/',
    file: 'why-women-kill-s1.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/vlD5bXx69jJO4h9byWs4FAcT96y.jpg',
  },
];

async function download(url, dest) {
  const r = await fetch(url, {
    headers: { 'User-Agent': 'portfolio-favorites-seed/1.0' },
  });
  if (!r.ok) throw new Error(`download ${url}: ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

async function main() {
  fs.mkdirSync(favoritesDir, { recursive: true });

  const { data: existing } = await sb
    .from('portfolio_favorites')
    .select('title, category');

  const have = new Set(
    (existing ?? []).map((r) => `${r.category}:${r.title}`),
  );

  let movieOrder = 3;
  let tvOrder = 1;

  for (const entry of ENTRIES) {
    const key = `${entry.category}:${entry.title}`;
    if (have.has(key)) {
      console.log('skip exists', key);
      continue;
    }

    const dest = path.join(favoritesDir, entry.file);
    if (!fs.existsSync(dest)) {
      console.log('download', entry.file);
      await download(entry.imageUrl, dest);
    }

    const sort_order =
      entry.category === 'movie' ? ++movieOrder : ++tvOrder;

    const row = {
      category: entry.category,
      title: entry.title,
      subtitle: entry.subtitle,
      link_url: entry.link_url,
      image_url: `/favorites/${entry.file}`,
      note: '',
      sort_order,
    };

    const { error } = await sb.from('portfolio_favorites').insert(row);
    if (error) throw error;
    console.log('inserted', key, 'sort', sort_order);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

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

const REMOVE_TITLES = [
  '进击的巨人',
  '葬送的芙莉莲',
  '塞尔达传说：旷野之息',
  '艾尔登法环',
  'Bohemian Rhapsody',
  '夜に駆ける',
  '坂本龙一',
  '刘亦菲',
  'Web Dev 速览',
  '4K 风景样片',
  '示例条目 A',
  '示例条目 B',
];

/** @type {{ category: string, title: string, subtitle: string, link_url: string, file: string, imageUrl: string }[]} */
const ENTRIES = [
  // anime
  {
    category: 'anime',
    title: '火影忍者',
    subtitle: 'Naruto',
    link_url: 'https://myanimelist.net/anime/20/Naruto',
    file: 'naruto.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg',
  },
  {
    category: 'anime',
    title: '迷宫饭',
    subtitle: 'Delicious in Dungeon',
    link_url: 'https://myanimelist.net/anime/52701/Delicious_in_Dungeon',
    file: 'dungeon-meshi.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/bFlVZV8TQbs8hcIY7PVYonYFMgK.jpg',
  },
  {
    category: 'anime',
    title: '关于前辈很烦人的事',
    subtitle: 'My Senpai Is Annoying',
    link_url:
      'https://myanimelist.net/anime/42351/Senpai_ga_Uzai_Kouhai_no_Hanashi',
    file: 'senpai-annoying.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/dBkZUQKcUqR0dgVhTB3SSozDvqz.jpg',
  },
  {
    category: 'anime',
    title: '黄金神威',
    subtitle: 'Golden Kamuy',
    link_url: 'https://myanimelist.net/anime/34549/Golden_Kamuy',
    file: 'golden-kamuy.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/7FxjyLe7co1U8xLYYkpLbXfkTh1.jpg',
  },
  {
    category: 'anime',
    title: '妖精的尾巴',
    subtitle: 'Fairy Tail',
    link_url: 'https://myanimelist.net/anime/6702/Fairy_Tail',
    file: 'fairy-tail.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/dj0uI34MOkZMTE233tfRebs0YYx.jpg',
  },
  {
    category: 'anime',
    title: '鬼灭之刃',
    subtitle: 'Demon Slayer',
    link_url: 'https://myanimelist.net/anime/38000/Kimetsu_no_Yaiba',
    file: 'demon-slayer.jpg',
    imageUrl:
      'https://media.themoviedb.org/t/p/w780/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg',
  },
  // games
  {
    category: 'game',
    title: '阴阳师',
    subtitle: 'Onmyoji',
    link_url: 'https://onmyoji.net/',
    file: 'onmyoji.jpg',
    imageUrl:
      'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/551170/header.jpg',
  },
  {
    category: 'game',
    title: '明日方舟',
    subtitle: 'Arknights',
    link_url: 'https://ak.hypergryph.com/',
    file: 'arknights.jpg',
    imageUrl:
      'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1708010/header.jpg',
  },
  {
    category: 'game',
    title: '王者荣耀',
    subtitle: 'Honor of Kings',
    link_url: 'https://pvp.qq.com/',
    file: 'honor-of-kings.jpg',
    imageUrl:
      'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1117030/header.jpg',
  },
  {
    category: 'game',
    title: '决战平安京',
    subtitle: 'Onmyoji Arena',
    link_url: 'https://paj.qq.com/',
    file: 'onmyoji-arena.jpg',
    imageUrl:
      'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/551170/header_292x136.jpg',
  },
  {
    category: 'game',
    title: 'Coming Out on Top',
    subtitle: 'Visual novel · Steam',
    link_url: 'https://store.steampowered.com/app/251990/Coming_Out_on_Top/',
    file: 'coming-out-on-top.jpg',
    imageUrl:
      'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/251990/header.jpg',
  },
  {
    category: 'game',
    title: 'Lustful Desires',
    subtitle: 'Hyao · itch.io',
    link_url: 'https://hyao.itch.io/lustful-desires',
    file: 'lustful-desires.jpg',
    imageUrl: 'https://img.itch.zone/aW1nLzI5NTA5NzYucG5n/original/d4QlPn.png',
  },
  {
    category: 'game',
    title: '公寓dem',
    subtitle: '妹居物语 · Demo',
    link_url: 'https://store.steampowered.com/app/4027870/_Demo/',
    file: 'apartment-demo.jpg',
    imageUrl: 'https://picsum.photos/seed/meiju-demo/400/560',
  },
  {
    category: 'game',
    title: '诺恩的餐厅',
    subtitle: "Norn's Dine",
    link_url: 'https://store.steampowered.com/app/3664240/Norns_Dine/',
    file: 'norns-dine.jpg',
    imageUrl: 'https://picsum.photos/seed/norns-dine/400/560',
  },
  // celebrity
  {
    category: 'celebrity',
    title: 'Lady Gaga',
    subtitle: 'Stefani Germanotta',
    link_url: 'https://www.ladygaga.com/',
    file: 'lady-gaga.jpg',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Lady_Gaga_at_Joe_Biden%27s_inauguration_%28cropped%29.jpg/440px-Lady_Gaga_at_Joe_Biden%27s_inauguration_%28cropped%29.jpg',
  },
  {
    category: 'celebrity',
    title: 'Olivia Rodrigo',
    subtitle: 'Singer-songwriter',
    link_url: 'https://www.oliviarodrigo.com/',
    file: 'olivia-rodrigo.jpg',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Olivia_Rodrigo_2021_%28cropped%29.jpg/440px-Olivia_Rodrigo_2021_%28cropped%29.jpg',
  },
  {
    category: 'celebrity',
    title: 'Chappell Roan',
    subtitle: 'Singer-songwriter',
    link_url: 'https://www.chappellroan.com/',
    file: 'chappell-roan.jpg',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Chappell_Roan_at_Governors_Ball_2024.jpg/440px-Chappell_Roan_at_Governors_Ball_2024.jpg',
  },
  {
    category: 'celebrity',
    title: 'Conan Gray',
    subtitle: 'Singer-songwriter',
    link_url: 'https://www.conangray.com/',
    file: 'conan-gray.jpg',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Conan_Gray_2019.png/440px-Conan_Gray_2019.png',
  },
  {
    category: 'celebrity',
    title: '王心凌',
    subtitle: 'Cyndi Wang',
    link_url: 'https://zh.wikipedia.org/wiki/%E7%8E%8B%E5%BF%83%E5%87%8C',
    file: 'cyndi-wang.jpg',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Cyndi_Wang_2013.jpg/440px-Cyndi_Wang_2013.jpg',
  },
  // song (albums)
  {
    category: 'song',
    title: 'The Rise and Fall of a Midwest Princess',
    subtitle: 'Chappell Roan · 2023',
    link_url:
      'https://open.spotify.com/album/5aYhdzAb6frX65JXxC3n5S',
    file: 'midwest-princess.jpg',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/en/thumb/8/8a/Chappell_Roan_-_The_Rise_and_Fall_of_a_Midwest_Princess.png/440px-Chappell_Roan_-_The_Rise_and_Fall_of_a_Midwest_Princess.png',
  },
  {
    category: 'song',
    title: 'SOUR',
    subtitle: 'Olivia Rodrigo · 2021',
    link_url: 'https://open.spotify.com/album/6s84Wp2bpmN4Bt9mCK56UE',
    file: 'sour.jpg',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/en/thumb/9/90/Sour.png/440px-Sour.png',
  },
  {
    category: 'song',
    title: 'Kid Krow',
    subtitle: 'Conan Gray · 2020',
    link_url: 'https://open.spotify.com/album/2WYlOqoUyJRI7nBI7Yak5A',
    file: 'kid-krow.jpg',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/en/thumb/1/1e/Conan_Gray_-_Kid_Krow.png/440px-Conan_Gray_-_Kid_Krow.png',
  },
  // video
  {
    category: 'video',
    title: 'Lady Gaga 超级碗',
    subtitle: 'Super Bowl LI Halftime Show · 2017',
    link_url: 'https://www.youtube.com/watch?v=txXggH8qJS8',
    file: 'lady-gaga-superbowl.jpg',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Lady_Gaga_at_Joe_Biden%27s_inauguration_%28cropped%29.jpg/440px-Lady_Gaga_at_Joe_Biden%27s_inauguration_%28cropped%29.jpg',
  },
  // pornstar
  {
    category: 'pornstar',
    title: 'Beau Butler',
    subtitle: 'Actor',
    link_url: 'https://www.imdb.com/name/nm12341751/',
    file: 'beau-butler.jpg',
    imageUrl: 'https://www.imdb.com/name/nm12341751/',
  },
  {
    category: 'pornstar',
    title: '黒井大河',
    subtitle: 'Kuroi Taiga',
    link_url: 'https://md.gvdb.org/89962/',
    file: 'kuroi-taiga.jpg',
    imageUrl: 'https://picsum.photos/seed/kuroi-taiga/400/560',
  },
];

async function tmdbOg(type, id) {
  const r = await fetch(`https://www.themoviedb.org/${type}/${id}`);
  const html = await r.text();
  const m = html.match(/property="og:image" content="([^"]+)"/);
  return m?.[1]?.replace('/w500/', '/w780/') ?? null;
}

async function imdbOg(imdbId) {
  const r = await fetch(`https://www.imdb.com/name/${imdbId}/`, {
    headers: { 'User-Agent': 'portfolio-favorites-seed/1.0' },
  });
  const html = await r.text();
  const m = html.match(/property="og:image" content="([^"]+)"/);
  return m?.[1] ?? null;
}

async function resolveImageUrl(entry) {
  if (entry.title === 'Beau Butler') {
    const u = await imdbOg('nm12341751');
    if (u) return u;
  }
  return entry.imageUrl;
}

async function download(url, dest) {
  const r = await fetch(url, {
    headers: { 'User-Agent': 'portfolio-favorites-seed/1.0' },
  });
  if (!r.ok) throw new Error(`download ${url}: ${r.status}`);
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
}

async function main() {
  fs.mkdirSync(favoritesDir, { recursive: true });

  for (const title of REMOVE_TITLES) {
    const { error } = await sb
      .from('portfolio_favorites')
      .delete()
      .eq('title', title);
    if (error) console.warn('delete', title, error.message);
    else console.log('removed', title);
  }

  const { data: existing } = await sb
    .from('portfolio_favorites')
    .select('title, category, sort_order');

  const have = new Set(
    (existing ?? []).map((r) => `${r.category}:${r.title}`),
  );

  const maxSort = {};
  for (const row of existing ?? []) {
    maxSort[row.category] = Math.max(maxSort[row.category] ?? 0, row.sort_order);
  }

  for (const entry of ENTRIES) {
    const key = `${entry.category}:${entry.title}`;
    if (have.has(key)) {
      console.log('skip exists', key);
      continue;
    }

    const imageUrl = await resolveImageUrl(entry);
    const dest = path.join(favoritesDir, entry.file);
    if (!fs.existsSync(dest)) {
      console.log('download', entry.file);
      await download(imageUrl, dest);
    }

    const sort_order = (maxSort[entry.category] ?? 0) + 1;
    maxSort[entry.category] = sort_order;

    const { error } = await sb.from('portfolio_favorites').insert({
      category: entry.category,
      title: entry.title,
      subtitle: entry.subtitle,
      link_url: entry.link_url,
      image_url: `/favorites/${entry.file}`,
      note: '',
      sort_order,
    });
    if (error) throw error;
    console.log('inserted', key, 'sort', sort_order);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

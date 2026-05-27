import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const envText = fs.readFileSync(path.join(root, 'social-prototype/.env'), 'utf8');
const sb = createClient(
  envText.match(/SUPABASE_URL=(.+)/)[1].trim(),
  envText.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim(),
);
const favoritesDir = path.join(root, 'public/favorites');

async function wikiThumb(title, lang = 'en') {
  const r = await fetch(
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    { headers: { 'User-Agent': 'portfolio-favorites-seed/1.0' } },
  );
  if (!r.ok) throw new Error(`wiki ${lang}:${title} ${r.status}`);
  const data = await r.json();
  const src = data.originalimage?.source ?? data.thumbnail?.source;
  if (!src) throw new Error(`wiki ${title}: no image`);
  return src;
}

const ENTRIES = [
  {
    category: 'celebrity',
    title: 'Lady Gaga',
    subtitle: 'Stefani Germanotta',
    link_url: 'https://www.ladygaga.com/',
    file: 'lady-gaga.jpg',
    wiki: 'Lady_Gaga',
  },
  {
    category: 'celebrity',
    title: 'Olivia Rodrigo',
    subtitle: 'Singer-songwriter',
    link_url: 'https://www.oliviarodrigo.com/',
    file: 'olivia-rodrigo.jpg',
    wiki: 'Olivia_Rodrigo',
  },
  {
    category: 'celebrity',
    title: 'Chappell Roan',
    subtitle: 'Singer-songwriter',
    link_url: 'https://www.chappellroan.com/',
    file: 'chappell-roan.jpg',
    wiki: 'Chappell_Roan',
  },
  {
    category: 'celebrity',
    title: 'Conan Gray',
    subtitle: 'Singer-songwriter',
    link_url: 'https://www.conangray.com/',
    file: 'conan-gray.jpg',
    wiki: 'Conan_Gray',
  },
  {
    category: 'celebrity',
    title: '王心凌',
    subtitle: 'Cyndi Wang',
    link_url: 'https://zh.wikipedia.org/wiki/%E7%8E%8B%E5%BF%83%E5%87%8C',
    file: 'cyndi-wang.jpg',
    wiki: '王心凌',
    wikiLang: 'zh',
  },
  {
    category: 'song',
    title: 'The Rise and Fall of a Midwest Princess',
    subtitle: 'Chappell Roan · 2023',
    link_url: 'https://open.spotify.com/album/5aYhdzAb6frX65JXxC3n5S',
    file: 'midwest-princess.jpg',
    wiki: 'The_Rise_and_Fall_of_a_Midwest_Princess',
  },
  {
    category: 'song',
    title: 'SOUR',
    subtitle: 'Olivia Rodrigo · 2021',
    link_url: 'https://open.spotify.com/album/6s84Wp2bpmN4Bt9mCK56UE',
    file: 'sour.jpg',
    wiki: 'Sour_(album)',
  },
  {
    category: 'song',
    title: 'Kid Krow',
    subtitle: 'Conan Gray · 2020',
    link_url: 'https://open.spotify.com/album/2WYlOqoUyJRI7nBI7Yak5A',
    file: 'kid-krow.jpg',
    wiki: 'Kid_Krow',
  },
  {
    category: 'video',
    title: 'Lady Gaga 超级碗',
    subtitle: 'Super Bowl LI Halftime Show · 2017',
    link_url: 'https://www.youtube.com/watch?v=txXggH8qJS8',
    file: 'lady-gaga-superbowl.jpg',
    wiki: 'Super_Bowl_LI_halftime_show',
  },
  {
    category: 'pornstar',
    title: 'Beau Butler',
    subtitle: 'Actor',
    link_url: 'https://www.imdb.com/name/nm12341751/',
    file: 'beau-butler.jpg',
    imageUrl: 'https://picsum.photos/seed/beau-butler/400/560',
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function download(url, dest) {
  console.log('  url:', url);
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'portfolio-favorites-seed/1.0' },
      redirect: 'follow',
    });
    if (r.ok) {
      fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
      return;
    }
    if (r.status === 429 && attempt < 3) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    throw new Error(`${r.status} ${url}`);
  }
}

const { data: existing } = await sb.from('portfolio_favorites').select('title,category,sort_order');
const have = new Set((existing ?? []).map((r) => `${r.category}:${r.title}`));
const maxSort = {};
for (const row of existing ?? []) {
  maxSort[row.category] = Math.max(maxSort[row.category] ?? 0, row.sort_order);
}

for (const entry of ENTRIES) {
  const key = `${entry.category}:${entry.title}`;
  if (have.has(key)) {
    console.log('skip', key);
    continue;
  }
  const dest = path.join(favoritesDir, entry.file);
  if (!fs.existsSync(dest)) {
    const imageUrl = entry.wiki
      ? await wikiThumb(entry.wiki, entry.wikiLang ?? 'en')
      : entry.imageUrl;
    console.log('download', entry.file);
    await download(imageUrl, dest);
    await sleep(800);
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
  console.log('ok', key, sort_order);
}

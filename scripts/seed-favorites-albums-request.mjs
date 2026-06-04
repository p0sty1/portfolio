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
  'User-Agent': 'portfolio-favorites-seed/1.0 Mozilla/5.0',
};

const entries = [
  {
    title: '纯妹妹',
    artist: '单依纯',
    file: 'pure-sister.jpg',
    itunesId: 1864543075,
    itunesCountry: 'cn',
  },
  {
    title: '极限',
    artist: '徐佳莹',
    file: 'lala-hsu-limit.jpg',
    itunesId: 672974493,
    itunesCountry: 'tw',
  },
  {
    title: 'Wishbone',
    artist: 'Conan Gray',
    file: 'wishbone-conan-gray.jpg',
    deezerId: 801417931,
  },
  {
    title: 'Lover',
    artist: 'Taylor Swift',
    file: 'lover.jpg',
    deezerId: 108447472,
  },
  {
    title: 'Melodrama',
    artist: 'Lorde',
    file: 'melodrama.jpg',
    deezerId: 42886601,
  },
  {
    title: 'My 21st Century Blues',
    artist: 'RAYE',
    file: 'my-21st-century-blues.jpg',
    deezerId: 393727427,
  },
  {
    title: 'Sexistential',
    artist: 'Robyn',
    file: 'sexistential.jpg',
    deezerId: 933146091,
  },
  {
    title: 'Pure Heroine',
    artist: 'Lorde',
    file: 'pure-heroine.jpg',
    deezerId: 6909237,
  },
  {
    title: "Hollywood's Bleeding",
    artist: 'Post Malone',
    file: 'hollywoods-bleeding.jpg',
    deezerId: 110040592,
  },
  {
    title: 'Virgin',
    artist: 'Lorde',
    file: 'virgin-lorde.jpg',
    deezerId: 777441001,
  },
  {
    title: '陶喆同名专辑',
    artist: '陶喆',
    file: 'david-tao-album.jpg',
    itunesId: 1416149926,
    itunesCountry: 'tw',
  },
  {
    title: "I'm O.K.",
    artist: '陶喆',
    file: 'im-ok-david-tao.jpg',
    itunesId: 905206471,
    itunesCountry: 'tw',
  },
  {
    title: '渺小',
    artist: '田馥甄',
    file: 'insignificance-hebe.jpg',
    itunesId: 744962939,
    itunesCountry: 'tw',
  },
  {
    title: 'The Fame Monster',
    artist: 'Lady Gaga',
    file: 'the-fame-monster.jpg',
    itunesId: 1440814077,
    itunesCountry: 'us',
  },
  {
    title: 'MAYHEM',
    artist: 'Lady Gaga',
    file: 'mayhem.jpg',
    deezerId: 722147851,
  },
  {
    title: 'eternal sunshine',
    artist: 'Ariana Grande',
    file: 'eternal-sunshine.jpg',
    deezerId: 556294552,
  },
  {
    title: 'BRAT',
    artist: 'Charli xcx',
    file: 'brat.jpg',
    deezerId: 597350882,
  },
  {
    title: '无人知晓',
    artist: '田馥甄',
    file: 'no-one-knows-hebe.jpg',
    itunesId: 1534004626,
    itunesCountry: 'tw',
  },
  {
    title: 'reputation',
    artist: 'Taylor Swift',
    file: 'reputation.jpg',
    deezerId: 52612062,
  },
  {
    title: 'Golden Hour',
    artist: 'Kacey Musgraves',
    file: 'golden-hour.jpg',
    deezerId: 60649622,
  },
  {
    title: 'Ultraviolence',
    artist: 'Lana Del Rey',
    file: 'ultraviolence.jpg',
    deezerId: 7898271,
  },
  {
    title: 'Blue Banisters',
    artist: 'Lana Del Rey',
    file: 'blue-banisters.jpg',
    deezerId: 267169752,
  },
  {
    title: "Short n' Sweet",
    artist: 'Sabrina Carpenter',
    file: 'short-n-sweet.jpg',
    deezerId: 631839161,
  },
  {
    title: '19',
    artist: 'Adele',
    file: 'adele-19.jpg',
    deezerId: 251821,
  },
  {
    title: 'HIT ME HARD AND SOFT',
    artist: 'Billie Eilish',
    file: 'hit-me-hard-and-soft.jpg',
    deezerId: 586786102,
  },
  {
    title: '25',
    artist: 'Adele',
    file: 'adele-25.jpg',
    deezerId: 14880539,
  },
  {
    title: 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?',
    artist: 'Billie Eilish',
    file: 'when-we-all-fall-asleep.jpg',
    deezerId: 91598612,
  },
  {
    title: 'thank u, next',
    artist: 'Ariana Grande',
    file: 'thank-u-next.jpg',
    deezerId: 86773062,
  },
  {
    title: 'Merry Christmas',
    artist: 'Mariah Carey',
    file: 'merry-christmas-mariah-carey.jpg',
    deezerId: 6155526,
  },
  {
    title: 'Dangerous Woman',
    artist: 'Ariana Grande',
    file: 'dangerous-woman.jpg',
    itunesId: 1440835631,
    itunesCountry: 'us',
  },
  {
    title: 'GUTS',
    artist: 'Olivia Rodrigo',
    file: 'guts.jpg',
    deezerId: 484372295,
  },
  {
    title: 'Chill Kill',
    artist: 'Red Velvet',
    file: 'chill-kill.jpg',
    itunesId: 1766620383,
    itunesCountry: 'us',
  },
  {
    title: '1989',
    artist: 'Taylor Swift',
    file: '1989.jpg',
    deezerId: 9007779,
  },
  {
    title: 'Bloom',
    artist: 'Troye Sivan',
    file: 'bloom-troye-sivan.jpg',
    deezerId: 71592302,
  },
  {
    title: 'Blue Neighbourhood',
    artist: 'Troye Sivan',
    file: 'blue-neighbourhood.jpg',
    itunesId: 1876132053,
    itunesCountry: 'us',
  },
  {
    title: '吉他手',
    artist: '陈绮贞',
    file: 'guitarist-cheer-chen.jpg',
    itunesId: 152197399,
    itunesCountry: 'tw',
  },
  {
    title: '阿密特意识专辑',
    artist: '张惠妹',
    file: 'amit.jpg',
    itunesId: 1834202426,
    itunesCountry: 'tw',
  },
  {
    title: 'UNFORGIVEN',
    artist: 'LE SSERAFIM',
    file: 'unforgiven.jpg',
    deezerId: 434848357,
  },
  {
    title: "Did you know that there's a tunnel under Ocean Blvd",
    artist: 'Lana Del Rey',
    file: 'ocean-blvd.jpg',
    deezerId: 420368197,
  },
  {
    title: '还是会寂寞',
    artist: '陈绮贞',
    file: 'still-lonely.jpg',
    itunesId: 152200437,
    itunesCountry: 'tw',
  },
  {
    title: '让我想一想',
    artist: '陈绮贞',
    file: 'let-me-think.jpg',
    itunesId: 152235788,
    itunesCountry: 'tw',
  },
  {
    title: 'Born This Way',
    artist: 'Lady Gaga',
    file: 'born-this-way.jpg',
    deezerId: 1075405,
  },
  {
    title: 'Guitar Songs',
    artist: 'Billie Eilish',
    file: 'guitar-songs.jpg',
    deezerId: 338169017,
  },
  {
    title: "~how i'm feeling~",
    artist: 'Lauv',
    file: 'how-im-feeling-lauv.jpg',
    deezerId: 363784187,
  },
  {
    title: 'beerbongs & bentleys',
    artist: 'Post Malone',
    file: 'beerbongs-and-bentleys.jpg',
    deezerId: 62183462,
  },
  {
    title: "NewJeans 1st EP 'New Jeans'",
    artist: 'NewJeans',
    file: 'new-jeans-1st-ep.jpg',
    deezerId: 340450917,
  },
  {
    title: '华丽的冒险',
    artist: '陈绮贞',
    file: 'gorgeous-adventure.jpg',
    itunesId: 818157917,
    itunesCountry: 'tw',
  },
  {
    title: 'Norman Fucking Rockwell!',
    artist: 'Lana Del Rey',
    file: 'norman-fucking-rockwell.jpg',
    deezerId: 108706862,
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function json(url) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers });

      if (response.ok) {
        return response.json();
      }

      if (attempt === 4) {
        throw new Error(`${url} returned ${response.status}`);
      }
    } catch (error) {
      if (attempt === 4) throw error;
    }

    await sleep(1200 * attempt);
  }
}

function scaleItunesArtwork(url) {
  return url.replace(/\/\d+x\d+bb\.(jpg|png)$/, '/600x600bb.$1');
}

async function itunesAlbum(id, country = 'us') {
  const data = await json(
    `https://itunes.apple.com/lookup?${new URLSearchParams({
      country,
      id: String(id),
    })}`,
  );
  const album = data.results?.[0];

  if (!album) {
    throw new Error(`iTunes album ${id} not found`);
  }

  return {
    imageUrl: scaleItunesArtwork(album.artworkUrl100),
    linkUrl: album.collectionViewUrl,
    releaseDate: album.releaseDate,
  };
}

async function deezerAlbum(id) {
  const album = await json(`https://api.deezer.com/album/${id}`);

  if (album.error) {
    throw new Error(`Deezer album ${id} not found`);
  }

  return {
    imageUrl: album.cover_xl ?? album.cover_big ?? album.cover_medium,
    linkUrl: album.link,
    releaseDate: album.release_date,
  };
}

async function resolveEntry(entry) {
  if (entry.itunesId) return itunesAlbum(entry.itunesId, entry.itunesCountry);
  if (entry.deezerId) return deezerAlbum(entry.deezerId);

  return {
    imageUrl: entry.imageUrl,
    linkUrl: entry.linkUrl,
    releaseDate: entry.releaseDate,
  };
}

async function download(url, dest) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, { headers, redirect: 'follow' });

    if (response.ok) {
      fs.writeFileSync(dest, Buffer.from(await response.arrayBuffer()));
      return;
    }

    if (attempt === 4) {
      throw new Error(`download ${url}: ${response.status}`);
    }

    await sleep(1200 * attempt);
  }
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

  const startOrder = 4;

  for (const [index, entry] of entries.entries()) {
    const resolved = await resolveEntry(entry);
    const year = entry.year ?? resolved.releaseDate?.slice(0, 4) ?? '';
    const dest = path.join(favoritesDir, entry.file);

    if (!fs.existsSync(dest)) {
      console.log(`download song:${entry.title}`);
      await download(resolved.imageUrl, dest);
    }

    const row = {
      category: 'song',
      title: entry.title,
      subtitle: year ? `${entry.artist} · ${year}` : entry.artist,
      link_url: resolved.linkUrl,
      image_url: `/favorites/${entry.file}`,
      note: '',
      sort_order: startOrder + index,
    };

    const existingId = await findExisting(row.category, row.title);

    if (existingId) {
      const { error } = await sb
        .from('portfolio_favorites')
        .update(row)
        .eq('id', existingId);
      if (error) throw error;
      console.log(`updated song:${entry.title}`);
    } else {
      const { error } = await sb.from('portfolio_favorites').insert(row);
      if (error) throw error;
      console.log(`inserted song:${entry.title}`);
    }

    await sleep(350);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

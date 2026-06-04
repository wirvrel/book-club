import { writeFile, mkdir, access, unlink, copyFile, stat } from 'fs/promises';
import { join } from 'path';
import { db } from '../index.js';
import { authors, books, publishers, users, collections } from '../schema/index.js';
import { authorsData } from './data/authors.js';
import { booksData } from './data/books.js';
import { publishersData } from './data/publishers.js';
import { usersData } from './data/users.js';
import { collectionsData } from './data/collections.js';
import { eq } from 'drizzle-orm';

const STORAGE_PATH = './storage';
const DOWNLOAD_TIMEOUT_MS = 20_000;

const PLACEHOLDER_BOOK      = 'https://placehold.co/400x600/8B4513/FFFFFF.jpg';
const PLACEHOLDER_AUTHOR    = 'https://placehold.co/400x400/654321/FFFFFF.jpg';
const PLACEHOLDER_PUBLISHER = 'https://placehold.co/400x400/2C1810/FFFFFF.jpg';

const BOOK_COVER_IDS: Record<string, number> = {
  kobzar:                6826629,
    tini_zabutykh_predkiv: 13012528,
    voroshylovhrad:        12649478,
    atomni_zvychky:        12539702,
    '1984':                9267242,
    skotoferma:            11261770,
    peretvorennya:         12820198,
    sto_rokiv_samotnosti:  12627383,
    staryi_i_more:         463307,
    chuma:                 13151272,
};

const AUTHOR_WIKIPEDIA: Record<string, string> = {
  shevchenko:      'Taras_Shevchenko',
  franko:          'Ivan_Franko',
  lesia_ukrainka:  'Lesya_Ukrainka',
  kotsyubynsky:    'Mykhailo_Kotsiubynsky',
  stus:            'Vasyl_Stus',
  zhadan:          'Serhiy_Zhadan',
  andrukhovych:    'Yuri_Andrukhovych',
  zabuzhko:        'Oksana_Zabuzhko',
  nechuy_levytsky: 'Ivan_Nechuy-Levytsky',
  vynnychenko:     'Volodymyr_Vynnychenko',
  kafka:           'Franz_Kafka',
  marquez:         'Gabriel_García_Márquez',
  orwell:          'George_Orwell',
  hemingway:       'Ernest_Hemingway',
  camus:           'Albert_Camus',
  kulish:          'Panteleimon_Kulish',
  clear:           'James_Clear',
};

const PUBLISHER_LOGOS: Record<string, string | null> = {
  vivat:               'https://vivat-publish.com/img/logo.png',
  ranok:               'https://ranok.com.ua/img/logo.png',
  folio:               null,
    a_ba_ba_ha_la_ma_ha: null,
    old_lion:            'https://starylev.com.ua/sites/default/files/logo.png',
  nash_format:         null,
    meridian_czernowitz: null,
    tempora:             null,
};

async function ensureDir(path: string) {
  await mkdir(path, { recursive: true });
}

async function fileExists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

async function getFileSize(path: string): Promise<number> {
  try { return (await stat(path)).size; } catch { return 0; }
}

async function fetchWithTimeout(url: string, opts: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: controller.signal, redirect: 'follow' });
  } finally {
    clearTimeout(timer);
  }
}

async function resolveWikipediaImage(articleTitle: string): Promise<string | null> {
  try {
    const url =
      `https://en.wikipedia.org/w/api.php?action=query` +
      `&titles=${encodeURIComponent(articleTitle)}` +
      `&prop=pageimages&format=json&pithumbsize=500`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const pages = data?.query?.pages ?? {};
    const page  = Object.values(pages)[0] as any;
    return page?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

async function resolveOpenLibraryCover(title: string, authorName: string): Promise<string | null> {
  try {
    const q   = encodeURIComponent(`${title} ${authorName}`);
    const url = `https://openlibrary.org/search.json?q=${q}&limit=3&fields=title,cover_i`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const doc  = (data?.docs ?? []).find((d: any) => d.cover_i);
    if (!doc) return null;
    return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
  } catch {
    return null;
  }
}

function uiAvatarUrl(name: string, bg = '8B4513', fg = 'FFFFFF', size = 400): string {
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&size=${size}&background=${bg}&color=${fg}&bold=true&format=png`;
}

async function downloadImage(url: string, filepath: string): Promise<'ok' | 'skip' | 'fail'> {
  if (await fileExists(filepath)) {
    const size = await getFileSize(filepath);
    if (size > 3_000) {
      console.log(`   ⏭️  Already exists (${(size / 1024).toFixed(1)} KB), skipping`);
      return 'skip';
    }
    await unlink(filepath);
    console.log(`   🔁 Re-downloading (previous file was too small: ${size} bytes)`);
  }

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      console.log(`   ⚠️  HTTP ${res.status}`);
      return 'fail';
    }
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      console.log(`   ⚠️  Not an image (${contentType || 'no content-type'})`);
      return 'fail';
    }
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 500) {
      console.log(`   ⚠️  Too small (${buffer.byteLength} bytes)`);
      return 'fail';
    }
    await writeFile(filepath, Buffer.from(buffer));
    console.log(`   ✅ ${(buffer.byteLength / 1024).toFixed(1)} KB → ${filepath}`);
    return 'ok';
  } catch (err: any) {
    console.log(`   ❌ ${err?.name === 'AbortError' ? 'timeout' : (err?.message ?? 'unknown')}`);
    return 'fail';
  }
}

async function downloadWithFallback(
  candidates: (string | null)[],
  fallbackUrl: string,
  filepath: string,
): Promise<boolean> {
  for (const url of candidates) {
    if (!url) continue;
    const r = await downloadImage(url, filepath);
    if (r === 'ok' || r === 'skip') return true;
  }
  console.log(`   🔄 Using fallback`);
  const r = await downloadImage(fallbackUrl, filepath);
  return r === 'ok' || r === 'skip';
}

function isRealImage(size: number) { return size > 10_000; }

async function downloadImages() {
  console.log('🖼️  Starting image download...\n');

  await ensureDir(join(STORAGE_PATH, 'authors'));
  await ensureDir(join(STORAGE_PATH, 'books'));
  await ensureDir(join(STORAGE_PATH, 'publishers'));
  await ensureDir(join(STORAGE_PATH, 'users'));
  await ensureDir(join(STORAGE_PATH, 'collections'));

  const stats = {
    authors:    { real: 0, generated: 0, fail: 0 },
    books:      { real: 0, generated: 0, fail: 0 },
    publishers: { real: 0, generated: 0, fail: 0 },
    users:      { real: 0, generated: 0, fail: 0 },
    collections:{ real: 0, generated: 0, fail: 0 },
  };

    console.log(`✍️  Downloading ${authorsData.length} author images...\n`);

  for (const a of authorsData) {
    const filename = `${a.key}.jpg`;
    const filepath = join(STORAGE_PATH, 'authors', filename);
    const dbPath   = `/authors/${filename}`;
    console.log(`👤 ${a.name}`);

    let wikiUrl: string | null = null;
    const wikiTitle = AUTHOR_WIKIPEDIA[a.key];
    if (wikiTitle) {
      process.stdout.write(`   🔍 Wikipedia API...`);
      wikiUrl = await resolveWikipediaImage(wikiTitle);
      console.log(wikiUrl ? ' found' : ' not found');
    }

      const avatarUrl = uiAvatarUrl(a.name, '654321');
    const ok = await downloadWithFallback([wikiUrl], avatarUrl, filepath);

    if (ok) {
      const size = await getFileSize(filepath);
      isRealImage(size) ? stats.authors.real++ : stats.authors.generated++;
      const [row] = await db.select({ id: authors.id }).from(authors)
        .where(eq(authors.name, a.name)).limit(1);
      if (row) await db.update(authors).set({ profilePicture: dbPath }).where(eq(authors.id, row.id));
    } else {
      stats.authors.fail++;
    }
  }

    console.log(`\n📕 Downloading ${booksData.length} book covers...\n`);

  for (const b of booksData) {
    const filename = `${b.key}.jpg`;
    const filepath = join(STORAGE_PATH, 'books', filename);
    const dbPath   = `/books/${filename}`;
    console.log(`📖 ${b.title}`);

    const candidates: (string | null)[] = [];

    const hardcodedId = BOOK_COVER_IDS[b.key];
    if (hardcodedId) {
      candidates.push(`https://covers.openlibrary.org/b/id/${hardcodedId}-L.jpg`);
      console.log(`   📌 Hardcoded cover_id: ${hardcodedId}`);
    }
    if (b.coverImageUrl) candidates.push(b.coverImageUrl);
    if (b.isbn) candidates.push(`https://covers.openlibrary.org/b/isbn/${b.isbn}-L.jpg`);

    if (!hardcodedId && !b.coverImageUrl) {
      process.stdout.write(`   🔍 Open Library Search API...`);
      const authorName = authorsData.find((a) => a.key === b.authorKeys[0])?.name ?? '';
      const searchUrl  = await resolveOpenLibraryCover(b.title, authorName);
      console.log(searchUrl ? ' found' : ' not found');
      if (searchUrl) candidates.push(searchUrl);
    }

    const ok = await downloadWithFallback(candidates, PLACEHOLDER_BOOK, filepath);
    if (ok) {
      const size = await getFileSize(filepath);
      isRealImage(size) ? stats.books.real++ : stats.books.generated++;
      const [row] = await db.select({ id: books.id }).from(books)
        .where(eq(books.title, b.title)).limit(1);
      if (row) await db.update(books).set({ coverImage: dbPath }).where(eq(books.id, row.id));
    } else {
      stats.books.fail++;
    }
  }

    console.log(`\n🏢 Downloading ${publishersData.length} publisher logos...\n`);

  for (const p of publishersData) {
    const filename = `${p.key}.png`;
    const filepath = join(STORAGE_PATH, 'publishers', filename);
    const dbPath   = `/publishers/${filename}`;
    console.log(`🏢 ${p.name}`);

    const logoUrl = PUBLISHER_LOGOS[p.key] ?? null;
      const shortName  = p.name.split(' ')[0];
    const avatarUrl  = uiAvatarUrl(shortName, '2C1810');
    const ok = await downloadWithFallback([logoUrl], avatarUrl, filepath);

    if (ok) {
      const size = await getFileSize(filepath);
      isRealImage(size) ? stats.publishers.real++ : stats.publishers.generated++;
      const [row] = await db.select({ id: publishers.id }).from(publishers)
        .where(eq(publishers.name, p.name)).limit(1);
      if (row) await db.update(publishers).set({ logo: dbPath }).where(eq(publishers.id, row.id));
    } else {
      stats.publishers.fail++;
    }
  }

    console.log(`\n👥 Generating ${usersData.length} user avatars...\n`);

    const userColors = [
    '8B4513', 'A0522D', 'CD853F', '654321', 'D2691E',
    '8B6914', 'C68642', '7B3F00', 'B8621B', 'A0522D',
    '6B3A2A', '9C4A1A',
  ];

  for (let i = 0; i < usersData.length; i++) {
    const u        = usersData[i];
    const filename = `${u.key}.png`;
    const filepath = join(STORAGE_PATH, 'users', filename);
    const dbPath   = `/users/${filename}`;
    console.log(`👤 ${u.username}`);

      const bg       = userColors[i % userColors.length];
    const avatarUrl = uiAvatarUrl(u.username.replace(/_/g, ' '), bg);
    const ok = await downloadImage(avatarUrl, filepath);

    if (ok === 'ok' || ok === 'skip') {
      stats.users.generated++;
      const [row] = await db.select({ id: users.id }).from(users)
        .where(eq(users.username, u.username)).limit(1);
      if (row) await db.update(users).set({ profilePicture: dbPath }).where(eq(users.id, row.id));
    } else {
      stats.users.fail++;
    }
  }

    console.log(`\n📂 Generating ${collectionsData.length} collection covers...\n`);

    for (const c of collectionsData) {
    const firstBookKey = c.bookKeys[0];
    const srcFilename  = `${firstBookKey}.jpg`;
    const srcPath      = join(STORAGE_PATH, 'books', srcFilename);

        const userId = await db.select({ id: users.id }).from(users)
      .where(eq(users.username, c.userKey)).limit(1)
      .then((r) => r[0]?.id);
    if (!userId) continue;

    const [colRow] = await db.select({ id: collections.id, title: collections.title })
      .from(collections)
      .where(eq(collections.title, c.title))
      .limit(1);
    if (!colRow) continue;

    const filename = `${colRow.id}.jpg`;
    const destPath = join(STORAGE_PATH, 'collections', filename);
    const dbPath   = `/collections/${filename}`;

    console.log(`📂 "${c.title}"`);

    if (await fileExists(destPath)) {
      console.log(`   ⏭️  Already exists, skipping`);
      stats.collections.real++;
      continue;
    }

    if (await fileExists(srcPath) && (await getFileSize(srcPath)) > 3_000) {
      await copyFile(srcPath, destPath);
      console.log(`   ✅ Copied from books/${srcFilename}`);
      stats.collections.real++;
    } else {
        const avatarUrl = uiAvatarUrl(c.title.slice(0, 20), '8B4513');
      const ok = await downloadImage(avatarUrl, destPath);
      if (ok === 'ok') stats.collections.generated++;
      else stats.collections.fail++;
    }

    await db.update(collections).set({ coverImage: dbPath }).where(eq(collections.id, colRow.id));
  }

    console.log('\n══════════════════════════════════════════');
  console.log('🎉 All images downloaded!\n');
  console.log('📊 Summary:');
  console.log(`   Authors     : ${stats.authors.real} real, ${stats.authors.generated} generated, ${stats.authors.fail} failed`);
  console.log(`   Books       : ${stats.books.real} real, ${stats.books.generated} generated, ${stats.books.fail} failed`);
  console.log(`   Publishers  : ${stats.publishers.real} real, ${stats.publishers.generated} generated, ${stats.publishers.fail} failed`);
  console.log(`   Users       : ${stats.users.real} real, ${stats.users.generated} generated, ${stats.users.fail} failed`);
  console.log(`   Collections : ${stats.collections.real} real, ${stats.collections.generated} generated, ${stats.collections.fail} failed`);

  const totalReal = Object.values(stats).reduce((s, v) => s + v.real, 0);
  const totalGen  = Object.values(stats).reduce((s, v) => s + v.generated, 0);
  const totalFail = Object.values(stats).reduce((s, v) => s + v.fail, 0);
  console.log(`\n   Total       : ${totalReal} real, ${totalGen} generated, ${totalFail} failed`);
  console.log('\n💡 All paths updated in the database.\n');
}

downloadImages()
  .catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  })
  .finally(() => process.exit(0));

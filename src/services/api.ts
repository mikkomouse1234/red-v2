import { ComicItem, ChapterItem, ContentType, ApiError } from '../types';

async function apiFetch<T>(path: string, userMessage: string): Promise<T> {
  let res: Response;
  try { res = await fetch(path); }
  catch (e) { throw new ApiError(String(e), userMessage); }
  if (!res.ok) {
    let msg = userMessage;
    try { const b = await res.json() as { error?: string }; if (b.error) msg = b.error; } catch {}
    throw new ApiError(`HTTP ${res.status}`, msg, res.status);
  }
  return res.json() as Promise<T>;
}

function proxyImg(url: string) {
  if (!url) return '';
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

// ─── MangaDex parsers ────────────────────────────────────────────────────────

interface MDManga {
  id: string;
  attributes: {
    title: Record<string, string>;
    altTitles: Record<string, string>[];
    description: Record<string, string>;
    status: string;
    year: number | null;
    contentRating: string;
    publicationDemographic: string | null;
    tags: Array<{ attributes: { name: Record<string, string>; group: string } }>;
  };
  relationships: Array<{ type: string; attributes?: Record<string, unknown> }>;
}

interface MDChapter {
  id: string;
  attributes: {
    chapter: string | null;
    volume: string | null;
    title: string | null;
    pages: number;
    publishAt: string;
    translatedLanguage: string;
  };
  relationships: Array<{ type: string; attributes?: Record<string, unknown> }>;
}

function parseMDManga(m: MDManga): ComicItem {
  const coverRel = m.relationships.find(r => r.type === 'cover_art');
  const coverFile = (coverRel?.attributes as { fileName?: string } | undefined)?.fileName;
  const rawCover = coverFile ? `https://uploads.mangadex.org/covers/${m.id}/${coverFile}.512.jpg` : '';
  const a = m.attributes;
  const title = a.title['en'] || a.title['ja-ro'] || a.title['ja'] || Object.values(a.title)[0] || 'Unknown';
  const desc = a.description?.['en'] || Object.values(a.description || {})[0] || '';
  const authorRel = m.relationships.find(r => r.type === 'author');
  const artistRel = m.relationships.find(r => r.type === 'artist');
  const genres = a.tags
    .filter(t => t.attributes.group === 'genre' || t.attributes.group === 'theme')
    .map(t => t.attributes.name['en'] || Object.values(t.attributes.name)[0])
    .filter(Boolean) as string[];

  return {
    id: `md-${m.id}`, mangadexId: m.id, title,
    altTitles: (a.altTitles || []).map(t => t['en'] || Object.values(t)[0]).filter(Boolean) as string[],
    coverUrl: rawCover ? proxyImg(rawCover) : '',
    bannerUrl: rawCover ? proxyImg(rawCover) : '',
    description: desc,
    author: (authorRel?.attributes as { name?: string } | undefined)?.name,
    artist: (artistRel?.attributes as { name?: string } | undefined)?.name,
    status: { ongoing:'Ongoing', completed:'Completed', hiatus:'Hiatus', cancelled:'Cancelled' }[a.status] ?? a.status,
    genres, releaseYear: a.year, demographic: a.publicationDemographic,
    source: 'mangadex', type: 'manga', totalChapters: 0,
  };
}

function parseMDChapter(ch: MDChapter, mangaId: string): ChapterItem {
  const group = ch.relationships.find(r => r.type === 'scanlation_group');
  const chNum = ch.attributes.chapter ? parseFloat(ch.attributes.chapter) : 0;
  const chTitle = ch.attributes.title
    ? `Ch.${ch.attributes.chapter}: ${ch.attributes.title}`
    : ch.attributes.chapter ? `Chapter ${ch.attributes.chapter}` : 'Oneshot';
  return {
    id: ch.id, comicId: mangaId, chapterNumber: chNum,
    volume: ch.attributes.volume, title: chTitle,
    releaseDate: ch.attributes.publishAt?.slice(0, 10),
    scanlationGroup: (group?.attributes as { name?: string } | undefined)?.name,
    pageCount: ch.attributes.pages,
  };
}

// ─── ApiService ──────────────────────────────────────────────────────────────

export const ApiService = {
  // COMICS (ComicVine)
  async searchComics(query: string, sort?: string): Promise<ComicItem[]> {
    const qs = new URLSearchParams();
    if (query) qs.set('q', query);
    if (sort)  qs.set('sort', sort);
    const data = await apiFetch<{ results: ComicItem[] }>(`/api/comics/search?${qs}`, 'Unable to load comics.');
    return data.results || [];
  },

  async getComicVolume(id: string): Promise<ComicItem | null> {
    try {
      const data = await apiFetch<Record<string, unknown>>(`/api/comics/volume/${id}`, 'Unable to load comic.');
      return {
        id, comicvineId: String(data.id),
        title: String(data.name || ''),
        description: String(data.description || '').replace(/<[^>]+>/g,'').slice(0,500),
        coverUrl: (data.image as { medium_url?: string } | undefined)?.medium_url || '',
        bannerUrl: (data.image as { super_url?: string } | undefined)?.super_url || '',
        publisher: (data.publisher as { name?: string } | undefined)?.name || '',
        status: 'Ongoing',
        genres: ((data.genres as Array<{ name: string }>) || []).map(g => g.name),
        releaseYear: String(data.start_year || ''),
        source: 'comicvine', type: 'comic',
        totalChapters: Number(data.count_of_issues || 0),
      };
    } catch { return null; }
  },

  async getComicIssues(id: string): Promise<ChapterItem[]> {
    const data = await apiFetch<{ results: Array<{ id: number; issue_number: string; name: string | null; cover_date: string | null; image: { medium_url: string } | null }> }>(
      `/api/comics/volume/${id}/issues`, 'Unable to load issues.'
    );
    return (data.results || []).map(i => ({
      id: `cv-issue-${i.id}`, comicId: id,
      chapterNumber: parseFloat(i.issue_number) || 1,
      title: i.name ? `#${i.issue_number}: ${i.name}` : `Issue #${i.issue_number}`,
      releaseDate: i.cover_date || undefined,
      coverUrl: i.image?.medium_url,
      pageCount: 0,
    }));
  },

  // MANGA (MangaDex)
  async searchManga(query: string, sort?: string, genre?: string): Promise<ComicItem[]> {
    const qs = new URLSearchParams();
    if (query) qs.set('q', query);
    if (sort)  qs.set('sort', sort);
    if (genre && genre !== 'All') qs.set('genre', genre);
    const data = await apiFetch<{ data: MDManga[] }>(`/api/manga/search?${qs}`, 'Unable to load manga from MangaDex.');
    return (data.data || []).map(parseMDManga);
  },

  async getMangaDetails(id: string): Promise<ComicItem> {
    const rawId = id.startsWith('md-') ? id.slice(3) : id;
    const data = await apiFetch<{ data: MDManga }>(`/api/manga/${rawId}`, 'Unable to load manga details.');
    return parseMDManga(data.data);
  },

  async getMangaChapters(id: string): Promise<ChapterItem[]> {
    const rawId = id.startsWith('md-') ? id.slice(3) : id;
    const data = await apiFetch<{ data: MDChapter[] }>(`/api/manga/${rawId}/feed`, 'Unable to load chapters.');
    const seen = new Set<string>();
    const out: ChapterItem[] = [];
    for (const ch of data.data || []) {
      if (!seen.has(ch.id)) { seen.add(ch.id); out.push(parseMDChapter(ch, id)); }
    }
    return out;
  },

  async getMangaPages(chapterId: string): Promise<string[]> {
    const data = await apiFetch<{ baseUrl: string; chapter: { hash: string; data: string[] } }>(
      `/api/manga/chapter/${chapterId}/pages`, 'Unable to load chapter pages.'
    );
    if (!data.baseUrl || !data.chapter?.hash) throw new ApiError('Bad at-home response', 'Unable to load chapter pages.');
    return data.chapter.data.map(f => proxyImg(`${data.baseUrl}/data/${data.chapter.hash}/${f}`));
  },

  // Unified reader helper
  async getPages(item: ComicItem, chapter: ChapterItem): Promise<string[]> {
    if (item.source === 'mangadex') return this.getMangaPages(chapter.id);
    // ComicVine doesn't provide page images — return empty so reader shows message
    return [];
  },
};

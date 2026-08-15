import {
  ComicItem,
  ChapterItem,
  ContentType,
  ApiError,
  MangaDexManga,
  MangaDexChapter,
  MangaDexAtHomeResponse,
  MangaDexSearchResponse,
  MangaDexChapterFeedResponse,
} from '../types';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Checked fetch — throws ApiError on non-OK or network failure */
async function apiFetch<T>(url: string, userMessage: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new ApiError(`Network error fetching ${url}: ${err}`, userMessage);
  }
  if (!response.ok) {
    let serverMsg = userMessage;
    try {
      const body = await response.json() as { error?: string };
      if (body.error) serverMsg = body.error;
    } catch { /* ignore */ }
    throw new ApiError(
      `HTTP ${response.status} for ${url}`,
      serverMsg,
      response.status,
    );
  }
  return response.json() as Promise<T>;
}

/** MangaDex image servers can be loaded directly by an <img>. Keeping the
 * original URL avoids failures when MangaDex rotates At-Home hosts. */
function mangaDexImage(url: string): string {
  return url || '';
}

/** Parse a raw MangaDex manga object into our ComicItem shape. */
function parseMangaDexManga(m: MangaDexManga): ComicItem {
  const coverRel = m.relationships.find((r) => r.type === 'cover_art');
  const coverFile = (coverRel?.attributes as { fileName?: string } | undefined)?.fileName;
  const coverUrl = coverFile
    ? mangaDexImage(`https://uploads.mangadex.org/covers/${m.id}/${coverFile}.512.jpg`)
    : '';

  const authorRel = m.relationships.find((r) => r.type === 'author');
  const artistRel = m.relationships.find((r) => r.type === 'artist');
  const authorName = (authorRel?.attributes as { name?: string } | undefined)?.name;
  const artistName = (artistRel?.attributes as { name?: string } | undefined)?.name;

  const attrs = m.attributes;

  // Prefer English title, fall back to first available
  const title =
    attrs.title['en'] ||
    attrs.title['ja-ro'] ||
    attrs.title['ja'] ||
    Object.values(attrs.title)[0] ||
    'Unknown Title';

  const altTitles = (attrs.altTitles || [])
    .map((t) => t['en'] || t['ja-ro'] || Object.values(t)[0])
    .filter((v): v is string => Boolean(v))
    .slice(0, 5);

  const description =
    attrs.description?.['en'] ||
    attrs.description?.['ja'] ||
    Object.values(attrs.description || {})[0] ||
    '';

  const genres = attrs.tags
    .filter((t) => t.attributes.group === 'genre' || t.attributes.group === 'theme')
    .map((t) => t.attributes.name['en'] || Object.values(t.attributes.name)[0])
    .filter((v): v is string => Boolean(v));

  const statusMap: Record<string, ComicItem['status']> = {
    ongoing:   'Ongoing',
    completed: 'Completed',
    hiatus:    'Hiatus',
    cancelled: 'Cancelled',
  };

  return {
    id:             `mangadex-${m.id}`,
    mangadexId:     m.id,
    title,
    altTitles,
    coverUrl,
    bannerUrl:      coverUrl,
    description,
    author:         authorName,
    artist:         artistName,
    status:         statusMap[attrs.status] ?? 'Ongoing',
    genres:         genres.length > 0 ? genres : [],
    demographic:    attrs.publicationDemographic,
    contentRating:  attrs.contentRating,
    rating: undefined,
    releaseYear:    attrs.year,
    source:         'mangadex',
    type:           'manga',
    totalChapters:  0, // updated after chapter feed fetch
    chapters:       undefined,
  };
}

/** Parse a raw MangaDex chapter into our ChapterItem shape. */
function parseMangaDexChapter(ch: MangaDexChapter, mangaAppId: string): ChapterItem {
  const groupRel = ch.relationships.find((r) => r.type === 'scanlation_group');
  const groupName = (groupRel?.attributes as { name?: string } | undefined)?.name;

  const chNum = ch.attributes.chapter ? parseFloat(ch.attributes.chapter) : 0;
  const chTitle = ch.attributes.title
    ? `Ch. ${ch.attributes.chapter || '?'}: ${ch.attributes.title}`
    : ch.attributes.chapter
    ? `Chapter ${ch.attributes.chapter}`
    : 'Oneshot';

  return {
    id:                 ch.id,        // real MangaDex UUID as the app ID
    mangadexChapterId:  ch.id,
    comicId:            mangaAppId,
    chapterNumber:      chNum,
    volume:             ch.attributes.volume,
    title:              chTitle,
    releaseDate:        ch.attributes.publishAt?.slice(0, 10),
    scanlationGroup:    groupName,
    pageCount:          ch.attributes.pages,
  };
}

// ---------------------------------------------------------------------------
// ApiService
// ---------------------------------------------------------------------------

export const ApiService = {
  // =========================================================================
  // COMICS
  // =========================================================================
  // Do not fabricate a comic catalogue or reader pages. Batcave does not
  // expose an authorized API in this project, so the UI reports the source as
  // unavailable until the owner supplies an authorized API/feed.

  async getComics(): Promise<ComicItem[]> {
    throw new ApiError(
      'Batcave source adapter is not configured',
      'The comics source is not connected yet. Add an authorized comics API/feed to enable this section.'
    );
  },

  async getComicById(_id: string): Promise<ComicItem | null> {
    return null;
  },

  async getComicChapterPages(comicId: string, chapterId: string): Promise<string[]> {
    throw new ApiError(
      `Comic source is not connected for ${comicId}/${chapterId}`,
      'The comics source is not connected yet. No placeholder pages are available.'
    );
  },

  // =========================================================================
  // MANGA (MangaDex — 100% live)
  // =========================================================================

  /**
   * Search or browse MangaDex.
   * Throws ApiError on failure — no silent fallback.
   */
  async getManga(params?: {
    query?: string;
    genre?: string;
    sort?: 'popular' | 'recent' | 'rating';
    limit?: number;
    offset?: number;
  }): Promise<ComicItem[]> {
    const url = new URL('/api/mangadex/search', window.location.origin);
    if (params?.query)  url.searchParams.set('title',  params.query);
    if (params?.genre && params.genre !== 'All')
                        url.searchParams.set('genre',  params.genre);
    if (params?.sort)   url.searchParams.set('sort',   params.sort);
    if (params?.limit)  url.searchParams.set('limit',  String(params.limit));
    if (params?.offset) url.searchParams.set('offset', String(params.offset));

    const data = await apiFetch<MangaDexSearchResponse>(
      url.toString(),
      'Unable to load manga from MangaDex.'
    );

    if (!data.data || !Array.isArray(data.data)) {
      throw new ApiError('Invalid MangaDex search response', 'Unable to load manga from MangaDex.');
    }

    return data.data.map(parseMangaDexManga);
  },

  /**
   * Fetch a single manga's full details from MangaDex.
   * Throws ApiError on failure.
   */
  async getMangaById(id: string): Promise<ComicItem> {
    // id may be "mangadex-<uuid>" or a raw UUID
    const rawId = id.startsWith('mangadex-') ? id.slice('mangadex-'.length) : id;

    const data = await apiFetch<{ data: MangaDexManga }>(
      `/api/mangadex/manga/${rawId}`,
      'Unable to load manga details.'
    );

    if (!data.data) {
      throw new ApiError('Invalid manga details response', 'Unable to load manga details.');
    }

    return parseMangaDexManga(data.data);
  },

  /**
   * Fetch all English chapters for a manga.
   * Throws ApiError on failure.
   */
  async getMangaChapters(mangaId: string): Promise<ChapterItem[]> {
    const rawId = mangaId.startsWith('mangadex-') ? mangaId.slice('mangadex-'.length) : mangaId;
    const appId = mangaId.startsWith('mangadex-') ? mangaId : `mangadex-${mangaId}`;

    const data = await apiFetch<MangaDexChapterFeedResponse>(
      `/api/mangadex/manga/${rawId}/feed`,
      'Unable to load chapters.'
    );

    if (!data.data || !Array.isArray(data.data)) {
      throw new ApiError('Invalid chapter feed response', 'Unable to load chapters.');
    }

    // De-duplicate by chapter UUID (the real ID), preserve sort order
    const seen = new Set<string>();
    const chapters: ChapterItem[] = [];
    for (const ch of data.data) {
      if (!seen.has(ch.id)) {
        seen.add(ch.id);
        chapters.push(parseMangaDexChapter(ch, appId));
      }
    }

    return chapters;
  },

  /**
   * Fetch real page URLs for a chapter via MangaDex At-Home.
   * Throws ApiError on failure — no placeholder fallback.
   */
  async getMangaChapterPages(chapterId: string): Promise<string[]> {
    // chapterId here is the real MangaDex UUID (ChapterItem.mangadexChapterId === ChapterItem.id for manga)
    const data = await apiFetch<MangaDexAtHomeResponse>(
      `/api/mangadex/at-home/server/${chapterId}`,
      'Unable to load this chapter. Please try again.'
    );

    if (!data.baseUrl || !data.chapter?.hash || !Array.isArray(data.chapter?.data)) {
      throw new ApiError('Invalid at-home response', 'Unable to load this chapter. Please try again.');
    }

    return data.chapter.data.map((file) =>
      mangaDexImage(`${data.baseUrl}/data/${data.chapter.hash}/${file}`)
    );
  },

  // =========================================================================
  // Generic helpers (used by App.tsx / ReaderScreen)
  // =========================================================================

  async getItemById(id: string, type?: ContentType): Promise<ComicItem | null> {
    if (type === 'comic' || id.startsWith('batcave-')) {
      return this.getComicById(id);
    }
    try {
      return await this.getMangaById(id);
    } catch {
      return null;
    }
  },

  /**
   * Get pages for any item type.
   * For manga, chapterId is the real MangaDex UUID.
   */
  async getChapterPages(itemId: string, chapterId: string, type: ContentType): Promise<string[]> {
    if (type === 'comic') {
      return this.getComicChapterPages(itemId, chapterId);
    }
    // For manga, chapterId is the real MangaDex chapter UUID
    return this.getMangaChapterPages(chapterId);
  },
};

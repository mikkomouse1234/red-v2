export type ContentType = 'comic' | 'manga';
export type SourceType = 'batcave' | 'mangadex';

// ---------------------------------------------------------------------------
// MangaDex API response shapes (raw)
// ---------------------------------------------------------------------------

export interface MangaDexRelationship {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
}

export interface MangaDexTag {
  id: string;
  type: 'tag';
  attributes: {
    name: Record<string, string>;
    group: 'genre' | 'theme' | 'format' | 'content';
  };
}

export interface MangaDexMangaAttributes {
  title: Record<string, string>;
  altTitles: Record<string, string>[];
  description: Record<string, string>;
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
  year: number | null;
  contentRating: 'safe' | 'suggestive' | 'erotica' | 'pornographic';
  publicationDemographic: 'shounen' | 'shoujo' | 'josei' | 'seinen' | null;
  tags: MangaDexTag[];
  lastChapter: string | null;
  lastVolume: string | null;
}

export interface MangaDexManga {
  id: string;
  type: 'manga';
  attributes: MangaDexMangaAttributes;
  relationships: MangaDexRelationship[];
}

export interface MangaDexChapterAttributes {
  chapter: string | null;
  volume: string | null;
  title: string | null;
  translatedLanguage: string;
  pages: number;
  publishAt: string;
  scanlationGroup?: string;
}

export interface MangaDexChapter {
  id: string;
  type: 'chapter';
  attributes: MangaDexChapterAttributes;
  relationships: MangaDexRelationship[];
}

export interface MangaDexAtHomeResponse {
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
}

export interface MangaDexSearchResponse {
  data: MangaDexManga[];
  limit: number;
  offset: number;
  total: number;
}

export interface MangaDexChapterFeedResponse {
  data: MangaDexChapter[];
  limit: number;
  offset: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Application domain types
// ---------------------------------------------------------------------------

export interface ChapterItem {
  id: string;                   // App-internal ID (may equal mangadexChapterId for manga)
  mangadexChapterId?: string;   // Real MangaDex chapter UUID
  comicId: string;
  chapterNumber: number | string;
  volume?: string | null;
  title: string;
  releaseDate?: string;
  scanlationGroup?: string;
  pageCount: number;
  pages?: string[];
}

export interface ComicItem {
  id: string;
  mangadexId?: string;          // Real MangaDex manga UUID
  title: string;
  altTitles?: string[];
  coverUrl: string;
  bannerUrl?: string;
  description: string;
  publisher?: string;
  author?: string;
  artist?: string;
  status: 'Ongoing' | 'Completed' | 'Hiatus' | 'Cancelled';
  genres: string[];
  demographic?: string | null;
  contentRating?: string;
  releaseYear?: number | string | null;
  rating?: number;
  source: SourceType;
  type: ContentType;
  totalChapters: number;
  chapters?: ChapterItem[];
  views?: string;
  isPopular?: boolean;
  isRecentlyAdded?: boolean;
}

export interface ReadingProgress {
  itemId: string;
  itemTitle: string;
  itemType: ContentType;
  source: SourceType;
  coverUrl: string;
  chapterId: string;
  chapterNumber: number | string;
  chapterTitle: string;
  pageIndex: number;
  totalPages: number;
  percentage: number;
  lastReadTimestamp: number;
  isCompleted: boolean;
}

export type ListCategory = 'Reading' | 'Plan to Read' | 'Completed' | 'Favorites';

export interface SavedItem {
  itemId: string;
  item: ComicItem;
  addedAt: number;
  category: ListCategory;
}

export type ReadingDirection = 'vertical' | 'horizontal-rtl' | 'horizontal-ltr';
export type FitMode = 'fit-width' | 'fit-height' | 'fit-both' | 'original';
export type ThemeMode = 'dark' | 'light' | 'amoled';

export interface ReaderSettings {
  readingDirection: ReadingDirection;
  pageSpacing: number;
  fitMode: FitMode;
  autoHideControls: boolean;
  autoHideDelay: number;
  doubleTapZoom: boolean;
  maxZoom: number;
  showPageNumberBadge: boolean;
  theme: ThemeMode;
  imageQuality: 'high' | 'data-saver' | 'original';
  keepScreenAwake: boolean;
  volumeKeyNavigation: boolean;
}

export type ActiveTab = 'home' | 'comics' | 'manga' | 'settings';

// ---------------------------------------------------------------------------
// API error type used by the frontend
// ---------------------------------------------------------------------------
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

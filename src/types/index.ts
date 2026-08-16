export type ContentType = 'comic' | 'manga';
export type Source = 'comicvine' | 'mangadex';

export interface ComicItem {
  id: string;
  comicvineId?: string;
  mangadexId?: string;
  title: string;
  altTitles?: string[];
  coverUrl: string;
  bannerUrl?: string;
  description: string;
  publisher?: string;
  author?: string;
  artist?: string;
  status: string;
  genres: string[];
  releaseYear?: string | number | null;
  source: Source;
  type: ContentType;
  totalChapters: number;
  chapters?: ChapterItem[];
  demographic?: string | null;
}

export interface ChapterItem {
  id: string;
  comicId: string;
  chapterNumber: number | string;
  volume?: string | null;
  title: string;
  releaseDate?: string;
  scanlationGroup?: string;
  pageCount: number;
  coverUrl?: string;
}

export interface ReadingProgress {
  itemId: string;
  chapterId: string;
  pageIndex: number;
  totalPages: number;
  lastRead: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

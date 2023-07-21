interface Cursor {
  hasMoreChpaters: () => boolean;
  nextChapters: () => Promise<Omit<IMangaUpdate, "mangaUpdateId">[]>;
}
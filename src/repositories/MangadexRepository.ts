import { CrawlTarget, IMangaUpdate } from "@ca-tyler/smithers-server-utils"
import { MangadexCursor } from "./MangadexCursor"
import Bottleneck from 'bottleneck'

interface MangadexAdapterOptions {
  onlyLatest: boolean;
  limiter: Bottleneck;
}

namespace MangadexRepository {
  const getCursor = (crawlTarget: CrawlTarget): MangadexCursor => {
    return new MangadexCursor(crawlTarget)
  }

  export const getChapters = async (crawlTarget: CrawlTarget, opts: MangadexAdapterOptions): Promise<Omit<IMangaUpdate, "mangaUpdateId">[]> => {
    const cursor = getCursor(crawlTarget)

    if (opts.onlyLatest) {
      return cursor.nextChapters()
    }

    let chapters: Omit<IMangaUpdate, "mangaUpdateId">[] = []

    while (cursor.hasMoreChpaters()) {
      chapters = [
        ...chapters,
        ...await opts.limiter.schedule(() => cursor.nextChapters())
      ]
    }

    return chapters
  }
}

export {
  MangadexRepository
}
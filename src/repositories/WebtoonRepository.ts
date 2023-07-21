import { CrawlTarget, IMangaUpdate } from "@ca-tyler/smithers-server-utils"
import { WebtoonCursor } from "./WebtoonCursor"
import Bottleneck from 'bottleneck'

interface WebtoonAdapterOptions {
  onlyLatest: boolean;
  limiter: Bottleneck;
}

namespace WebtoonRepository {
  const getCursor = (crawlTarget: CrawlTarget): WebtoonCursor => {
    return new WebtoonCursor(crawlTarget)
  }

  export const getChapters = async (crawlTarget: CrawlTarget, opts: WebtoonAdapterOptions): Promise<Omit<IMangaUpdate, "mangaUpdateId">[]> => {
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
  WebtoonRepository
}
import { CrawlTargetListOptions, CrawlTargetRepository, CrawlerTypes, IMangaUpdate, MangaUpdate, MangaUpdateListOptions, MangaUpdateRepository, Database, CrawlTarget } from "@ca-tyler/smithers-server-utils"
import Bottleneck from "bottleneck"
import { WebtoonRepository } from "./repositories/WebtoonRepository"
import { MangadexRepository } from "./repositories/MangadexRepository"
import { precisionEquals } from "./utils/float"

const isRelatedUpdate = (dbUpdate: MangaUpdate, update: Omit<IMangaUpdate, 'mangaUpdateId'>): boolean => {
  const data = dbUpdate.getObject()

  return precisionEquals(data.chapter, update.chapter, 1) &&
    data.crawlId === update.crawlId
}

const getUpdateObject = (dbUpdate: MangaUpdate, update: Omit<IMangaUpdate, 'mangaUpdateId'>): Partial<Pick<IMangaUpdate, 'crawledOn' | 'chapterName' | 'readAt'>> => {
  const data = dbUpdate.getObject()

  return Object.keys(update).reduce((acc: Partial<Pick<IMangaUpdate, 'crawledOn' | 'chapterName' | 'readAt'>>, key) => {
    if (key === 'crawledOn' && data.crawledOn.valueOf() !== update[key].valueOf()) {
      return {
        ...acc,
        crawledOn: update[key]
      }
    } else if (key === 'chapterName' && data.chapterName !== update[key]) {
      return {
        ...acc,
        chapterName: update[key]
      }
    } else if (key === 'readAt' && data.readAt !== update[key]) {
      return {
        ...acc,
        readAt: update[key]
      }
    } else {
      // Ignore all other fields
      return acc
    }
  }, {})
}

const updateDb = async (
  db: Database,
  crawlTarget: CrawlTarget, // what go crawled
  crawlerUpdates: Omit<IMangaUpdate, "mangaUpdateId">[] // manga updates created by the crawler
): Promise<void> => {
  const limiter = new Bottleneck({maxConcurrent: 50}) // How quickly to write to the db
  const crawlTargetId = crawlTarget.getObject().crawlTargetId
  console.log(`Now updating data from crawler ${crawlTarget.getObject().name}`)

  // Read db to find the current state of the updates (the History)
  const dbUpdates = await MangaUpdateRepository.list(db, new MangaUpdateListOptions({crawlTargetId}))

  // Update the mangaUpdates
  await Promise.all(crawlerUpdates.reduce((acc: Promise<MangaUpdate | null>[], update) => {
    // Merge MangaUpdate and History
    const relatedUpdate = dbUpdates.find((dbUpdate) => isRelatedUpdate(dbUpdate, update))

    // Write the result to db
    if (relatedUpdate) {
      const updateData = getUpdateObject(relatedUpdate, update)

      if (Object.keys(updateData).length === 0) {
        return acc
      }

      return [
        ...acc,
        limiter.schedule(() => MangaUpdateRepository.update(db, relatedUpdate.getObject().mangaUpdateId, updateData))
      ]
    } else {
      return [
        ...acc,
        limiter.schedule(() => MangaUpdateRepository.insert(db, update))
      ]
    }
  }, []))

  // Update the crawler
  await CrawlTargetRepository.update(db, crawlTargetId, {crawlSuccess: true, lastCrawledOn: new Date()})

  console.log(`Done updating data from crawler ${crawlTarget.getObject().name}`)

  return
}

const main = async (db: Database) => {
  const webtoonLimiter = new Bottleneck({maxConcurrent: 1})  // How quickly to crawl webtoon
  const mangadexLimiter = new Bottleneck({maxConcurrent: 1}) // How quickly to crawl mangadex

  // Retreive from db what is supposed to be crawled
  console.log("Retrieving all crawlers...")
  const crawlTargets = await CrawlTargetRepository.list(db, new CrawlTargetListOptions({}))

  // For each crawler, choose the appropriate adapter and store the MangaUpdates
  const results: PromiseSettledResult<void>[] = await Promise.allSettled(crawlTargets.map(async (crawlTarget) => {
    try {
      if (crawlTarget.getObject().adapter === CrawlerTypes.webtoon) {
        const crawlerUpdates = await WebtoonRepository.getChapters(crawlTarget, {onlyLatest: true, limiter: webtoonLimiter})
        await updateDb(db, crawlTarget, crawlerUpdates)

        return
      } else if (crawlTarget.getObject().adapter === CrawlerTypes.mangadex) {
        const crawlerUpdates = await MangadexRepository.getChapters(crawlTarget, {onlyLatest: true, limiter: mangadexLimiter})
        await updateDb(db, crawlTarget, crawlerUpdates)

        return
      } else {
        throw new Error(`Unknown adapter ${crawlTarget.getObject().adapter} found for crawler ${crawlTarget.getObject().name}`)
      }
    } catch (err: any) {
      err.smithersContext = crawlTarget
      return Promise.reject(err)
    }
  }))

  return Promise.all(results.reduce((acc: Promise<any>[], result) => {
    if (result.status === 'rejected' && result.reason.smithersContext) {
      console.error(result.reason)

      return [
        ...acc,
        CrawlTargetRepository.update(db, result.reason.smithersContext.getObject().crawlTargetId, {crawlSuccess: false, lastCrawledOn: new Date()})
      ]
    } else if (result.status === 'rejected') {
      console.error(result.reason)
      return acc
    } else {
      return acc
    }
  }, []))
}

const script = async () => {
  let db: Database | null = null
  try {
    db = await Database.getInstance()
    await main(db)
    await db.end()
  } catch (err) {
    console.log("Unexpected problem encountered when crawling")
    if (db) {
      await db.end()
    }
    throw err
  }
}

script()
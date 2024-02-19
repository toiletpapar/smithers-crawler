import { MangaRepository, Database, MangaSyncOptions, LogRepository, LogTypes, SmithersError, SmithersErrorTypes } from "@ca-tyler/smithers-server-utils"

const script = async () => {
  let db: Database | null = null
  try {
    if (!process.env.DATABASE_CONNECTION_STRING) {
      throw new SmithersError(SmithersErrorTypes.DB_CONNECTION_NOT_FOUND, "No db connection string provided")
    }

    console.log('Starting crawl...')
    db = await Database.getInstance()
    await MangaRepository.syncManga(db, new MangaSyncOptions({onlyLatest: true}))
    await db.end()
    console.log('Done!')
  } catch (err: any) {
    console.log("Unexpected problem encountered when crawling")

    if (db) {
      await LogRepository.insert(db, {
        logType: LogTypes.SMITHERS_CRAWLER_FATAL,
        explanation: "An unknown error occurred while crawling for manga",
        info: {
          error: err && err.stack ? err.stack : err
        },
        loggedOn: new Date(),
      })
      await db.end()
    }
    
    throw err
  }
}

script()
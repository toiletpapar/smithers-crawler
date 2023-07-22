import { MangaRepository, Database, MangaSyncOptions } from "@ca-tyler/smithers-server-utils"

const script = async () => {
  let db: Database | null = null
  try {
    db = await Database.getInstance()
    await MangaRepository.syncManga(db, new MangaSyncOptions({}))
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
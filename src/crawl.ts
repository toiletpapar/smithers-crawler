import { MangaRepository, Database, MangaSyncOptions } from "@ca-tyler/smithers-server-utils"
import Bottleneck from "bottleneck"

const script = async () => {
  let db: Database | null = null
  try {
    db = await Database.getInstance()
    await MangaRepository.syncManga(db, new MangaSyncOptions({onlyLatest: true}))
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
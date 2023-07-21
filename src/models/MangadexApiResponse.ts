interface IMangadexApiFeedChapter {
  id: string; // MangadexId of the chapter
  attributes: {
    chapter: string;  // Number representing the chapter, can be half-chapters like 735.5
    title: string;
  }
}

interface IMangadexApiFeedResponse {
  "result": string;
  "response": string;
  "data": IMangadexApiFeedChapter[];
  "limit": number;
  "offset": number;
  "total": number;  // The number of remaining chapters
}

class MangadexApiFeedResponse {
  private data: IMangadexApiFeedResponse

  constructor(data: IMangadexApiFeedResponse) {
    this.data = data
  }

  public getObject(): IMangadexApiFeedResponse {
    return {
      ...this.data
    }
  }
}

export {
  MangadexApiFeedResponse,
  IMangadexApiFeedResponse
}
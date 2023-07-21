import axios, { Axios } from 'axios'

interface HttpConfig {
  params?: {
    [x: string]: any
  },
  data?: {
    [y: string]: any
  }
}

class HttpClient {
  private client: Axios

  constructor() {
    this.client = axios.create()
  }

  get(url: string, config: HttpConfig = {}) {
    return this.client.get(url, config)
  }
}

const httpClient = new HttpClient()

export {
  HttpClient,
  httpClient
}
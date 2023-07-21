import { parse as htmlParser, HTMLElement } from 'node-html-parser'

namespace HTMLParser {
  export const parse = htmlParser
}

export {
  HTMLParser,
  HTMLElement
}
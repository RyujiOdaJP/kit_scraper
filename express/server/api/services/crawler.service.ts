import L from '../../common/logger'

export class CrawlService {
  crawl(): Promise<Example[]> {
    L.info(examples, 'fetch all examples');
    return Promise.resolve(examples);
  }
}

export const crawlService = new CrawlService();
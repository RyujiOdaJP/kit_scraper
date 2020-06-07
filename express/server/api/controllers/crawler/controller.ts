import { crawlService } from '../../services/crawler.service';
import { Request, Response } from 'express';

export class Controller {
  crawl(req: Request, res: Response): void {
    crawlService.crawl().then(r => res.json(r));
  }
}
export default new Controller();

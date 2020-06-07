import { Controller, Get, Route } from 'tsoa';
import * as crawlerService from '../../services/crawler';

@Route('crawler')
export class DevController extends Controller {
  @Get('/run')
  public run(): string {
    return crawlerService.run();
  }
}

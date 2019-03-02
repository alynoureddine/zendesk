import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/customer')
  getHelloo(): string {
    return this.appService.getHelloo();
  }

  @Get('/zendesk')
  startZendesk(): string {
    return this.appService.startZendesk();
  }
}

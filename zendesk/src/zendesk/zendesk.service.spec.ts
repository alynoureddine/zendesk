import { Test, TestingModule } from '@nestjs/testing';
import { ZendeskService } from './zendesk.service';

describe('ZendeskService', () => {
  let service: ZendeskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZendeskService],
    }).compile();

    service = module.get<ZendeskService>(ZendeskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

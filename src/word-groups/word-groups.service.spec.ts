import { Test, TestingModule } from '@nestjs/testing';
import { WordGroupsService } from './word-groups.service';

describe('WordGroupsService', () => {
  let service: WordGroupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WordGroupsService],
    }).compile();

    service = module.get<WordGroupsService>(WordGroupsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

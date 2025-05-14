import { WordGroupsModule } from 'src/word-groups/word-groups.module';
import { WordsModule } from 'src/words/words.module';

import { Module } from '@nestjs/common';

import { DictionaryController } from './dictionary.controller';
import { DictionaryService } from './dictionary.service';

@Module({
  imports: [WordsModule, WordGroupsModule],
  providers: [DictionaryService],
  controllers: [DictionaryController],
})
export class DictionaryModule {}

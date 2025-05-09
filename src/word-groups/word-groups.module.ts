import { WordsModule } from 'src/words/words.module';

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { WordGroup, WordGroupSchema } from './entities/word-group.entity';
import { WordGroupsService } from './word-groups.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WordGroup.name, schema: WordGroupSchema },
    ]),
  ],
  providers: [WordGroupsService],
  exports: [MongooseModule],
})
export class WordGroupsModule {}

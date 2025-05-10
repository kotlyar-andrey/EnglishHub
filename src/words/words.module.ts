import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Word, WordSchema } from './entities/word.entity';
import { WordsService } from './words.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Word.name, schema: WordSchema }]),
  ],
  providers: [WordsService],
  exports: [WordsService],
})
export class WordsModule {}

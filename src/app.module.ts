import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DictionaryModule } from './dictionary/dictionary.module';
import { WordGroupsModule } from './word-groups/word-groups.module';
import { WordsModule } from './words/words.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/word-groups'),
    WordsModule,
    WordGroupsModule,
    DictionaryModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}

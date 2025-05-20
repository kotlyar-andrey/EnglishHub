import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from './auth/auth.module';
import { DictionaryModule } from './dictionary/dictionary.module';
import { UsersModule } from './users/users.module';
import { WordGroupsModule } from './word-groups/word-groups.module';
import { WordsModule } from './words/words.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot('mongodb://localhost:27017/word-groups'),
    WordsModule,
    WordGroupsModule,
    DictionaryModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}

import { HydratedDocument } from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class WordGroup {
  @Prop()
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true, unique: true })
  mainWord: string;

  @Prop({ default: false })
  isPublish: boolean;

  @Prop({ default: false })
  isApprove: boolean;
}

export const WordGroupSchema = SchemaFactory.createForClass(WordGroup);
export type WordGroupDocument = HydratedDocument<WordGroup>;

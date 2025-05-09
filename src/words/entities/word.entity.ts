import { Document, Types } from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
class Translation {
  @Prop()
  language: string;

  @Prop()
  translation: string;
}

@Schema()
export class Word {
  @Prop({ required: true, unique: true })
  text: string;

  @Prop()
  transcription: string;

  @Prop()
  meaning: string;

  @Prop()
  examples: string[];

  @Prop([Translation])
  translations: Translation[];

  @Prop({ type: Types.ObjectId, ref: 'WordGroup', required: true })
  group: Types.ObjectId;
}

export const WordSchema = SchemaFactory.createForClass(Word);
export type WordDocument = Word & Document;

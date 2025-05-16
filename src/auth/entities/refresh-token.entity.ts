import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/users/entities/user.entity';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  expiresAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

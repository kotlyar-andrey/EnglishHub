import { HydratedDocument, Types } from 'mongoose';
import { UserRole } from 'src/common/enums/user-roles.enum';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

@Schema({ timestamps: true })
export class User {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ unique: false, default: null })
  password: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.MEMBER })
  role: UserRole;

  @Prop({ required: true, enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
export type UserDocument = HydratedDocument<User>;

UserSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

import { Model } from 'mongoose';

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { User, UserDocument, UserStatus } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  findOneById(id: string) {
    return this.userModel.findById(id).lean().exec();
  }

  findOneByEmail(email: string) {
    return this.userModel.findOne({ email }).lean().exec();
  }

  async create(createUserDto: CreateUserDto) {
    const user = new this.userModel(createUserDto);
    try {
      return await user.save();
    } catch (err) {
      if (err.code === 11000) {
        throw new ConflictException(
          `User with email '${createUserDto.email} already exists`,
        );
      }
      throw err;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: updateUserDto }, { new: true })
      .lean()
      .exec();
    if (!user) {
      throw new NotFoundException(`User doesn't exists`);
    }
    return user;
  }

  async ban(id: string, banned: boolean) {
    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          $set: { status: banned ? UserStatus.BANNED : UserStatus.ACTIVE },
        },
        { new: true },
      )
      .lean()
      .exec();
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }
}

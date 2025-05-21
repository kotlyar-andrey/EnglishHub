import { HydratedDocument, Model } from 'mongoose';

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { User, UserDocument, UserStatus } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findOneById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).lean().exec();
    if (!user) {
      throw new NotFoundException(`User with id '${id}' not found`);
    }
    return user;
  }

  async findOneByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).lean().exec();
    if (!user) {
      throw new NotFoundException(`User with email '${email}' not found`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = new this.userModel(createUserDto);
    try {
      return (await user.save()).toObject();
    } catch (err) {
      if (err.code === 11000) {
        throw new ConflictException(
          `User with email '${createUserDto.email} already exists`,
        );
      }
      throw err;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: updateUserDto }, { new: true })
      .lean()
      .exec();
    if (!user) {
      throw new NotFoundException(`User doesn't exists`);
    }
    return user;
  }

  async ban(id: string, banned: boolean): Promise<User> {
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

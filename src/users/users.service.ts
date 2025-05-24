import * as bcrypt from 'bcrypt';
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

  findOneById(id: string): Promise<User | null> {
    return this.userModel.findById(id).select('-password -__v').lean().exec();
  }

  findOneByEmail(email: string): Promise<User | null> {
    return this.userModel
      .findOne({ email })
      .select('-password -__v')
      .lean()
      .exec();
  }

  async createByEmailAndPassword(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findOneByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = new this.userModel({
      email: createUserDto.email,
      password: hashedPassword,
    });
    const savedUser = await newUser.save();
    return savedUser.toObject();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: updateUserDto }, { new: true })
      .select('-password -__v')
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
      .select('-password -__v')
      .lean()
      .exec();
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }
}

import { DeleteResult, Model } from 'mongoose';

import {
    ConflictException, Injectable, InternalServerErrorException, NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { CreateWordGroupDto, UpdateWordGroupDto } from './dto/create-word-group.dto';
import { WordGroup, WordGroupDocument } from './entities/word-group.entity';

@Injectable()
export class WordGroupsService {
  constructor(
    @InjectModel(WordGroup.name)
    private readonly wordGroupsModel: Model<WordGroupDocument>,
  ) {}

  findAll(): Promise<WordGroupDocument[]> {
    return this.wordGroupsModel.find().lean().exec();
  }

  async findOne(id: string): Promise<WordGroup> {
    const wordGroup = await this.wordGroupsModel.findById(id).lean().exec();
    if (!wordGroup) {
      throw new NotFoundException();
    }
    return wordGroup;
  }

  async create(createGroupDto: CreateWordGroupDto): Promise<WordGroup> {
    const wordGroup = new this.wordGroupsModel(createGroupDto);
    try {
      return await wordGroup.save();
    } catch (err) {
      if (err.code === 11000) {
        throw new ConflictException(
          `Group with the main word '${createGroupDto.mainWord}' already exists`,
        );
      }
      throw new InternalServerErrorException('Error saving group');
    }
  }

  async update(
    id: string,
    updateWordGroupDto: UpdateWordGroupDto,
  ): Promise<WordGroup> {
    const wordGroup = await this.wordGroupsModel
      .findOneAndUpdate(
        { _id: id },
        { $set: updateWordGroupDto },
        { new: true },
      )
      .exec();
    if (!wordGroup) {
      throw new NotFoundException();
    }
    return wordGroup;
  }

  async delete(id: string) {
    const wordGroup = await this.wordGroupsModel.findById(id).lean().exec();
    return wordGroup?.deleteOne();
  }
}

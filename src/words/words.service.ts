import { Model } from 'mongoose';

import {
    ConflictException, Injectable, InternalServerErrorException, NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { CreateWordDto } from './dto/create-word.dto';
import { GetWordDto } from './dto/get-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { Word, WordDocument } from './entities/word.entity';

@Injectable()
export class WordsService {
  constructor(
    @InjectModel(Word.name) private readonly wordModel: Model<WordDocument>,
  ) {}

  findAll(): Promise<WordDocument[]> {
    return this.wordModel.find().exec();
  }

  async findOne({ id, text }: GetWordDto): Promise<WordDocument> {
    const word = id
      ? await this.wordModel.findById(id).exec()
      : await this.wordModel.findOne({ text: text }).exec();

    if (!word) {
      throw new NotFoundException();
    }
    return word;
  }

  async create(createWordDto: CreateWordDto): Promise<WordDocument> {
    const newWord = new this.wordModel(createWordDto);
    try {
      return newWord.save();
    } catch (err) {
      if (err.code === 11000) {
        throw new ConflictException(
          `Group with the main word '${createWordDto.english}' already exists`,
        );
      }
      throw new InternalServerErrorException('Error saving group');
    }
  }

  async update(
    id: string,
    updateWordDto: UpdateWordDto,
  ): Promise<WordDocument> {
    const word = await this.wordModel
      .findByIdAndUpdate({ _id: id }, { $set: updateWordDto }, { new: true })
      .exec();
    if (!word) {
      throw new NotFoundException();
    }
    return word;
  }

  delete(id: string) {
    return this.wordModel.findByIdAndDelete(id).exec();
  }
}

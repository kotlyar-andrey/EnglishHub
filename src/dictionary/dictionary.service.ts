import { CreateWordGroupDto, UpdateWordGroupDto } from 'src/word-groups/dto/create-word-group.dto';
import { GetWordGroupDto } from 'src/word-groups/dto/get-word-group.dto';
import { WordGroupsService } from 'src/word-groups/word-groups.service';
import { CreateWordDto } from 'src/words/dto/create-word.dto';
import { GetWordDto } from 'src/words/dto/get-word.dto';
import { UpdateWordDto } from 'src/words/dto/update-word.dto';
import { WordsService } from 'src/words/words.service';

import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class DictionaryService {
  constructor(
    private readonly wordGroupsService: WordGroupsService,
    private readonly wordsService: WordsService,
  ) {}

  findAllWordGroups({ type }: GetWordGroupDto) {
    return type === 'full'
      ? this.__findAllWordGroupsFull()
      : this.__findAllWordGroupsSimple();
  }

  async findOneWordGroup(groupId: string) {
    const wordGroup = await this.wordGroupsService.findOne(groupId);
    const words = await this.wordsService.findManyByGroupId(groupId);
    return { ...wordGroup, words };
  }

  async createWordGroup(createWordGroupDto: CreateWordGroupDto) {
    return this.wordGroupsService.create(createWordGroupDto);
  }

  async updateWordGroup(id: string, updateWordGroupDto: UpdateWordGroupDto) {
    return this.wordGroupsService.update(id, updateWordGroupDto);
  }

  async deleteWordGroup(groupId: string) {
    await this.wordsService.deleteManyByGroupId(groupId);
    return this.wordGroupsService.delete(groupId);
  }

  async findOneWord(getWordDto: GetWordDto) {
    return this.wordsService.findOne(getWordDto);
  }

  async createWord(createWordDto: CreateWordDto) {
    const { group: groupId } = createWordDto;
    const existedGroup = await this.wordGroupsService.findOne(groupId);
    if (!existedGroup) {
      throw new NotFoundException();
    }
    return this.wordsService.create(createWordDto);
  }

  async updateWord(wordId: string, updateWordDto: UpdateWordDto) {
    if (updateWordDto.group) {
      const group = await this.wordGroupsService.findOne(updateWordDto.group);
      if (!group) {
        throw new NotFoundException();
      }
    }
    return this.wordsService.update(wordId, updateWordDto);
  }

  async deleteWord(wordId: string) {
    return this.wordsService.deleteOne(wordId);
  }

  /**
   * Return all word groups without words
   */
  __findAllWordGroupsSimple() {
    return this.wordGroupsService.findAll();
  }

  /**
   * Return all word groups with all included words
   */
  async __findAllWordGroupsFull() {
    const wordGroups = await this.wordGroupsService.findAll();
    const words = await this.wordsService.findAll();
    const result = wordGroups.map((wordGroup) => {
      const wordsForGroup = words.filter(
        (word) => word.group.toString() === wordGroup._id.toString(),
      );
      return { ...wordGroup, words: wordsForGroup };
    });
    return result;
  }
}

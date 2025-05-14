import { CreateWordGroupDto, UpdateWordGroupDto } from 'src/word-groups/dto/create-word-group.dto';
import { GetWordGroupDto } from 'src/word-groups/dto/get-word-group.dto';
import { CreateWordDto } from 'src/words/dto/create-word.dto';
import { GetWordDto } from 'src/words/dto/get-word.dto';
import { UpdateWordDto } from 'src/words/dto/update-word.dto';

import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { DictionaryService } from './dictionary.service';

@Controller()
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  // Word Groups API -------------------------------------------------

  @Get('word-groups')
  findAllWordGroups(@Query() getWordGroupDto: GetWordGroupDto) {
    return this.dictionaryService.findAllWordGroups(getWordGroupDto);
  }

  @Get('word-groups/:groupId')
  findOneWordGroup(@Param('groupId') groupId: string) {
    return this.dictionaryService.findOneWordGroup(groupId);
  }

  @Post('word-groups')
  createWordGroup(@Body() createWordGroupDto: CreateWordGroupDto) {
    return this.dictionaryService.createWordGroup(createWordGroupDto);
  }

  @Patch('word-groups/:groupId')
  updateWordGroup(
    @Param('groupId') groupId: string,
    @Body() updateWordGroup: UpdateWordGroupDto,
  ) {
    return this.dictionaryService.updateWordGroup(groupId, updateWordGroup);
  }

  @Delete('word-groups/:groupId')
  deleteWordGroup(@Param('groupId') groupId: string) {
    return this.dictionaryService.deleteWordGroup(groupId);
  }

  // Words API ---------------------------------------------------------------

  @Get('words/')
  findOneWord(@Query() getWordDto: GetWordDto) {
    return this.dictionaryService.findOneWord(getWordDto);
  }

  @Post('words/')
  createWord(@Body() createWordDto: CreateWordDto) {
    return this.dictionaryService.createWord(createWordDto);
  }

  @Patch('words/:wordId')
  updateWord(
    @Param('wordId') wordId: string,
    @Body() updateWordDto: UpdateWordDto,
  ) {
    return this.dictionaryService.updateWord(wordId, updateWordDto);
  }

  @Delete('words/:wordId')
  deleteWord(@Param('wordId') wordId: string) {
    return this.dictionaryService.deleteWord(wordId);
  }
}

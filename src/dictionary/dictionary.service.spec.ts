import {
  CreateWordGroupDto,
  UpdateWordGroupDto,
} from 'src/word-groups/dto/create-word-group.dto';
import { WordGroupsService } from 'src/word-groups/word-groups.service';
import { CreateWordDto } from 'src/words/dto/create-word.dto';
import { UpdateWordDto } from 'src/words/dto/update-word.dto';
import { WordsService } from 'src/words/words.service';

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DictionaryService } from './dictionary.service';

const mockWordsService = {
  findAll: jest.fn(),
  findManyByGroupId: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deleteOne: jest.fn(),
  deleteManyByGroupId: jest.fn(),
};

const mockWordGroupsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('DictionaryService', () => {
  let service: DictionaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DictionaryService,
        { provide: WordsService, useValue: mockWordsService },
        { provide: WordGroupsService, useValue: mockWordGroupsService },
      ],
    }).compile();

    service = module.get<DictionaryService>(DictionaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllWordGroups({type})', () => {
    const groupId = 'test-group-id';
    const mockWordGroups = [{ _id: groupId, name: 'test group' }];
    const mockWords = [{ _id: 'word1', text: 'word1', group: groupId }];

    it('should return all word groups with words (type=simple)', async () => {
      mockWordGroupsService.findAll.mockResolvedValue(mockWordGroups);
      mockWordsService.findAll.mockResolvedValue(mockWords);

      const result = await service.findAllWordGroups({ type: 'simple' });
      expect(result).toEqual(mockWordGroups);
      expect(mockWordGroupsService.findAll).toHaveBeenCalledTimes(1);
      expect(mockWordsService.findAll).not.toHaveBeenCalled();
    });

    it('should return all word groups with words (type=full)', async () => {
      mockWordGroupsService.findAll.mockResolvedValue(mockWordGroups);
      mockWordsService.findAll.mockResolvedValue(mockWords);

      const result = await service.findAllWordGroups({ type: 'full' });
      expect(result).toEqual([{ ...mockWordGroups[0], words: mockWords }]);
      expect(mockWordGroupsService.findAll).toHaveBeenCalledTimes(1);
      expect(mockWordsService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty list', async () => {
      mockWordGroupsService.findAll.mockResolvedValue([]);

      const result = await service.findAllWordGroups({ type: 'full' });
      expect(result).toEqual([]);
      expect(mockWordGroupsService.findAll).toHaveBeenCalledTimes(1);
      expect(mockWordsService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOneWordGroup(groupId)', () => {
    const groupId = 'test-group-id';
    const mockWordGroup = { _id: groupId, name: 'test group' };
    const mockWords = [{ _id: 'word1', text: 'word1', group: groupId }];

    it('should return word group with all words', async () => {
      mockWordGroupsService.findOne.mockResolvedValue(mockWordGroup);
      mockWordsService.findManyByGroupId.mockResolvedValue(mockWords);

      const result = await service.findOneWordGroup(groupId);

      expect(result).toEqual({ ...mockWordGroup, words: mockWords });
      expect(mockWordGroupsService.findOne).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsService.findOne).toHaveBeenCalledWith(groupId);
      expect(mockWordsService.findManyByGroupId).toHaveBeenCalledTimes(1);
      expect(mockWordsService.findManyByGroupId).toHaveBeenCalledWith(groupId);
    });

    it('should return word group with empty words list', async () => {
      mockWordGroupsService.findOne.mockResolvedValue(mockWordGroup);
      mockWordsService.findManyByGroupId.mockResolvedValue([]);

      const result = await service.findOneWordGroup(groupId);

      expect(result).toEqual({ ...mockWordGroup, words: [] });
      expect(mockWordGroupsService.findOne).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsService.findOne).toHaveBeenCalledWith(groupId);
      expect(mockWordsService.findManyByGroupId).toHaveBeenCalledTimes(1);
      expect(mockWordsService.findManyByGroupId).toHaveBeenCalledWith(groupId);
    });

    it('should throw NotFoundException', async () => {
      mockWordGroupsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.findOneWordGroup(groupId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockWordGroupsService.findOne).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsService.findOne).toHaveBeenCalledWith(groupId);
      expect(mockWordsService.findManyByGroupId).not.toHaveBeenCalled();
    });
  });

  describe('createWordGroup(dto)', () => {
    const mockCreateWordGroupDto: CreateWordGroupDto = {
      mainWord: 'test',
      name: 'test word group',
      description: 'test word group',
    };
    const createdWordGroup = {
      ...mockCreateWordGroupDto,
      _id: 'created-group',
    };

    it('should create word group', async () => {
      mockWordGroupsService.create.mockResolvedValue(createdWordGroup);

      const result = await service.createWordGroup(mockCreateWordGroupDto);

      expect(result).toEqual(createdWordGroup);
      expect(mockWordGroupsService.create).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsService.create).toHaveBeenCalledWith(
        mockCreateWordGroupDto,
      );
    });

    it('should throw ConflictException', async () => {
      mockWordGroupsService.create.mockRejectedValue(
        new ConflictException(
          `Group with the main word '${mockCreateWordGroupDto.mainWord}' already exists`,
        ),
      );

      const result = service.createWordGroup(mockCreateWordGroupDto);

      await expect(result).rejects.toThrow(ConflictException);
      await expect(result).rejects.toThrow(
        `Group with the main word '${mockCreateWordGroupDto.mainWord}' already exists`,
      );
      expect(mockWordGroupsService.create).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsService.create).toHaveBeenCalledWith(
        mockCreateWordGroupDto,
      );
    });
  });
  describe('updateWordGroup(id, dto)', () => {
    const groupId = 'test-group-id';
    const updateDto: UpdateWordGroupDto = {
      name: 'new test name',
    };
    const updatedWordGroup = {
      _id: groupId,
      mainWord: 'test-group',
      ...updateDto,
    };

    it('should update word group', async () => {
      mockWordGroupsService.update.mockResolvedValue(updatedWordGroup);

      const result = await service.updateWordGroup(groupId, updateDto);

      expect(result).toEqual(updatedWordGroup);
      expect(mockWordGroupsService.update).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsService.update).toHaveBeenCalledWith(
        groupId,
        updateDto,
      );
    });

    it('should throw NotFoundException', async () => {
      mockWordGroupsService.update.mockRejectedValue(new NotFoundException());

      await expect(
        service.updateWordGroup(groupId, updatedWordGroup),
      ).rejects.toThrow(NotFoundException);

      expect(mockWordGroupsService.update).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsService.update).toHaveBeenCalledWith(
        groupId,
        updatedWordGroup,
      );
    });

    it('should throw ConflictException', async () => {
      mockWordGroupsService.update.mockRejectedValue(new ConflictException());

      await expect(
        service.updateWordGroup(groupId, updatedWordGroup),
      ).rejects.toThrow(ConflictException);

      expect(mockWordGroupsService.update).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsService.update).toHaveBeenCalledWith(
        groupId,
        updatedWordGroup,
      );
    });
  });

  describe('deleteWordGroup(groupId)', () => {
    const groupId = 'test-group';
    const deleteResult = { deleteCount: 1 };

    it('should delete the word group with all words in this group', async () => {
      mockWordGroupsService.delete.mockResolvedValue(deleteResult);
      mockWordsService.deleteManyByGroupId.mockResolvedValue({
        deleteCount: 2,
      });

      const result = await service.deleteWordGroup(groupId);

      expect(result).toEqual(deleteResult);
      expect(mockWordGroupsService.delete).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsService.delete).toHaveBeenCalledWith(groupId);
      expect(mockWordsService.deleteManyByGroupId).toHaveBeenCalledTimes(1);
      expect(mockWordsService.deleteManyByGroupId).toHaveBeenCalledWith(
        groupId,
      );
    });

    it('should throw NotFoundException', async () => {
      mockWordGroupsService.delete.mockRejectedValue(new NotFoundException());

      await expect(service.deleteWordGroup(groupId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockWordGroupsService.delete).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsService.delete).toHaveBeenCalledWith(groupId);
      expect(mockWordsService.deleteManyByGroupId).toHaveBeenCalledTimes(1);
      expect(mockWordsService.deleteManyByGroupId).toHaveBeenCalledWith(
        groupId,
      );
    });
  });

  describe('findOneWord(wordId)', () => {
    const wordId = 'test-word-id';
    const wordText = 'test-word';
    const mockWord = { _id: wordId, text: 'test-word' };

    it('should return a word by ID', async () => {
      mockWordsService.findOne.mockResolvedValue(mockWord);

      const result = await service.findOneWord({ id: wordId });

      expect(result).toEqual(mockWord);
      expect(mockWordsService.findOne).toHaveBeenCalledTimes(1);
      expect(mockWordsService.findOne).toHaveBeenCalledWith({ id: wordId });
    });

    it('should return a word by TEXT', async () => {
      mockWordsService.findOne.mockResolvedValue(mockWord);

      const result = await service.findOneWord({ text: wordText });

      expect(result).toEqual(mockWord);
      expect(mockWordsService.findOne).toHaveBeenCalledTimes(1);
      expect(mockWordsService.findOne).toHaveBeenCalledWith({ text: wordText });
    });
  });
  describe('createWord(dto)', () => {
    const groupId = 'test-group-id';
    const wordDto: CreateWordDto = {
      text: 'test-word',
      examples: ['test example'],
      group: groupId,
      transcription: 'test',
      meaning: 'test',
      translations: [],
    };
    const createdWord = { _id: 'test-word-id', ...wordDto };

    it('should create a new word', async () => {
      mockWordGroupsService.findOne.mockResolvedValue({ _id: groupId });
      mockWordsService.create.mockResolvedValue(createdWord);

      const result = await service.createWord(wordDto);

      expect(result).toEqual(createdWord);
      expect(mockWordsService.create).toHaveBeenCalledTimes(1);
      expect(mockWordsService.create).toHaveBeenCalledWith(wordDto);
    });

    it('should throw ConflictException', async () => {
      mockWordGroupsService.findOne.mockResolvedValue({ _id: groupId });
      mockWordsService.create.mockRejectedValue(new ConflictException());

      await expect(service.createWord(wordDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockWordGroupsService.findOne).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsService.findOne).toHaveBeenCalledWith(groupId);
      expect(mockWordsService.create).toHaveBeenCalledTimes(1);
      expect(mockWordsService.create).toHaveBeenCalledWith(wordDto);
    });

    it('should throw NotFoundException', async () => {
      mockWordGroupsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.createWord(wordDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockWordGroupsService.findOne).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsService.findOne).toHaveBeenCalledWith(groupId);
      expect(mockWordsService.create).not.toHaveBeenCalled();
    });
  });

  describe('updateWord(wordId, dto)', () => {
    const wordId = 'test-word-id';
    const groupId = 'test-group-id';
    const wordDto: UpdateWordDto = {
      transcription: 'new-test',
      group: groupId,
    };
    const updatedWord = { _id: wordId, ...wordDto };

    it('should update a word', async () => {
      mockWordGroupsService.findOne.mockResolvedValue({ _id: groupId });
      mockWordsService.update.mockResolvedValue(updatedWord);

      const result = await service.updateWord(wordId, wordDto);

      expect(result).toEqual(updatedWord);
      expect(mockWordsService.update).toHaveBeenCalledTimes(1);
      expect(mockWordsService.update).toHaveBeenCalledWith(wordId, wordDto);
    });

    it('should throw ConflictException', async () => {
      mockWordGroupsService.findOne.mockResolvedValue({ _id: groupId });
      mockWordsService.update.mockRejectedValue(new ConflictException());

      await expect(service.updateWord(wordId, wordDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockWordGroupsService.findOne).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsService.findOne).toHaveBeenCalledWith(groupId);
      expect(mockWordsService.update).toHaveBeenCalledTimes(1);
      expect(mockWordsService.update).toHaveBeenCalledWith(wordId, wordDto);
    });

    it('should throw NotFoundException when a GROUP not existing', async () => {
      mockWordGroupsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.updateWord(wordId, wordDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockWordGroupsService.findOne).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsService.findOne).toHaveBeenCalledWith(groupId);
      expect(mockWordsService.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when a WORD not existing', async () => {
      mockWordGroupsService.findOne.mockResolvedValue({ _id: groupId });
      mockWordsService.update.mockRejectedValue(new NotFoundException());

      await expect(service.updateWord(wordId, wordDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockWordGroupsService.findOne).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsService.findOne).toHaveBeenCalledWith(groupId);
      expect(mockWordsService.update).toHaveBeenCalledTimes(1);
      expect(mockWordsService.update).toHaveBeenCalledWith(wordId, wordDto);
    });
  });

  describe('deleteWord(wordId)', () => {
    const wordId = 'test-word-id';
    const mockDelete = { _id: wordId };

    it('should delete a word and return it', async () => {
      mockWordsService.deleteOne.mockResolvedValue(mockDelete);

      const result = await service.deleteWord(wordId);

      expect(result).toEqual(mockDelete);
      expect(mockWordsService.deleteOne).toHaveBeenCalledTimes(1);
      expect(mockWordsService.deleteOne).toHaveBeenCalledWith(wordId);
    });

    it('should return null', async () => {
      mockWordsService.deleteOne.mockResolvedValue(null);

      const result = await service.deleteWord(wordId);

      expect(result).toEqual(null);
      expect(mockWordsService.deleteOne).toHaveBeenCalledTimes(1);
      expect(mockWordsService.deleteOne).toHaveBeenCalledWith(wordId);
    });
  });
});

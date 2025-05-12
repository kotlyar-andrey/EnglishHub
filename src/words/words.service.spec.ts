import { DeleteResult } from 'mongoose';

import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { Word, WordDocument } from './entities/word.entity';
import { WordsService } from './words.service';

const saveMock = jest.fn();

const execMock = {
  exec: jest.fn(),
};

const leanMock = {
  lean: jest.fn().mockReturnValue(execMock),
};

const mockWordsModelInstance = {
  text: 'test-word',
  translations: [{ test: 'test' }],
  group: 'group-id',
  save: saveMock,
};

const mockWordsModel = jest
  .fn()
  .mockImplementation(() => mockWordsModelInstance) as any;
mockWordsModel.find = jest.fn().mockReturnValue(leanMock);
mockWordsModel.findById = jest.fn().mockReturnValue(leanMock);
mockWordsModel.findOne = jest.fn().mockReturnValue(leanMock);
mockWordsModel.findByIdAndUpdate = jest.fn().mockReturnValue(execMock);
mockWordsModel.findByIdAndDelete = jest.fn().mockReturnValue(execMock);
mockWordsModel.deleteMany = jest.fn().mockReturnValue(execMock);

describe('WordsService', () => {
  let service: WordsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WordsService,
        {
          provide: getModelToken(Word.name),
          useValue: mockWordsModel,
        },
      ],
    }).compile();

    service = module.get<WordsService>(WordsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    execMock.exec.mockClear();
    leanMock.lean.mockClear();
    saveMock.mockClear();
  });

  describe('findAll()', () => {
    it('should return all words', async () => {
      const mockWordsList = [
        {
          text: 'word-1',
          translations: [{ language: 'test', translation: 'test' }],
        },
      ] as WordDocument[];
      execMock.exec.mockReturnValue(mockWordsList);

      const result = await service.findAll();

      expect(result).toEqual(mockWordsList);
      expect(mockWordsModel.find).toHaveBeenCalledTimes(1);
      expect(execMock.exec).toHaveBeenCalledTimes(1);
      expect(leanMock.lean).toHaveBeenCalledTimes(1);
    });

    it('should return empty list', async () => {
      execMock.exec.mockReturnValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(mockWordsModel.find).toHaveBeenCalledTimes(1);
      expect(execMock.exec).toHaveBeenCalledTimes(1);
      expect(leanMock.lean).toHaveBeenCalledTimes(1);
    });

    it('should expect InternalServerError if not have connection', async () => {
      execMock.exec.mockRejectedValue(
        new InternalServerErrorException('Error'),
      );

      await expect(service.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(execMock.exec).toHaveBeenCalledTimes(1);
      expect(leanMock.lean).toHaveBeenCalledTimes(1);
      expect(mockWordsModel.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('findManyByGroupId(groupId)', () => {
    it('should return list of words with some groupId', async () => {
      const groupId = 'test-group-id';
      const mockWordsList = [
        { text: 'test-1', group: groupId },
        { text: 'test-2', group: groupId },
      ];
      execMock.exec.mockResolvedValue(mockWordsList);

      const result = await service.findManyByGroupId(groupId);

      expect(result).toEqual(mockWordsList);
      expect(mockWordsModel.find).toHaveBeenCalledTimes(1);
      expect(mockWordsModel.find).toHaveBeenCalledWith({ group: groupId });
      expect(leanMock.lean).toHaveBeenCalledTimes(1);
      expect(execMock.exec).toHaveBeenCalledTimes(1);
    });
    it('should return empty list', async () => {
      const groupId = 'test-group-id';
      execMock.exec.mockResolvedValue([]);

      const result = await service.findManyByGroupId(groupId);

      expect(result).toEqual([]);
      expect(mockWordsModel.find).toHaveBeenCalledTimes(1);
      expect(mockWordsModel.find).toHaveBeenCalledWith({ group: groupId });
      expect(leanMock.lean).toHaveBeenCalledTimes(1);
      expect(execMock.exec).toHaveBeenCalledTimes(1);
    });

    it('should throw InternalServerError', async () => {
      const groupId = 'test-group-id';
      execMock.exec.mockRejectedValue(
        new InternalServerErrorException('Error'),
      );

      await expect(service.findManyByGroupId(groupId)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(mockWordsModel.find).toHaveBeenCalledTimes(1);
      expect(mockWordsModel.find).toHaveBeenCalledWith({ group: groupId });
      expect(execMock.exec).toHaveBeenCalledTimes(1);
      expect(leanMock.lean).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne({id, text})', () => {
    it('should return word by ID', async () => {
      const id = 'test-group-id';
      const mockTestWord = { text: 'test-word', id: 'test-id' };
      execMock.exec.mockResolvedValue(mockTestWord);

      const result = await service.findOne({ id });

      expect(result).toEqual(mockTestWord);
      expect(mockWordsModel.findById).toHaveBeenCalledTimes(1);
      expect(mockWordsModel.findById).toHaveBeenCalledWith(id);
      expect(leanMock.lean).toHaveBeenCalledTimes(1);
      expect(execMock.exec).toHaveBeenCalledTimes(1);
    });

    it('should return word by TEXT', async () => {
      const text = 'text-word';
      const mockTestWord = { text: 'test-word', id: 'test-id' };
      execMock.exec.mockResolvedValue(mockTestWord);

      const result = await service.findOne({ text });

      expect(result).toEqual(mockTestWord);
      expect(mockWordsModel.findOne).toHaveBeenCalledTimes(1);
      expect(mockWordsModel.findOne).toHaveBeenCalledWith({ text });
      expect(leanMock.lean).toHaveBeenCalledTimes(1);
      expect(execMock.exec).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundError', async () => {
      const id = 'test-id';
      execMock.exec.mockRejectedValue(new NotFoundException('Error'));

      await expect(service.findOne({ id })).rejects.toThrow(NotFoundException);
      expect(mockWordsModel.findById).toHaveBeenCalledTimes(1);
      expect(mockWordsModel.findById).toHaveBeenCalledWith(id);
      expect(execMock.exec).toHaveBeenCalledTimes(1);
      expect(leanMock.lean).toHaveBeenCalledTimes(1);
    });

    it('should throw InternalServerError', async () => {
      const id = 'test-id';
      execMock.exec.mockRejectedValue(
        new InternalServerErrorException('Error'),
      );

      await expect(service.findOne({ id })).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockWordsModel.findById).toHaveBeenCalledTimes(1);
      expect(mockWordsModel.findById).toHaveBeenCalledWith(id);
      expect(leanMock.lean).toHaveBeenCalledTimes(1);
      expect(execMock.exec).toHaveBeenCalledTimes(1);
    });
  });

  describe('create(createWordDto)', () => {
    const createDto: CreateWordDto = {
      text: 'new-test-word',
      transcription: 'test',
      meaning: 'test',
      examples: ['test'],
      translations: [{ language: 'test', translation: 'test' }],
      group: 'test-group-id',
    };
    it('should create new word', async () => {
      const savedWord = Object.assign(mockWordsModelInstance, {
        _id: 'test-word-id',
        ...createDto,
      });
      saveMock.mockResolvedValue(savedWord);

      const result = await service.create(createDto);
      expect(result).toEqual(savedWord);
      expect(mockWordsModel).toHaveBeenCalledTimes(1);
      expect(mockWordsModel).toHaveBeenCalledWith(createDto);
      expect(mockWordsModelInstance.save).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException', async () => {
      const error = new ConflictException(
        `Word '${createDto.text}' already exists`,
      );
      (error as any).code = 11000;

      saveMock.mockRejectedValue(error);

      const result = service.create(createDto);

      await expect(result).rejects.toThrow(ConflictException);
      await expect(result).rejects.toThrow(
        `Word '${createDto.text}' already exists`,
      );
      expect(mockWordsModel).toHaveBeenCalledTimes(1);
      expect(mockWordsModel).toHaveBeenCalledWith(createDto);
      expect(mockWordsModelInstance.save).toHaveBeenCalledTimes(1);
    });

    it('should throw InternalServerError', async () => {
      saveMock.mockRejectedValue(
        new InternalServerErrorException('Error saving group'),
      );

      const result = service.create(createDto);

      await expect(result).rejects.toThrow(InternalServerErrorException);
      await expect(result).rejects.toThrow('Error saving group');
      expect(mockWordsModel).toHaveBeenCalledTimes(1);
      expect(mockWordsModel).toHaveBeenCalledWith(createDto);
      expect(mockWordsModelInstance.save).toHaveBeenCalledTimes(1);
    });
  });
  describe('update(id, updateDto)', () => {
    const wordId = 'test-word-id';
    const updateDto: UpdateWordDto = { transcription: 'new-value' };

    it('should update a word', async () => {
      const updatedWord = Object.assign(mockWordsModelInstance, {
        ...updateDto,
        _id: wordId,
      });

      execMock.exec.mockResolvedValue(updatedWord);

      const result = await service.update(wordId, updateDto);

      expect(result).toEqual(updatedWord);
      expect(mockWordsModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      expect(mockWordsModel.findByIdAndUpdate).toHaveBeenCalledWith(
        { _id: wordId },
        { $set: updateDto },
        { new: true },
      );
    });

    it('should throw NotFoundException', async () => {
      execMock.exec.mockRejectedValue(new NotFoundException());

      await expect(service.update(wordId, updateDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockWordsModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      expect(mockWordsModel.findByIdAndUpdate).toHaveBeenCalledWith(
        { _id: wordId },
        { $set: updateDto },
        { new: true },
      );
      expect(execMock.exec).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException', async () => {
      execMock.exec.mockRejectedValue(
        new ConflictException(`Word '${updateDto.text}' already exists`),
      );

      const result = service.update(wordId, updateDto);
      await expect(result).rejects.toThrow(ConflictException);
      await expect(result).rejects.toThrow(
        `Word '${updateDto.text}' already exists`,
      );

      expect(mockWordsModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      expect(mockWordsModel.findByIdAndUpdate).toHaveBeenCalledWith(
        { _id: wordId },
        { $set: updateDto },
        { new: true },
      );
      expect(execMock.exec).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete(id)', () => {
    const wordId = 'test-word-id';

    it('should delete word', async () => {
      const mockDeleteResult = { deletedCount: 1 } as DeleteResult;
      execMock.exec.mockResolvedValue(mockDeleteResult);

      const result = await service.deleteOne(wordId);

      expect(result).toEqual(mockDeleteResult);

      expect(execMock.exec).toHaveBeenCalledTimes(1);
      expect(mockWordsModel.findByIdAndDelete).toHaveBeenCalledTimes(1);
      expect(mockWordsModel.findByIdAndDelete).toHaveBeenCalledWith(wordId);
    });

    it('should throw NotFoundException', async () => {
      execMock.exec.mockRejectedValue(new NotFoundException());

      await expect(service.deleteOne(wordId)).rejects.toThrow(
        NotFoundException,
      );
      expect(execMock.exec).toHaveBeenCalledTimes(1);
      expect(mockWordsModel.findByIdAndDelete).toHaveBeenCalledTimes(1);
      expect(mockWordsModel.findByIdAndDelete).toHaveBeenCalledWith(wordId);
    });
  });

  describe('deleteManyByGroupId(groupId)', () => {
    const groupId = 'test-group-id';

    it('should delete all words with groupId', async () => {
      const mockDeleteResult = { deletedCount: 3 } as DeleteResult;
      execMock.exec.mockResolvedValue(mockDeleteResult);

      const result = await service.deleteManyByGroupId(groupId);

      expect(result).toEqual(mockDeleteResult);

      expect(execMock.exec).toHaveBeenCalledTimes(1);
      expect(mockWordsModel.deleteMany).toHaveBeenCalledTimes(1);
      expect(mockWordsModel.deleteMany).toHaveBeenCalledWith({
        group: groupId,
      });
    });
  });
});

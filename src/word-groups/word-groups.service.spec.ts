import { DeleteResult, Model } from 'mongoose';

import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { CreateWordGroupDto, UpdateWordGroupDto } from './dto/create-word-group.dto';
import { WordGroup, WordGroupDocument } from './entities/word-group.entity';
import { WordGroupsService } from './word-groups.service';

// ------------------ Mocks -------------------------------

const mockSave = jest.fn();

const mockDeleteOne = jest.fn();

const mockWordGroupInstance = {
  _id: 'test id',
  name: 'test name',
  mainWord: 'test word',
  save: mockSave,
  deleteOne: mockDeleteOne,
};

const execMock = {
  exec: jest.fn(),
};
const leanMock = {
  lean: jest.fn().mockReturnValue(execMock),
};

const findByIdMock = {
  findById: jest.fn().mockReturnValue(leanMock),
};

const mockWordGroupsModel = jest.fn(() => mockWordGroupInstance) as any;
mockWordGroupsModel.find = jest.fn().mockReturnValue(leanMock);
mockWordGroupsModel.findOne = jest.fn().mockReturnValue(leanMock);
mockWordGroupsModel.findById = jest.fn().mockReturnValue(leanMock);
mockWordGroupsModel.findOneAndUpdate = jest.fn().mockReturnValue(execMock);
mockWordGroupsModel.deleteMany = jest
  .fn()
  .mockResolvedValue({ deletedCount: 1 });
mockWordGroupsModel.findByIdAndUpdate = jest.fn().mockReturnValue(execMock);

// ------------------ Tests ----------------------

describe('WordGroupsService', () => {
  let service: WordGroupsService;

  beforeEach(async () => {
    mockSave.mockClear();
    mockDeleteOne.mockClear();
    execMock.exec.mockClear();
    leanMock.lean.mockClear();
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WordGroupsService,
        {
          provide: getModelToken(WordGroup.name),
          useValue: mockWordGroupsModel,
        },
      ],
    }).compile();

    service = module.get<WordGroupsService>(WordGroupsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockSave.mockClear();
    mockDeleteOne.mockClear();
    execMock.exec.mockClear();
    leanMock.lean.mockClear();
  });

  describe('findAll()', () => {
    it('should return all word groups', async () => {
      const mockWordGroups = [
        { _id: 'id1', name: 'Group 1' },
        { _id: 'id2', name: 'Group 2' },
      ] as WordGroupDocument[];
      execMock.exec.mockResolvedValue(mockWordGroups);

      const result = await service.findAll();

      expect(result).toEqual(mockWordGroups);
      expect(leanMock.lean).toHaveBeenCalledTimes(1);
      expect(execMock.exec).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsModel.find).toHaveBeenCalledWith();
    });

    it("should return an empty list when groups don't exist", async () => {
      execMock.exec.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(leanMock.lean).toHaveBeenCalledTimes(1);
      expect(execMock.exec).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsModel.find).toHaveBeenCalledWith();
    });

    it('should throw an error if connection rejects', async () => {
      const testError = new Error('Database connection error');
      execMock.exec.mockRejectedValue(testError);

      await expect(service.findAll()).rejects.toThrow(
        'Database connection error',
      );

      expect(mockWordGroupsModel.find).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsModel.find).toHaveBeenCalledWith();
      expect(leanMock.lean).toHaveBeenCalledTimes(1);
      expect(execMock.exec).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne(id)', () => {
    it('should return one existing group', async () => {
      const groupId = 'mockGroupId';
      const mockFoundGroup = {
        _id: groupId,
        name: 'test group',
        mainWord: 'test',
      } as WordGroupDocument;

      execMock.exec.mockResolvedValue(mockFoundGroup);

      const result = await service.findOne(groupId);

      expect(result).toEqual(mockFoundGroup);
      expect(mockWordGroupsModel.findById).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsModel.findById).toHaveBeenCalledWith(groupId);
      expect(leanMock.lean).toHaveBeenCalledTimes(1);
      expect(execMock.exec).toHaveBeenCalledTimes(1);
    });

    it("should throw NotFoundError when group doesn't exist", async () => {
      const groupId = 'mockGroupId';
      execMock.exec.mockResolvedValue(null);

      await expect(service.findOne(groupId)).rejects.toThrow(NotFoundException);
      expect(mockWordGroupsModel.findById).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsModel.findById).toHaveBeenCalledWith(groupId);
      expect(leanMock.lean).toHaveBeenCalledTimes(1);
      expect(execMock.exec).toHaveBeenCalledTimes(1);
    });
  });

  describe('create(dto)', () => {
    const createDto: CreateWordGroupDto = {
      name: 'new test group',
      mainWord: 'TestWord',
      description: 'test description',
    };

    it('should be created', async () => {
      const savedGroup = { _id: 'mock-id', ...createDto } as WordGroupDocument;
      mockSave.mockResolvedValue(savedGroup);

      const result = await service.create(createDto);

      expect(mockWordGroupsModel).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsModel).toHaveBeenCalledWith(createDto);
      expect(mockWordGroupInstance.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(savedGroup);
    });

    it('should throw ConflictException for duplicate key error (11000)', async () => {
      const duplicateKeyError = new Error('Duplicate key error');
      (duplicateKeyError as any).code = 11000;
      mockSave.mockRejectedValue(duplicateKeyError);

      const result = service.create(createDto);

      await expect(result).rejects.toThrow(ConflictException);
      await expect(result).rejects.toThrow(
        `Group with the main word '${createDto.mainWord}' already exists`,
      );

      expect(mockWordGroupsModel).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsModel).toHaveBeenCalledWith(createDto);
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it('should throw InternalServerErrorException for other saving errors', async () => {
      const otherError = new Error('Some other database error');
      mockSave.mockRejectedValue(otherError);

      const result = service.create(createDto);

      await expect(result).rejects.toThrow(InternalServerErrorException);

      await expect(result).rejects.toThrow('Error saving group');

      expect(mockWordGroupsModel).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsModel).toHaveBeenCalledWith(createDto);
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('update(id, dto)', () => {
    const groupId = 'test group id';
    const updateDto: UpdateWordGroupDto = { name: 'Updated Name' };

    it('should update a word group', async () => {
      const mockUpdatedGroup = {
        _id: groupId,
        ...updateDto,
        mainWord: 'test word',
      } as WordGroupDocument;
      execMock.exec.mockResolvedValue(mockUpdatedGroup);

      const result = await service.update(groupId, updateDto);

      expect(result).toEqual(mockUpdatedGroup);

      expect(mockWordGroupsModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: groupId },
        { $set: updateDto },
        { new: true },
      );
      expect(execMock.exec).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if group is not found', async () => {
      execMock.exec.mockResolvedValue(null);

      await expect(service.update(groupId, updateDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockWordGroupsModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: groupId },
        { $set: updateDto },
        { new: true },
      );
      expect(execMock.exec).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if group with same mainWord have already exists', async () => {
      execMock.exec.mockRejectedValue(
        new ConflictException(
          `Group with the main word '${updateDto.mainWord}' already exists`,
        ),
      );

      const result = service.update(groupId, updateDto);

      await expect(result).rejects.toThrow(ConflictException);
      await expect(result).rejects.toThrow(
        `Group with the main word '${updateDto.mainWord}' already exists`,
      );
      expect(execMock.exec).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: groupId },
        { $set: updateDto },
        { new: true },
      );
    });

    it('should throw an error if connection rejects', async () => {
      const testError = new Error('Update failed');
      execMock.exec.mockRejectedValue(testError);

      await expect(service.update(groupId, updateDto)).rejects.toThrow(
        'Update failed',
      );

      expect(mockWordGroupsModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: groupId },
        { $set: updateDto },
        { new: true },
      );
      expect(execMock.exec).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete(id)', () => {
    const groupId = 'test group id';

    it('should delete a word group', async () => {
      execMock.exec.mockResolvedValue(mockWordGroupInstance);

      const mockDeleteResult = { deletedCount: 1 } as DeleteResult;
      mockDeleteOne.mockResolvedValue(mockDeleteResult);

      const result = await service.delete(groupId);

      expect(result).toEqual(mockDeleteResult);

      expect(mockWordGroupsModel.findById).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsModel.findById).toHaveBeenCalledWith(groupId);
      expect(execMock.exec).toHaveBeenCalledTimes(1);
      expect(mockWordGroupInstance.deleteOne).toHaveBeenCalledTimes(1);
    });

    it('should return undefined if group is not found', async () => {
      execMock.exec.mockResolvedValue(null);

      const result = await service.delete(groupId);

      expect(result).toBeUndefined();

      expect(mockWordGroupsModel.findById).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsModel.findById).toHaveBeenCalledWith(groupId);
      expect(execMock.exec).toHaveBeenCalledTimes(1);

      expect(mockWordGroupInstance.deleteOne).not.toHaveBeenCalled();
    });

    it('should throw an error if findById().exec() rejects', async () => {
      const groupId = 'test group id';
      const testError = new Error('Find for delete failed');
      execMock.exec.mockRejectedValue(testError);

      await expect(service.delete(groupId)).rejects.toThrow(
        'Find for delete failed',
      );

      expect(mockWordGroupsModel.findById).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsModel.findById).toHaveBeenCalledWith(groupId);
      expect(execMock.exec).toHaveBeenCalledTimes(1);
      expect(mockWordGroupInstance.deleteOne).not.toHaveBeenCalled();
    });

    it('should throw an error if deleteOne() rejects', async () => {
      const groupId = 'test group id';
      const testError = new Error('Delete operation failed');

      execMock.exec.mockResolvedValue(mockWordGroupInstance);
      mockDeleteOne.mockRejectedValue(testError);

      await expect(service.delete(groupId)).rejects.toThrow(
        'Delete operation failed',
      );

      expect(mockWordGroupsModel.findById).toHaveBeenCalledTimes(1);
      expect(mockWordGroupsModel.findById).toHaveBeenCalledWith(groupId);
      expect(execMock.exec).toHaveBeenCalledTimes(1);
      expect(mockWordGroupInstance.deleteOne).toHaveBeenCalledTimes(1);
    });
  });
});

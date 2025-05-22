// Импортируем мокнутый bcrypt для доступа к его методам, чтобы проверить вызовы
import * as bcrypt from 'bcrypt';

import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { User, UserStatus } from './entities/user.entity';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn((password, saltRounds) => 'hashed-password'),
}));

describe('UsersService', () => {
  let service: UsersService;

  const toObjectMock = jest.fn();

  const saveMock = jest.fn();

  const execMock = {
    exec: jest.fn(),
  };

  const leanMock = {
    lean: jest.fn().mockReturnValue(execMock),
  };

  const mockUserInstance = {
    _id: 'test-user-id',
    email: 'test@test.com',
    password: 'hashed-password',
    save: saveMock,
  };

  const mockUserModel = jest.fn(() => mockUserInstance) as any;
  mockUserModel.findById = jest.fn().mockReturnValue(leanMock);
  mockUserModel.findOne = jest.fn().mockReturnValue(leanMock);
  mockUserModel.findByIdAndUpdate = jest.fn().mockReturnValue(leanMock);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOneById(id)', () => {
    const userId = 'test-user-id';
    const userEmail = 'test@test.com';
    const mockUser = { _id: userId, email: userEmail };

    it('should return a user', async () => {
      execMock.exec.mockResolvedValue(mockUser);

      const result = await service.findOneById(userId);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledTimes(1);
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
    });

    it('should return null', async () => {
      execMock.exec.mockResolvedValue(null);

      const result = await service.findOneById(userId);

      expect(result).toEqual(null);
      expect(mockUserModel.findById).toHaveBeenCalledTimes(1);
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('findOneByEmail(email)', () => {
    const userId = 'test-user-id';
    const userEmail = 'test@test.com';
    const mockUser = { _id: userId, email: userEmail };

    it('should return a user', async () => {
      execMock.exec.mockResolvedValue(mockUser);

      const result = await service.findOneByEmail(userEmail);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledTimes(1);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: userEmail });
    });

    it('should return null', async () => {
      execMock.exec.mockResolvedValue(null);

      const result = await service.findOneByEmail(userEmail);

      expect(result).toEqual(null);
      expect(mockUserModel.findOne).toHaveBeenCalledTimes(1);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: userEmail });
    });
  });

  describe('create(dto)', () => {
    const userEmail = 'create@test.com';
    const createDto: CreateUserDto = {
      email: userEmail,
      password: 'test-password',
    };

    toObjectMock.mockReturnValue(mockUserInstance);

    it('should create a new user', async () => {
      saveMock.mockResolvedValue({
        ...mockUserInstance,
        toObject: toObjectMock,
      });

      const result = await service.createByEmailAndPassword(createDto);
      expect(result).toEqual(mockUserInstance);
      expect(mockUserModel).toHaveBeenCalledTimes(1);
      expect(mockUserModel).toHaveBeenCalledWith({
        ...createDto,
        password: 'hashed-password',
      });
      expect(mockUserInstance.save).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException', async () => {
      saveMock.mockRejectedValue(new ConflictException());

      await expect(service.createByEmailAndPassword(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserModel).toHaveBeenCalledTimes(1);
      expect(mockUserModel).toHaveBeenCalledWith({
        ...createDto,
        password: 'hashed-password',
      });
    });
  });

  describe('update(dto)', () => {
    const userId = 'update-user-id';
    const updateDto: UpdateUserDto = {
      password: 'new-password',
    };
    const updatedUser = Object.assign(mockUserInstance, updateDto);

    it('should update a user', async () => {
      execMock.exec.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateDto);
      expect(result).toEqual(updatedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $set: updateDto },
        { new: true },
      );
    });

    it('should throw NotFoundException', async () => {
      execMock.exec.mockRejectedValue(new NotFoundException());

      await expect(service.update(userId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $set: updateDto },
        { new: true },
      );
    });
  });

  describe('ban(userId)', () => {
    const userId = 'banned-user-id';

    it('should ban a user by id', async () => {
      execMock.exec.mockResolvedValue({
        ...mockUserInstance,
        status: UserStatus.BANNED,
      });

      const result = await service.ban(userId, true);
      expect(result.status).toEqual(UserStatus.BANNED);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        {
          $set: { status: UserStatus.BANNED },
        },
        { new: true },
      );
    });

    it('should un ban a user by id', async () => {
      execMock.exec.mockResolvedValue({
        ...mockUserInstance,
        status: UserStatus.ACTIVE,
      });

      const result = await service.ban(userId, false);
      expect(result.status).toEqual(UserStatus.ACTIVE);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        {
          $set: { status: UserStatus.ACTIVE },
        },
        { new: true },
      );
    });

    it('should throw NotFoundException', async () => {
      execMock.exec.mockResolvedValue(null);

      await expect(service.ban(userId, true)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        {
          $set: { status: UserStatus.BANNED },
        },
        { new: true },
      );
    });
  });
});

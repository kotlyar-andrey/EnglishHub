import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';

import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshToken } from './entities/refresh-token.entity';

jest.mock('crypto', () => ({
  randomBytes: (n) => ({
    toString: () => 'random-string',
  }),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockUserService = {
    createByEmailAndPassword: jest.fn(),
    findOneByEmail: jest.fn(),
  };

  const mockJestService = {
    sign: jest.fn().mockReturnValue('jwt-string'),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(123),
  };

  const mockRefreshInstance = {
    user: 'user-id',
    token: 'random-string',
    expiresAt: new Date(),
  };
  const saveMock = jest.fn().mockResolvedValue(mockRefreshInstance);
  const mockRefreshToken = jest.fn(() => ({
    ...mockRefreshInstance,
    save: saveMock,
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUserService,
        },
        { provide: JwtService, useValue: mockJestService },
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: getModelToken(RefreshToken.name),
          useValue: mockRefreshToken,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('registrationByEmailAndPassword(dto)', () => {
    const registerDto: RegisterDto = {
      email: 'test@test.com',
      password: '123',
      passwordConfirm: '123',
    };

    it('should register new user', async () => {
      mockUserService.createByEmailAndPassword.mockResolvedValue({
        email: 'test@test.com',
        _id: 'test-id',
      });
      const result = await service.registrationByEmailAndPassword(registerDto);
      expect(result).toEqual({
        access: 'jwt-string',
        refresh: 'random-string',
      });
      expect(mockUserService.createByEmailAndPassword).toHaveBeenCalledTimes(1);
      expect(mockUserService.createByEmailAndPassword).toHaveBeenCalledWith(
        registerDto,
      );
    });

    it('should throw ConflictException', async () => {
      mockUserService.createByEmailAndPassword.mockRejectedValue(
        new ConflictException(),
      );

      await expect(
        service.registrationByEmailAndPassword(registerDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('loginByEmailAndPassword(dto)', () => {
    const loginDto: LoginDto = {
      email: 'test@test.com',
      password: '123',
    };

    it('should login a user', async () => {
      mockUserService.findOneByEmail.mockResolvedValue({
        email: 'test@test.com',
      });
      bcrypt.compare.mockReturnValue(true);

      const result = await service.loginByEmailAndPassword(loginDto);
      expect(result).toEqual({
        access: 'jwt-string',
        refresh: 'random-string',
      });
    });

    it('should throw UnauthorizedException when email is incorrect', async () => {
      mockUserService.findOneByEmail.mockRejectedValue(
        new UnauthorizedException(),
      );

      await expect(service.loginByEmailAndPassword(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      mockUserService.findOneByEmail.mockResolvedValue({
        email: 'test@test.com',
      });
      bcrypt.compare.mockReturnValue(false);

      await expect(service.loginByEmailAndPassword(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

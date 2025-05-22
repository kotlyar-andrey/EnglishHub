import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Model } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshToken, RefreshTokenDocument } from './entities/refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async registrationByEmailAndPassword(registerDto: RegisterDto) {
    const newUser: User =
      await this.usersService.createByEmailAndPassword(registerDto);
    const accessToken = await this.__createAccessToken(newUser);
    const refreshToken = await this.__createRefreshToken(newUser);
    return { access: accessToken, refresh: refreshToken };
  }

  async loginByEmailAndPassword(loginDto: LoginDto) {
    const user: User | null = await this.usersService.findOneByEmail(
      loginDto.email,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const checkPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!checkPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const accessToken = await this.__createAccessToken(user);
    const refreshToken = await this.__createRefreshToken(user);
    return { access: accessToken, refresh: refreshToken };
  }

  async __createAccessToken(user: User) {
    const payload = { email: user.email, sub: user._id };
    return this.jwtService.sign(payload);
  }

  async __createRefreshToken(user: User) {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(
      this.__calcExpiresTime(
        this.configService.get<number>('JWT_REFRESH_EXPIRES') || 10,
      ),
    );
    const refreshToken = new this.refreshTokenModel({
      user: user._id,
      token,
      expiresAt,
    });
    const savedRefreshToken = await refreshToken.save();
    return savedRefreshToken.token;
  }

  __calcExpiresTime(days: number): number {
    return Date.now() + days * 1000 * 3600 * 24;
  }
}

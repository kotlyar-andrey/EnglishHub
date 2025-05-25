import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Model, Types } from 'mongoose';
import { daysToMilliseconds } from 'src/common/utils/calculations';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';

import { LoginDto } from './dto/login.dto';
import { RefreshTokensDto } from './dto/refresh-token.dto';
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
    const user: User | null =
      await this.usersService.findOneByEmailWithPassword(loginDto.email);
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

  async refreshTokens({ refreshToken }: RefreshTokensDto) {
    const existedToken = await this.findOne(refreshToken);
    if (!existedToken || existedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is required');
    }

    await this.deleteOne(existedToken.token);

    const newAccessToken = await this.__createAccessToken(existedToken.user);
    const newRefreshToken = await this.__createRefreshToken(existedToken.user);

    return { access: newAccessToken, refresh: newRefreshToken };
  }

  async findOne(token: string) {
    const refreshToken = await this.refreshTokenModel
      .findOne({ token: token })
      .populate('user')
      .lean()
      .exec();
    return refreshToken;
  }

  async deleteOne(token: string) {
    await this.refreshTokenModel.findOneAndDelete({ token: token }).exec();
  }

  async deleteAllForUser(userId: Types.ObjectId) {
    await this.refreshTokenModel.deleteMany({ user: userId }).exec();
  }

  async __createAccessToken(user: User) {
    const payload = { email: user.email, sub: user._id };

    return this.jwtService.sign(payload);
  }

  async __createRefreshToken(user: User) {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(
      Date.now() +
        daysToMilliseconds(
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
}

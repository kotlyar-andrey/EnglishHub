import { Request, Response } from 'express';
import { daysToMilliseconds } from 'src/common/utils/calculations';

import { Body, Controller, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('registration')
  async registration(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { access, refresh } =
      await this.authService.registrationByEmailAndPassword(registerDto);

    this.__setCookie('refresh', refresh, response);

    return { access };
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { access, refresh } =
      await this.authService.loginByEmailAndPassword(loginDto);

    this.__setCookie('refresh', refresh, response);

    return { access };
  }

  @Post('refresh')
  async refreshTokens(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const prevRefreshToken: string = request.cookies['refresh'];
    if (!prevRefreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const { access, refresh } = await this.authService.refreshTokens({
      refreshToken: prevRefreshToken,
    });

    this.__setCookie('refresh', refresh, response);

    return { access };
  }

  __setCookie(name: string, value: string, response: Response) {
    response.cookie(name, value, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') !== 'development',
      sameSite: 'strict',
      path: '/',
      maxAge: daysToMilliseconds(
        this.configService.get<number>('JWT_REFRESH_EXPIRES') || 10,
      ),
    });
  }
}

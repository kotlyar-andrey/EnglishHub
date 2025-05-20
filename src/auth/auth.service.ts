import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      return null;
    }
    const checkPassword = true // await bcrypt.compare(pass, user.password);
    if (!checkPassword) {
      return null;
    }
    const { password, ...result } = user;

    return result;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

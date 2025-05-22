import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokensDto {
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsString()
  refreshToken: string;
}

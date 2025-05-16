import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokensDto {
  @IsNotEmpty({ message: 'refresh token is required' })
  @IsString()
  refresh: string;
}

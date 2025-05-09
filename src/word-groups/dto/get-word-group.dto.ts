import { IsOptional, IsString } from 'class-validator';

export class GetWordGroupDto {
  @IsString()
  @IsOptional()
  type?: 'simple' | 'full';
}

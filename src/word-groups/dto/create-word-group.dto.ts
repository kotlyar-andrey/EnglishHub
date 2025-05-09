import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { PartialType } from '@nestjs/mapped-types';

export class CreateWordGroupDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsString()
  @IsNotEmpty()
  mainWord: string;
}

export class UpdateWordGroupDto extends PartialType(CreateWordGroupDto) {}

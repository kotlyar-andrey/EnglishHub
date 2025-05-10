import { Type } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class TranslationDto {
  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsNotEmpty()
  translation: string;
}

export class CreateWordDto {
  @IsMongoId()
  group: string;

  @IsString()
  text: string;

  @IsString()
  transcription: string;

  @IsString()
  @IsOptional()
  meaning: string;

  @IsString({ each: true })
  examples: string[];

  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations: TranslationDto[];
}

import { IsMongoId, IsOptional, IsString, ValidateIf } from 'class-validator';

export class GetWordDto {
  @IsMongoId()
  @IsOptional()
  @ValidateIf((obj) => !obj.text)
  id?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((obj) => !obj.id)
  text?: string;
}

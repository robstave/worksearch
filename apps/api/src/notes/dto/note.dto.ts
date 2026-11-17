import { IsString, IsOptional } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  notesMd?: string;
}

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  notesMd?: string;
}

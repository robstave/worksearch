import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateJobBoardDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  notesMd?: string;
}

export class UpdateJobBoardDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  notesMd?: string;
}

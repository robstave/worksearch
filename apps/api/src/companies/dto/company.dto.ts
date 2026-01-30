import {
  IsString,
  IsOptional,
  IsUrl,
  MinLength,
  IsBoolean,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  notesMd?: string;

  @IsOptional()
  @IsBoolean()
  star?: boolean;

  @IsOptional()
  @IsBoolean()
  revisit?: boolean;
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  notesMd?: string;

  @IsOptional()
  @IsBoolean()
  star?: boolean;

  @IsOptional()
  @IsBoolean()
  revisit?: boolean;
}

export class CreateCompanyVisitDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  status?: string; // "no new jobs", "new jobs found", "no interest"
}

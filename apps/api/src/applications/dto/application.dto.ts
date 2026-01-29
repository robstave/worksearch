import { IsString, IsOptional, IsEnum, MinLength, IsArray, IsDateString } from 'class-validator';

export enum AppState {
  INTERESTED = 'INTERESTED',
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  REJECTED = 'REJECTED',
  GHOSTED = 'GHOSTED',
  TRASH = 'TRASH',
}

export enum WorkLocationType {
  REMOTE = 'REMOTE',
  ONSITE = 'ONSITE',
  HYBRID = 'HYBRID',
  CONTRACT = 'CONTRACT',
}

export class CreateApplicationDto {
  @IsString()
  companyId: string;

  @IsString()
  @MinLength(1)
  jobTitle: string;

  @IsOptional()
  @IsString()
  jobReqUrl?: string;

  @IsOptional()
  @IsString()
  jobDescriptionMd?: string;

  @IsOptional()
  @IsEnum(WorkLocationType)
  workLocation?: WorkLocationType;

  @IsOptional()
  @IsEnum(AppState)
  initialState?: AppState;
}

export class UpdateApplicationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  jobTitle?: string;

  @IsOptional()
  @IsString()
  jobReqUrl?: string;

  @IsOptional()
  @IsString()
  jobDescriptionMd?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(WorkLocationType)
  workLocation?: WorkLocationType;

  @IsOptional()
  @IsDateString()
  appliedAt?: string;
}

export class MoveApplicationDto {
  @IsEnum(AppState)
  toState: AppState;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateTransitionDto {
  @IsOptional()
  @IsDateString()
  transitionedAt?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

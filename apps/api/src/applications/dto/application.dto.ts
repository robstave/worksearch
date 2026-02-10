import { IsString, IsOptional, IsEnum, MinLength, IsArray, IsDateString, IsBoolean } from 'class-validator';

export enum AppState {
  INTERESTED = 'INTERESTED',
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  INTERVIEW = 'INTERVIEW',
  INTERVIEW_2 = 'INTERVIEW_2',
  INTERVIEW_3 = 'INTERVIEW_3',
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
  @IsBoolean()
  easyApply?: boolean;

  @IsOptional()
  @IsBoolean()
  coverLetter?: boolean;

  @IsOptional()
  @IsEnum(AppState)
  initialState?: AppState;

  @IsOptional()
  @IsDateString()
  appliedAt?: string;
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
  @IsBoolean()
  easyApply?: boolean;

  @IsOptional()
  @IsBoolean()
  coverLetter?: boolean;

  @IsOptional()
  @IsBoolean()
  hot?: boolean;

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

  @IsOptional()
  @IsDateString()
  transitionedAt?: string;
}

export class UpdateTransitionDto {
  @IsOptional()
  @IsDateString()
  transitionedAt?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

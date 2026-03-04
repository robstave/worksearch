import { IsString, IsOptional, IsEnum, IsBoolean, MinLength, IsDateString } from 'class-validator';

export enum CalendarEventType {
  SCREENING = 'SCREENING',
  INTERVIEW = 'INTERVIEW',
  TECH_SCREENING = 'TECH_SCREENING',
  TODO = 'TODO',
  MEETUP = 'MEETUP',
  FOLLOWUP = 'FOLLOWUP',
  CALL = 'CALL',
  DEADLINE = 'DEADLINE',
  NONE = 'NONE',
  OTHER = 'OTHER',
}

export class CreateEventDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsEnum(CalendarEventType)
  type?: CalendarEventType;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsString()
  notesMd?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  applicationId?: string;

  @IsOptional()
  @IsBoolean()
  confirmed?: boolean;

  @IsOptional()
  @IsBoolean()
  createFollowUp?: boolean;

  @IsOptional()
  @IsDateString()
  followUpAt?: string;
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsEnum(CalendarEventType)
  type?: CalendarEventType;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  notesMd?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  applicationId?: string;

  @IsOptional()
  @IsBoolean()
  confirmed?: boolean;

  @IsOptional()
  @IsBoolean()
  createFollowUp?: boolean;

  @IsOptional()
  @IsDateString()
  followUpAt?: string;
}

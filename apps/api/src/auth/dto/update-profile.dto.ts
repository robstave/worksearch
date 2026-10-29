import { IsOptional, IsTimeZone } from 'class-validator';

export class UpdateProfileDto {
  @IsTimeZone()
  @IsOptional()
  timezone?: string;
}

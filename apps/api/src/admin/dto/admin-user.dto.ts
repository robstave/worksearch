import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export enum RoleDto {
  admin = 'admin',
  aiuser = 'aiuser',
  user = 'user',
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(RoleDto)
  @IsOptional()
  role?: RoleDto = RoleDto.user;
}

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(RoleDto)
  @IsOptional()
  role?: RoleDto;
}

export class SetPasswordDto {
  @IsString()
  @MinLength(6)
  password: string;
}

export class UserResponseDto {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

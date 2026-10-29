import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ) {
    const user = await this.authService.validateUser(dto);

    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
    
    // Store user ID in session
    (req.session as any).userId = user.id;

    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
    
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      timezone: user.timezone,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      await new Promise<void>((resolve, reject) => {
        req.session.destroy((err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });

      res.clearCookie('connect.sid');
      res.status(HttpStatus.NO_CONTENT).send();
      return;
    } catch (error) {
      throw new InternalServerErrorException('Failed to logout');
    }
  }

  @Get('me')
  async me(@Req() req: Request) {
    const userId = (req.session as any).userId;
    
    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    const user = await this.authService.getUserById(userId);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      timezone: user.timezone,
    };
  }

  @Patch('profile')
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const userId = (req.session as any).userId;
    
    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    const user = await this.authService.updateProfile(userId, dto);
    
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      timezone: user.timezone,
    };
  }
}

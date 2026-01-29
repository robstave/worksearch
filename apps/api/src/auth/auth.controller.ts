import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

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
    
    // Store user ID in session
    (req.session as any).userId = user.id;
    
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res() res: Response) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
    });
    res.clearCookie('connect.sid');
    res.send();
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
    };
  }
}

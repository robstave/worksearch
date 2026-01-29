import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { CreateUserDto, UpdateUserDto, SetPasswordDto } from './dto/admin-user.dto';

@Controller('admin/users')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async findAll() {
    return this.adminService.findAllUsers();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.adminService.findUserById(id);
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Post(':id/set-password')
  @HttpCode(HttpStatus.OK)
  async setPassword(@Param('id') id: string, @Body() dto: SetPasswordDto) {
    return this.adminService.setPassword(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Req() req: Request) {
    const actorId = (req.session as any).userId;
    return this.adminService.deleteUser(id, actorId);
  }

  @Post(':id/clear-data')
  @HttpCode(HttpStatus.OK)
  async clearData(@Param('id') id: string) {
    return this.adminService.clearUserData(id);
  }
}

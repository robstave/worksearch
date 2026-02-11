import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, UpdateUserDto, SetPasswordDto } from './dto/admin-user.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            companies: true,
            applications: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      timezone: u.timezone,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      companiesCount: u._count.companies,
      applicationsCount: u._count.applications,
    }));
  }

  async findUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            companies: true,
            applications: true,
            jobBoards: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      timezone: user.timezone,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      companiesCount: user._count.companies,
      applicationsCount: user._count.applications,
      jobBoardsCount: user._count.jobBoards,
    };
  }

  async createUser(dto: CreateUserDto) {
    // Check for duplicate email
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role ?? 'user',
      },
      select: {
        id: true,
        email: true,
        role: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      timezone: user.timezone,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check for duplicate email if changing
    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existing) {
        throw new ConflictException('User with this email already exists');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      timezone: updated.timezone,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async setPassword(id: string, dto: SetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { message: 'Password updated successfully' };
  }

  async deleteUser(id: string, actorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent self-deletion
    if (id === actorId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    // Cascading delete handled by Prisma schema (onDelete: Cascade)
    await this.prisma.user.delete({ where: { id } });

    return { message: 'User and all associated data deleted' };
  }

  async clearUserData(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete all user's data but keep the user account
    await this.prisma.$transaction([
      this.prisma.application.deleteMany({ where: { ownerId: id } }),
      this.prisma.company.deleteMany({ where: { ownerId: id } }),
      this.prisma.jobBoard.deleteMany({ where: { ownerId: id } }),
      this.prisma.companyTag.deleteMany({ where: { ownerId: id } }),
      this.prisma.applicationTag.deleteMany({ where: { ownerId: id } }),
    ]);

    return { message: 'All user data cleared successfully' };
  }
}

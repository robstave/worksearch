import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobBoardDto, UpdateJobBoardDto } from './dto/job-board.dto';

@Injectable()
export class JobBoardsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    ownerId: string,
    search?: string,
    sort: 'name' | 'updatedAt' = 'name',
    order: 'asc' | 'desc' = 'asc',
  ) {
    const where: any = { ownerId };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const jobBoards = await this.prisma.jobBoard.findMany({
      where,
      orderBy: { [sort]: order },
    });

    return {
      items: jobBoards.map((jb) => ({
        id: jb.id,
        name: jb.name,
        link: jb.link,
        notesMd: jb.notesMd,
        createdAt: jb.createdAt.toISOString(),
        updatedAt: jb.updatedAt.toISOString(),
      })),
    };
  }

  async findOne(id: string, ownerId: string) {
    const jobBoard = await this.prisma.jobBoard.findFirst({
      where: { id, ownerId },
    });

    if (!jobBoard) {
      throw new NotFoundException('Job board not found');
    }

    return {
      id: jobBoard.id,
      name: jobBoard.name,
      link: jobBoard.link,
      notesMd: jobBoard.notesMd,
      createdAt: jobBoard.createdAt.toISOString(),
      updatedAt: jobBoard.updatedAt.toISOString(),
    };
  }

  async create(ownerId: string, dto: CreateJobBoardDto) {
    const jobBoard = await this.prisma.jobBoard.create({
      data: {
        ownerId,
        name: dto.name,
        link: dto.link ?? null,
        notesMd: dto.notesMd ?? '',
      },
    });

    return {
      id: jobBoard.id,
      name: jobBoard.name,
      link: jobBoard.link,
      notesMd: jobBoard.notesMd,
      createdAt: jobBoard.createdAt.toISOString(),
      updatedAt: jobBoard.updatedAt.toISOString(),
    };
  }

  async update(id: string, ownerId: string, dto: UpdateJobBoardDto) {
    const jobBoard = await this.prisma.jobBoard.findFirst({
      where: { id, ownerId },
    });

    if (!jobBoard) {
      throw new NotFoundException('Job board not found');
    }

    const updated = await this.prisma.jobBoard.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.link !== undefined && { link: dto.link || null }),
        ...(dto.notesMd !== undefined && { notesMd: dto.notesMd }),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      link: updated.link,
      notesMd: updated.notesMd,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async remove(id: string, ownerId: string) {
    const jobBoard = await this.prisma.jobBoard.findFirst({
      where: { id, ownerId },
    });

    if (!jobBoard) {
      throw new NotFoundException('Job board not found');
    }

    await this.prisma.jobBoard.delete({ where: { id } });
  }
}

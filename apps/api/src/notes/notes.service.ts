import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    ownerId: string,
    search?: string,
    sort: 'name' | 'updatedAt' = 'name',
    order: 'asc' | 'desc' = 'asc',
  ) {
    const where: { ownerId: string; name?: { contains: string; mode: 'insensitive' } } = { ownerId };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const notes = await this.prisma.note.findMany({
      where,
      orderBy: { [sort === 'updatedAt' ? 'updatedAt' : 'name']: order === 'desc' ? 'desc' : 'asc' },
    });

    return {
      items: notes.map((jb) => ({
        id: jb.id,
        name: jb.name,
        value: jb.value,
        notesMd: jb.notesMd,
        createdAt: jb.createdAt.toISOString(),
        updatedAt: jb.updatedAt.toISOString(),
      })),
    };
  }

  async findOne(id: string, ownerId: string) {
    const note = await this.prisma.note.findFirst({
      where: { id, ownerId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return {
      id: note.id,
      name: note.name,
      value: note.value,
      notesMd: note.notesMd,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    };
  }

  async create(ownerId: string, dto: CreateNoteDto) {
    const note = await this.prisma.note.create({
      data: {
        ownerId,
        name: dto.name,
        value: dto.value ?? null,
        notesMd: dto.notesMd ?? '',
      },
    });

    return {
      id: note.id,
      name: note.name,
      value: note.value,
      notesMd: note.notesMd,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    };
  }

  async update(id: string, ownerId: string, dto: UpdateNoteDto) {
    const note = await this.prisma.note.findFirst({
      where: { id, ownerId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    const updated = await this.prisma.note.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.value !== undefined && { value: dto.value || null }),
        ...(dto.notesMd !== undefined && { notesMd: dto.notesMd }),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      value: updated.value,
      notesMd: updated.notesMd,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async remove(id: string, ownerId: string) {
    const note = await this.prisma.note.findFirst({
      where: { id, ownerId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    await this.prisma.note.delete({ where: { id } });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    ownerId: string,
    options: {
      from?: string;
      to?: string;
      companyId?: string;
      applicationId?: string;
      type?: string;
    } = {},
  ) {
    const where: any = { ownerId };

    if (options.from || options.to) {
      where.scheduledAt = {};
      if (options.from) where.scheduledAt.gte = new Date(options.from);
      if (options.to) where.scheduledAt.lte = new Date(options.to);
    }

    if (options.companyId) {
      where.companyId = options.companyId;
    }

    if (options.applicationId) {
      where.applicationId = options.applicationId;
    }

    if (options.type) {
      where.type = options.type;
    }

    const events = await this.prisma.event.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        application: {
          select: {
            id: true,
            jobTitle: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return {
      items: events.map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type,
        scheduledAt: e.scheduledAt.toISOString(),
        notesMd: e.notesMd,
        companyId: e.companyId,
        applicationId: e.applicationId,
        company: e.company
          ? { id: e.company.id, name: e.company.name }
          : e.application?.company
            ? { id: e.application.company.id, name: e.application.company.name }
            : null,
        application: e.application
          ? { id: e.application.id, jobTitle: e.application.jobTitle }
          : null,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
    };
  }

  async findOne(id: string, ownerId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, ownerId },
      include: {
        company: { select: { id: true, name: true } },
        application: {
          select: {
            id: true,
            jobTitle: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return {
      id: event.id,
      title: event.title,
      type: event.type,
      scheduledAt: event.scheduledAt.toISOString(),
      notesMd: event.notesMd,
      companyId: event.companyId,
      applicationId: event.applicationId,
      company: event.company
        ? { id: event.company.id, name: event.company.name }
        : event.application?.company
          ? { id: event.application.company.id, name: event.application.company.name }
          : null,
      application: event.application
        ? { id: event.application.id, jobTitle: event.application.jobTitle }
        : null,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }

  async create(ownerId: string, dto: CreateEventDto) {
    // If applicationId is provided, verify ownership and auto-fill companyId
    let companyId = dto.companyId || null;

    if (dto.applicationId) {
      const app = await this.prisma.application.findFirst({
        where: { id: dto.applicationId, ownerId },
      });
      if (!app) {
        throw new NotFoundException('Application not found');
      }
      // Auto-associate the company from the application
      companyId = app.companyId;
    }

    // If companyId is provided (without application), verify ownership
    if (companyId && !dto.applicationId) {
      const company = await this.prisma.company.findFirst({
        where: { id: companyId, ownerId },
      });
      if (!company) {
        throw new NotFoundException('Company not found');
      }
    }

    const event = await this.prisma.event.create({
      data: {
        ownerId,
        title: dto.title,
        type: (dto.type as any) || 'NONE',
        scheduledAt: new Date(dto.scheduledAt),
        notesMd: dto.notesMd || '',
        companyId: companyId,
        applicationId: dto.applicationId || null,
      },
      include: {
        company: { select: { id: true, name: true } },
        application: {
          select: {
            id: true,
            jobTitle: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
    });

    return {
      id: event.id,
      title: event.title,
      type: event.type,
      scheduledAt: event.scheduledAt.toISOString(),
      notesMd: event.notesMd,
      companyId: event.companyId,
      applicationId: event.applicationId,
      company: event.company
        ? { id: event.company.id, name: event.company.name }
        : event.application?.company
          ? { id: event.application.company.id, name: event.application.company.name }
          : null,
      application: event.application
        ? { id: event.application.id, jobTitle: event.application.jobTitle }
        : null,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }

  async update(id: string, ownerId: string, dto: UpdateEventDto) {
    const existing = await this.prisma.event.findFirst({
      where: { id, ownerId },
    });

    if (!existing) {
      throw new NotFoundException('Event not found');
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.scheduledAt !== undefined) data.scheduledAt = new Date(dto.scheduledAt);
    if (dto.notesMd !== undefined) data.notesMd = dto.notesMd;
    if (dto.companyId !== undefined) data.companyId = dto.companyId || null;
    if (dto.applicationId !== undefined) data.applicationId = dto.applicationId || null;

    const event = await this.prisma.event.update({
      where: { id },
      data,
      include: {
        company: { select: { id: true, name: true } },
        application: {
          select: {
            id: true,
            jobTitle: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
    });

    return {
      id: event.id,
      title: event.title,
      type: event.type,
      scheduledAt: event.scheduledAt.toISOString(),
      notesMd: event.notesMd,
      companyId: event.companyId,
      applicationId: event.applicationId,
      company: event.company
        ? { id: event.company.id, name: event.company.name }
        : event.application?.company
          ? { id: event.application.company.id, name: event.application.company.name }
          : null,
      application: event.application
        ? { id: event.application.id, jobTitle: event.application.jobTitle }
        : null,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }

  async remove(id: string, ownerId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, ownerId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.prisma.event.delete({ where: { id } });
  }
}

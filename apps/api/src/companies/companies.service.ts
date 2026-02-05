import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CreateCompanyVisitDto,
} from './dto/company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    ownerId: string,
    search?: string,
    tag?: string,
    filter?: 'star' | 'revisit' | 'all',
    sort: 'name' | 'applicationCount' | 'createdAt' | 'star' | 'revisit' = 'name',
    order: 'asc' | 'desc' = 'asc',
    page = 1,
    limit = 20,
  ) {
    const where: any = { ownerId };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (tag) {
      where.tags = {
        some: {
          tag: { name: tag },
        },
      };
    }

    if (filter === 'star') {
      where.star = true;
    } else if (filter === 'revisit') {
      where.revisit = true;
    }

    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        include: {
          tags: {
            include: { tag: true },
          },
          _count: {
            select: { apps: true },
          },
        },
        orderBy: sort === 'applicationCount' 
          ? { apps: { _count: order } }
          : sort === 'createdAt'
            ? { createdAt: order }
            : sort === 'star'
              ? { star: order }
              : sort === 'revisit'
                ? { revisit: order }
                : { name: order },
        skip,
        take: limit,
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      items: companies.map((c) => ({
        id: c.id,
        name: c.name,
        website: c.website,
        notesMd: c.notesMd,
        star: c.star,
        revisit: c.revisit,
        tags: c.tags.map((t) => t.tag.name),
        applicationCount: c._count.apps,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, ownerId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, ownerId },
      include: {
        tags: {
          include: { tag: true },
        },
        apps: {
          select: {
            id: true,
            jobTitle: true,
            currentState: true,
            transitions: {
              orderBy: { transitionedAt: 'desc' },
              take: 1,
              select: { transitionedAt: true },
            },
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return {
      id: company.id,
      name: company.name,
      website: company.website,
      notesMd: company.notesMd,
      star: company.star,
      revisit: company.revisit,
      tags: company.tags.map((t) => t.tag.name),
      applications: company.apps.map((a) => ({
        id: a.id,
        jobTitle: a.jobTitle,
        currentState: a.currentState,
        lastTransitionAt: a.transitions[0]?.transitionedAt?.toISOString() ?? null,
      })),
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
    };
  }

  async create(ownerId: string, dto: CreateCompanyDto) {
    // Check for duplicate name
    const existing = await this.prisma.company.findFirst({
      where: { ownerId, name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Company with this name already exists');
    }

    const company = await this.prisma.company.create({
      data: {
        ownerId,
        name: dto.name,
        website: dto.website ?? null,
        notesMd: dto.notesMd ?? '',
        star: dto.star ?? false,
        revisit: dto.revisit ?? false,
      },
    });

    return {
      id: company.id,
      name: company.name,
      website: company.website,
      notesMd: company.notesMd,
      star: company.star,
      revisit: company.revisit,
      createdAt: company.createdAt.toISOString(),
    };
  }

  async update(id: string, ownerId: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findFirst({
      where: { id, ownerId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check for duplicate name if name is being changed
    if (dto.name && dto.name !== company.name) {
      const existing = await this.prisma.company.findFirst({
        where: { ownerId, name: dto.name, NOT: { id } },
      });

      if (existing) {
        throw new ConflictException('Company with this name already exists');
      }
    }

    const updated = await this.prisma.company.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.notesMd !== undefined && { notesMd: dto.notesMd }),
        ...(dto.star !== undefined && { star: dto.star }),
        ...(dto.revisit !== undefined && { revisit: dto.revisit }),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      website: updated.website,
      notesMd: updated.notesMd,
      star: updated.star,
      revisit: updated.revisit,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async remove(id: string, ownerId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, ownerId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.prisma.company.delete({ where: { id } });
  }

  async getVisits(companyId: string, ownerId: string) {
    // Verify ownership
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, ownerId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const visits = await this.prisma.companyVisit.findMany({
      where: { companyId },
      orderBy: { visitedAt: 'desc' },
    });

    return visits.map((v) => ({
      id: v.id,
      visitedAt: v.visitedAt.toISOString(),
      note: v.note,
      status: v.status,
    }));
  }

  async createVisit(
    companyId: string,
    ownerId: string,
    dto: CreateCompanyVisitDto,
  ) {
    // Verify ownership
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, ownerId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const visit = await this.prisma.companyVisit.create({
      data: {
        companyId,
        note: dto.note ?? null,
        status: dto.status ?? null,
      },
    });

    return {
      id: visit.id,
      visitedAt: visit.visitedAt.toISOString(),
      note: visit.note,
      status: visit.status,
    };
  }
}

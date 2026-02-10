import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppState as PrismaAppState } from '@prisma/client';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
  MoveApplicationDto,
  UpdateTransitionDto,
  AppState,
} from './dto/application.dto';

// State machine: allowed transitions
const ALLOWED_TRANSITIONS: Record<AppState, AppState[]> = {
  [AppState.INTERESTED]: [AppState.APPLIED, AppState.TRASH],
  [AppState.APPLIED]: [AppState.SCREENING, AppState.REJECTED, AppState.GHOSTED, AppState.TRASH],
  [AppState.SCREENING]: [AppState.INTERVIEW, AppState.REJECTED, AppState.GHOSTED, AppState.TRASH],
  [AppState.INTERVIEW]: [AppState.INTERVIEW_2, AppState.OFFER, AppState.REJECTED, AppState.GHOSTED, AppState.TRASH],
  [AppState.INTERVIEW_2]: [AppState.INTERVIEW_3, AppState.OFFER, AppState.REJECTED, AppState.GHOSTED, AppState.TRASH],
  [AppState.INTERVIEW_3]: [AppState.OFFER, AppState.REJECTED, AppState.GHOSTED, AppState.TRASH],
  [AppState.OFFER]: [AppState.ACCEPTED, AppState.DECLINED, AppState.REJECTED, AppState.GHOSTED],
  [AppState.ACCEPTED]: [], // terminal
  [AppState.DECLINED]: [], // terminal
  [AppState.REJECTED]: [], // terminal
  [AppState.GHOSTED]: [], // terminal
  [AppState.TRASH]: [], // terminal
};

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    ownerId: string,
    options: {
      state?: AppState;
      companyId?: string;
      tag?: string;
      search?: string;
      appliedDate?: string; // YYYY-MM-DD format
      sort?: 'updatedAt' | 'company' | 'ageInState' | 'appliedAt' | 'jobTitle' | 'state' | 'workLocation' | 'hot';
      order?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { state, companyId, tag, search, appliedDate, sort = 'updatedAt', order = 'desc', page = 1, limit = 20 } = options;

    const where: any = { ownerId };

    if (state) {
      where.currentState = state;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (tag) {
      where.tags = {
        some: {
          tag: { name: tag },
        },
      };
    }

    if (search) {
      where.OR = [
        { jobTitle: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (appliedDate) {
      // Filter for applications applied on this specific date
      const startOfDay = new Date(appliedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(appliedDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.appliedAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    let orderBy: any = { updatedAt: order };
    if (sort === 'company') {
      orderBy = { company: { name: order } };
    } else if (sort === 'appliedAt') {
      orderBy = { appliedAt: order };
    } else if (sort === 'jobTitle') {
      orderBy = { jobTitle: order };
    } else if (sort === 'state') {
      orderBy = { currentState: order };
    } else if (sort === 'workLocation') {
      orderBy = { workLocation: order };
    } else if (sort === 'updatedAt') {
      orderBy = { updatedAt: order };
    } else if (sort === 'hot') {
      // Sort by hot (true first) then by hotDate (most recent first)
      orderBy = [{ hot: 'desc' }, { hotDate: 'desc' }];
    }

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          transitions: {
            orderBy: { transitionedAt: 'desc' },
            take: 1,
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      items: applications.map((a) => ({
        id: a.id,
        company: { id: a.company.id, name: a.company.name },
        jobTitle: a.jobTitle,
        jobReqUrl: a.jobReqUrl,
        currentState: a.currentState,
        workLocation: a.workLocation,
        hot: a.hot,
        hotDate: a.hotDate?.toISOString() ?? null,
        tags: a.tagsList,
        lastTransitionAt: a.transitions[0]?.transitionedAt?.toISOString() ?? null,
        appliedAt: a.appliedAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, ownerId: string) {
    const app = await this.prisma.application.findFirst({
      where: { id, ownerId },
      include: {
        company: { select: { id: true, name: true } },
        transitions: {
          orderBy: { transitionedAt: 'desc' },
        },
        applicationEvents: {
          orderBy: { at: 'asc' },
        },
      },
    });

    if (!app) {
      throw new NotFoundException('Application not found');
    }

    return {
      id: app.id,
      company: { id: app.company.id, name: app.company.name },
      jobTitle: app.jobTitle,
      jobReqUrl: app.jobReqUrl,
      jobDescriptionMd: app.jobDescriptionMd,
      currentState: app.currentState,
      workLocation: app.workLocation,
      easyApply: app.easyApply,
      coverLetter: app.coverLetter,
      hot: app.hot,
      hotDate: app.hotDate?.toISOString() ?? null,
      tags: app.tagsList,
      transitions: app.transitions.map((t) => ({
        id: t.id,
        fromState: t.fromState,
        toState: t.toState,
        transitionedAt: t.transitionedAt.toISOString(),
        note: t.note,
      })),
      events: app.applicationEvents.map((e) => ({
        id: e.id,
        type: e.type,
        at: e.at.toISOString(),
        note: e.note,
      })),
      appliedAt: app.appliedAt?.toISOString() ?? null,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    };
  }

  async create(ownerId: string, dto: CreateApplicationDto) {
    // Verify company exists and belongs to user
    const company = await this.prisma.company.findFirst({
      where: { id: dto.companyId, ownerId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const initialState = dto.initialState || AppState.INTERESTED;

    // Determine appliedAt: use provided date if given, else set to today if initialState is APPLIED, else null
    let appliedAt: Date | null = null;
    if (dto.appliedAt) {
      appliedAt = new Date(dto.appliedAt);
    } else if (initialState === AppState.APPLIED) {
      appliedAt = new Date();
    }

    const app = await this.prisma.application.create({
      data: {
        ownerId,
        companyId: dto.companyId,
        jobTitle: dto.jobTitle,
        jobReqUrl: dto.jobReqUrl ?? null,
        workLocation: dto.workLocation ?? null,
        easyApply: dto.easyApply ?? false,
        coverLetter: dto.coverLetter ?? false,
        jobDescriptionMd: dto.jobDescriptionMd ?? '',
        currentState: initialState as PrismaAppState,
        appliedAt,
        transitions: {
          create: {
            fromState: null,
            toState: initialState as PrismaAppState,
            actorUserId: ownerId,
          },
        },
      },
      include: {
        company: { select: { id: true, name: true } },
      },
    });

    return {
      id: app.id,
      company: { id: app.company.id, name: app.company.name },
      jobTitle: app.jobTitle,
      jobReqUrl: app.jobReqUrl,
      jobDescriptionMd: app.jobDescriptionMd,
      currentState: app.currentState,
      workLocation: app.workLocation,
      tags: app.tagsList,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    };
  }

  async update(id: string, ownerId: string, dto: UpdateApplicationDto) {
    const app = await this.prisma.application.findFirst({
      where: { id, ownerId },
    });

    if (!app) {
      throw new NotFoundException('Application not found');
    }

    // Handle hot toggle: set hotDate when turning on, clear it when turning off
    let hotUpdate = {};
    if (dto.hot !== undefined) {
      if (dto.hot && !app.hot) {
        // Turning hot ON: set date
        hotUpdate = { hot: true, hotDate: new Date() };
      } else if (!dto.hot && app.hot) {
        // Turning hot OFF: clear date
        hotUpdate = { hot: false, hotDate: null };
      }
    }

    const updated = await this.prisma.application.update({
      where: { id },
      data: {
        ...(dto.jobTitle !== undefined && { jobTitle: dto.jobTitle }),
        ...(dto.jobReqUrl !== undefined && { jobReqUrl: dto.jobReqUrl }),
        ...(dto.jobDescriptionMd !== undefined && { jobDescriptionMd: dto.jobDescriptionMd }),
        ...(dto.tags !== undefined && { tagsList: dto.tags }),
        ...(dto.workLocation !== undefined && { workLocation: dto.workLocation }),
        ...(dto.easyApply !== undefined && { easyApply: dto.easyApply }),
        ...(dto.coverLetter !== undefined && { coverLetter: dto.coverLetter }),
        ...(dto.appliedAt !== undefined && { appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : null }),
        ...hotUpdate,
      },
      include: {
        company: { select: { id: true, name: true } },
      },
    });

    return {
      id: updated.id,
      company: { id: updated.company.id, name: updated.company.name },
      jobTitle: updated.jobTitle,
      jobReqUrl: updated.jobReqUrl,
      currentState: updated.currentState,
      workLocation: updated.workLocation,
      hot: updated.hot,
      hotDate: updated.hotDate?.toISOString() ?? null,
      tags: updated.tagsList,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async move(id: string, ownerId: string, dto: MoveApplicationDto) {
    const app = await this.prisma.application.findFirst({
      where: { id, ownerId },
    });

    if (!app) {
      throw new NotFoundException('Application not found');
    }

    const currentState = app.currentState as AppState;
    const toState = dto.toState;

    // Check if transition is allowed
    const allowedNextStates = ALLOWED_TRANSITIONS[currentState];
    if (!allowedNextStates.includes(toState)) {
      throw new ConflictException(
        `Cannot transition from ${currentState} to ${toState}. Allowed: ${allowedNextStates.join(', ') || 'none (terminal state)'}`,
      );
    }

    // Create transition and update state
    const transition = await this.prisma.stateTransition.create({
      data: {
        applicationId: id,
        fromState: currentState as PrismaAppState,
        toState: toState as PrismaAppState,
        note: dto.note ?? null,
        actorUserId: ownerId,
      },
    });

    await this.prisma.application.update({
      where: { id },
      data: {
        currentState: toState as PrismaAppState,
        // Set appliedAt when transitioning to APPLIED (only if not already set)
        ...(toState === 'APPLIED' && !app.appliedAt && { appliedAt: new Date() }),
      },
    });

    return {
      applicationId: id,
      fromState: currentState,
      toState: toState,
      transitionedAt: transition.transitionedAt.toISOString(),
    };
  }

  async updateTransition(
    transitionId: string,
    ownerId: string,
    dto: { transitionedAt?: string; note?: string },
  ) {
    // Verify the transition exists and belongs to this user's application
    const transition = await this.prisma.stateTransition.findFirst({
      where: {
        id: transitionId,
        application: { ownerId },
      },
    });

    if (!transition) {
      throw new NotFoundException('Transition not found');
    }

    return this.prisma.stateTransition.update({
      where: { id: transitionId },
      data: {
        ...(dto.transitionedAt && { transitionedAt: new Date(dto.transitionedAt) }),
        ...(dto.note !== undefined && { note: dto.note || null }),
      },
    });
  }

  async remove(id: string, ownerId: string) {
    const app = await this.prisma.application.findFirst({
      where: { id, ownerId },
    });

    if (!app) {
      throw new NotFoundException('Application not found');
    }

    await this.prisma.application.delete({ where: { id } });
  }

  async getSankeyData(ownerId: string) {
    // Get all transitions for this user
    const transitions = await this.prisma.stateTransition.findMany({
      where: {
        application: { ownerId },
      },
      select: {
        fromState: true,
        toState: true,
      },
    });

    // Also include applications that never transitioned (stuck in INTERESTED)
    const applications = await this.prisma.application.findMany({
      where: { ownerId },
      select: {
        currentState: true,
        transitions: { select: { id: true } },
      },
    });

    // Count transitions
    const transitionCounts = new Map<string, number>();

    // Add explicit transitions
    for (const t of transitions) {
      const key = `${t.fromState || 'START'}->${t.toState}`;
      transitionCounts.set(key, (transitionCounts.get(key) || 0) + 1);
    }

    // Add implicit "START" transitions for apps with no transitions
    for (const app of applications) {
      if (app.transitions.length === 0) {
        const key = `START->${app.currentState}`;
        transitionCounts.set(key, (transitionCounts.get(key) || 0) + 1);
      }
    }

    // Build nodes and links
    const nodeSet = new Set<string>();
    const links: Array<{ source: string; target: string; value: number }> = [];

    for (const [key, count] of transitionCounts.entries()) {
      const [source, target] = key.split('->');
      nodeSet.add(source);
      nodeSet.add(target);
      links.push({ source, target, value: count });
    }

    const nodes = Array.from(nodeSet).map((name) => ({ name }));
    const nodeIndexMap = new Map(nodes.map((n, i) => [n.name, i]));

    const indexedLinks = links.map((link) => ({
      source: nodeIndexMap.get(link.source)!,
      target: nodeIndexMap.get(link.target)!,
      value: link.value,
    }));

    return {
      nodes,
      links: indexedLinks,
    };
  }

  async getDashboardStats(ownerId: string) {
    // Count applications that ever reached APPLIED (check transitions where toState = APPLIED)
    const appliedCount = await this.prisma.application.count({
      where: {
        ownerId,
        OR: [
          { currentState: 'APPLIED' },
          {
            transitions: {
              some: { toState: 'APPLIED' },
            },
          },
        ],
      },
    });

    // Count applications that ever reached SCREENING or beyond (interview process started)
    const interviewedCount = await this.prisma.application.count({
      where: {
        ownerId,
        OR: [
          { currentState: { in: ['SCREENING', 'INTERVIEW', 'OFFER', 'ACCEPTED', 'DECLINED'] } },
          {
            transitions: {
              some: { toState: { in: ['SCREENING', 'INTERVIEW', 'OFFER', 'ACCEPTED', 'DECLINED'] } },
            },
          },
        ],
      },
    });

    // Count applications currently in terminal "passed on" states
    const passedOnCount = await this.prisma.application.count({
      where: {
        ownerId,
        currentState: { in: ['REJECTED', 'GHOSTED', 'DECLINED'] },
      },
    });

    return {
      applied: appliedCount,
      interviewed: interviewedCount,
      passedOn: passedOnCount,
    };
  }

  async getDailyTimeline(ownerId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    // Get applications with appliedAt in the date range
    const applications = await this.prisma.application.findMany({
      where: {
        ownerId,
        appliedAt: { gte: startDate },
      },
      select: {
        appliedAt: true,
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create a map of date -> { count, companies }
    const dataByDate = new Map<string, { count: number; companies: string[] }>();
    
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dataByDate.set(key, { count: 0, companies: [] });
    }

    // Count applications per day by appliedAt and collect company names
    for (const app of applications) {
      if (app.appliedAt) {
        const key = app.appliedAt.toISOString().split('T')[0];
        const data = dataByDate.get(key) || { count: 0, companies: [] };
        data.count += 1;
        data.companies.push(app.company.name);
        dataByDate.set(key, data);
      }
    }

    // Convert to array sorted by date
    const timeline = Array.from(dataByDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({ date, count: data.count, companies: data.companies }));

    return { timeline };
  }

  async cleanHot(ownerId: string) {
    // Un-hot applications where hotDate is older than 1 month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const result = await this.prisma.application.updateMany({
      where: {
        ownerId,
        hot: true,
        hotDate: { lt: oneMonthAgo },
      },
      data: {
        hot: false,
        hotDate: null,
      },
    });

    return { cleaned: result.count };
  }

  async getSwimlaneData(ownerId: string) {
    const applications = await this.prisma.application.findMany({
      where: {
        ownerId,
        // Exclude INTERESTED-only and TRASH
        currentState: { notIn: ['INTERESTED', 'TRASH'] },
        appliedAt: { not: null },
      },
      include: {
        company: { select: { name: true } },
        transitions: {
          orderBy: { transitionedAt: 'asc' },
          select: {
            fromState: true,
            toState: true,
            transitionedAt: true,
          },
        },
      },
      orderBy: { appliedAt: 'asc' },
    });

    return applications.map((app) => ({
      id: app.id,
      company: app.company.name,
      jobTitle: app.jobTitle,
      appliedAt: app.appliedAt!.toISOString(),
      currentState: app.currentState,
      transitions: app.transitions.map((t) => ({
        fromState: t.fromState,
        toState: t.toState,
        date: t.transitionedAt.toISOString(),
      })),
    }));
  }
}

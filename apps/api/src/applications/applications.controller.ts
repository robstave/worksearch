import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApplicationsService } from './applications.service';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
  MoveApplicationDto,
  UpdateTransitionDto,
  AppState,
} from './dto/application.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('applications')
@UseGuards(AuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  async findAll(
    @Req() req: Request,
    @Query('state') state?: AppState,
    @Query('companyId') companyId?: string,
    @Query('tag') tag?: string,
    @Query('search') search?: string,
    @Query('appliedDate') appliedDate?: string,
    @Query('sort') sort?: 'updatedAt' | 'company' | 'ageInState' | 'appliedAt' | 'jobTitle' | 'state' | 'workLocation',
    @Query('order') order?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const ownerId = (req.session as any).userId;
    return this.applicationsService.findAll(ownerId, {
      state,
      companyId,
      tag,
      search,
      appliedDate,
      sort,
      order,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const ownerId = (req.session as any).userId;
    return this.applicationsService.findOne(id, ownerId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request, @Body() dto: CreateApplicationDto) {
    const ownerId = (req.session as any).userId;
    return this.applicationsService.create(ownerId, dto);
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    const ownerId = (req.session as any).userId;
    return this.applicationsService.update(id, ownerId, dto);
  }

  @Post(':id/move')
  async move(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: MoveApplicationDto,
  ) {
    const ownerId = (req.session as any).userId;
    return this.applicationsService.move(id, ownerId, dto);
  }

  @Patch(':id/transitions/:transitionId')
  async updateTransition(
    @Req() req: Request,
    @Param('transitionId') transitionId: string,
    @Body() dto: UpdateTransitionDto,
  ) {
    const ownerId = (req.session as any).userId;
    return this.applicationsService.updateTransition(transitionId, ownerId, dto);
  }

  @Post(':id/reset')
  async reset(@Req() req: Request, @Param('id') id: string) {
    const ownerId = (req.session as any).userId;
    return this.applicationsService.reset(id, ownerId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const ownerId = (req.session as any).userId;
    await this.applicationsService.remove(id, ownerId);
  }

  @Get('analytics/sankey')
  async getSankey(@Req() req: Request) {
    const ownerId = (req.session as any).userId;
    return this.applicationsService.getSankeyData(ownerId);
  }

  @Get('analytics/stats')
  async getStats(@Req() req: Request) {
    const ownerId = (req.session as any).userId;
    return this.applicationsService.getDashboardStats(ownerId);
  }

  @Get('analytics/timeline')
  async getTimeline(@Req() req: Request, @Query('days') days?: string) {
    const ownerId = (req.session as any).userId;
    return this.applicationsService.getDailyTimeline(ownerId, days ? parseInt(days, 10) : undefined);
  }

  @Get('analytics/swimlane')
  async getSwimlane(@Req() req: Request) {
    const ownerId = (req.session as any).userId;
    return this.applicationsService.getSwimlaneData(ownerId);
  }

  @Post('clean-hot')
  async cleanHot(@Req() req: Request) {
    const ownerId = (req.session as any).userId;
    return this.applicationsService.cleanHot(ownerId);
  }
}

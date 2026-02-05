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
import { CompaniesService } from './companies.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CreateCompanyVisitDto,
} from './dto/company.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('companies')
@UseGuards(AuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  async findAll(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('filter') filter?: 'star' | 'revisit' | 'all',
    @Query('sort') sort?: 'name' | 'applicationCount' | 'createdAt' | 'star' | 'revisit',
    @Query('order') order?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const ownerId = (req.session as any).userId;
    return this.companiesService.findAll(
      ownerId,
      search,
      tag,
      filter,
      sort,
      order,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const ownerId = (req.session as any).userId;
    return this.companiesService.findOne(id, ownerId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request, @Body() dto: CreateCompanyDto) {
    const ownerId = (req.session as any).userId;
    return this.companiesService.create(ownerId, dto);
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    const ownerId = (req.session as any).userId;
    return this.companiesService.update(id, ownerId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const ownerId = (req.session as any).userId;
    await this.companiesService.remove(id, ownerId);
  }

  @Get(':id/visits')
  async getVisits(@Req() req: Request, @Param('id') id: string) {
    const ownerId = (req.session as any).userId;
    return this.companiesService.getVisits(id, ownerId);
  }

  @Post(':id/visits')
  @HttpCode(HttpStatus.CREATED)
  async createVisit(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: CreateCompanyVisitDto,
  ) {
    const ownerId = (req.session as any).userId;
    return this.companiesService.createVisit(id, ownerId, dto);
  }
}

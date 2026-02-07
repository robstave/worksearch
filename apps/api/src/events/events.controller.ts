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
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('events')
@UseGuards(AuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async findAll(
    @Req() req: Request,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('companyId') companyId?: string,
    @Query('applicationId') applicationId?: string,
    @Query('type') type?: string,
  ) {
    const ownerId = (req.session as any).userId;
    return this.eventsService.findAll(ownerId, { from, to, companyId, applicationId, type });
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const ownerId = (req.session as any).userId;
    return this.eventsService.findOne(id, ownerId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request, @Body() dto: CreateEventDto) {
    const ownerId = (req.session as any).userId;
    return this.eventsService.create(ownerId, dto);
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    const ownerId = (req.session as any).userId;
    return this.eventsService.update(id, ownerId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const ownerId = (req.session as any).userId;
    await this.eventsService.remove(id, ownerId);
  }
}

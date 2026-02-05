import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JobBoardsService } from './job-boards.service';
import { CreateJobBoardDto, UpdateJobBoardDto } from './dto/job-board.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('job-boards')
@UseGuards(AuthGuard)
export class JobBoardsController {
  constructor(private readonly jobBoardsService: JobBoardsService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('sort') sort?: 'name' | 'updatedAt',
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.jobBoardsService.findAll(req.session.userId, search, sort, order);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.jobBoardsService.findOne(id, req.session.userId);
  }

  @Post()
  create(@Body() dto: CreateJobBoardDto, @Req() req: any) {
    return this.jobBoardsService.create(req.session.userId, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateJobBoardDto,
    @Req() req: any,
  ) {
    return this.jobBoardsService.update(id, req.session.userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.jobBoardsService.remove(id, req.session.userId);
  }
}

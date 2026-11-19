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
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('notes')
@UseGuards(AuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('sort') sort?: 'name' | 'updatedAt',
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.notesService.findAll(req.session.userId, search, sort, order);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.notesService.findOne(id, req.session.userId);
  }

  @Post()
  create(@Body() dto: CreateNoteDto, @Req() req: any) {
    return this.notesService.create(req.session.userId, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
    @Req() req: any,
  ) {
    return this.notesService.update(id, req.session.userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.notesService.remove(id, req.session.userId);
  }
}

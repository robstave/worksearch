import { Module } from '@nestjs/common';
import { JobBoardsController } from './job-boards.controller';
import { JobBoardsService } from './job-boards.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [JobBoardsController],
  providers: [JobBoardsService],
})
export class JobBoardsModule {}

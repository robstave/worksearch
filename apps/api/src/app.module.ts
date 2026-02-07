import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { ApplicationsModule } from './applications/applications.module';
import { JobBoardsModule } from './job-boards/job-boards.module';
import { AdminModule } from './admin/admin.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [PrismaModule, AuthModule, CompaniesModule, ApplicationsModule, JobBoardsModule, AdminModule, EventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

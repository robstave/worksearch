import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth() {
    const userCount = await this.prisma.user.count();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      userCount,
    };
  }
}

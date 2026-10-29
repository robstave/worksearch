import { Test, TestingModule } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { EventsModule } from './events.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';

@Injectable()
class ConsumerAService {
  constructor(public readonly eventsService: EventsService) {}
}

@Injectable()
class ConsumerBService {
  constructor(public readonly eventsService: EventsService) {}
}

describe('EventsModule', () => {
  let moduleRef: TestingModule;
  const mockPrismaService = {};

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      imports: [PrismaModule, EventsModule],
      providers: [ConsumerAService, ConsumerBService],
    });

    moduleBuilder.overrideProvider(PrismaService).useValue(mockPrismaService);

    moduleRef = await moduleBuilder.compile();
  });

  it('registers the EventsController and EventsService', () => {
    const controller = moduleRef.get<EventsController>(EventsController);
    const service = moduleRef.get<EventsService>(EventsService);

    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('exports EventsService so other providers can inject it', () => {
    const service = moduleRef.get<EventsService>(EventsService);
    const consumer = moduleRef.get<ConsumerAService>(ConsumerAService);

    expect(consumer.eventsService).toBe(service);
  });

  it('uses a single shared EventsService instance across controller and consumers', () => {
    const service = moduleRef.get<EventsService>(EventsService);
    const controller = moduleRef.get<EventsController>(EventsController);
    const controllerService = (controller as unknown as { eventsService: EventsService })
      .eventsService;
    const consumerA = moduleRef.get<ConsumerAService>(ConsumerAService);
    const consumerB = moduleRef.get<ConsumerBService>(ConsumerBService);

    expect(controllerService).toBe(service);
    expect(consumerA.eventsService).toBe(service);
    expect(consumerB.eventsService).toBe(service);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppState } from './dto/application.dto';

describe('ApplicationsService', () => {
  let service: ApplicationsService;

  const mockCompany = {
    id: 'company-123',
    name: 'Test Company',
  };

  const mockApplication = {
    id: 'app-123',
    ownerId: 'user-123',
    companyId: 'company-123',
    jobTitle: 'Software Engineer',
    jobReqUrl: 'https://example.com/job',
    jobDescriptionMd: '# Job Description',
    tagsList: ['react', 'typescript'],
    currentState: 'INTERESTED',
    workLocation: 'REMOTE',
    appliedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    company: mockCompany,
    transitions: [],
    applicationEvents: [],
  };

  const mockPrismaService = {
    application: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    company: {
      findFirst: jest.fn(),
    },
    stateTransition: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockTransition = {
    id: 'trans-123',
    fromState: 'INTERESTED',
    toState: 'APPLIED',
    transitionedAt: new Date('2025-01-15'),
    note: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all applications for a user', async () => {
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);
      mockPrismaService.application.count.mockResolvedValue(1);

      const result = await service.findAll('user-123');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].jobTitle).toBe('Software Engineer');
      expect(result.items[0].company.name).toBe('Test Company');
    });

    it('should filter by state', async () => {
      mockPrismaService.application.findMany.mockResolvedValue([]);
      mockPrismaService.application.count.mockResolvedValue(0);

      await service.findAll('user-123', { state: AppState.APPLIED });

      expect(mockPrismaService.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            currentState: 'APPLIED',
          }),
        }),
      );
    });

    it('should filter by search term', async () => {
      mockPrismaService.application.findMany.mockResolvedValue([]);
      mockPrismaService.application.count.mockResolvedValue(0);

      await service.findAll('user-123', { search: 'Engineer' });

      expect(mockPrismaService.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { jobTitle: { contains: 'Engineer', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });
  });

  describe('getBoardData', () => {
    it('should return top applications per state with totals', async () => {
      mockPrismaService.application.findMany.mockResolvedValue([]);
      mockPrismaService.application.count.mockResolvedValue(0);

      const result = await service.getBoardData('user-123', 25);

      expect(result.limitPerState).toBe(25);
      expect(result.columns.INTERESTED).toEqual(
        expect.objectContaining({ total: 0, hasMore: false, items: [] }),
      );
      expect(mockPrismaService.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ownerId: 'user-123', currentState: 'INTERESTED' }),
          take: 25,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an application when found', async () => {
      mockPrismaService.application.findFirst.mockResolvedValue(mockApplication);

      const result = await service.findOne('app-123', 'user-123');

      expect(result.id).toBe('app-123');
      expect(result.jobTitle).toBe('Software Engineer');
    });

    it('should throw NotFoundException when application not found', async () => {
      mockPrismaService.application.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new application', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(mockCompany);
      mockPrismaService.application.create.mockResolvedValue(mockApplication);

      const result = await service.create('user-123', {
        companyId: 'company-123',
        jobTitle: 'Software Engineer',
        jobReqUrl: 'https://example.com/job',
      });

      expect(result.jobTitle).toBe('Software Engineer');
      expect(mockPrismaService.application.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when company not found', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(null);

      await expect(
        service.create('user-123', {
          companyId: 'nonexistent',
          jobTitle: 'Test',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an existing application', async () => {
      mockPrismaService.application.findFirst.mockResolvedValue(mockApplication);
      mockPrismaService.application.update.mockResolvedValue({
        ...mockApplication,
        jobTitle: 'Senior Software Engineer',
      });

      const result = await service.update('app-123', 'user-123', {
        jobTitle: 'Senior Software Engineer',
      });

      expect(result.jobTitle).toBe('Senior Software Engineer');
    });

    it('should throw NotFoundException when application not found', async () => {
      mockPrismaService.application.findFirst.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', 'user-123', { jobTitle: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('move', () => {
    it('should move application to allowed state', async () => {
      mockPrismaService.application.findFirst.mockResolvedValue(mockApplication);
      mockPrismaService.application.update.mockResolvedValue({
        ...mockApplication,
        currentState: 'APPLIED',
        appliedAt: new Date(),
      });
      mockPrismaService.stateTransition.create.mockResolvedValue(mockTransition);

      const result = await service.move('app-123', 'user-123', {
        toState: AppState.APPLIED,
      });

      expect(result.toState).toBe('APPLIED');
    });

    it('should throw NotFoundException when application not found', async () => {
      mockPrismaService.application.findFirst.mockResolvedValue(null);

      await expect(
        service.move('nonexistent', 'user-123', { toState: AppState.APPLIED }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException for invalid state transition', async () => {
      mockPrismaService.application.findFirst.mockResolvedValue({
        ...mockApplication,
        currentState: 'INTERESTED',
      });

      await expect(
        service.move('app-123', 'user-123', { toState: AppState.INTERVIEW }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when moving from terminal state', async () => {
      mockPrismaService.application.findFirst.mockResolvedValue({
        ...mockApplication,
        currentState: 'REJECTED',
      });

      await expect(
        service.move('app-123', 'user-123', { toState: AppState.APPLIED }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete an application', async () => {
      mockPrismaService.application.findFirst.mockResolvedValue(mockApplication);
      mockPrismaService.application.delete.mockResolvedValue(mockApplication);

      await service.remove('app-123', 'user-123');

      expect(mockPrismaService.application.delete).toHaveBeenCalledWith({
        where: { id: 'app-123' },
      });
    });

    it('should throw NotFoundException when application not found', async () => {
      mockPrismaService.application.findFirst.mockResolvedValue(null);

      await expect(service.remove('nonexistent', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CompaniesService', () => {
  let service: CompaniesService;

  const mockCompany = {
    id: 'company-123',
    ownerId: 'user-123',
    name: 'Test Company',
    website: 'https://test.com',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    tags: [],
    _count: { apps: 2 },
  };

  const mockPrismaService = {
    company: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all companies for a user', async () => {
      mockPrismaService.company.findMany.mockResolvedValue([mockCompany]);

      const result = await service.findAll('user-123');

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        id: 'company-123',
        name: 'Test Company',
        website: 'https://test.com',
        tags: [],
        applicationCount: 2,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should filter by search term', async () => {
      mockPrismaService.company.findMany.mockResolvedValue([]);

      await service.findAll('user-123', 'Test');

      expect(mockPrismaService.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'Test', mode: 'insensitive' },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a company when found', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue({
        ...mockCompany,
        apps: [],
      });

      const result = await service.findOne('company-123', 'user-123');

      expect(result.id).toBe('company-123');
      expect(result.name).toBe('Test Company');
    });

    it('should throw NotFoundException when company not found', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new company', async () => {
      mockPrismaService.company.create.mockResolvedValue(mockCompany);

      const result = await service.create('user-123', {
        name: 'Test Company',
        website: 'https://test.com',
      });

      expect(result.name).toBe('Test Company');
      expect(mockPrismaService.company.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerId: 'user-123',
            name: 'Test Company',
            website: 'https://test.com',
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update an existing company', async () => {
      mockPrismaService.company.findFirst
        .mockResolvedValueOnce(mockCompany) // First call: find company
        .mockResolvedValueOnce(null); // Second call: check for duplicate name
      mockPrismaService.company.update.mockResolvedValue({
        ...mockCompany,
        name: 'Updated Company',
      });

      const result = await service.update('company-123', 'user-123', {
        name: 'Updated Company',
      });

      expect(result.name).toBe('Updated Company');
    });

    it('should throw NotFoundException when company not found', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', 'user-123', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when name already exists', async () => {
      mockPrismaService.company.findFirst
        .mockResolvedValueOnce(mockCompany) // First call: find company
        .mockResolvedValueOnce({ id: 'other-123', name: 'Existing Name' }); // Second call: duplicate check

      await expect(
        service.update('company-123', 'user-123', { name: 'Existing Name' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a company', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(mockCompany);
      mockPrismaService.company.delete.mockResolvedValue(mockCompany);

      await service.remove('company-123', 'user-123');

      expect(mockPrismaService.company.delete).toHaveBeenCalledWith({
        where: { id: 'company-123' },
      });
    });

    it('should throw NotFoundException when company not found', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(null);

      await expect(service.remove('nonexistent', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

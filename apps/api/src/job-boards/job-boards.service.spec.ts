import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { JobBoardsService } from './job-boards.service';
import { PrismaService } from '../prisma/prisma.service';

describe('JobBoardsService', () => {
  let service: JobBoardsService;

  const mockJobBoard = {
    id: 'jb-123',
    ownerId: 'user-123',
    name: 'LinkedIn',
    link: 'https://linkedin.com/jobs',
    notesMd: '# Notes\nJob board notes here',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockPrismaService = {
    jobBoard: {
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
        JobBoardsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<JobBoardsService>(JobBoardsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all job boards for a user', async () => {
      mockPrismaService.jobBoard.findMany.mockResolvedValue([mockJobBoard]);

      const result = await service.findAll('user-123');

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        id: 'jb-123',
        name: 'LinkedIn',
        link: 'https://linkedin.com/jobs',
        notesMd: '# Notes\nJob board notes here',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return empty array when no job boards exist', async () => {
      mockPrismaService.jobBoard.findMany.mockResolvedValue([]);

      const result = await service.findAll('user-123');

      expect(result.items).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a job board when found', async () => {
      mockPrismaService.jobBoard.findFirst.mockResolvedValue(mockJobBoard);

      const result = await service.findOne('jb-123', 'user-123');

      expect(result.id).toBe('jb-123');
      expect(result.name).toBe('LinkedIn');
    });

    it('should throw NotFoundException when job board not found', async () => {
      mockPrismaService.jobBoard.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new job board', async () => {
      mockPrismaService.jobBoard.create.mockResolvedValue(mockJobBoard);

      const result = await service.create('user-123', {
        name: 'LinkedIn',
        link: 'https://linkedin.com/jobs',
        notesMd: '# Notes',
      });

      expect(result.name).toBe('LinkedIn');
      expect(mockPrismaService.jobBoard.create).toHaveBeenCalledWith({
        data: {
          ownerId: 'user-123',
          name: 'LinkedIn',
          link: 'https://linkedin.com/jobs',
          notesMd: '# Notes',
        },
      });
    });

    it('should create job board with default empty notes', async () => {
      mockPrismaService.jobBoard.create.mockResolvedValue({
        ...mockJobBoard,
        notesMd: '',
      });

      await service.create('user-123', { name: 'Indeed' });

      expect(mockPrismaService.jobBoard.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          notesMd: '',
        }),
      });
    });
  });

  describe('update', () => {
    it('should update an existing job board', async () => {
      mockPrismaService.jobBoard.findFirst.mockResolvedValue(mockJobBoard);
      mockPrismaService.jobBoard.update.mockResolvedValue({
        ...mockJobBoard,
        name: 'Updated LinkedIn',
      });

      const result = await service.update('jb-123', 'user-123', {
        name: 'Updated LinkedIn',
      });

      expect(result.name).toBe('Updated LinkedIn');
    });

    it('should throw NotFoundException when job board not found', async () => {
      mockPrismaService.jobBoard.findFirst.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', 'user-123', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only provided fields', async () => {
      mockPrismaService.jobBoard.findFirst.mockResolvedValue(mockJobBoard);
      mockPrismaService.jobBoard.update.mockResolvedValue(mockJobBoard);

      await service.update('jb-123', 'user-123', { notesMd: 'New notes' });

      expect(mockPrismaService.jobBoard.update).toHaveBeenCalledWith({
        where: { id: 'jb-123' },
        data: { notesMd: 'New notes' },
      });
    });
  });

  describe('remove', () => {
    it('should delete a job board', async () => {
      mockPrismaService.jobBoard.findFirst.mockResolvedValue(mockJobBoard);
      mockPrismaService.jobBoard.delete.mockResolvedValue(mockJobBoard);

      await service.remove('jb-123', 'user-123');

      expect(mockPrismaService.jobBoard.delete).toHaveBeenCalledWith({
        where: { id: 'jb-123' },
      });
    });

    it('should throw NotFoundException when job board not found', async () => {
      mockPrismaService.jobBoard.findFirst.mockResolvedValue(null);

      await expect(service.remove('nonexistent', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

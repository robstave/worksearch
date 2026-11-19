import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotesService', () => {
  let service: NotesService;

  const mockNote = {
    id: 'note-123',
    ownerId: 'user-123',
    name: 'GitHub',
    value: 'https://github.com/example',
    notesMd: '# Notes\nNote notes here',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockPrismaService = {
    note: {
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
        NotesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    jest.clearAllMocks();
  });

  it('filters search and sorting within the current owner', async () => {
    mockPrismaService.note.findMany.mockResolvedValue([]);
    await service.findAll('owner', 'github', 'updatedAt', 'desc');
    expect(mockPrismaService.note.findMany).toHaveBeenCalledWith({
      where: { ownerId: 'owner', name: { contains: 'github', mode: 'insensitive' } },
      orderBy: { updatedAt: 'desc' },
    });
  });

  it('clears a previously saved value', async () => {
    mockPrismaService.note.findFirst.mockResolvedValue(mockNote);
    mockPrismaService.note.update.mockResolvedValue({ ...mockNote, value: null });
    const result = await service.update('note-123', 'user-123', { value: '' });
    expect(result.value).toBeNull();
    expect(mockPrismaService.note.update).toHaveBeenCalledWith({
      where: { id: 'note-123' }, data: { value: null },
    });
  });

  it('does not read, change, or delete a different owner’s note', async () => {
    mockPrismaService.note.findFirst.mockResolvedValue(null);
    await expect(service.findOne('private', 'other')).rejects.toThrow(NotFoundException);
    await expect(service.update('private', 'other', { value: 'changed' })).rejects.toThrow(NotFoundException);
    await expect(service.remove('private', 'other')).rejects.toThrow(NotFoundException);
    expect(mockPrismaService.note.findFirst).toHaveBeenCalledWith({ where: { id: 'private', ownerId: 'other' } });
    expect(mockPrismaService.note.update).not.toHaveBeenCalled();
    expect(mockPrismaService.note.delete).not.toHaveBeenCalled();
  });

  describe('findAll', () => {
    it('should return all notes for a user', async () => {
      mockPrismaService.note.findMany.mockResolvedValue([mockNote]);

      const result = await service.findAll('user-123');

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        id: 'note-123',
        name: 'GitHub',
        value: 'https://github.com/example',
        notesMd: '# Notes\nNote notes here',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return empty array when no notes exist', async () => {
      mockPrismaService.note.findMany.mockResolvedValue([]);

      const result = await service.findAll('user-123');

      expect(result.items).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a note when found', async () => {
      mockPrismaService.note.findFirst.mockResolvedValue(mockNote);

      const result = await service.findOne('note-123', 'user-123');

      expect(result.id).toBe('note-123');
      expect(result.name).toBe('GitHub');
    });

    it('should throw NotFoundException when note not found', async () => {
      mockPrismaService.note.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new note', async () => {
      mockPrismaService.note.create.mockResolvedValue(mockNote);

      const result = await service.create('user-123', {
        name: 'GitHub',
        value: 'https://github.com/example',
        notesMd: '# Notes',
      });

      expect(result.name).toBe('GitHub');
      expect(mockPrismaService.note.create).toHaveBeenCalledWith({
        data: {
          ownerId: 'user-123',
          name: 'GitHub',
          value: 'https://github.com/example',
          notesMd: '# Notes',
        },
      });
    });

    it('should create note with default empty notes', async () => {
      mockPrismaService.note.create.mockResolvedValue({
        ...mockNote,
        notesMd: '',
      });

      await service.create('user-123', { name: 'Indeed' });

      expect(mockPrismaService.note.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          notesMd: '',
        }),
      });
    });
  });

  describe('update', () => {
    it('should update an existing note', async () => {
      mockPrismaService.note.findFirst.mockResolvedValue(mockNote);
      mockPrismaService.note.update.mockResolvedValue({
        ...mockNote,
        name: 'Updated GitHub',
      });

      const result = await service.update('note-123', 'user-123', {
        name: 'Updated GitHub',
      });

      expect(result.name).toBe('Updated GitHub');
    });

    it('should throw NotFoundException when note not found', async () => {
      mockPrismaService.note.findFirst.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', 'user-123', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only provided fields', async () => {
      mockPrismaService.note.findFirst.mockResolvedValue(mockNote);
      mockPrismaService.note.update.mockResolvedValue(mockNote);

      await service.update('note-123', 'user-123', { notesMd: 'New notes' });

      expect(mockPrismaService.note.update).toHaveBeenCalledWith({
        where: { id: 'note-123' },
        data: { notesMd: 'New notes' },
      });
    });
  });

  describe('remove', () => {
    it('should delete a note', async () => {
      mockPrismaService.note.findFirst.mockResolvedValue(mockNote);
      mockPrismaService.note.delete.mockResolvedValue(mockNote);

      await service.remove('note-123', 'user-123');

      expect(mockPrismaService.note.delete).toHaveBeenCalledWith({
        where: { id: 'note-123' },
      });
    });

    it('should throw NotFoundException when note not found', async () => {
      mockPrismaService.note.findFirst.mockResolvedValue(null);

      await expect(service.remove('nonexistent', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

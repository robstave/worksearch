import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const makeRequest = (userId?: string) => {
  const session = {
    userId,
    regenerate: jest.fn((cb: (err: Error | null) => void) => cb(null)),
    save: jest.fn((cb: (err: Error | null) => void) => cb(null)),
    destroy: jest.fn((cb: (err: Error | null) => void) => cb(null)),
  };

  return { session } as unknown as Request;
};

const makeResponse = () => {
  const response = {
    clearCookie: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  };

  return response as unknown as Response;
};

describe('AuthController', () => {
  let controller: AuthController;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'user',
    timezone: 'UTC',
  };

  const mockAuthService = {
    validateUser: jest.fn(),
    getUserById: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('regenerates and saves session before returning user payload', async () => {
      const req = makeRequest();
      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await controller.login(
        { email: 'test@example.com', password: 'password123' },
        req,
      );

      const session = (req as any).session;

      expect(mockAuthService.validateUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(session.regenerate).toHaveBeenCalledTimes(1);
      expect(session.userId).toBe('user-123');
      expect(session.save).toHaveBeenCalledTimes(1);
      expect(session.regenerate.mock.invocationCallOrder[0]).toBeLessThan(
        session.save.mock.invocationCallOrder[0],
      );
      expect(result).toEqual(mockUser);
    });

    it('propagates session regeneration failures', async () => {
      const req = makeRequest();
      const session = (req as any).session;
      session.regenerate.mockImplementationOnce((cb: (err: Error | null) => void) =>
        cb(new Error('regenerate failed')),
      );
      mockAuthService.validateUser.mockResolvedValue(mockUser);

      await expect(
        controller.login({ email: 'test@example.com', password: 'password123' }, req),
      ).rejects.toThrow('regenerate failed');

      expect(session.save).not.toHaveBeenCalled();
    });

    it('propagates session save failures', async () => {
      const req = makeRequest();
      const session = (req as any).session;
      session.save.mockImplementationOnce((cb: (err: Error | null) => void) =>
        cb(new Error('save failed')),
      );
      mockAuthService.validateUser.mockResolvedValue(mockUser);

      await expect(
        controller.login({ email: 'test@example.com', password: 'password123' }, req),
      ).rejects.toThrow('save failed');
    });
  });

  describe('logout', () => {
    it('destroys session and clears cookie on success', async () => {
      const req = makeRequest('user-123');
      const res = makeResponse();

      await controller.logout(req, res);

      expect((req as any).session.destroy).toHaveBeenCalledTimes(1);
      expect((res as any).clearCookie).toHaveBeenCalledWith('connect.sid');
      expect((res as any).status).toHaveBeenCalledWith(204);
      expect((res as any).send).toHaveBeenCalledTimes(1);
    });

    it('throws InternalServerErrorException when destroy fails', async () => {
      const req = makeRequest('user-123');
      const res = makeResponse();
      (req as any).session.destroy.mockImplementationOnce((cb: (err: Error | null) => void) =>
        cb(new Error('destroy failed')),
      );

      await expect(controller.logout(req, res)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect((res as any).clearCookie).not.toHaveBeenCalled();
    });
  });

  describe('me', () => {
    it('throws UnauthorizedException when not authenticated', async () => {
      const req = makeRequest();

      await expect(controller.me(req)).rejects.toThrow(UnauthorizedException);
      expect(mockAuthService.getUserById).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when user is missing', async () => {
      const req = makeRequest('user-123');
      mockAuthService.getUserById.mockResolvedValue(null);

      await expect(controller.me(req)).rejects.toThrow(UnauthorizedException);
      expect(mockAuthService.getUserById).toHaveBeenCalledWith('user-123');
    });

    it('returns authenticated user profile', async () => {
      const req = makeRequest('user-123');
      mockAuthService.getUserById.mockResolvedValue(mockUser);

      const result = await controller.me(req);

      expect(result).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('throws UnauthorizedException when not authenticated', async () => {
      const req = makeRequest();

      await expect(controller.updateProfile(req, { timezone: 'UTC' })).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthService.updateProfile).not.toHaveBeenCalled();
    });

    it('updates profile for authenticated user', async () => {
      const req = makeRequest('user-123');
      const dto = { timezone: 'America/New_York' };
      const updated = { ...mockUser, timezone: 'America/New_York' };
      mockAuthService.updateProfile.mockResolvedValue(updated);

      const result = await controller.updateProfile(req, dto);

      expect(mockAuthService.updateProfile).toHaveBeenCalledWith('user-123', dto);
      expect(result).toEqual(updated);
    });
  });
});

import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

describe('UsersService avatar', () => {
  let service: UsersService;

  const user = { id: 'u1', companyId: 'co1', avatarUrl: null as string | null };
  const prisma = {
    companyUser: {
      findFirst: jest.fn().mockResolvedValue(user),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...user, ...data })),
    },
  };
  const storage = {
    putPublicObject: jest.fn().mockResolvedValue('http://cdn/avatars/co1/u1-x.jpg'),
    deleteObject: jest.fn().mockResolvedValue(undefined),
    keyFromUrl: jest.fn().mockReturnValue('avatars/co1/old.jpg'),
  };

  const jpeg = { buffer: Buffer.from('fake'), mimetype: 'image/jpeg', size: 100_000 };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it('uploads a valid photo and saves the URL', async () => {
    const res = await service.setMyAvatar('co1', 'u1', jpeg);
    expect(storage.putPublicObject).toHaveBeenCalledWith(
      expect.stringMatching(/^avatars\/co1\/u1-/),
      jpeg.buffer,
      'image/jpeg',
    );
    expect(res.avatarUrl).toBe('http://cdn/avatars/co1/u1-x.jpg');
  });

  it('rejects non-image mime types', async () => {
    await expect(
      service.setMyAvatar('co1', 'u1', { ...jpeg, mimetype: 'application/pdf' }),
    ).rejects.toThrow(BadRequestException);
    expect(storage.putPublicObject).not.toHaveBeenCalled();
  });

  it('rejects photos over 2 MB', async () => {
    await expect(
      service.setMyAvatar('co1', 'u1', { ...jpeg, size: 3 * 1024 * 1024 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('deletes the previous object when replacing a photo', async () => {
    prisma.companyUser.findFirst.mockResolvedValueOnce({ ...user, avatarUrl: 'http://cdn/avatars/co1/old.jpg' });
    await service.setMyAvatar('co1', 'u1', jpeg);
    expect(storage.deleteObject).toHaveBeenCalledWith('avatars/co1/old.jpg');
  });

  it('removeMyAvatar clears the URL and deletes the object', async () => {
    prisma.companyUser.findFirst.mockResolvedValueOnce({ ...user, avatarUrl: 'http://cdn/avatars/co1/old.jpg' });
    const res = await service.removeMyAvatar('co1', 'u1');
    expect(storage.deleteObject).toHaveBeenCalledWith('avatars/co1/old.jpg');
    expect(res.avatarUrl).toBeNull();
  });
});

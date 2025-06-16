import { Test } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma';

describe('PrismaService', () => {
  let prismaService: PrismaService;
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    app = moduleRef.createNestApplication();
    prismaService = moduleRef.get<PrismaService>(PrismaService);
    await app.init();
  });

  it('should be defined', () => {
    expect(prismaService).toBeDefined();
  });

  it('should be able to connect to the database', async () => {
    await expect(async () => {
      await prismaService.onModuleInit();
    }).not.toThrow();
  });

  it('should be able to disconnect from the database', async () => {
    await expect(async () => {
      await prismaService.onModuleDestroy();
    }).not.toThrow();
  });

  afterAll(async () => {
    await app.close();
  });
});

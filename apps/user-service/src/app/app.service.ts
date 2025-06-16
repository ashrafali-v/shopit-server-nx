import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { User, CreateUserDto, PrismaService } from '@shopit/shared';

@Injectable()
export class AppService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const user = await this.prisma.user.create({
      data: createUserDto
    });

    // Invalidate cache
    await this.cacheManager.del('userList');
    return user;
  }

  async getUsers(): Promise<User[]> {
    // Check if the user list is cached
    const cachedUsers = await this.cacheManager.get<User[]>('userList');
    if (cachedUsers) {
      return cachedUsers;
    }

    const users = await this.prisma.user.findMany();
    await this.cacheManager.set('userList', users);
    return users;
  }

  async getUser(id: number): Promise<User | null> {
    // Check if the user details are cached
    const cachedUser = await this.cacheManager.get<User>(`user_${id}`);
    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    if (user) {
      await this.cacheManager.set(`user_${id}`, user);
    }
    return user;
  }

  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}

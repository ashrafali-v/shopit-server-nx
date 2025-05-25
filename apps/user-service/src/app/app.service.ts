import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { User, CreateUserDto } from '@shopit/shared';

@Injectable()
export class AppService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  private users: User[] = [];
  private currentUserId = 1;

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const user: User = {
      id: this.currentUserId++,
      ...createUserDto
    };

    this.users.push(user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    // Check if the user list is cached
    const cachedUsers = await this.cacheManager.get<User[]>('userList');
    if (cachedUsers) {
      return cachedUsers;
    }

    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.cacheManager.set('userList', this.users);
    return this.users;
  }

  async getUser(id: number): Promise<User | null> {
    // Check if the user details are cached
    const cachedUser = await this.cacheManager.get<User>(`user_${id}`);
    if (cachedUser) {
      return cachedUser;
    }

    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    const user = this.users.find((u) => u.id === id);
    return user || null;
  }

  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}

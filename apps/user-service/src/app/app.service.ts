import { Injectable } from '@nestjs/common';
import { User, CreateUserDto } from '@shopit/shared';

@Injectable()
export class AppService {
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
    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    return this.users;
  }

  async getUser(id: number): Promise<User | null> {
    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    const user = this.users.find((u) => u.id === id);
    return user || null;
  }

  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}

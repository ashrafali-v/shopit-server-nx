import { Controller, Get } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AppService } from './app.service';
import { User, CreateUserDto } from '@shopit/shared';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @MessagePattern({ cmd: 'create_user' })
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    return this.appService.createUser(createUserDto);
  }

  @MessagePattern({ cmd: 'get_users' })
  async getUsers(): Promise<User[]> {
    return this.appService.getUsers();
  }

  @MessagePattern({ cmd: 'get_user' })
  async getUser(data: { id: number }): Promise<User | null> {
    return this.appService.getUser(data.id);
  }
}

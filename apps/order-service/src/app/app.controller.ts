import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, ClientProxy, Ctx, RmqContext } from '@nestjs/microservices';
import { AppService } from './app.service';
import { Order, CreateOrderDto } from '@shopit/shared';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('PRODUCT_SERVICE') private readonly productServiceClient: ClientProxy
  ) {}

  @MessagePattern({ cmd: 'create_order' })
  async createOrder(data: CreateOrderDto, @Ctx() ctx: RmqContext): Promise<Order> {
    return this.appService.createOrder(data, ctx);
  }

  @MessagePattern({ cmd: 'get_orders' })
  async getOrders(): Promise<Order[]> {
    return this.appService.getOrders();
  }

  @MessagePattern({ cmd: 'get_order' })
  async getOrder(data: { id: number }): Promise<Order | null> {
    return this.appService.getOrder(data.id);
  }

  @MessagePattern({ cmd: 'get_user_orders' })
  async getUserOrders(data: { userId: number }): Promise<Order[]> {
    return this.appService.getUserOrders(data.userId);
  }
}

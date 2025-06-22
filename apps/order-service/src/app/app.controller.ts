import { Controller, Inject, Logger } from '@nestjs/common';
import { MessagePattern, ClientProxy, Ctx, RmqContext, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { Order, CreateOrderDto } from '@shopit/shared';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    @Inject('PRODUCT_SERVICE') private readonly productServiceClient: ClientProxy
  ) {}

  @MessagePattern({ cmd: 'create_order' })
  async createOrder(
    @Payload() createOrderDto: CreateOrderDto,
    @Ctx() context: RmqContext
  ): Promise<Order> {
    return this.appService.createOrder(createOrderDto, context);
  }
  @MessagePattern({ cmd: 'get_orders' })
  async getOrders(@Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    this.logger.log('Received get_orders request');

    try {
      // Get orders from service
      const orders = await this.appService.getOrders();
      this.logger.debug(`Retrieved ${orders.length} orders`);

      // Acknowledge the message since we successfully processed it
      channel.ack(originalMsg);
      
      return orders;
    } catch (error) {
      this.logger.error('Error getting orders:', error);
      
      // Negative acknowledge the message since we failed to process it
      channel.nack(originalMsg, false, false);
      
      throw error;
    }
  }

  @MessagePattern({ cmd: 'get_order' })
  async getOrder(data: { id: number }): Promise<Order | null> {
    return this.appService.getOrder(data.id);
  }

  @MessagePattern({ cmd: 'get_user_orders' })
  async getUserOrders(data: { userId: number }): Promise<Order[]> {
    return this.appService.getOrders(data.userId);
  }
}

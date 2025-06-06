import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Ctx, RmqContext } from '@nestjs/microservices';
import { AppService } from './app.service';
import { Product, CreateProductDto } from '@shopit/shared';
import { Channel, Message } from 'amqplib';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern({ cmd: 'create_product' })
  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    return this.appService.createProduct(createProductDto);
  }

  @MessagePattern({ cmd: 'get_products' })
  async getProducts(): Promise<Product[]> {
    return this.appService.getProducts();
  }

  @MessagePattern({ cmd: 'get_product' })
  async getProduct(data: { id: string }): Promise<Product | null> {
    return this.appService.getProduct(data.id);
  }

  @MessagePattern({ cmd: 'update_product' })
  async updateProduct(data: { id: number; updateData: Partial<Product> }): Promise<Product> {
    return this.appService.updateProduct(data.id, data.updateData);
  }

  @MessagePattern({ cmd: 'delete_product' })
  async deleteProduct(data: { id: number }): Promise<void> {
    return this.appService.deleteProduct(data.id);
  }

  @MessagePattern({ cmd: 'check_stock' })
  async checkStock(
    items: Array<{ productId: number; quantity: number }>,
  ): Promise<{
    success: boolean;
    insufficientItems?: Array<{
      productId: number;
      requested: number;
      available: number;
    }>;
  }> {
    return this.appService.checkStock(items);
  }

  @EventPattern('order_created')
  async handleOrderCreated(
    data: {
      items: Array<{ productId: number; quantity: number }>;
      orderId: number;
    },
    @Ctx() ctx: RmqContext,
  ): Promise<void> {
    const channel = ctx.getChannelRef() as Channel;
    const originalMsg = ctx.getMessage() as Message;

    try {
      await this.appService.updateStock(data.items);
      await channel.ack(originalMsg);
    } catch (error) {
      // Get message retry count from headers
      const retryCount = this.getRetryCount(originalMsg);
      
      if (retryCount < 3) {
        await channel.nack(originalMsg, false, true);
      } else {
        await channel.nack(originalMsg, false, false);
      }
      
      throw error;
    }
  }

  private getRetryCount(msg: Message): number {
    const deaths = msg.properties.headers['x-death'];
    if (!deaths) return 0;
    return deaths[0]?.count || 0;
  }
}

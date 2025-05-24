import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Order, CreateOrderDto } from '@shopit/shared';
import { RmqContext } from '@nestjs/microservices/ctx-host';
import { Channel, Message } from 'amqplib';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  private orders: Order[] = [];
  private currentOrderId = 1;

  constructor(@Inject('PRODUCT_SERVICE') private productService: ClientProxy) {}

  async createOrder(createOrderDto: CreateOrderDto, ctx: RmqContext): Promise<Order> {
    const channel = ctx.getChannelRef() as Channel;
    const originalMsg = ctx.getMessage() as Message;

    try {
      // Check product stock before creating order
      const stockCheckResult = await firstValueFrom(
        this.productService.send({ cmd: 'check_stock' }, createOrderDto.items)
      );

      if (!stockCheckResult.success) {
        throw new Error(
          `Insufficient stock for items: ${JSON.stringify(stockCheckResult.insufficientItems)}`
        );
      }

      // Calculate total amount
      const order: Order = {
        id: this.currentOrderId++,
        userId: createOrderDto.userId,
        items: createOrderDto.items.map(item => ({
          ...item,
          price: 0 // This will be updated with actual prices
        })),
        totalAmount: 0,
        status: 'pending',
        createdAt: new Date()
      };

      // Store the order
      this.orders.push(order);

      // Emit event to update product stock
      await firstValueFrom(
        this.productService.emit('order_created', {
          orderId: order.id,
          items: order.items
        })
      );

      // Acknowledge the message
      await channel.ack(originalMsg);

      return order;
    } catch (error) {
      // Negative acknowledgment with requeue
      await channel.nack(originalMsg, false, true);
      throw error;
    }
  }

  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}

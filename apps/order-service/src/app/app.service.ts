import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Order, CreateOrderDto } from '@shopit/shared';
import { RmqContext } from '@nestjs/microservices/ctx-host';
import { Channel, Message } from 'amqplib';
import { firstValueFrom } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AppService {
  private orders: Order[] = [
    {
      id: 1,
      userId: 1,
      items: [
        { productId: 1, quantity: 2, price: 999.99 },
        { productId: 2, quantity: 1, price: 699.99 }
      ],
      totalAmount: 2699.97,
      status: 'completed',
      createdAt: new Date('2025-05-30T10:00:00Z')
    },
    {
      id: 2,
      userId: 1,
      items: [
        { productId: 2, quantity: 3, price: 699.99 }
      ],
      totalAmount: 2099.97,
      status: 'pending',
      createdAt: new Date('2025-05-31T15:30:00Z')
    },
    {
      id: 3,
      userId: 2,
      items: [
        { productId: 1, quantity: 1, price: 999.99 }
      ],
      totalAmount: 999.99,
      status: 'completed',
      createdAt: new Date('2025-06-01T09:15:00Z')
    }
  ];
  private currentOrderId = 4; // Set to next available ID

  constructor(
    @Inject('PRODUCT_SERVICE') private productService: ClientProxy,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

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

      // Get product prices and calculate total amount
      const products = await firstValueFrom(
        this.productService.send({ cmd: 'get_products' }, {})
      );

      const orderItems = createOrderDto.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        return {
          ...item,
          price: product.price
        };
      });

      const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const order: Order = {
        id: this.currentOrderId++,
        userId: createOrderDto.userId,
        items: orderItems,
        totalAmount,
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

  async getOrders(userId?: number): Promise<Order[]> {
    if (userId) {
      const cachedOrders = await this.cacheManager.get<Order[]>(`orders_user_${userId}`);
      if (cachedOrders) {
        return cachedOrders;
      }

      const orders = this.orders.filter(order => order.userId === userId);
      await this.cacheManager.set(`orders_user_${userId}`, orders, 300);
      return orders;
    }
    
    return this.orders;
  }

  async getOrder(orderId: number): Promise<Order | undefined> {
    const cachedOrder = await this.cacheManager.get<Order>(`order_${orderId}`);
    if (cachedOrder) {
      return cachedOrder;
    }

    const order = this.orders.find(order => order.id === orderId);

    if (order) {
      await this.cacheManager.set(`order_${orderId}`, order, 300);
    }

    return order;
  }

  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}

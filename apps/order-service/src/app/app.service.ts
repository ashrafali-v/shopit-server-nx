import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Order, CreateOrderDto, PrismaService } from '@shopit/shared';
import { RmqContext } from '@nestjs/microservices/ctx-host';
import { Channel, Message } from 'amqplib';
import { firstValueFrom } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AppService {
  constructor(
    @Inject('PRODUCT_SERVICE') private productService: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private notificationClient: ClientProxy,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService
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
          productId: item.productId,
          quantity: item.quantity,
          price: product.price
        };
      });

      const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Create order with items in a transaction
      const order = await this.prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            userId: createOrderDto.userId,
            totalAmount,
            items: {
              create: orderItems
            }
          },
          include: {
            items: true
          }
        });
        return newOrder;
      });

      // Emit event to update product stock
      await firstValueFrom(
        this.productService.emit('order_created', {
          orderId: order.id,
          items: order.items
        })
      );

      // Get user details for email notification
      const user = await this.prisma.user.findUnique({
        where: { id: createOrderDto.userId },
        select: { name: true, email: true }
      });

      if (user) {
        // Emit order confirmation email event
        await firstValueFrom(
          this.notificationClient.emit('order_confirmation_email', {
            orderId: order.id,
            customerName: user.name,
            email: user.email,
            items: order.items,
            totalAmount: totalAmount
          })
        );
      }

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

      const orders = await this.prisma.order.findMany({
        where: { userId },
        include: {
          items: true
        }
      });

      await this.cacheManager.set(`orders_user_${userId}`, orders, 300);
      return orders;
    }
    
    return this.prisma.order.findMany({
      include: {
        items: true
      }
    });
  }

  async getOrder(orderId: number): Promise<Order | null> {
    const cachedOrder = await this.cacheManager.get<Order>(`order_${orderId}`);
    if (cachedOrder) {
      return cachedOrder;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    });

    if (order) {
      await this.cacheManager.set(`order_${orderId}`, order, 300);
    }

    return order;
  }

  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}

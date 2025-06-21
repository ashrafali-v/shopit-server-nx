import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Order, OrderItem, CreateOrderDto, PrismaService } from '@shopit/shared';
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

  private transformOrderItem(item: any): OrderItem {
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: Number(item.price)
    };
  }

  private transformOrder(order: any): Order {
    return {
      id: order.id,
      userId: order.userId,
      totalAmount: Number(order.totalAmount),
      status: order.status,
      items: order.items.map(item => this.transformOrderItem(item)),
      createdAt: order.createdAt
    };
  }

  private transformOrders(orders: any[]): Order[] {
    return orders.map(order => this.transformOrder(order));
  }

  async getOrders(userId?: number): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: userId ? { userId } : undefined,
      include: {
        items: true
      }
    });
    return this.transformOrders(orders);
  }

  async getOrder(id: number): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    return order ? this.transformOrder(order) : null;
  }

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

      const totalAmount = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const order = await this.prisma.order.create({
        data: {
          userId: createOrderDto.userId,
          totalAmount,
          status: 'pending',
          items: {
            create: orderItems
          }
        },
        include: {
          items: true
        }
      });

      // Acknowledge RabbitMQ message
      channel.ack(originalMsg);

      // Notify about order creation
      //this.productService.emit('order_created', order);

      return this.transformOrder(order);
    } catch (error) {
      // Reject RabbitMQ message on error
      channel.nack(originalMsg);
      throw error;
    }
  }
}

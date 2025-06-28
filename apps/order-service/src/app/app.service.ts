import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Order, OrderItem, CreateOrderDto, PrismaService } from '@shopit/shared';
import { RmqContext } from '@nestjs/microservices/ctx-host';
import { Channel, Message } from 'amqplib';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @Inject('PRODUCT_SERVICE') private productService: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private notificationClient: ClientProxy,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService
  ) {}

  private transformOrderItem(item: { productId: number; quantity: number; price: number | string | { toString(): string } }): OrderItem {
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: Number(item.price?.toString() || 0)
    };
  }

  private transformOrder(order: {
    id: number;
    userId: number;
    totalAmount: number | string | { toString(): string };
    status: Order['status'];
    items: Array<{ productId: number; quantity: number; price: number | string | { toString(): string } }>;
    createdAt: Date;
  }): Order {
    return {
      id: order.id,
      userId: order.userId,
      totalAmount: Number(order.totalAmount?.toString() || 0),
      status: order.status,
      items: order.items.map(item => this.transformOrderItem(item)),
      createdAt: order.createdAt
    };
  }

  private transformOrders(orders: Array<Parameters<typeof this.transformOrder>[0]>): Order[] {
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
      this.logger.log(`Starting order creation process for user ${createOrderDto.userId}`);
      this.logger.debug('Order details:', JSON.stringify(createOrderDto, null, 2));

      // Check product stock before creating order
      this.logger.debug('Checking product stock availability...');
      const stockCheckResult = await firstValueFrom(
        this.productService.send(
          { cmd: 'check_stock' }, 
          createOrderDto.items
        ).pipe(
          timeout({
            first: 5000,     // 5s for initial response
            each: 10000,     // 10s for the operation
            with: () => { throw new Error('Stock check service timed out') }
          }),
          catchError(err => {
            this.logger.error('Stock check failed:', err);
            throw new Error('Failed to check product stock: ' + err.message);
          })
        )
      );
      
      if (!stockCheckResult) {
        throw new Error('Stock check service did not respond');
      }

      this.logger.debug('Stock check response:', JSON.stringify(stockCheckResult, null, 2));

      if (!stockCheckResult.success) {
        const itemDetails = stockCheckResult.insufficientItems
          ?.map(item => `Product ${item.productId} (requested: ${item.requested}, available: ${item.available})`)
          .join(', ');
        this.logger.warn(`Stock check failed: ${itemDetails}`);
        throw new Error(`Insufficient stock for the following items: ${itemDetails}`);
      }

      this.logger.debug('Stock check passed successfully');

      // Get product prices and calculate total amount
      this.logger.debug('Fetching product details for pricing...');
      const products = await firstValueFrom(
        this.productService.send({ cmd: 'get_products' }, {}).pipe(
          timeout({
            first: 5000,     // 5s for initial response
            each: 10000,     // 10s for the operation
            with: () => { throw new Error('Product service timed out') }
          }),
          catchError(err => {
            this.logger.error('Get products failed:', err);
            throw new Error('Failed to get product details: ' + err.message);
          })
        )
      );
      
      if (!products) {
        throw new Error('Product service did not return any products');
      }

      if (!products || !Array.isArray(products)) {
        throw new Error(`Invalid response from product service: ${JSON.stringify(products)}`);
      }

      this.logger.debug('Products received:', JSON.stringify(products, null, 2));

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

      // Get user details and create order in a transaction
      this.logger.log(`Starting order creation for user ${createOrderDto.userId}`);
      const { order } = await this.prisma.$transaction(async (tx) => {
        // Get user details
        const user = await tx.user.findUnique({
          where: { id: createOrderDto.userId }
        });
        
        if (!user) {
          throw new Error(`User not found: ${createOrderDto.userId}`);
        }

        // Create order
        const order = await tx.order.create({
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

        return { user, order };
      });

      this.logger.log(`Order created successfully: ${order.id}`);

      try {
        // Update product stock
        this.logger.debug('Updating product stock...', {
          orderId: order.id,
          items: order.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        });

        const stockUpdateResult = await firstValueFrom(
          this.productService.send(
            { cmd: 'update_stock' },
            {
              items: order.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity
              })),
              orderId: order.id
            }
          ).pipe(
            timeout({
              first: 5000,     // 5s for initial response
              each: 10000,     // 10s for the operation
              with: () => { throw new Error('Stock update service timed out') }
            }),
            catchError(err => {
              this.logger.error('Stock update failed:', err);
              throw new Error('Failed to update product stock: ' + err.message);
            })
          )
        );

        if (!stockUpdateResult || !stockUpdateResult.success) {
          throw new Error('Failed to update product stock');
        }

        this.logger.debug('Stock update completed successfully');

        // Get user data for notification
        const user = await this.prisma.user.findUnique({
          where: { id: order.userId },
          select: { name: true, email: true }
        });

        if (!user) {
          this.logger.warn(`User not found for order ${order.id}, skipping notification`);
        } else {
          // Send order confirmation email
          this.logger.debug('Sending order confirmation email...');
          await firstValueFrom(
            this.notificationClient.emit('order_confirmation_email', {
              orderId: order.id,
              customerName: user.name,
              email: user.email,
              items: order.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: Number(item.price)
              })),
              totalAmount: Number(totalAmount)
            })
          );
        }

        // Update order status to completed after stock update and email
        this.logger.log(`Updating order status to completed: ${order.id}`);
        const updatedOrder = await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'completed' },
          include: { items: true }
        });

        this.logger.log(`Order ${order.id} processed successfully`);

        // Acknowledge RabbitMQ message only after all operations are complete
        channel.ack(originalMsg);

        return this.transformOrder(updatedOrder);
      } catch (innerError) {
        // If stock update or notification fails, update order status to cancelled
        this.logger.error(`Failed to process order ${order.id}:`, innerError);
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'cancelled' }
        });
        throw innerError;
      }
    } catch (error) {
      this.logger.error(`Error processing order: ${error.message}`, error.stack);
      // Reject RabbitMQ message on error
      channel.nack(originalMsg);
      throw error;
    }
  }
}

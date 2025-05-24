import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Ctx, RmqContext } from '@nestjs/microservices';
import { AppService } from './app.service';
import { Product, CreateProductDto } from '@shopit/shared';
import { Channel, Message } from 'amqplib';

@Controller()
export class AppController {
  private products: Product[] = [
    {
      id: 1,
      name: 'Product 1',
      description: 'Description 1',
      price: 999.99,
      stock: 10,
    },
    {
      id: 2,
      name: 'Product 2',
      description: 'Description 2',
      price: 699.99,
      stock: 15,
    },
  ];

  constructor(private readonly appService: AppService) {}

  @MessagePattern({ cmd: 'create_product' })
  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    const product: Product = {
      id: Math.floor(Math.random() * 1000),
      ...createProductDto
    };
    this.products.push(product);
    return product;
  }

  @MessagePattern({ cmd: 'get_products' })
  async getProducts(): Promise<Product[]> {
    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    return this.products;
  }

  @MessagePattern({ cmd: 'get_product' })
  async getProduct(data: { id: string }): Promise<Product | null> {
    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    const productId = parseInt(data.id, 10);
    const product = this.products.find((p) => p.id === productId);
    return product || null;
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
    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const insufficientItems: Array<{
      productId: number;
      requested: number;
      available: number;
    }> = [];

    for (const item of items) {
      const product = this.products.find((p) => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        insufficientItems.push({
          productId: item.productId,
          requested: item.quantity,
          available: product?.stock || 0,
        });
      }
    }

    return {
      success: insufficientItems.length === 0,
      insufficientItems: insufficientItems.length > 0 ? insufficientItems : undefined,
    };
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
      console.log('Received order_created event:', data);
      
      // Check if we have enough stock for all items
      const stockCheck = await this.checkStock(data.items);
      if (!stockCheck.success) {
        throw new Error(
          `Insufficient stock for order ${data.orderId}: ${JSON.stringify(stockCheck.insufficientItems)}`,
        );
      }

      // Use a transaction-like pattern
      const updates: Array<{ product: Product; newStock: number }> = [];
      
      // First phase: validate all updates
      for (const item of data.items) {
        const product = this.products.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }
        updates.push({ product, newStock: product.stock - item.quantity });
      }

      // Second phase: apply all updates
      for (const update of updates) {
        update.product.stock = update.newStock;
        console.log(
          `Updated stock for product ${update.product.id}: ${update.product.stock}`,
        );
      }

      // Success: Acknowledge the message
      console.log(`Successfully updated inventory for order ${data.orderId}`);
      await channel.ack(originalMsg);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `Failed to update inventory for order ${data.orderId}:`,
        errorMessage,
      );

      // Get message retry count from headers
      const retryCount = this.getRetryCount(originalMsg);
      
      if (retryCount < 3) {
        // Negative acknowledgment with requeue
        console.log(
          `Retrying message for order ${data.orderId}. Attempt ${retryCount + 1}`,
        );
        await channel.nack(originalMsg, false, true);
      } else {
        // Max retries reached, move to dead letter queue
        console.log(
          `Max retries reached for order ${data.orderId}, moving to DLQ`,
        );
        await channel.nack(originalMsg, false, false);
      }
      
      throw error;
    }
  }

  private getRetryCount(msg: Message): number {
    const headers = msg.properties.headers || {};
    return (headers['x-retry-count'] as number) || 0;
  }
}

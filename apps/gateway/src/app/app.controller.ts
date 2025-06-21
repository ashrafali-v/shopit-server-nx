import { Controller, Post, Get, Body, Param, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateProductDto, Product, CreateOrderDto, Order, User, CreateUserDto } from '@shopit/shared';
import { firstValueFrom, timeout } from 'rxjs';

@Controller()
export class AppController {
  constructor(
    @Inject('PRODUCT_SERVICE') private readonly productService: ClientProxy,
    @Inject('ORDER_SERVICE') private readonly orderService: ClientProxy,
    @Inject('USER_SERVICE') private readonly userService: ClientProxy,
  ) {}

  @Get()
  getApiInfo() {
    return {
      name: 'ShopIt API Gateway',
      version: '1.0.0',
      endpoints: {
        products: '/products',
        orders: '/orders',
        users: '/users'
      }
    };
  }

  // Product endpoints
  @Post('products')
  async createProduct(@Body() createProductDto: CreateProductDto): Promise<Product> {
    try {
      return await firstValueFrom(
        this.productService.send({ cmd: 'create_product' }, createProductDto)
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('products')
  async getProducts(): Promise<Product[]> {
    try {
      return await firstValueFrom(
        this.productService.send({ cmd: 'get_products' }, {})
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('products/:id')
  async getProduct(@Param('id') id: string): Promise<Product> {
    try {
      const product = await firstValueFrom(
        this.productService.send({ cmd: 'get_product' }, { id })
      );
      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }
      return product;
    } catch (error) {
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('products/check-stock')
  async checkProductStock(
    @Body() items: Array<{ productId: number; quantity: number }>
  ): Promise<{
    success: boolean;
    insufficientItems?: Array<{
      productId: number;
      requested: number;
      available: number;
    }>;
  }> {
    try {
      return await firstValueFrom(
        this.productService.send({ cmd: 'check_stock' }, items)
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // Order endpoints
  @Post('orders')
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      console.log(`Gateway: Starting order creation for user ${createOrderDto.userId}`);
      const result = await firstValueFrom(
        this.orderService.send({ cmd: 'create_order' }, createOrderDto).pipe(
          timeout(30000) // 30 second timeout to match RabbitMQ TTL
        )
      );
      console.log(`Gateway: Order created successfully`);
      return result;
    } catch (error) {
      console.error(`Gateway: Order creation failed:`, error);
      if (error.name === 'TimeoutError') {
        throw new HttpException(
          'Order service is not responding. Please try again.',
          HttpStatus.GATEWAY_TIMEOUT
        );
      }
      throw new HttpException(
        error.message || 'Failed to create order',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('orders')
  async getOrders(): Promise<Order[]> {
    try {
      return await firstValueFrom(
        this.orderService.send({ cmd: 'get_orders' }, {})
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string): Promise<Order> {
    try {
      const order = await firstValueFrom(
        this.orderService.send({ cmd: 'get_order' }, { id: parseInt(id, 10) })
      );
      if (!order) {
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }
      return order;
    } catch (error) {
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('users/:userId/orders')
  async getUserOrders(@Param('userId') userId: string): Promise<Order[]> {
    try {
      return await firstValueFrom(
        this.orderService.send(
          { cmd: 'get_user_orders' },
          { userId: parseInt(userId, 10) }
        )
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // User endpoints
  @Post('users')
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    try {
      return await firstValueFrom(
        this.userService.send({ cmd: 'create_user' }, createUserDto)
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('users')
  async getUsers(): Promise<User[]> {
    try {
      return await firstValueFrom(
        this.userService.send({ cmd: 'get_users' }, {})
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string): Promise<User> {
    try {
      const user = await firstValueFrom(
        this.userService.send({ cmd: 'get_user' }, { id: parseInt(id, 10) })
      );
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return user;
    } catch (error) {
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

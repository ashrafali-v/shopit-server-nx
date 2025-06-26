import { Controller, Post, Get, Body, Param, Inject, HttpException, HttpStatus, Logger, ForbiddenException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateProductDto, Product, CreateOrderDto, Order, User, CreateUserDto } from '@shopit/shared';
import { firstValueFrom, timeout, catchError } from 'rxjs';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    @Inject('PRODUCT_SERVICE') private readonly productService: ClientProxy,
    @Inject('ORDER_SERVICE') private readonly orderService: ClientProxy,
    @Inject('USER_SERVICE') private readonly userService: ClientProxy,
  ) {}

  // Error handler for CSRF token validation
  private handleCsrfError(error: Error & { code?: string }) {
    if (error.code === 'EBADCSRFTOKEN') {
      throw new ForbiddenException('Invalid CSRF token. Please try again.');
    }
    throw error;
  }

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
      this.handleCsrfError(error);
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
      this.handleCsrfError(error);
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
      this.handleCsrfError(error);
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
      this.handleCsrfError(error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // Order endpoints
  @Post('orders')
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    this.logger.log('Starting order creation for user', createOrderDto.userId);
    
    try {
      const order$ = this.orderService.send(
        { cmd: 'create_order' },
        createOrderDto
      ).pipe(
        timeout({
          each: 10000,    // 10s for each operation
          first: 5000,    // 5s for initial response
          with: () => { throw new Error('Order service timed out') }
        }),
        catchError(err => {
          this.logger.error('Order creation failed:', err);
          if (err.message === 'Order service timed out') {
            throw new HttpException(
              'Order service is not responding. Please try again.',
              HttpStatus.GATEWAY_TIMEOUT
            );
          }
          throw new HttpException(
            err.message || 'Failed to create order',
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        })
      );

      const order = await firstValueFrom(order$);
      this.logger.log('Order created successfully:', order?.id);
      return order;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to create order',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('orders')
  async getOrders(): Promise<Order[]> {
    this.logger.log('GET /orders - Fetching all orders');
    try {
      return await firstValueFrom(
        this.orderService.send({ cmd: 'get_orders' }, {}).pipe(
          timeout({
            first: 5000,     // 5s for initial response
            each: 10000,     // 10s for the operation
            with: () => { throw new Error('Order service timed out') }
          }),
          catchError(err => {
            this.logger.error('Failed to fetch orders:', err);
            throw new HttpException(
              err.message || 'Failed to fetch orders',
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          })
        )
      );
    } catch (error) {
      this.logger.error('Error in getOrders:', error);
      throw new HttpException(
        error.message || 'Failed to fetch orders',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
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
      this.handleCsrfError(error);
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
      this.handleCsrfError(error);
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
      this.handleCsrfError(error);
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
      this.handleCsrfError(error);
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
      this.handleCsrfError(error);
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

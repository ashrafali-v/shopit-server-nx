// Entity interfaces
export * from './lib/interfaces/product.interface';
export * from './lib/interfaces/order.interface';
export * from './lib/interfaces/user.interface';

// Configurations and DTOs
export * from './lib/config/rabbitmq.config';
export * from './lib/dtos/create-order.dto';
export * from './lib/dtos/create-product.dto';
export * from './lib/dtos/create-user.dto';

// Transformers
export * from './lib/transformers/sanitize.transformer';

// Prisma exports
export * from './lib/services/prisma.service';
export { 
  PrismaClient,
  User as PrismaUser,
  Product as PrismaProduct,
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem 
} from '../generated/prisma';

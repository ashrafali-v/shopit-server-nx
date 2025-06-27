import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const user1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      isActive: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      isActive: true,
    },
  });

  // Create Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Laptop',
        description: 'High-performance laptop with latest specifications',
        price: 999.99,
        stock: 50,
        category: 'electronics',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Smartphone',
        description: 'Latest model with advanced camera system',
        price: 699.99,
        stock: 100,
        category: 'electronics',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Headphones',
        description: 'Wireless noise-canceling headphones',
        price: 199.99,
        stock: 200,
        category: 'accessories',
      },
    }),
  ]);

  // Create Orders with Order Items
  await prisma.order.create({
    data: {
      userId: user1.id,
      totalAmount: 1199.98,
      status: 'completed',
      items: {
        create: [
          {
            productId: products[0].id, // Laptop
            quantity: 1,
            price: 999.99,
          },
          {
            productId: products[2].id, // Headphones
            quantity: 1,
            price: 199.99,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      userId: user2.id,
      totalAmount: 699.99,
      status: 'pending',
      items: {
        create: [
          {
            productId: products[1].id, // Smartphone
            quantity: 1,
            price: 699.99,
          },
        ],
      },
    },
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

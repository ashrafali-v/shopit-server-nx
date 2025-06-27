# ShopIt E-Commerce Microservices Platform

A modern e-commerce platform built with NestJS microservices architecture and RabbitMQ message broker.

## Architecture Overview

This platform consists of:

- **API Gateway**: Central entry point that routes requests to microservices
- **Product Service**: Manages product catalog and inventory with Redis caching
- **Order Service**: Handles order processing and management
- **User Service**: Manages user accounts and authentication
- **Shared Library**: Common code, DTOs, and configurations

Infrastructure:

- **RabbitMQ**: Message broker for inter-service communication
- **Redis**: Distributed caching layer for improved performance

## Prerequisites

- Node.js (v18 or later)
- Docker
- pnpm (recommended) or npm

## Getting Started

1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd shopit-server-nx

# Install dependencies
pnpm install
```

2. Start Infrastructure Services

```bash
# Start RabbitMQ and Redis containers
docker compose -f docker-compose-dev.yml up -d

# Verify services are running
docker compose -f docker-compose-dev.yml ps
```

Services available:

RabbitMQ:

- Management UI: http://localhost:15672
- AMQP Port: 5672
- Username: admin
- Password: admin

Redis:

- Port: 6379
- Health Check: Enabled (5s interval)
- Persistence: Enabled (data directory mounted)

3. Start the Microservices

```bash
# Start all services in parallel (recommended)
npx nx run-many --target=serve --projects=gateway,product-service,order-service,user-service --parallel=4

# Or start services individually in separate terminals:
npx nx serve gateway
npx nx serve product-service
npx nx serve order-service
npx nx serve user-service
```

The API Gateway will be available at http://localhost:3000

## Available API Endpoints

### Products

- `GET /products` - List all products
- `GET /products/:id` - Get product by ID
- `POST /products` - Create new product

### Orders

- `GET /orders` - List all orders
- `GET /orders/:id` - Get order by ID
- `POST /orders` - Create new order
- `GET /users/:userId/orders` - Get user's orders

### Users

- `GET /users` - List all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create new user

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

```sh
npx nx g @nx/nest:app demo
```

To generate a new library, use:

```sh
npx nx g @nx/node:lib mylib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/nx-api/nest?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:

- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Development Commands

### Managing Services

```bash
# Start individual service
npx nx serve <service-name>  # e.g., npx nx serve gateway

# Build service
npx nx build <service-name>  # e.g., npx nx build product-service

# Run tests
npx nx test <service-name>   # e.g., npx nx test order-service
```

### Docker Commands

```bash
# Start infrastructure services
docker compose -f docker-compose-dev.yml up -d

# Stop all services
docker compose -f docker-compose-dev.yml down

# Check logs for all services
docker compose -f docker-compose-dev.yml logs -f

# Check logs for specific service
docker compose -f docker-compose-dev.yml logs redis -f

# Restart all services
docker compose -f docker-compose-dev.yml restart

# Health checks
docker compose -f docker-compose-dev.yml ps     # Check container health status
docker exec shopit-server-nx-redis-1 redis-cli ping    # Test Redis connection
docker exec shopit-server-nx-redis-1 redis-cli info    # Get detailed Redis info

# Monitor Redis
docker exec shopit-server-nx-redis-1 redis-cli --stat  # Real-time Redis statistics
docker exec shopit-server-nx-redis-1 redis-cli info memory  # Check Redis memory usage
```

### Stopping All Services

```bash
# Stop all running Nx processes
pkill -f "nx serve"

# Stop RabbitMQ and remove containers
docker compose -f docker-compose-dev.yml down

# Verify no services are running
docker ps
ps aux | grep "nx serve"
```

You can also press `Ctrl + C` in each terminal window where a service is running to stop them individually.

### Restarting All Services

Follow these steps in order to restart all services:

1. **Start RabbitMQ First**

```bash
# Start RabbitMQ container
docker compose -f docker-compose-dev.yml up -d

# Verify RabbitMQ is running
docker ps

# Wait 10-15 seconds for RabbitMQ to fully initialize
```

2. **Start All Microservices**

```bash
# Method 1: Start all services in parallel (recommended)
npx nx run-many --target=serve --projects=gateway,product-service,order-service,user-service --parallel=4

# Method 2: Start services individually in separate terminals
npx nx serve gateway
npx nx serve product-service
npx nx serve order-service
npx nx serve user-service
```

3. **Verify Services**

```bash
# Check if RabbitMQ is running
docker ps

# Check if all services are running
ps aux | grep "nx serve"

# Test the API gateway
curl http://localhost:3000
```

Services should now be available at:

- Gateway API: http://localhost:3000
- RabbitMQ Management UI: http://localhost:15672 (guest/guest)

## Troubleshooting

1. **RabbitMQ Connection Issues**

   - Verify RabbitMQ is running: `docker ps`
   - Check RabbitMQ logs: `docker compose -f docker-compose-dev.yml logs rabbitmq`
   - Ensure RabbitMQ ports (5672, 15672) are not in use

2. **Service Start-up Issues**

   - Check if all dependencies are installed: `pnpm install`
   - Verify RabbitMQ connection in service logs
   - Try starting services one by one to identify the issue

3. **API Gateway Issues**

   - Ensure gateway service is running
   - Check if all required microservices are up
   - Verify ports are not in use (default: 3000)

4. **Redis Issues**
   - Check Redis container health: `docker compose -f docker-compose-dev.yml ps redis`
   - Verify Redis connection: `docker exec shopit-server-nx-redis-1 redis-cli ping`
   - Check Redis logs: `docker compose -f docker-compose-dev.yml logs redis`
   - Verify Redis port (6379) is not in use
   - Monitor memory usage: `docker exec shopit-server-nx-redis-1 redis-cli info memory`

## Database Migration Strategy

This section outlines the database migration strategy for the ShopIt microservices platform using Prisma.

### Migration Overview

Our database schema is managed through Prisma and located in `libs/shared/prisma/schema.prisma`. All microservices share the same database schema through the shared library.

#### Database Schema Structure

- **Users**: Customer accounts and authentication
- **Products**: Product catalog with inventory management
- **Orders**: Order processing and status tracking
- **OrderItems**: Individual items within orders with pricing history

### Development Workflow

#### 1. Local Development Migrations

```bash
# Create a new migration during development
cd libs/shared
npx prisma migrate dev --name your_migration_name

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma client after schema changes
npx prisma generate
```

#### 2. Migration Best Practices

##### ✅ Backward Compatible Changes

```sql
-- Adding optional columns
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);

-- Adding new tables
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Adding indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

##### ⚠️ Breaking Changes (Multi-Phase Approach)

```sql
-- Phase 1: Add new column
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);

-- Phase 2: Populate data (after app deployment)
UPDATE users SET full_name = CONCAT(first_name, ' ', last_name);

-- Phase 3: Drop old columns (next deployment)
ALTER TABLE users DROP COLUMN first_name, DROP COLUMN last_name;
```

### Concrete Schema Change Example

This example demonstrates adding new fields to existing models and how Prisma generates and tracks migrations.

#### Example: Adding User Account Status and Product Categories

**Step 1: Modify the Schema**

```prisma
model User {
  id          Int      @id @default(autoincrement())
  email       String   @unique
  name        String
  phoneNumber String? // Existing optional field
  isActive    Boolean  @default(true) // NEW: user account status
  orders      Order[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("users")
}

model Product {
  id          Int         @id @default(autoincrement())
  name        String
  description String      @db.Text
  price       Decimal     @db.Decimal(10, 2)
  stock       Int
  category    String      @default("general") // NEW: product category
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  orderItems  OrderItem[]

  @@map("products")
}
```

**Step 2: Generate Migration**

```bash
cd libs/shared
npx prisma migrate dev --name add_user_active_status_and_product_category
```

**Step 3: Generated Migration File**

Prisma automatically creates a new migration file: `migrations/20250626234315_add_user_active_status_and_product_category/migration.sql`

```sql
-- AlterTable
ALTER TABLE "products" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'general';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
```

**Step 4: Update DTOs and Interfaces**

```typescript
// libs/shared/src/lib/dtos/create-user.dto.ts
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Sanitize()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  @Sanitize()
  email!: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true; // NEW field
}

// libs/shared/src/lib/dtos/create-product.dto.ts
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Sanitize()
  name!: string;

  @IsString()
  @MaxLength(1000)
  @Sanitize()
  description!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(0)
  stock!: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Sanitize()
  category?: string = 'general'; // NEW field
}
```

**Step 5: Update Seed File**

```typescript
// libs/shared/prisma/seed.ts
const user1 = await prisma.user.create({
  data: {
    name: 'John Doe',
    email: 'john@example.com',
    isActive: true, // NEW field
  },
});

const laptop = await prisma.product.create({
  data: {
    name: 'Laptop',
    description: 'High-performance laptop with latest specifications',
    price: 999.99,
    stock: 50,
    category: 'electronics', // NEW field
  },
});
```

**Step 6: Verify Migration**

```bash
# Check migration status
npx prisma migrate status

# Output:
# 4 migrations found in prisma/migrations
# Database schema is up to date!

# Run seed to test new fields
npx ts-node prisma/seed.ts

# Output:
# Seed data created successfully!
```

**Step 7: Build and Test**

```bash
# Build shared library with new types
npx nx build shared

# Test that microservices compile with new interfaces
npx nx build gateway
npx nx build product-service
npx nx build user-service
```

#### Migration Results

This schema change demonstrates several key concepts:

1. **Non-breaking changes**: Both new fields have default values, making them backward-compatible
2. **Automatic SQL generation**: Prisma generated appropriate `ALTER TABLE` statements
3. **Type safety**: Updated DTOs and interfaces maintain type safety across the monorepo
4. **Consistent data**: Seed file updated to include new fields for complete testing

The migration files are tracked in version control and applied consistently across environments:

```
migrations/
├── 0_init/
│   └── migration.sql
├── 20250615044159_init/
│   └── migration.sql
├── 20250616001535_test_16_06_2025_8_15/
│   └── migration.sql
└── 20250626234315_add_user_active_status_and_product_category/
    └── migration.sql
```

Each migration builds upon the previous state, ensuring a reliable and traceable database evolution history.

#### Using the New Fields in API Calls

After deploying the schema changes, the new fields are immediately available in the API:

**Creating a User with Account Status**

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "isActive": true
  }'
```

**Creating a Product with Category**

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse with precision tracking",
    "price": 29.99,
    "stock": 150,
    "category": "accessories"
  }'
```

**Filtering Products by Category**

```bash
# Get electronics products
curl -X GET "http://localhost:3000/products?category=electronics"

# Get accessories products
curl -X GET "http://localhost:3000/products?category=accessories"
```

**Managing User Account Status**

```bash
# Deactivate a user account
curl -X PATCH http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'

# Get only active users
curl -X GET "http://localhost:3000/users?isActive=true"
```

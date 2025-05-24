# ShopIt E-Commerce Microservices Platform

A modern e-commerce platform built with NestJS microservices architecture and RabbitMQ message broker.

## Architecture Overview

This platform consists of:

- **API Gateway**: Central entry point that routes requests to microservices
- **Product Service**: Manages product catalog and inventory
- **Order Service**: Handles order processing and management
- **User Service**: Manages user accounts and authentication
- **Shared Library**: Common code, DTOs, and configurations

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

2. Start RabbitMQ

```bash
# Start RabbitMQ container
docker compose -f docker-compose-dev.yml up -d

# Verify RabbitMQ is running
docker ps
```

RabbitMQ Management UI will be available at:

- URL: http://localhost:15672
- Username: guest
- Password: guest

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
# Start RabbitMQ
docker compose -f docker-compose-dev.yml up -d

# Stop RabbitMQ
docker compose -f docker-compose-dev.yml down

# Check logs
docker compose -f docker-compose-dev.yml logs -f

# Restart RabbitMQ
docker compose -f docker-compose-dev.yml restart
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

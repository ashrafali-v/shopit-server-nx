# Order Service

This is a NestJS microservice that handles order management for the Shopit e-commerce platform.

## Features

- Create orders
- List all orders
- Get order by ID
- Get user orders

## Message Patterns

### Commands
- `{ cmd: 'create_order' }` - Create a new order
- `{ cmd: 'get_orders' }` - Get all orders
- `{ cmd: 'get_order' }` - Get a single order
- `{ cmd: 'get_user_orders' }` - Get orders for a specific user

## Development

```bash
# Start the service
npx nx serve order-service

# Run tests
npx nx test order-service

# Build
npx nx build order-service
```
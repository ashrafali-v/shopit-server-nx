# Product Service

This is a NestJS microservice that handles product management for the Shopit e-commerce platform.

## Features

- Create products
- List all products
- Get product by ID
- Check product stock
- Handle order creation events

## Message Patterns

### Commands
- `{ cmd: 'create_product' }` - Create a new product
- `{ cmd: 'get_products' }` - Get all products
- `{ cmd: 'get_product' }` - Get a single product
- `{ cmd: 'check_stock' }` - Check stock availability

### Events
- `'order_created'` - Handle order creation and update stock

## Development

```bash
# Start the service
npx nx serve product-service

# Run tests
npx nx test product-service

# Build
npx nx build product-service
```
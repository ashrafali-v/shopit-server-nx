# Gateway API

This is the API Gateway for the Shopit e-commerce platform. It provides a REST API interface and communicates with the microservices via RabbitMQ.

## Features

- RESTful API endpoints for products, orders, and users
- Message-based communication with microservices
- Error handling and response formatting

## API Endpoints

### Products
- `POST /products` - Create a product
- `GET /products` - List all products
- `GET /products/:id` - Get a single product

### Orders
- `POST /orders` - Create an order
- `GET /orders` - List all orders
- `GET /orders/:id` - Get a single order
- `GET /users/:userId/orders` - Get orders for a user

### Users
- `POST /users` - Create a user
- `GET /users` - List all users
- `GET /users/:id` - Get a single user

## Development

```bash
# Start the service
npx nx serve gateway

# Run tests
npx nx test gateway

# Build
npx nx build gateway
```
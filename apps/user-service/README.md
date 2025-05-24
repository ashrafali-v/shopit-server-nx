# User Service

This is a NestJS microservice that handles user management for the Shopit e-commerce platform.

## Features

- Create users
- List all users
- Get user by ID

## Message Patterns

### Commands
- `{ cmd: 'create_user' }` - Create a new user
- `{ cmd: 'get_users' }` - Get all users
- `{ cmd: 'get_user' }` - Get a single user

## Development

```bash
# Start the service
npx nx serve user-service

# Run tests
npx nx test user-service

# Build
npx nx build user-service
```
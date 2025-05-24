export const RABBITMQ_CONFIG = {
  url: 'amqp://admin:admin@localhost:5672',
  queues: {
    users: 'users_queue',
    products: 'products_queue',
    orders: 'orders_queue',
    deadLetter: 'dead_letter_queue'
  },
  queueOptions: {
    durable: true, // Queue survives broker restart
    deadLetterExchange: 'dead_letter_exchange',
    messageTtl: 1000 * 60 * 60, // 1 hour TTL
    maxRetries: 3
  },
  prefetchCount: 1 // Process one message at a time
};

export const RABBITMQ_CONFIG = {
  url: 'amqp://admin:admin@localhost:5672',
  queues: {
    users: 'users_queue',
    products: 'products_queue',
    orders: 'orders_queue',
    deadLetter: 'dead_letter_queue'
  },
  queueOptions: {
    durable: true
  },
  prefetchCount: 1
};

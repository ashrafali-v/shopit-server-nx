export const RABBITMQ_CONFIG = {
  url: 'amqp://admin:admin@localhost:5672',
  queues: {
    users: 'users_queue',
    products: 'products_queue',
    orders: 'orders_queue',
    notifications: 'notifications_queue',
    deadLetter: 'dead_letter_queue'
  },
  queueOptions: {
    durable: true,
    deadLetterExchange: 'dead_letter_exchange',
    deadLetterRoutingKey: 'dead_letter_queue',
    messageTtl: 60000 // 1 minute
  },
  prefetchCount: 1
};

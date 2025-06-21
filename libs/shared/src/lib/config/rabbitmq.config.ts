export const RABBITMQ_CONFIG = {
  url: 'amqp://admin:admin@localhost:5672',
  queues: {
    users: 'users_queue',
    products: 'products_queue',
    orders: 'orders_queue',
    deadLetter: 'dead_letter_queue'
  },
  queueOptions: {
    durable: true,
    arguments: {
      'x-message-ttl': 30000,
      'x-dead-letter-exchange': 'dead_letter_exchange',
      'x-max-retries': 3
    }
  },
  prefetchCount: 10,
  socketOptions: {
    heartbeatIntervalInSeconds: 5,
    reconnectTimeInSeconds: 5
  },
  noAck: false
};

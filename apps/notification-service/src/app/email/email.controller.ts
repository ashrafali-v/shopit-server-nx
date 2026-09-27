import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Ctx, RmqContext, Payload } from '@nestjs/microservices';
import { Channel, Message } from 'amqplib';
import { EmailQueueService } from './email-queue.service';
import { OrderConfirmationEmailEvent } from './interfaces/email.interface';

@Controller()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailQueueService: EmailQueueService) {}

  @EventPattern('order_confirmation_email')
  async handleOrderConfirmationEmail(@Payload() data: OrderConfirmationEmailEvent, @Ctx() ctx: RmqContext) {
    const channel = ctx.getChannelRef() as Channel;
    const originalMsg = ctx.getMessage() as Message;

    try {
      this.logger.debug('Received order confirmation email event:', JSON.stringify(data));
      
      if (!data || !data.orderId) {
        throw new Error('Invalid message payload: missing required fields');
      }

      const jobId = await this.emailQueueService.enqueueOrderConfirmation(data);
      await channel.ack(originalMsg);
      this.logger.log(`Queued order confirmation email for order #${data.orderId} (job ${jobId})`);
    } catch (error) {
      this.logger.error(`Failed to queue order confirmation email for order #${data?.orderId || 'unknown'}:`, error);
      this.logger.debug('Message payload:', JSON.stringify(data));
      await channel.nack(originalMsg, false, false);
    }
  }
}

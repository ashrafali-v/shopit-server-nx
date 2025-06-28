import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Ctx, RmqContext, Payload } from '@nestjs/microservices';
import { Channel, Message } from 'amqplib';
import { EmailService } from './email.service';
import { OrderConfirmationEmailEvent } from './interfaces/email.interface';

@Controller()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  @EventPattern('order_confirmation_email')
  async handleOrderConfirmationEmail(@Payload() data: OrderConfirmationEmailEvent, @Ctx() ctx: RmqContext) {
    const channel = ctx.getChannelRef() as Channel;
    const originalMsg = ctx.getMessage() as Message;

    try {
      this.logger.debug('Received order confirmation email event:', JSON.stringify(data));
      
      if (!data || !data.orderId) {
        throw new Error('Invalid message payload: missing required fields');
      }

      await this.emailService.sendOrderConfirmation(data);
      await channel.ack(originalMsg);
      this.logger.log(`Order confirmation email event handled for order #${data.orderId}`);
    } catch (error) {
      const retryCount = this.getRetryCount(originalMsg);
      this.logger.error(`Failed to handle order confirmation email (attempt ${retryCount + 1}):`, error);
      this.logger.debug('Message payload:', JSON.stringify(data));

      if (retryCount < 3) {
        await channel.nack(originalMsg, false, true);
      } else {
        this.logger.error(`Max retries reached for order confirmation email #${data?.orderId || 'unknown'}`);
        await channel.nack(originalMsg, false, false);
      }
    }
  }

  private getRetryCount(msg: Message): number {
    const deaths = msg.properties.headers['x-death'];
    if (!deaths) return 0;
    return deaths[0]?.count || 0;
  }
}

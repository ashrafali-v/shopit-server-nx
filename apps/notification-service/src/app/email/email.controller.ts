import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Ctx, RmqContext } from '@nestjs/microservices';
import { Channel, Message } from 'amqplib';
import { EmailService } from './email.service';
import { OrderConfirmationEmailEvent } from '../interfaces/email.interface';

@Controller()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  @EventPattern('order_confirmation_email')
  async handleOrderConfirmationEmail(data: OrderConfirmationEmailEvent, @Ctx() ctx: RmqContext) {
    const channel = ctx.getChannelRef() as Channel;
    const originalMsg = ctx.getMessage() as Message;

    try {
      await this.emailService.sendOrderConfirmation(data);
      await channel.ack(originalMsg);
      this.logger.log(`Order confirmation email event handled for order #${data.orderId}`);
    } catch (error) {
      const retryCount = this.getRetryCount(originalMsg);
      this.logger.error(`Failed to handle order confirmation email (attempt ${retryCount + 1}):`, error);

      if (retryCount < 3) {
        await channel.nack(originalMsg, false, true);
      } else {
        this.logger.error(`Max retries reached for order confirmation email #${data.orderId}`);
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

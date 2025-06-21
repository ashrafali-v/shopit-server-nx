import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { OrderConfirmationEmailEvent } from './interfaces/email.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendOrderConfirmation(data: OrderConfirmationEmailEvent) {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: `Order Confirmation #${data.orderId}`,
        template: 'order-confirmation',
        context: {
          name: data.customerName,
          orderId: data.orderId,
          items: data.items,
          total: data.totalAmount,
        },
      });
      this.logger.log(`Order confirmation email sent successfully for order #${data.orderId}`);
    } catch (error) {
      this.logger.error(`Failed to send order confirmation email for order #${data.orderId}:`, error);
      throw error;
    }
  }
}

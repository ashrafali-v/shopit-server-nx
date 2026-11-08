import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@shopit/shared';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'UTC' })
  async generateDailyOrdersReport(): Promise<void> {
    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);

    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 1);

    try {
      const summary = await this.prisma.order.aggregate({
        where: {
          status: 'completed',
          createdAt: { gte: start, lt: end },
        },
        _count: { _all: true },
        _sum: { totalAmount: true },
      });

      this.logger.log(
        `Daily report for orders placed on ${start.toISOString().slice(0, 10)}: ` +
          `${summary._count._all} completed orders, ` +
          `total ${summary._sum.totalAmount?.toString() ?? '0'}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to generate daily orders report: ${message}`, stack);
    }
  }
}

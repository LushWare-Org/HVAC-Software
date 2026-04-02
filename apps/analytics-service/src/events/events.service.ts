import { Injectable } from '@nestjs/common';
import { Prisma } from '../prisma/generated';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAnalyticsEventInput {
  companyId: string;
  eventType: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(input: CreateAnalyticsEventInput) {
    return this.prisma.analyticsEvent.create({
      data: {
        companyId: input.companyId,
        eventType: input.eventType,
        userId: input.userId,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }
}

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service'
import { IotService } from './iot.service'

@Injectable()
export class IotTokenRefreshService {
  private readonly logger = new Logger(IotTokenRefreshService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly iot: IotService,
  ) {}

  // Runs every 8 minutes
  // Honeywell tokens expire in 10 min → 2 min buffer
  // Nest tokens expire in 60 min → same cron catches them with 2 min buffer
  @Cron('0 */8 * * * *')
  async refreshExpiringTokens() {
    const cutoff = new Date(Date.now() + 2 * 60 * 1000)

    const connections = await this.prisma.customerIotConnection.findMany({
      where: { tokenExpiresAt: { lte: cutoff } },
      select: { id: true, provider: true, refreshToken: true },
    })

    if (connections.length === 0) return

    this.logger.log(`Refreshing ${connections.length} expiring IoT token(s)`)

    for (const conn of connections) {
      try {
        await this.iot.refreshConnectionToken(conn.id, conn.provider, conn.refreshToken)
        this.logger.log(`Refreshed ${conn.provider} token for connection ${conn.id}`)
      } catch (err) {
        this.logger.error(`Token refresh failed [${conn.provider}] ${conn.id}: ${(err as Error).message}`)
      }
    }
  }
}

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InternalApiKeyGuard } from '@tscrm/auth-client';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CustomerNotificationsService } from './customer-notifications.service';
import { CustomerPushDto } from './customer-push.dto';

/**
 * Service-to-service only (job-service's reminder sweep).
 *
 * This route used to be completely unguarded on the theory that it was only
 * reachable over an internal network. On Cloud Run that is not true: every
 * service has a public URL and the gateway proxies this one under
 * /api/comms/notifications/customer-push. Anyone could push an arbitrary title
 * and body to any customer of any tenant. The shared internal key is what now
 * proves the caller is one of our services.
 */
@ApiTags('Customer Notifications')
@Controller('notifications')
export class CustomerNotificationsController {
  constructor(private readonly service: CustomerNotificationsService) {}

  @Post('customer-push')
  @UseGuards(InternalApiKeyGuard)
  @ApiSecurity('x-internal-api-key')
  @ApiOperation({ summary: "Send a push to a customer, resolving their token and deduping" })
  send(@Body() dto: CustomerPushDto) {
    return this.service.pushToCustomer(dto);
  }
}

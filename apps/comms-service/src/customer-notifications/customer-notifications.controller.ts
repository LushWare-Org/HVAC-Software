import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomerNotificationsService } from './customer-notifications.service';
import { CustomerPushDto } from './customer-push.dto';

/**
 * Service-to-service only (job-service's reminder sweep). Unguarded for the
 * same reason as the activity-log ingest route: it is reached over the internal
 * network and carries no user context to authenticate against.
 */
@ApiTags('Customer Notifications')
@Controller('notifications')
export class CustomerNotificationsController {
  constructor(private readonly service: CustomerNotificationsService) {}

  @Post('customer-push')
  @ApiOperation({ summary: "Send a push to a customer, resolving their token and deduping" })
  send(@Body() dto: CustomerPushDto) {
    return this.service.pushToCustomer(dto);
  }
}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@tscrm/auth-client';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { LocationsModule } from './locations/locations.module';
import { InventoryItemsModule } from './inventory-items/inventory-items.module';
import { StockOperationsModule } from './stock-operations/stock-operations.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { AlertsModule } from './alerts/alerts.module';
import { AvailabilityModule } from './availability/availability.module';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['../../.env', '.env'],
    }),
    AuthModule,
    PrismaModule,
    HealthModule,
    LocationsModule,
    InventoryItemsModule,
    StockOperationsModule,
    PurchaseOrdersModule,
    AlertsModule,
    AvailabilityModule,
  ],
})
export class AppModule {}

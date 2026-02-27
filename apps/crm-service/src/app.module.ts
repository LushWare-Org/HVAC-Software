import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@tscrm/auth-client';
import { PrismaModule } from './prisma/prisma.module';
import { CustomersModule } from './customers/customers.module';
import { ContactsModule } from './contacts/contacts.module';
import { LeadsModule } from './leads/leads.module';
import { BookingsModule } from './bookings/bookings.module';
import { HealthModule } from './health/health.module';
import appConfig from './config/app.config';

@Module({
  imports: [
    // Load .env and expose typed config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['../../.env', '.env'],
    }),
    AuthModule,       // JWT strategy + guards (from shared package)
    PrismaModule,     // Prisma client (global)
    HealthModule,     // GET /health
    CustomersModule,  // GET/POST/PUT/DELETE /customers
    ContactsModule,   // GET/POST/PUT/DELETE /contacts
    LeadsModule,      // GET/POST/PUT/DELETE /leads
    BookingsModule,   // GET/POST/PUT/DELETE /bookings
  ],
})
export class AppModule {}

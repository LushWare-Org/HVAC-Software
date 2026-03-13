import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@tscrm/auth-client';
import { PrismaModule } from './prisma/prisma.module';
import { CustomersModule } from './customers/customers.module';
import { ContactsModule } from './contacts/contacts.module';
import { LeadsModule } from './leads/leads.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AddressesModule } from './addresses/addresses.module';
import { EquipmentModule } from './equipment/equipment.module';
import { UsersModule } from './users/users.module';
import { CompanyModule } from './company/company.module';
import { LocalAuthModule } from './auth/local-auth.module';
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
    LocalAuthModule,  // POST /auth/login (local email+password auth)
    CustomersModule,  // GET/POST/PUT/DELETE /customers
    ContactsModule,   // GET/POST/PUT/DELETE /contacts
    LeadsModule,      // GET/POST/PUT/DELETE /leads
    BookingsModule,   // GET/POST/PUT/DELETE /bookings
    ReviewsModule,    // GET/POST /reviews
    AddressesModule,  // GET/POST/PUT/DELETE /customers/:id/addresses & /leads/:id/addresses
    EquipmentModule,  // GET/POST/PUT/DELETE /customers/:id/equipment
    UsersModule,      // GET/POST/PATCH/DELETE /users
    CompanyModule,    // GET/PATCH /company
  ],
})
export class AppModule {}

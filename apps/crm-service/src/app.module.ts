import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@tscrm/auth-client';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './cache/cache.module';
import { CustomersModule } from './customers/customers.module';
import { ContactsModule } from './contacts/contacts.module';
import { LeadsModule } from './leads/leads.module';
import { BookingsModule } from './bookings/bookings.module';
import { AgreementsModule } from './agreements/agreements.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AddressesModule } from './addresses/addresses.module';
import { EquipmentModule } from './equipment/equipment.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './users/users.module';
import { CompanyModule } from './company/company.module';
import { LocalAuthModule } from './auth/local-auth.module';
import { HealthModule } from './health/health.module';
import { FollowupModule } from './followup/followup.module';
import { UpsellModule } from './upsell/upsell.module';
import { MetaModule } from './meta/meta.module';
import { ImportModule } from './import/import.module';
import { IotModule } from './iot/iot.module';
import { ProjectsModule } from './projects/projects.module';
import { DocumentTemplatesModule } from './document-templates/document-templates.module';
import { ProjectTemplatesModule } from './project-templates/project-templates.module';
import { ProjectComponentsModule } from './project-components/project-components.module';
// HousesModule intentionally not imported/registered — superseded by
// ProjectComponentsModule (spec: docs/superpowers/specs/2026-08-14-project-component-templates-design.md).
// Files kept on disk until the Task 9 cleanup pass; not loaded here.
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
    CacheModule,
    HealthModule,
    LocalAuthModule,
    CustomersModule,
    ContactsModule,
    LeadsModule,
    BookingsModule,
    AgreementsModule,
    ReviewsModule,
    AddressesModule,
    EquipmentModule,
    AnnouncementsModule,
    PostsModule,
    UsersModule,
    CompanyModule,
    FollowupModule,
    UpsellModule,
    MetaModule,
    ImportModule,
    IotModule,
    ProjectsModule,
    DocumentTemplatesModule,
    ProjectTemplatesModule,
    ProjectComponentsModule,
  ],
})
export class AppModule {}

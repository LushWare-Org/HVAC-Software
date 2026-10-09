import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { requireJwtSecret } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import { locationToken, readLocationToken, validPoint } from './location-token';

const COMMS_URL = (process.env.COMMS_SERVICE_URL || 'http://localhost:3005').replace(/\/$/, '');
const PORTAL_URL = (process.env.CUSTOMER_PORTAL_URL || 'http://localhost:5174').replace(/\/$/, '');

export type RequestChannel = 'message' | 'email' | 'push';
const OPEN = ['PENDING', 'SCHEDULED', 'EN_ROUTE', 'ON_HOLD'];

function commsHeaders(companyId: string) {
  const token = jwt.sign(
    { sub: 'system-job-service', company_id: companyId, role: 'company_admin', name: 'Job Service', iss: 'tscrm-local' },
    requireJwtSecret(),
    { expiresIn: '5m' },
  );
  return { Authorization: `Bearer ${token}` };
}

/**
 * Asking a customer where a visit is, and taking their answer. The office (or
 * Kelvin) sends a link by in-app message, email and/or push; the customer drops
 * a pin on a map, signed in or not; the job gets its coordinates and dispatch
 * can measure distance again.
 */
@Injectable()
export class LocationRequestsService {
  private readonly logger = new Logger(LocationRequestsService.name);

  constructor(private readonly prisma: PrismaService, private readonly jobs: JobsService) {}

  async request(user: AuthUser, jobId: string, channels: RequestChannel[]) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId: user.companyId },
      select: { id: true, jobNumber: true, title: true, status: true, customerId: true, customerName: true },
    });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    if (!job.customerId) throw new BadRequestException('This job has no customer to ask');
    if (!OPEN.includes(job.status as string)) throw new BadRequestException('This visit is already done, so its location is no longer needed');
    const want = channels.filter((c, i) => ['message', 'email', 'push'].includes(c) && channels.indexOf(c) === i);
    if (!want.length) throw new BadRequestException('Choose at least one way to ask');

    const url = `${PORTAL_URL}/share-location/${locationToken(user.companyId, job.id)}`;
    const text =
      `So our technician can find you for "${job.title}" (${job.jobNumber}), please mark where the visit is on the map: ${url}`;
    const headers = commsHeaders(user.companyId);
    const results: Partial<Record<RequestChannel, string>> = {};

    if (want.includes('message')) {
      try {
        // Into the customer's conversation with the office, sent as the company.
        await axios.post(`${COMMS_URL}/chat/customers/${job.customerId}/messages`, { body: text, jobId: job.id }, { headers, timeout: 8000 });
        results.message = 'sent';
      } catch (err) {
        this.logger.warn(`location request message failed: ${(err as Error).message}`);
        results.message = 'failed';
      }
    }
    // The chat message already pushes to their phone/browser: don't push the same thing twice.
    if (want.includes('message') && want.includes('push')) results.push = 'with-message';
    const direct = want.filter((c) => c !== 'message' && !(c === 'push' && want.includes('message')));
    if (direct.length) {
      try {
        const res = (await axios.post(`${COMMS_URL}/notifications/direct`, {
          to: 'customer', id: job.customerId, jobId: job.id, channels: direct,
          title: 'Where should we come?', message: text,
        }, { headers, timeout: 10000 })).data;
        Object.assign(results, res?.results ?? {});
      } catch (err) {
        this.logger.warn(`location request email/push failed: ${(err as Error).message}`);
        for (const c of direct) results[c] = 'failed';
      }
    }
    return { url, results };
  }

  /** What the share-location page shows. Only what the customer needs to recognise their visit. */
  async preview(token: string) {
    const ref = readLocationToken(token);
    if (!ref) throw new NotFoundException('This link is no longer valid');
    const job = await this.prisma.job.findFirst({
      where: { id: ref.jobId, companyId: ref.companyId },
      select: { jobNumber: true, title: true, status: true, serviceAddress: true, serviceCity: true, serviceLatitude: true, serviceLongitude: true, scheduledStart: true, customerName: true },
    });
    if (!job) throw new NotFoundException('This link is no longer valid');
    return {
      jobNumber: job.jobNumber, title: job.title, customerName: job.customerName,
      // The city only when the address doesn't already end with it.
      address: (job.serviceCity && !(job.serviceAddress ?? '').toLowerCase().includes(job.serviceCity.toLowerCase())
        ? [job.serviceAddress, job.serviceCity].filter(Boolean).join(', ')
        : job.serviceAddress) || null,
      scheduledStart: job.scheduledStart, open: OPEN.includes(job.status as string),
      lat: job.serviceLatitude != null ? Number(job.serviceLatitude) : null,
      lng: job.serviceLongitude != null ? Number(job.serviceLongitude) : null,
    };
  }

  async submitByToken(token: string, body: { lat?: unknown; lng?: unknown; address?: string }) {
    const ref = readLocationToken(token);
    if (!ref) throw new NotFoundException('This link is no longer valid');
    return this.save(ref.companyId, ref.jobId, body, { name: 'Customer (shared link)' });
  }

  async submitByCustomer(user: AuthUser, jobId: string, body: { lat?: unknown; lng?: unknown; address?: string }) {
    if (user.role !== Role.CUSTOMER) throw new ForbiddenException('This is for customers');
    const job = await this.prisma.job.findFirst({ where: { id: jobId, companyId: user.companyId }, select: { customerId: true } });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    if (job.customerId !== user.customerId) throw new ForbiddenException('You can only set the location of your own visits');
    return this.save(user.companyId, jobId, body, { userId: user.userId, name: user.name ?? 'Customer' });
  }

  private async save(companyId: string, jobId: string, body: { lat?: unknown; lng?: unknown; address?: string }, actor: { userId?: string; name: string }) {
    const point = validPoint(body.lat, body.lng);
    if (!point) throw new BadRequestException('Drop the pin on the map first');
    const job = await this.prisma.job.findFirst({ where: { id: jobId, companyId }, select: { status: true } });
    if (!job) throw new NotFoundException('This link is no longer valid');
    if (!OPEN.includes(job.status as string)) throw new BadRequestException('This visit is already done, so the location can no longer be changed');
    const updated = await this.jobs.setServiceLocation(companyId, jobId, { ...point, address: body.address }, actor as any);
    return { ok: true, jobNumber: updated.jobNumber, lat: point.lat, lng: point.lng };
  }
}

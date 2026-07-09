import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../prisma/generated';
import { StorageService } from '../storage/storage.service';
import { clampPagination } from '@tscrm/types';

const JWT_SECRET = process.env.JWT_SECRET || 'tscrm-local-jwt-secret-change-in-production';
const COMMS_SERVICE_URL = process.env.COMMS_SERVICE_URL || 'http://localhost:3005';
const APP_NAME = process.env.APP_NAME || 'T&S Services';

function isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async findAll(companyId: string, params: { role?: string; search?: string; isActive?: boolean; page?: number; limit?: number }) {
    const { role, search, isActive } = params;
    const { page, limit, skip } = clampPagination({ page: params.page, limit: params.limit }, { defaultLimit: 50 });

    const where: any = { companyId };
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.companyUser.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
      this.prisma.companyUser.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(companyId: string, id: string) {
    const user = await this.prisma.companyUser.findFirst({ where: { id, companyId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findMe(companyId: string, userId: string) {
    const user = await this.prisma.companyUser.findFirst({
      where: { companyId, OR: [{ id: userId }, { auth0UserId: userId }] },
    });
    if (!user) throw new NotFoundException('User profile not found');
    return user;
  }

  // ---- Avatar (technician photo shown to customers in en-route emails) ----

  private static readonly AVATAR_MIMES: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  private static readonly AVATAR_MAX_BYTES = 2 * 1024 * 1024;

  /** Upload/replace the avatar for the current user (by auth identity). */
  async setMyAvatar(companyId: string, userId: string, file: { buffer: Buffer; mimetype: string; size: number }) {
    const user = await this.findMe(companyId, userId);
    return this.storeAvatar(companyId, user.id, user.avatarUrl, file);
  }

  /** Admin variant: upload/replace the avatar for a specific company user. */
  async setUserAvatar(companyId: string, targetUserId: string, file: { buffer: Buffer; mimetype: string; size: number }) {
    const user = await this.findOne(companyId, targetUserId);
    return this.storeAvatar(companyId, user.id, user.avatarUrl, file);
  }

  async removeMyAvatar(companyId: string, userId: string) {
    const user = await this.findMe(companyId, userId);
    if (user.avatarUrl) {
      const oldKey = this.storage.keyFromUrl(user.avatarUrl);
      if (oldKey) await this.storage.deleteObject(oldKey);
    }
    return this.prisma.companyUser.update({ where: { id: user.id }, data: { avatarUrl: null } });
  }

  private async storeAvatar(
    companyId: string,
    userRecordId: string,
    previousUrl: string | null,
    file: { buffer: Buffer; mimetype: string; size: number },
  ) {
    const ext = UsersService.AVATAR_MIMES[file.mimetype];
    if (!ext) throw new BadRequestException('Photo must be a JPEG, PNG or WebP image');
    if (file.size > UsersService.AVATAR_MAX_BYTES) {
      throw new BadRequestException('Photo is too large — maximum size is 2 MB');
    }

    const key = `avatars/${companyId}/${userRecordId}-${randomUUID()}.${ext}`;
    const avatarUrl = await this.storage.putPublicObject(key, file.buffer, file.mimetype);

    if (previousUrl) {
      const oldKey = this.storage.keyFromUrl(previousUrl);
      if (oldKey) await this.storage.deleteObject(oldKey);
    }

    return this.prisma.companyUser.update({ where: { id: userRecordId }, data: { avatarUrl } });
  }

  async getPendingTechnicians(companyId: string) {
    const data = await this.prisma.companyUser.findMany({
      where: { companyId, role: 'technician', approvalStatus: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    return { data, total: data.length };
  }

  async approveTechnician(companyId: string, id: string) {
    const user = await this.findOne(companyId, id);
    if (user.role !== 'technician') throw new NotFoundException('User is not a technician');
    if (user.approvalStatus === 'APPROVED') return user;

    // 1. Activate user in CRM
    const updated = await this.prisma.companyUser.update({
      where: { id },
      data: { approvalStatus: 'APPROVED', isActive: true },
    });

    // 2. Create scheduling profile via direct SQL (same DB, different schema)
    try {
      const skillsLiteral = user.skills && user.skills.length > 0
        ? `ARRAY[${user.skills.map(s => `'${s.replace(/'/g, "''")}'`).join(',')}]::text[]`
        : `ARRAY[]::text[]`;

      if (user.latitude && user.longitude) {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO scheduling.technicians
             (company_id, user_id, name, phone, skills, max_daily_jobs, current_location, last_seen_at)
           VALUES ($1, $2, $3, $4, ${skillsLiteral}, 8,
             ST_SetSRID(ST_MakePoint($5, $6), 4326), NOW())
           ON CONFLICT (company_id, user_id) DO UPDATE SET
             is_active = TRUE,
             skills = EXCLUDED.skills,
             current_location = EXCLUDED.current_location,
             updated_at = NOW()`,
          companyId, user.id, user.name, user.phone ?? '',
          user.longitude, user.latitude,
        );
      } else {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO scheduling.technicians
             (company_id, user_id, name, phone, skills, max_daily_jobs)
           VALUES ($1, $2, $3, $4, ${skillsLiteral}, 8)
           ON CONFLICT (company_id, user_id) DO UPDATE SET
             is_active = TRUE,
             skills = EXCLUDED.skills,
             updated_at = NOW()`,
          companyId, user.id, user.name, user.phone ?? '',
        );
      }
      this.logger.log(`Scheduling profile created/updated for technician ${id}`);
    } catch (err) {
      this.logger.warn(`Could not create scheduling profile for ${id}: ${err}`);
    }

    // 3. Send approval email via comms service
    try {
      await this._sendApprovalEmail(companyId, user.id, user.name, user.email);
    } catch (err) {
      this.logger.warn(`Could not send approval email to ${user.email}: ${err}`);
    }

    return updated;
  }

  async rejectTechnician(companyId: string, id: string, note?: string) {
    const user = await this.findOne(companyId, id);
    if (user.role !== 'technician') throw new NotFoundException('User is not a technician');

    const updated = await this.prisma.companyUser.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        isActive: false,
        approvalNote: note ?? 'Your application was not approved.',
      },
    });

    // Send rejection email
    try {
      await this._sendRejectionEmail(companyId, user.id, user.name, user.email, updated.approvalNote ?? '');
    } catch (err) {
      this.logger.warn(`Could not send rejection email to ${user.email}: ${err}`);
    }

    return updated;
  }

  /** Generate a short-lived system JWT to call internal services */
  private _systemToken(companyId: string): string {
    return jwt.sign(
      { sub: 'system', company_id: companyId, role: 'company_admin', name: 'System', iss: 'tscrm-local' },
      JWT_SECRET,
      { expiresIn: '5m', algorithm: 'HS256' },
    );
  }

  private async _sendApprovalEmail(companyId: string, userId: string, name: string, email: string) {
    const token = this._systemToken(companyId);
    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0f1117;color:#e2e8f0;border-radius:12px;">
        <h1 style="color:#3b82f6;font-size:24px;margin-bottom:8px;">🎉 You're Approved!</h1>
        <p style="font-size:16px;line-height:1.6;margin-bottom:16px;">Hi <strong>${name}</strong>,</p>
        <p style="font-size:15px;line-height:1.7;color:#94a3b8;">
          Your technician account at <strong>${APP_NAME}</strong> has been reviewed and approved.
          You can now sign in to the T&S Technician app and start receiving job assignments.
        </p>
        <div style="margin:28px 0;padding:20px;background:#1e293b;border-radius:8px;border-left:4px solid #3b82f6;">
          <p style="margin:0;font-size:14px;color:#cbd5e1;">
            Open the <strong>T&S Technician</strong> app and sign in with your registered email and password.
          </p>
        </div>
        <p style="font-size:13px;color:#64748b;margin-top:24px;">
          If you have any questions, please contact your dispatcher or office manager.
        </p>
        <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;" />
        <p style="font-size:12px;color:#475569;">© ${APP_NAME} — T&S CRM</p>
      </div>`;

    const res = await fetch(`${COMMS_SERVICE_URL}/notifications/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipientId: userId,
        recipientName: name,
        recipientEmail: email,
        subject: `✅ Your ${APP_NAME} technician account has been approved`,
        htmlBody: html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Comms service responded ${res.status}: ${body}`);
    }
  }

  private async _sendRejectionEmail(companyId: string, userId: string, name: string, email: string, reason: string) {
    const token = this._systemToken(companyId);
    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0f1117;color:#e2e8f0;border-radius:12px;">
        <h1 style="color:#ef4444;font-size:22px;margin-bottom:8px;">Application Update</h1>
        <p style="font-size:16px;line-height:1.6;margin-bottom:16px;">Hi <strong>${name}</strong>,</p>
        <p style="font-size:15px;line-height:1.7;color:#94a3b8;">
          Thank you for applying to join <strong>${APP_NAME}</strong> as a technician.
          After review, we are unable to approve your application at this time.
        </p>
        ${reason ? `<div style="margin:24px 0;padding:16px;background:#1e293b;border-radius:8px;border-left:4px solid #ef4444;">
          <p style="margin:0;font-size:14px;color:#cbd5e1;"><strong>Reason:</strong> ${reason}</p>
        </div>` : ''}
        <p style="font-size:13px;color:#64748b;margin-top:24px;">
          If you believe this is an error, please contact the admin directly.
        </p>
        <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;" />
        <p style="font-size:12px;color:#475569;">© ${APP_NAME} — T&S CRM</p>
      </div>`;

    const res = await fetch(`${COMMS_SERVICE_URL}/notifications/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipientId: userId,
        recipientName: name,
        recipientEmail: email,
        subject: `Your ${APP_NAME} technician application status`,
        htmlBody: html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Comms service responded ${res.status}: ${body}`);
    }
  }

  async create(companyId: string, data: { name: string; email: string; phone?: string; role?: string; auth0UserId?: string }) {
    let user;
    try {
      user = await this.prisma.companyUser.create({
        data: { companyId, ...data },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('A user with this email already exists in your company');
      }
      throw error;
    }

    // If creating an active technician, also provision their scheduling profile
    if (user.role === 'technician' && user.isActive) {
      try {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO scheduling.technicians
             (company_id, user_id, name, phone, skills, max_daily_jobs)
           VALUES ($1, $2, $3, $4, ARRAY[]::text[], 8)
           ON CONFLICT (company_id, user_id) DO NOTHING`,
          companyId, user.id, user.name, user.phone ?? '',
        );
      } catch (err) {
        this.logger.warn(`Could not create scheduling profile for new technician ${user.id}: ${err}`);
      }
    }

    return user;
  }

  async updateMe(companyId: string, userId: string, data: { name?: string; phone?: string }) {
    const user = await this.findMe(companyId, userId);
    return this.prisma.companyUser.update({ where: { id: user.id }, data });
  }

  /** Register or refresh the current user's push notification token. Idempotent. */
  async registerPushToken(
    companyId: string,
    userId: string,
    token: string,
    platform?: string,
  ) {
    const user = await this.findMe(companyId, userId);
    return this.prisma.companyUser.update({
      where: { id: user.id },
      data: {
        pushToken: token,
        pushPlatform: platform ?? user.pushPlatform ?? null,
        pushTokenUpdatedAt: new Date(),
      },
      select: { id: true, pushPlatform: true, pushTokenUpdatedAt: true },
    });
  }

  /** Clear the current user's push token (called on logout / device sign-out). */
  async clearPushToken(companyId: string, userId: string) {
    const user = await this.findMe(companyId, userId);
    await this.prisma.companyUser.update({
      where: { id: user.id },
      data: { pushToken: null, pushPlatform: null, pushTokenUpdatedAt: new Date() },
    });
    return { ok: true };
  }

  async update(companyId: string, id: string, data: { name?: string; email?: string; phone?: string; role?: string; isActive?: boolean }) {
    await this.findOne(companyId, id);
    try {
      return await this.prisma.companyUser.update({ where: { id }, data });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('A user with this email already exists in your company');
      }
      throw error;
    }
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.companyUser.delete({ where: { id } });
  }

  async getLoginHistory(companyId: string, userId: string) {
    try {
      return await this.prisma.userLoginEvent.findMany({
        where: { companyId, userId },
        orderBy: { loggedInAt: 'desc' },
        take: 20,
        select: { id: true, loggedInAt: true, ipAddress: true, userAgent: true },
      });
    } catch {
      return [];
    }
  }
}

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PartnerContext } from './partner-context';
import { isKnownScope } from './scopes';

/** Secret half of the key, in hex characters. 32 bytes = 256 bits. */
const SECRET_BYTES = 32;
const PREFIX_DISPLAY_LENGTH = 16;

export interface IssuedKey {
  id: string;
  name: string;
  key: string;
  keyPrefix: string;
  environment: 'LIVE' | 'SANDBOX';
  scopes: string[];
  rateLimitPerMin: number;
  expiresAt: Date | null;
}

const DEFAULT_KEY_CACHE_TTL_SEC = 10;

interface CachedVerification {
  partner: PartnerContext;
  expiresAtMs: number;
}

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);
  /** keyId -> epoch ms of the last lastUsedAt write, to throttle that write. */
  private readonly lastUsedWrites = new Map<string, number>();
  /** keyHash -> recently verified context. */
  private readonly verifiedCache = new Map<string, CachedVerification>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ------------------------------------------------------------------
  // Hashing
  // ------------------------------------------------------------------

  /**
   * SHA-256 rather than bcrypt/argon2 deliberately: the key is 256 bits of
   * CSPRNG output, so there is no low-entropy password to brute-force, and
   * this sits on the hot path of every partner request.
   */
  static hashKey(plaintext: string): string {
    return createHash('sha256').update(plaintext, 'utf8').digest('hex');
  }

  private static generatePlaintext(environment: 'LIVE' | 'SANDBOX'): string {
    const tag = environment === 'SANDBOX' ? 'test' : 'live';
    return `pk_${tag}_${randomBytes(SECRET_BYTES).toString('hex')}`;
  }

  // ------------------------------------------------------------------
  // Issue / list / revoke  (admin-facing)
  // ------------------------------------------------------------------

  async create(params: {
    companyId: string;
    name: string;
    scopes: string[];
    environment?: 'LIVE' | 'SANDBOX';
    rateLimitPerMin?: number;
    expiresAt?: Date | null;
    createdBy?: string;
  }): Promise<IssuedKey> {
    const unknown = params.scopes.filter((s) => !isKnownScope(s));
    if (unknown.length) {
      throw new BadRequestException(`Unknown scope(s): ${unknown.join(', ')}`);
    }

    const environment = params.environment ?? 'LIVE';
    const plaintext = ApiKeysService.generatePlaintext(environment);

    const record = await this.prisma.partnerApiKey.create({
      data: {
        companyId: params.companyId,
        name: params.name,
        environment,
        keyPrefix: plaintext.slice(0, PREFIX_DISPLAY_LENGTH),
        keyHash: ApiKeysService.hashKey(plaintext),
        scopes: params.scopes,
        rateLimitPerMin:
          params.rateLimitPerMin ??
          this.config.get<number>('app.defaultRateLimitPerMin', 60),
        expiresAt: params.expiresAt ?? null,
        createdBy: params.createdBy ?? null,
      },
    });

    this.logger.log(
      `Issued partner key ${record.keyPrefix}… for company ${params.companyId} (${params.scopes.length} scopes)`,
    );

    return {
      id: record.id,
      name: record.name,
      key: plaintext,
      keyPrefix: record.keyPrefix,
      environment: record.environment,
      scopes: record.scopes,
      rateLimitPerMin: record.rateLimitPerMin,
      expiresAt: record.expiresAt,
    };
  }

  async list(companyId: string) {
    const keys = await this.prisma.partnerApiKey.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    // keyHash is never returned — not even to an admin.
    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      environment: k.environment,
      scopes: k.scopes,
      rateLimitPerMin: k.rateLimitPerMin,
      status: k.status,
      lastUsedAt: k.lastUsedAt,
      expiresAt: k.expiresAt,
      createdAt: k.createdAt,
      revokedAt: k.revokedAt,
    }));
  }

  async revoke(companyId: string, id: string) {
    const existing = await this.prisma.partnerApiKey.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      throw new NotFoundException('API key not found');
    }

    this.lastUsedWrites.delete(id);
    // Drop any cached verification so the revocation takes effect immediately
    // on this instance rather than after the cache TTL.
    for (const [hash, entry] of this.verifiedCache) {
      if (entry.partner.keyId === id) {
        this.verifiedCache.delete(hash);
      }
    }

    const updated = await this.prisma.partnerApiKey.update({
      where: { id },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });

    this.logger.warn(`Revoked partner key ${updated.keyPrefix}… (${id})`);
    return { id: updated.id, status: updated.status, revokedAt: updated.revokedAt };
  }

  // ------------------------------------------------------------------
  // Verification  (hot path)
  // ------------------------------------------------------------------

  /**
   * Resolves a plaintext key to a PartnerContext, or null when the key is
   * unknown, revoked or expired. Callers must not distinguish between those
   * cases in the response — all three are a flat 401.
   */
  async verify(plaintext: string): Promise<PartnerContext | null> {
    if (!plaintext || typeof plaintext !== 'string') {
      return null;
    }

    const hash = ApiKeysService.hashKey(plaintext);

    const cached = this.verifiedCache.get(hash);
    if (cached && cached.expiresAtMs > Date.now()) {
      void this.touchLastUsed(cached.partner.keyId);
      return cached.partner;
    }

    const record = await this.prisma.partnerApiKey.findUnique({
      where: { keyHash: hash },
    });

    if (!record) {
      return null;
    }

    // Constant-time re-check. findUnique already matched on the hash, so this
    // is belt-and-braces against any future non-exact lookup landing here.
    const a = Buffer.from(record.keyHash, 'hex');
    const b = Buffer.from(hash, 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }

    if (record.status !== 'ACTIVE') {
      return null;
    }
    if (record.expiresAt && record.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    void this.touchLastUsed(record.id);

    const partner: PartnerContext = {
      keyId: record.id,
      companyId: record.companyId,
      name: record.name,
      environment: record.environment,
      scopes: record.scopes,
      rateLimitPerMin: record.rateLimitPerMin,
    };

    const ttlSec = Number(
      process.env.PARTNER_KEY_CACHE_TTL_SEC ?? DEFAULT_KEY_CACHE_TTL_SEC,
    );
    if (ttlSec > 0) {
      if (this.verifiedCache.size > 1000) {
        this.verifiedCache.clear();
      }
      this.verifiedCache.set(hash, {
        partner,
        // Never outlive the key itself.
        expiresAtMs: Math.min(
          Date.now() + ttlSec * 1000,
          record.expiresAt?.getTime() ?? Number.MAX_SAFE_INTEGER,
        ),
      });
    }

    return partner;
  }

  /** Rewrites lastUsedAt at most once per configured interval, per key. */
  private async touchLastUsed(keyId: string): Promise<void> {
    const intervalMs =
      this.config.get<number>('app.lastUsedWriteIntervalSec', 60) * 1000;
    const previous = this.lastUsedWrites.get(keyId) ?? 0;
    const now = Date.now();

    if (now - previous < intervalMs) {
      return;
    }
    this.lastUsedWrites.set(keyId, now);

    try {
      await this.prisma.partnerApiKey.update({
        where: { id: keyId },
        data: { lastUsedAt: new Date(now) },
      });
    } catch (err) {
      // Never fail a request because the usage stamp could not be written.
      this.logger.debug(`lastUsedAt update failed for ${keyId}: ${err}`);
    }
  }
}

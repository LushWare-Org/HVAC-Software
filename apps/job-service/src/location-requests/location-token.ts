import * as jwt from 'jsonwebtoken';
import { requireJwtSecret } from '@tscrm/auth-client';

/**
 * The link a customer opens to put their visit on the map. Signed, not stored:
 * it carries the job and company, works for 14 days, and is useless for
 * anything else (its own audience).
 */
const AUDIENCE = 'job-location';
const LIFETIME = '14d';

export function locationToken(companyId: string, jobId: string): string {
  return jwt.sign({ jobId, companyId }, requireJwtSecret(), { audience: AUDIENCE, expiresIn: LIFETIME });
}

export function readLocationToken(token: string): { jobId: string; companyId: string } | null {
  try {
    const p = jwt.verify(token, requireJwtSecret(), { audience: AUDIENCE }) as { jobId?: string; companyId?: string };
    return p.jobId && p.companyId ? { jobId: p.jobId, companyId: p.companyId } : null;
  } catch {
    return null;
  }
}

export function validPoint(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  const a = Number(lat);
  const b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a) > 90 || Math.abs(b) > 180 || (a === 0 && b === 0)) return null;
  return { lat: a, lng: b };
}

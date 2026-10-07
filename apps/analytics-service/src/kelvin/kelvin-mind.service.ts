import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Who is asking: notes and routines are always scoped to their company, and personal ones to them. */
export interface Who { companyId: string; userId: string; role: string; name?: string }
export interface NoteView { id: string; text: string; forEveryone: boolean; createdByName: string | null; createdAt: string }
export interface RoutineView { id: string; request: string; days: number[]; time: string; timezone: string }

const LEADS = ['super_admin', 'company_admin', 'office_manager'];
const NOTE_MAX = 300;
const NOTES_PER_PERSON = 30;
const NOTES_PER_COMPANY = 50;
const ROUTINES_PER_PERSON = 10;
const HABIT_DAYS = 60;
const HABIT_MIN = 3;

const lead = (w: Who) => LEADS.includes(String(w.role).toLowerCase());
const noteView = (n: any): NoteView => ({
  id: n.id, text: n.text, forEveryone: n.userId === null, createdByName: n.createdByName ?? null, createdAt: new Date(n.createdAt).toISOString(),
});
const routineView = (r: any): RoutineView => ({ id: r.id, request: r.request, days: r.days, time: r.time, timezone: r.timezone });

function validZone(tz: string): boolean {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; }
}

/** What Kelvin knows beyond today: notes he was asked to keep, routines, and habits learned from what people do. */
@Injectable()
export class KelvinMindService {
  constructor(private readonly prisma: PrismaService) {}

  async notes(w: Who): Promise<NoteView[]> {
    const rows = await this.prisma.kelvinNote.findMany({
      where: { companyId: w.companyId, OR: [{ userId: null }, { userId: w.userId }] },
      orderBy: { createdAt: 'asc' },
    });
    // Company notes first, then the person's own.
    return [...rows.filter((r: any) => r.userId === null), ...rows.filter((r: any) => r.userId !== null)].map(noteView);
  }

  async addNote(w: Who, input: { text?: unknown; forEveryone?: unknown }): Promise<NoteView> {
    const text = String(input?.text ?? '').replace(/\s+/g, ' ').trim();
    if (!text) throw new BadRequestException('What should I remember?');
    if (text.length > NOTE_MAX) throw new BadRequestException(`Keep a note under ${NOTE_MAX} characters.`);
    const forEveryone = input?.forEveryone === true;
    if (forEveryone && !lead(w)) throw new ForbiddenException('Only an admin or office manager can add a note for everyone.');
    const owner = forEveryone ? null : w.userId;
    const count = await this.prisma.kelvinNote.count({ where: { companyId: w.companyId, userId: owner } });
    const max = forEveryone ? NOTES_PER_COMPANY : NOTES_PER_PERSON;
    if (count >= max) throw new BadRequestException(`I keep at most ${max} notes${forEveryone ? ' for everyone' : ' for you'}. Remove one first.`);
    const row = await this.prisma.kelvinNote.create({
      data: { companyId: w.companyId, userId: owner, text, createdBy: w.userId, createdByName: w.name?.slice(0, 120) ?? null },
    });
    return noteView(row);
  }

  async removeNote(w: Who, id: string): Promise<{ ok: true }> {
    const row: any = await this.prisma.kelvinNote.findFirst({ where: { id, companyId: w.companyId, OR: [{ userId: null }, { userId: w.userId }] } });
    if (!row) throw new NotFoundException('That note was not found.');
    if (row.userId === null && !lead(w)) throw new ForbiddenException('Only an admin or office manager can remove a note for everyone.');
    await this.prisma.kelvinNote.delete({ where: { id: row.id } });
    return { ok: true };
  }

  async routines(w: Who): Promise<RoutineView[]> {
    const rows = await this.prisma.kelvinRoutine.findMany({ where: { companyId: w.companyId, userId: w.userId }, orderBy: { createdAt: 'asc' } });
    return rows.map(routineView);
  }

  async addRoutine(w: Who, input: { request?: unknown; days?: unknown; time?: unknown; timezone?: unknown }): Promise<RoutineView> {
    const request = String(input?.request ?? '').replace(/\s+/g, ' ').trim();
    if (!request) throw new BadRequestException('What should the routine do?');
    if (request.length > NOTE_MAX) throw new BadRequestException(`Keep the routine under ${NOTE_MAX} characters.`);
    const days = [...new Set((Array.isArray(input?.days) ? input.days : []).map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
    if (!days.length) throw new BadRequestException('Say which days the routine runs on.');
    const time = String(input?.time ?? '');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new BadRequestException('Give the time as HH:MM, e.g. 08:00.');
    const timezone = String(input?.timezone || 'UTC');
    if (!validZone(timezone)) throw new BadRequestException('Unknown time zone.');
    const count = await this.prisma.kelvinRoutine.count({ where: { companyId: w.companyId, userId: w.userId } });
    if (count >= ROUTINES_PER_PERSON) throw new BadRequestException(`You can have at most ${ROUTINES_PER_PERSON} routines. Remove one first.`);
    const row = await this.prisma.kelvinRoutine.create({ data: { companyId: w.companyId, userId: w.userId, request, days, time, timezone } });
    return routineView(row);
  }

  async removeRoutine(w: Who, id: string): Promise<{ ok: true }> {
    const row: any = await this.prisma.kelvinRoutine.findFirst({ where: { id, companyId: w.companyId, userId: w.userId } });
    if (!row) throw new NotFoundException('That routine was not found.');
    await this.prisma.kelvinRoutine.delete({ where: { id: row.id } });
    return { ok: true };
  }

  /** Learned from what this person does: steps they keep unticking on Kelvin's cards. */
  async habits(w: Who): Promise<{ usuallySkips: Array<{ action: string; times: number }> }> {
    const since = new Date(Date.now() - HABIT_DAYS * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.kelvinEvent.findMany({
      where: { companyId: w.companyId, userId: w.userId, type: 'STEP_SKIPPED', createdAt: { gte: since } },
      select: { action: true },
      take: 500,
    });
    const counts = new Map<string, number>();
    for (const r of rows as Array<{ action: string | null }>) if (r.action) counts.set(r.action, (counts.get(r.action) ?? 0) + 1);
    const usuallySkips = [...counts].filter(([, n]) => n >= HABIT_MIN).sort((a, b) => b[1] - a[1]).map(([action, times]) => ({ action, times }));
    return { usuallySkips };
  }

  /** Everything Kelvin brings into a conversation, in one call. */
  async mind(w: Who) {
    const [notes, routines, habits] = await Promise.all([this.notes(w), this.routines(w), this.habits(w)]);
    return { notes, routines, habits };
  }
}

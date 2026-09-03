import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_SLOT_HOURS = 2;
const DEFAULT_DAY_START_HOUR = 8;
const DEFAULT_DAY_END_HOUR = 17;
/** 0 = Sunday. Trades typically work Mon–Sat. */
const DEFAULT_CLOSED_WEEKDAYS = [0];
const DEFAULT_MIN_LEAD_HOURS = 2;

export interface AvailableSlot {
  start: string;
  end: string;
  label: string;
  remainingCapacity: number;
}

/** Offset of a timezone from UTC, in ms, at a given instant. */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
    .formatToParts(instant)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value;
      return acc;
    }, {});

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - instant.getTime();
}

function zonedToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, 0, 0);
  let offset = zoneOffsetMs(new Date(guess), timeZone);
  let result = guess - offset;
  offset = zoneOffsetMs(new Date(result), timeZone);
  result = guess - offset;
  return new Date(result);
}

/** Calendar date and weekday in `timeZone` for an instant. */
function zonedParts(instant: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(instant);
  const get = (t: string) => fmt.find((p) => p.type === t)?.value ?? '';
  const weekdayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
    get('weekday'),
  );
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday: weekdayIndex,
  };
}

@Injectable()
export class BookingAvailabilityService {
  private readonly logger = new Logger(BookingAvailabilityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findSlots(
    companyId: string,
    opts: { limit?: number; daysAhead?: number; from?: Date } = {},
  ): Promise<{ timezone: string; capacityPerSlot: number; slots: AvailableSlot[] }> {
    const limit = Math.min(Math.max(opts.limit ?? 6, 1), 50);
    const daysAhead = Math.min(Math.max(opts.daysAhead ?? 14, 1), 60);

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { timezone: true },
    });
    const timeZone = this.safeTimeZone(company?.timezone);

    const slotHours = Number(process.env.BOOKING_SLOT_HOURS ?? DEFAULT_SLOT_HOURS);
    const dayStart = Number(process.env.BOOKING_DAY_START_HOUR ?? DEFAULT_DAY_START_HOUR);
    const dayEnd = Number(process.env.BOOKING_DAY_END_HOUR ?? DEFAULT_DAY_END_HOUR);
    const minLeadMs =
      Number(process.env.BOOKING_MIN_LEAD_HOURS ?? DEFAULT_MIN_LEAD_HOURS) * 3_600_000;

    const capacity = Math.max(1, await this.technicianCapacity(companyId));

    const now = opts.from ?? new Date();
    const earliest = new Date(now.getTime() + minLeadMs);
    const horizon = new Date(now.getTime() + daysAhead * 86_400_000);
    const booked = await this.prisma.booking.findMany({
      where: {
        companyId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        preferredDate: { gte: earliest, lte: horizon },
      },
      select: { preferredDate: true },
    });

    const load = new Map<number, number>();
    for (const b of booked) {
      const key = this.slotKey(b.preferredDate, slotHours, dayStart, timeZone);
      if (key !== null) load.set(key, (load.get(key) ?? 0) + 1);
    }

    const slots: AvailableSlot[] = [];

    for (let dayOffset = 0; dayOffset <= daysAhead && slots.length < limit; dayOffset++) {
      const dayInstant = new Date(now.getTime() + dayOffset * 86_400_000);
      const { year, month, day, weekday } = zonedParts(dayInstant, timeZone);

      if (DEFAULT_CLOSED_WEEKDAYS.includes(weekday)) {
        continue;
      }

      for (let hour = dayStart; hour + slotHours <= dayEnd; hour += slotHours) {
        if (slots.length >= limit) break;

        const start = zonedToUtc(year, month, day, hour, timeZone);
        if (start < earliest || start > horizon) continue;

        const end = new Date(start.getTime() + slotHours * 3_600_000);
        const used = load.get(start.getTime()) ?? 0;
        if (used >= capacity) continue;

        slots.push({
          start: start.toISOString(),
          end: end.toISOString(),
          label: this.label(start, end, timeZone),
          remainingCapacity: capacity - used,
        });
      }
    }

    return { timezone: timeZone, capacityPerSlot: capacity, slots };
  }

  /**
   * Whether a specific instant is still offerable — checked again at booking
   * time, because the slot a caller was offered may have filled during the
   * conversation.
   */
  async isSlotAvailable(companyId: string, when: Date): Promise<boolean> {
    const { slots } = await this.findSlots(companyId, { limit: 50, daysAhead: 60 });
    return slots.some((s) => new Date(s.start).getTime() === when.getTime());
  }

  private async technicianCapacity(companyId: string): Promise<number> {
    return this.prisma.companyUser.count({
      where: {
        companyId,
        role: 'technician',
        isActive: true,
        approvalStatus: 'APPROVED',
      },
    });
  }

  /** The start instant of the slot an arbitrary time falls into, or null. */
  private slotKey(
    when: Date,
    slotHours: number,
    dayStart: number,
    timeZone: string,
  ): number | null {
    const { year, month, day } = zonedParts(when, timeZone);
    const localHour = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour12: false,
        hour: '2-digit',
      }).format(when),
    ) % 24;

    if (localHour < dayStart) return null;
    const index = Math.floor((localHour - dayStart) / slotHours);
    return zonedToUtc(year, month, day, dayStart + index * slotHours, timeZone).getTime();
  }

  private label(start: Date, end: Date, timeZone: string): string {
    const day = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(start);
    const time = (d: Date) =>
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
        .format(d)
        .replace(':00', '');
    return `${day}, ${time(start)}–${time(end)}`;
  }

  private safeTimeZone(tz?: string | null): string {
    if (!tz) return 'UTC';
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: tz });
      return tz;
    } catch {
      this.logger.warn(`Company timezone "${tz}" is not valid — falling back to UTC`);
      return 'UTC';
    }
  }
}

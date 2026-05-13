import { DateTime } from 'luxon';
import zipcodeToTimezone from 'zipcode-to-timezone';

const QUIET_START = 8;   // 08:00 inclusive
const QUIET_END   = 21;  // 21:00 exclusive

// US state → representative IANA timezone (fallback when zip is absent/unrecognised)
const STATE_TZ: Record<string, string> = {
  AL: 'America/Chicago',       AK: 'America/Anchorage',    AZ: 'America/Phoenix',
  AR: 'America/Chicago',       CA: 'America/Los_Angeles',  CO: 'America/Denver',
  CT: 'America/New_York',      DE: 'America/New_York',     DC: 'America/New_York',
  FL: 'America/New_York',      GA: 'America/New_York',     HI: 'Pacific/Honolulu',
  ID: 'America/Denver',        IL: 'America/Chicago',      IN: 'America/Indiana/Indianapolis',
  IA: 'America/Chicago',       KS: 'America/Chicago',      KY: 'America/New_York',
  LA: 'America/Chicago',       ME: 'America/New_York',     MD: 'America/New_York',
  MA: 'America/New_York',      MI: 'America/Detroit',      MN: 'America/Chicago',
  MS: 'America/Chicago',       MO: 'America/Chicago',      MT: 'America/Denver',
  NE: 'America/Chicago',       NV: 'America/Los_Angeles',  NH: 'America/New_York',
  NJ: 'America/New_York',      NM: 'America/Denver',       NY: 'America/New_York',
  NC: 'America/New_York',      ND: 'America/Chicago',      OH: 'America/New_York',
  OK: 'America/Chicago',       OR: 'America/Los_Angeles',  PA: 'America/New_York',
  RI: 'America/New_York',      SC: 'America/New_York',     SD: 'America/Chicago',
  TN: 'America/Chicago',       TX: 'America/Chicago',      UT: 'America/Denver',
  VT: 'America/New_York',      VA: 'America/New_York',     WA: 'America/Los_Angeles',
  WV: 'America/New_York',      WI: 'America/Chicago',      WY: 'America/Denver',
};

export function resolveTimezone(zipCode?: string | null, stateCode?: string | null): string {
  if (zipCode) {
    const tz = zipcodeToTimezone.lookup(zipCode);
    if (tz) return tz;
  }
  if (stateCode) {
    const tz = STATE_TZ[stateCode.toUpperCase()];
    if (tz) return tz;
  }
  return 'America/New_York'; // safest default: latest US timezone, maximises window coverage
}

export function canSendNow(
  zipCode?: string | null,
  stateCode?: string | null,
  now?: DateTime,
): boolean {
  const tz = resolveTimezone(zipCode, stateCode);
  const localNow = (now ?? DateTime.now()).setZone(tz);
  return localNow.hour >= QUIET_START && localNow.hour < QUIET_END;
}

// Returns the next DateTime at which the quiet-hours window opens in the customer's timezone.
export function nextSendableTime(
  zipCode?: string | null,
  stateCode?: string | null,
  now?: DateTime,
): DateTime {
  const tz = resolveTimezone(zipCode, stateCode);
  const localNow = (now ?? DateTime.now()).setZone(tz);

  if (localNow.hour < QUIET_START) {
    return localNow.set({ hour: QUIET_START, minute: 0, second: 0, millisecond: 0 });
  }
  // At or past 21:00 — next day at 08:00
  return localNow.plus({ days: 1 }).set({ hour: QUIET_START, minute: 0, second: 0, millisecond: 0 });
}

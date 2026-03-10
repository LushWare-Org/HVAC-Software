/**
 * Rich CLI Logger for T&S CRM Flow Tests
 *
 * Produces beautiful, client-readable output with:
 *  - Section banners (double-line borders)
 *  - Step headers (single-line borders)
 *  - Request/response display
 *  - Status indicators (✅ ❌ ⏳ 🔍 📤 📥)
 *  - Summary tables
 *
 * All output goes to process.stdout so it appears in Jest's verbose mode.
 */

const WIDE  = 72;
const MED   = 60;
const THIN  = 50;

const line   = (char: string, len = WIDE)  => char.repeat(len);
const pad    = (s: string, len = WIDE)     => s + ' '.repeat(Math.max(0, len - s.length));

// ── Colour helpers (ANSI, works in most terminals) ──────────────────────────

const c = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  cyan:    '\x1b[36m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  white:   '\x1b[37m',
  bgBlue:  '\x1b[44m',
  bgGreen: '\x1b[42m',
};

function col(color: string, text: string): string {
  return `${color}${text}${c.reset}`;
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Big section banner — use at the start of each flow test file */
export function flowBanner(flowNumber: string, title: string, description: string): void {
  console.log('\n');
  console.log(col(c.cyan + c.bold, line('═')));
  console.log(col(c.cyan + c.bold, `  🚀  FLOW ${flowNumber}: ${title.toUpperCase()}`));
  console.log(col(c.cyan + c.bold, line('─', WIDE)));
  const descLines = wrapText(description, WIDE - 5);
  descLines.forEach(l => console.log(col(c.cyan, `  ${l}`)));
  console.log(col(c.cyan + c.bold, line('═')));
  console.log('');
}

/** Step header — use at the start of each `it()` block */
export function stepBanner(stepNum: string | number, title: string, description?: string): void {
  console.log('');
  console.log(col(c.blue + c.bold, `  ┌${ line('─', WIDE - 2)}┐`));
  console.log(col(c.blue + c.bold, `  │  STEP ${stepNum}: ${title}`.padEnd(WIDE - 1) + '│'));
  if (description) {
    console.log(col(c.blue + c.bold, `  ├${ line('─', WIDE - 2)}┤`));
    const descLines = wrapText(description, WIDE - 7);
    descLines.forEach(l => console.log(col(c.blue, `  │    ${l}`.padEnd(WIDE - 1) + '│')));
  }
  console.log(col(c.blue + c.bold, `  └${ line('─', WIDE - 2)}┘`));
  console.log('');
}

/** Log an HTTP request being sent */
export function logRequest(method: string, url: string, body?: unknown): void {
  console.log(col(c.yellow, `  📤 REQUEST:`));
  console.log(col(c.yellow, `     ${method.toUpperCase()} ${url}`));
  if (body && Object.keys(body as object).length > 0) {
    console.log(col(c.dim, `     Body:`));
    const lines = JSON.stringify(body, null, 2).split('\n');
    lines.forEach(l => console.log(col(c.dim, `       ${l}`)));
  }
}

/** Log an HTTP response received */
export function logResponse(status: number, data: unknown, label?: string): void {
  const ok    = status >= 200 && status < 300;
  const icon  = ok ? '✅' : '❌';
  const color = ok ? c.green : c.red;
  console.log(col(color, `  ${icon} RESPONSE [${status}]${label ? ` — ${label}` : ''}:`));
  const json   = JSON.stringify(data, null, 2);
  const lines  = json.split('\n').slice(0, 30);         // cap at 30 lines
  lines.forEach(l => console.log(col(c.dim, `     ${l}`)));
  if (json.split('\n').length > 30) {
    console.log(col(c.dim, `     ... (truncated)`));
  }
  console.log('');
}

/** Log a key fact extracted from a response */
export function logFact(label: string, value: unknown): void {
  const v = typeof value === 'object' ? JSON.stringify(value) : String(value);
  console.log(col(c.green, `  ✅ ${label}: `) + col(c.white + c.bold, v));
}

/** Log that an ID was saved for later use in other steps */
export function logSaved(entityName: string, id: string): void {
  console.log(col(c.magenta, `  💾 Saved ${entityName} ID: `) + col(c.bold, id) + col(c.magenta, '  (will be used in subsequent steps)'));
}

/** Log an assertion result */
export function logAssert(label: string, passed?: boolean): void {
  const ok    = passed === undefined ? true : passed;
  const icon  = ok ? '✅' : '❌';
  const color = ok ? c.green : c.red;
  console.log(col(color, `  ${icon} ${ok ? 'VERIFIED' : 'FAILED'}: ${label}`));
}

/** Log a business context explanation */
export function logContext(text: string): void {
  const lines = wrapText(text, WIDE - 8);
  lines.forEach(l => console.log(col(c.dim, `  💡 ${l}`)));
}

/** Log a separator within a step */
export function logDivider(): void {
  console.log(col(c.dim, `     ${ line('·', THIN)}`));
}

/** Log a warning / expected behaviour */
export function logExpected(text: string, detail?: string): void {
  const suffix = detail ? ` — ${detail}` : '';
  console.log(col(c.yellow, `  ⚠️  EXPECTED: ${text}${suffix}`));
}

/** Log an error */
export function logError(text: string, err?: unknown): void {
  console.log(col(c.red, `  ❌ ERROR: ${text}`));
  if (err) console.log(col(c.red, `     Detail: ${String(err)}`));
}

/** Print a summary table at the end of a flow */
export function flowSummary(
  titleOrRows: string | Array<string | { step: string; status: 'PASS' | 'FAIL' | 'SKIP'; detail?: string }>,
  rowsOrTitle?: string | Array<string | { step: string; status: 'PASS' | 'FAIL' | 'SKIP'; detail?: string }>,
): void {
  type Row = string | { step: string; status: 'PASS' | 'FAIL' | 'SKIP'; detail?: string };
  let rows: Row[];
  let flowTitle: string | undefined;
  if (typeof titleOrRows === 'string') {
    flowTitle = titleOrRows;
    rows = (rowsOrTitle as Row[]) ?? [];
  } else {
    rows = titleOrRows;
    flowTitle = rowsOrTitle as string | undefined;
  }
  console.log('');
  console.log(col(c.cyan + c.bold, line('═')));
  console.log(col(c.cyan + c.bold, `  📊 FLOW SUMMARY${flowTitle ? ': ' + flowTitle : ''}`));
  console.log(col(c.cyan + c.bold, line('─', WIDE)));
  rows.forEach(r => {
    if (typeof r === 'string') {
      console.log(`  ${r}`);
      return;
    }
    const icon    = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⏭️ ';
    const color   = r.status === 'PASS' ? c.green : r.status === 'FAIL' ? c.red : c.yellow;
    const detail  = r.detail ? col(c.dim, `  — ${r.detail}`) : '';
    console.log(`  ${icon}  ${col(color, r.step)}${detail}`);
  });
  const objRows = rows.filter((r): r is { step: string; status: 'PASS' | 'FAIL' | 'SKIP'; detail?: string } => typeof r !== 'string');
  const passed  = objRows.filter(r => r.status === 'PASS').length;
  const total   = objRows.filter(r => r.status !== 'SKIP').length;
  if (total > 0) {
    console.log(col(c.cyan + c.bold, line('─', WIDE)));
    console.log(col(passed === total ? c.green + c.bold : c.red + c.bold,
      `  RESULT: ${passed}/${total} steps passed`));
  }
  console.log(col(c.cyan + c.bold, line('═')));
  console.log('');
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function wrapText(text: string, maxWidth: number): string[] {
  const words  = text.split(' ');
  const lines: string[] = [];
  let   cur    = '';
  for (const w of words) {
    if ((cur + ' ' + w).length > maxWidth) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = cur ? `${cur} ${w}` : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

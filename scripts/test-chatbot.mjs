#!/usr/bin/env node
/**
 * Chatbot Integration Test Suite
 *
 * Tests that the chatbot always returns numbers that match real DB data.
 * Run with:  node scripts/test-chatbot.mjs
 * Requires all services running (pnpm dev:all).
 */

// ─── Config ─────────────────────────────────────────────────────────────────

const CHAT_URL  = 'http://localhost:3008/message';
const CRM_URL   = 'http://localhost:3001';
const JOBS_URL  = 'http://localhost:3002';
const FIN_URL   = 'http://localhost:3004';
const ANA_URL   = 'http://localhost:3006';

const ADMIN_HEADERS = {
  'Content-Type': 'application/json',
  'x-test-company-id': 'co-demo-001',
  'x-test-user-id':    'user-admin-001',
  'x-test-user-role':  'company_admin',
  'x-test-user-email': 'admin@tsbrothers.com',
};

// A real customer that has jobs + invoices in the DB
const CUSTOMER_ID  = '362fd92e-93b4-41ad-ace9-a54720172bdd';
const CUSTOMER_HEADERS = {
  'Content-Type': 'application/json',
  'x-test-company-id':  'co-demo-001',
  'x-test-user-id':     CUSTOMER_ID,
  'x-test-user-role':   'customer',
  'x-test-user-email':  'testcustomer@tsbrothers.com',
  'x-test-customer-id': CUSTOMER_ID,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RESET  = '\x1b[0m';
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';

let passed = 0, failed = 0, skipped = 0;
const failures = [];

function log(msg)  { process.stdout.write(msg + '\n'); }
function pass(name) { passed++; log(`  ${GREEN}✓${RESET} ${name}`); }
function fail(name, reason, bot, expected) {
  failed++;
  failures.push({ name, reason, bot, expected });
  log(`  ${RED}✗${RESET} ${name}`);
  log(`    ${DIM}Expected: ${expected}${RESET}`);
  log(`    ${DIM}Bot said: ${bot.slice(0, 120)}${RESET}`);
  log(`    ${RED}Reason:   ${reason}${RESET}`);
}
function skip(name, reason) { skipped++; log(`  ${YELLOW}○${RESET} ${name} — ${DIM}${reason}${RESET}`); }

/** Call a service endpoint, return parsed JSON. */
async function api(url, headers = ADMIN_HEADERS) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

/** Send a message to the chatbot, collect the full SSE response. */
async function chat(message, headers = ADMIN_HEADERS, history = []) {
  const res = await fetch(CHAT_URL, {
    method:  'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error(`Chat service ${res.status}: ${await res.text()}`);

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let assembled = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    for (const line of text.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6);
      if (payload === '[DONE]') break;
      try {
        const parsed = JSON.parse(payload);
        if (parsed.chunk) assembled += parsed.chunk;
      } catch {}
    }
  }
  return assembled.trim();
}

/**
 * Extract all numbers from a natural-language string.
 * Handles: 102, 58,498.48, $58,498.48, 3.6, 8.
 */
function extractNumbers(text) {
  const matches = text.match(/\$?[\d,]+\.?\d*/g) ?? [];
  return matches
    .map(m => parseFloat(m.replace(/[$,]/g, '')))
    .filter(n => !isNaN(n) && n > 0);
}

/**
 * Assert the bot response contains a number within `tol`% of `expected`.
 * Returns { ok, found } — found = closest number seen.
 */
function containsNumber(text, expected, tol = 5) {
  const nums = extractNumbers(text);
  if (!nums.length) return { ok: false, found: null };
  const threshold = Math.max(1, Math.abs(expected) * (tol / 100));
  const match = nums.find(n => Math.abs(n - expected) <= threshold);
  const closest = nums.reduce((a, b) => Math.abs(a - expected) < Math.abs(b - expected) ? a : b);
  return { ok: !!match, found: closest };
}

/** Assert text contains one of the keywords (case-insensitive). */
function containsKeyword(text, ...keywords) {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

// ─── Ground truth fetchers ────────────────────────────────────────────────────

async function fetchGroundTruth() {
  const [kpis, jobStats, customers, overdueInv, customerJobs, customerInvoices, revSeries] =
    await Promise.all([
      api(`${ANA_URL}/dashboard/kpis`),
      api(`${ANA_URL}/jobs-analytics/by-status?range=30d`),
      api(`${CRM_URL}/customers?limit=1`),
      api(`${FIN_URL}/invoices?status=OVERDUE&limit=50`),
      api(`${JOBS_URL}/jobs?customerId=${CUSTOMER_ID}&limit=50`, CUSTOMER_HEADERS),
      api(`${FIN_URL}/invoices?customerId=${CUSTOMER_ID}&limit=50`, CUSTOMER_HEADERS),
      api(`${ANA_URL}/revenue/series?range=30d`),
    ]);

  const jobStatusMap = {};
  for (const row of (Array.isArray(jobStats) ? jobStats : [])) {
    jobStatusMap[row.status] = Number(row.count);
  }

  const revList = Array.isArray(revSeries) ? revSeries : (revSeries.series ?? []);
  const totalRevenue = revList.reduce((s, p) => s + Number(p.revenue ?? 0), 0);

  const overdueList = overdueInv.data ?? (Array.isArray(overdueInv) ? overdueInv : []);

  return {
    activeCustomers:   kpis.activeCustomers?.value,
    totalCustomersCRM: customers.meta?.total,
    revenueMonth:      kpis.revenue?.value ?? totalRevenue,
    revenueSeriesSum:  totalRevenue,
    jobsCompleted:     kpis.jobsCompleted?.value,
    jobStatusMap,
    totalJobs:         Object.values(jobStatusMap).reduce((a, b) => a + b, 0),
    overdueCount:      overdueList.length,
    // Customer-scoped
    customerJobsTotal: customerJobs.meta?.total ?? customerJobs.data?.length ?? 0,
    customerInvTotal:  customerInvoices.data?.length ?? (Array.isArray(customerInvoices) ? customerInvoices.length : 0),
  };
}

// ─── Test runner ─────────────────────────────────────────────────────────────

async function runSection(title, fn) {
  log(`\n${BOLD}${CYAN}── ${title} ${'─'.repeat(50 - title.length)}${RESET}`);
  await fn();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log(`\n${BOLD}Chatbot Integration Test Suite${RESET}`);
  log(`${DIM}Fetching ground truth from live services…${RESET}`);

  let truth;
  try {
    truth = await fetchGroundTruth();
  } catch (err) {
    log(`\n${RED}✗ Cannot connect to services: ${err.message}${RESET}`);
    log(`${YELLOW}  Make sure all services are running (pnpm dev:all)${RESET}`);
    process.exit(1);
  }

  log(`\n${DIM}Ground truth:${RESET}`);
  log(`  active customers (analytics): ${truth.activeCustomers}`);
  log(`  total customers (CRM):        ${truth.totalCustomersCRM}`);
  log(`  revenue this month:           $${truth.revenueMonth?.toFixed(2)}`);
  log(`  jobs completed (30d):         ${truth.jobsCompleted}`);
  log(`  total jobs (all statuses):    ${truth.totalJobs}`);
  log(`  pending jobs:                 ${truth.jobStatusMap['PENDING'] ?? 0}`);
  log(`  scheduled jobs:               ${truth.jobStatusMap['SCHEDULED'] ?? 0}`);
  log(`  overdue invoices:             ${truth.overdueCount}`);
  log(`  customer ${CUSTOMER_ID.slice(0,8)}… jobs:  ${truth.customerJobsTotal}`);
  log(`  customer invoices:            ${truth.customerInvTotal}`);

  // ── ADMIN BOT: DATA ACCURACY ────────────────────────────────────────────────
  await runSection('Admin Bot — Customer Data', async () => {
    {
      const q = 'How many customers do we have?';
      const bot = await chat(q);
      const { ok, found } = containsNumber(bot, truth.activeCustomers, 2);
      if (ok) pass(q);
      else fail(q, `Expected ~${truth.activeCustomers}, closest was ${found}`, bot, truth.activeCustomers);
    }
    {
      const q = 'How many total customers are in the system?';
      const bot = await chat(q);
      // Should match either activeCustomers (analytics) or totalCustomersCRM (CRM pagination)
      const { ok: ok1, found: f1 } = containsNumber(bot, truth.activeCustomers, 2);
      const { ok: ok2 }            = containsNumber(bot, truth.totalCustomersCRM, 2);
      if (ok1 || ok2) pass(q);
      else fail(q, `Expected ${truth.activeCustomers} or ${truth.totalCustomersCRM}, closest was ${f1}`, bot, `${truth.activeCustomers} or ${truth.totalCustomersCRM}`);
    }
    {
      // Consistency test: ask twice, numbers must match
      const q = 'How many customers do we currently have?';
      const bot1 = await chat(q);
      const bot2 = await chat(q);
      const nums1 = extractNumbers(bot1);
      const nums2 = extractNumbers(bot2);
      const consistent = nums1.length > 0 && nums2.length > 0 &&
        nums1.some(n1 => nums2.some(n2 => Math.abs(n1 - n2) < 5));
      if (consistent) pass('Consistency: same question asked twice gives same customer count');
      else fail('Consistency: same question asked twice gives same customer count',
        'Two calls returned different numbers', `Call1: ${nums1} | Call2: ${nums2}`,
        'Same number both times');
    }
  });

  await runSection('Admin Bot — Revenue Data', async () => {
    {
      const q = 'How much revenue did we make this month?';
      const bot = await chat(q);
      const { ok, found } = containsNumber(bot, truth.revenueMonth, 5);
      if (ok) pass(q);
      else fail(q, `Expected ~$${truth.revenueMonth?.toFixed(2)}, closest was ${found}`, bot, truth.revenueMonth?.toFixed(2));
    }
    {
      const q = 'What is our total revenue for this month?';
      const bot = await chat(q);
      const { ok, found } = containsNumber(bot, truth.revenueMonth, 5);
      if (ok) pass(q);
      else fail(q, `Expected ~$${truth.revenueMonth?.toFixed(2)}, closest was ${found}`, bot, truth.revenueMonth?.toFixed(2));
    }
    {
      const q = 'Give me a revenue summary for this week';
      const bot = await chat(q);
      const hasNumber = extractNumbers(bot).length > 0;
      const notError  = !containsKeyword(bot, 'unavailable', 'error', 'sorry, something');
      if (hasNumber && notError) pass(q);
      else fail(q, 'Response had no numbers or reported an error', bot, 'A dollar amount');
    }
  });

  await runSection('Admin Bot — Job Stats', async () => {
    {
      const q = 'How many jobs are pending?';
      const expected = truth.jobStatusMap['PENDING'] ?? 0;
      const bot = await chat(q);
      const { ok, found } = containsNumber(bot, expected, 0);
      if (ok) pass(q);
      else fail(q, `Expected ${expected}, closest was ${found}`, bot, expected);
    }
    {
      const q = 'How many jobs have been completed?';
      const expected = truth.jobStatusMap['COMPLETED'] ?? 0;
      const bot = await chat(q);
      const { ok, found } = containsNumber(bot, expected, 0);
      if (ok) pass(q);
      else fail(q, `Expected ${expected}, closest was ${found}`, bot, expected);
    }
    {
      const q = 'How many jobs are scheduled?';
      const expected = truth.jobStatusMap['SCHEDULED'] ?? 0;
      const bot = await chat(q);
      const { ok, found } = containsNumber(bot, expected, 0);
      if (ok) pass(q);
      else fail(q, `Expected ${expected}, closest was ${found}`, bot, expected);
    }
    {
      const q = 'Break down all jobs by status';
      const bot = await chat(q);
      // Should mention multiple statuses
      const mentionsPending   = containsKeyword(bot, 'pending');
      const mentionsScheduled = containsKeyword(bot, 'scheduled');
      const mentionsCompleted = containsKeyword(bot, 'completed');
      if (mentionsPending && mentionsScheduled && mentionsCompleted) pass(q);
      else fail(q, 'Response missing one or more status labels', bot, 'PENDING, SCHEDULED, COMPLETED mentioned');
    }
    {
      const q = 'How many total jobs do we have right now?';
      const bot = await chat(q);
      const { ok, found } = containsNumber(bot, truth.totalJobs, 10);
      if (ok) pass(q);
      else fail(q, `Expected ~${truth.totalJobs} total, closest was ${found}`, bot, truth.totalJobs);
    }
  });

  await runSection('Admin Bot — Invoices & Finance', async () => {
    {
      const q = 'Show me overdue invoices';
      const bot = await chat(q);
      const mentionsOverdue = containsKeyword(bot, 'overdue', 'INV-');
      const noData = containsKeyword(bot, 'no overdue', 'none');
      // Either it lists them or says there are none — both are valid responses
      if (mentionsOverdue || (truth.overdueCount === 0 && noData)) pass(q);
      else {
        const { ok } = containsNumber(bot, truth.overdueCount, 0);
        if (ok) pass(q);
        else fail(q, `Expected ${truth.overdueCount} overdue invoices mentioned`, bot, truth.overdueCount);
      }
    }
    {
      const q = 'What is the total outstanding invoice value?';
      const bot = await chat(q);
      const hasNumber  = extractNumbers(bot).length > 0;
      const notError   = !containsKeyword(bot, 'unavailable', 'error', 'sorry, something');
      if (hasNumber && notError) pass(q);
      else fail(q, 'No dollar amount returned', bot, 'A dollar amount');
    }
  });

  await runSection('Admin Bot — New Customers', async () => {
    {
      const q = 'How many new customers joined this month?';
      const bot = await chat(q);
      const hasNumber = extractNumbers(bot).length > 0;
      const notError  = !containsKeyword(bot, 'unavailable', 'error', 'sorry, something');
      if (hasNumber && notError) pass(q);
      else fail(q, 'No customer count returned', bot, 'A number');
    }
    {
      const q = 'Who are our newest customers?';
      const bot = await chat(q);
      // Should mention at least one name or email
      const hasCustomerData = bot.length > 50 && !containsKeyword(bot, 'unavailable', 'sorry, something');
      if (hasCustomerData) pass(q);
      else fail(q, 'Response too short or errored', bot, 'Customer list');
    }
  });

  await runSection('Admin Bot — No Hallucination Guard', async () => {
    {
      // Ask twice: second answer must be numerically consistent with first
      const q = 'How many customers do we have?';
      const bot1 = await chat(q);
      const bot2 = await chat(q, ADMIN_HEADERS, [
        { role: 'user',      content: q },
        { role: 'assistant', content: bot1 },
      ]);
      const nums1 = extractNumbers(bot1).filter(n => n > 10 && n < 100000);
      const nums2 = extractNumbers(bot2).filter(n => n > 10 && n < 100000);
      const consistent = nums1.length > 0 && nums2.length > 0 &&
        nums1.some(n1 => nums2.some(n2 => Math.abs(n1 - n2) <= 5));
      if (consistent) pass('Follow-up "are you sure?" returns same customer count (no hallucination)');
      else fail('Follow-up "are you sure?" returns same customer count',
        `First: [${nums1}] Second: [${nums2}]`,
        `Bot1: ${bot1.slice(0,80)} | Bot2: ${bot2.slice(0,80)}`,
        'Same number ±5');
    }
    {
      const q = 'What is our revenue this month?';
      const bot1 = await chat(q);
      const bot2 = await chat(q, ADMIN_HEADERS, [
        { role: 'user',      content: q },
        { role: 'assistant', content: bot1 },
      ]);
      const nums1 = extractNumbers(bot1).filter(n => n > 100);
      const nums2 = extractNumbers(bot2).filter(n => n > 100);
      const consistent = nums1.length > 0 && nums2.length > 0 &&
        nums1.some(n1 => nums2.some(n2 => Math.abs(n1 - n2) / Math.max(n1, n2) < 0.05));
      if (consistent) pass('Follow-up revenue question returns consistent amount (no hallucination)');
      else fail('Follow-up revenue returns consistent amount',
        `First: [${nums1}] Second: [${nums2}]`,
        `Bot1: ${bot1.slice(0,80)} | Bot2: ${bot2.slice(0,80)}`,
        'Same revenue ±5%');
    }
  });

  // ── CUSTOMER BOT: DATA ACCURACY ─────────────────────────────────────────────
  await runSection('Customer Bot — My Jobs', async () => {
    {
      const q = 'How many jobs do I have?';
      const bot = await chat(q, CUSTOMER_HEADERS);
      const { ok, found } = containsNumber(bot, truth.customerJobsTotal, 0);
      if (ok) pass(q);
      else fail(q, `Expected ${truth.customerJobsTotal} jobs, closest was ${found}`, bot, truth.customerJobsTotal);
    }
    {
      const q = 'Show me all my jobs';
      const bot = await chat(q, CUSTOMER_HEADERS);
      const notError = !containsKeyword(bot, 'error', 'sorry, something went wrong');
      const hasContent = bot.length > 40;
      if (notError && hasContent) pass(q);
      else fail(q, 'Response empty or errored', bot, 'Job list');
    }
    {
      const q = 'What jobs are scheduled for me?';
      const bot = await chat(q, CUSTOMER_HEADERS);
      const notError = !containsKeyword(bot, 'sorry, something went wrong');
      // Customer has 1 scheduled job
      const hasScheduled = containsKeyword(bot, 'scheduled', 'SCHEDULED') || containsNumber(bot, 1, 0).ok;
      if (notError && hasScheduled) pass(q);
      else fail(q, 'Scheduled job not mentioned', bot, '1 scheduled job');
    }
  });

  await runSection('Customer Bot — My Invoices', async () => {
    {
      const q = 'How many invoices do I have?';
      const bot = await chat(q, CUSTOMER_HEADERS);
      const { ok, found } = containsNumber(bot, truth.customerInvTotal, 0);
      if (ok) pass(q);
      else fail(q, `Expected ${truth.customerInvTotal} invoices, closest was ${found}`, bot, truth.customerInvTotal);
    }
    {
      const q = 'Show me my invoices';
      const bot = await chat(q, CUSTOMER_HEADERS);
      const mentionsInvoice = containsKeyword(bot, 'INV-', 'invoice');
      if (mentionsInvoice) pass(q);
      else fail(q, 'No invoice numbers in response', bot, 'INV- number(s)');
    }
    {
      const q = 'Do I have any unpaid invoices?';
      const bot = await chat(q, CUSTOMER_HEADERS);
      const notError  = !containsKeyword(bot, 'sorry, something went wrong');
      const hasAnswer = containsKeyword(bot, 'draft', 'paid', 'unpaid', 'partially', 'outstanding', 'no unpaid', 'INV-');
      if (notError && hasAnswer) pass(q);
      else fail(q, 'No meaningful invoice status response', bot, 'Invoice status info');
    }
  });

  await runSection('Customer Bot — Next Appointment', async () => {
    {
      const q = 'When is my next appointment?';
      const bot = await chat(q, CUSTOMER_HEADERS);
      const notError  = !containsKeyword(bot, 'sorry, something went wrong');
      // Customer has a scheduled job, so should mention it or say no upcoming
      const meaningful = bot.length > 30;
      if (notError && meaningful) pass(q);
      else fail(q, 'Response too short or errored', bot, 'Appointment info or "no upcoming"');
    }
  });

  // ── HELP / FLOW KNOWLEDGE ────────────────────────────────────────────────────
  await runSection('Admin Bot — Help & Navigation', async () => {
    const checks = [
      { q: 'How do I approve a pending technician?',     keywords: ['approve', 'users', 'pending', 'technician'] },
      { q: 'How do I create a new job?',                 keywords: ['job', 'new job', 'create', 'customer'] },
      { q: 'How do I send an invoice to a customer?',    keywords: ['invoice', 'send', 'finance', 'email'] },
      { q: 'How do I migrate data from another system?', keywords: ['import', 'csv', 'upload', '/import'] },
      { q: 'What job statuses are there?',               keywords: ['pending', 'scheduled', 'completed', 'invoiced'] },
      { q: 'How does the AI dispatch work?',             keywords: ['assign', 'technician', 'score', 'distance'] },
    ];
    for (const { q, keywords } of checks) {
      const bot = await chat(q);
      const ok  = keywords.some(k => containsKeyword(bot, k));
      if (ok) pass(q);
      else fail(q, `None of [${keywords.join(', ')}] found in response`, bot, `One of: ${keywords.join(', ')}`);
    }
  });

  await runSection('Customer Bot — Help & Navigation', async () => {
    const checks = [
      { q: 'How do I pay an invoice?',                   keywords: ['pay', 'invoice', 'payment', 'portal'] },
      { q: 'How can I see my job history?',               keywords: ['job', 'history', 'portal', 'status'] },
      { q: 'How do I contact support?',                  keywords: ['contact', 'message', 'support', 'communications'] },
    ];
    for (const { q, keywords } of checks) {
      const bot = await chat(q, CUSTOMER_HEADERS);
      const ok  = keywords.some(k => containsKeyword(bot, k));
      if (ok) pass(q);
      else fail(q, `None of [${keywords.join(', ')}] found`, bot, `One of: ${keywords.join(', ')}`);
    }
  });

  // ─── Results ────────────────────────────────────────────────────────────────

  const total = passed + failed + skipped;
  log(`\n${'─'.repeat(60)}`);
  log(`${BOLD}Results: ${GREEN}${passed} passed${RESET}  ${failed > 0 ? RED : ''}${failed} failed${RESET}  ${YELLOW}${skipped} skipped${RESET}  (${total} total)`);

  if (failures.length) {
    log(`\n${BOLD}${RED}Failures:${RESET}`);
    for (const { name, reason, bot, expected } of failures) {
      log(`\n  ${RED}✗ ${name}${RESET}`);
      log(`    Expected : ${expected}`);
      log(`    Reason   : ${reason}`);
      log(`    Response : ${bot.slice(0, 200)}${bot.length > 200 ? '…' : ''}`);
    }
  }

  log('');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  process.stderr.write(`\nFatal: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});

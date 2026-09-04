const BASE = (process.env.PARTNER_API_URL || 'http://localhost:3009').replace(/\/$/, '');
const KEY = process.env.PARTNER_API_KEY || process.argv[2];
const PHONE_FOUND = process.env.SMOKE_PHONE_FOUND || '+94771234567';
const PHONE_AMBIGUOUS = process.env.SMOKE_PHONE_AMBIGUOUS || '+94770009999';
const PHONE_UNKNOWN = process.env.SMOKE_PHONE_UNKNOWN || '+94700000000';

const results = [];
const state = {};

const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

async function call(method, path, body) {
  const started = Date.now();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'x-api-key': KEY,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, body: json, ms: Date.now() - started, headers: res.headers };
}

/**
 * One numbered feature from the guide. `fn` throws to fail; returning a string
 * annotates the pass line with what was actually observed.
 */
async function step(n, name, fn) {
  // A step whose prerequisite never produced an id is reported as skipped, not
  // passed — a green run must mean every feature was genuinely exercised.
  try {
    const note = await fn();
    results.push({ n, name, ok: true, note });
    console.log(`${c.green('  PASS')}  ${String(n).padStart(2)}. ${name}${note ? c.dim(`  — ${note}`) : ''}`);
  } catch (err) {
    if (err && err.skip) {
      results.push({ n, name, skip: true, note: err.message });
      console.log(`${c.yellow('  SKIP')}  ${String(n).padStart(2)}. ${name}${c.dim(`  — ${err.message}`)}`);
      return;
    }
    results.push({ n, name, ok: false, note: err.message });
    console.log(`${c.red('  FAIL')}  ${String(n).padStart(2)}. ${name}\n        ${c.red(err.message)}`);
  }
}

function skip(reason) {
  const e = new Error(reason);
  e.skip = true;
  throw e;
}

function expect(cond, message) {
  if (!cond) throw new Error(message);
}

function expectStatus(res, want) {
  expect(
    res.status === want,
    `expected HTTP ${want}, got ${res.status} — ${JSON.stringify(res.body).slice(0, 200)}`,
  );
}

async function main() {
  if (!KEY) {
    console.error(c.red('\nNo API key.\n'));
    console.error('  1. pnpm --filter partner-api seed:sandbox      (prints a pk_test_ key)');
    console.error('  2. PARTNER_API_KEY=pk_test_... pnpm --filter partner-api smoke\n');
    process.exit(2);
  }
  if (!KEY.startsWith('pk_test_')) {
    console.error(
      c.red('\nRefusing to run: this is not a sandbox key.\n') +
        'A live key would send real SMS and email to real customers.\n' +
        'Re-run with a pk_test_ key.\n',
    );
    process.exit(2);
  }

  console.log(c.bold(`\nHVACtor Partner API — end-to-end smoke test`));
  console.log(c.dim(`${BASE}  ·  key ${KEY.slice(0, 16)}…\n`));

  // --- reachability, before anything else ---------------------------------
  try {
    const health = await fetch(`${BASE}/health`).then((r) => r.json());
    expect(health.status === 'ok', 'unexpected health payload');
  } catch (err) {
    console.error(c.red(`Cannot reach ${BASE} — is partner-api running?\n`));
    console.error(c.dim('  pnpm --filter partner-api dev\n'));
    process.exit(2);
  }

  console.log(c.bold('Public documentation'));
  await step(0, 'Guide, OpenAPI spec and capabilities are reachable', async () => {
    const guide = await fetch(`${BASE}/guide`);
    expect(guide.status === 200, `/guide returned ${guide.status}`);
    const caps = await fetch(`${BASE}/capabilities`).then((r) => r.json());
    expect(Array.isArray(caps.endpoints), '/capabilities has no endpoint list');
    const spec = await fetch(`${BASE}/docs-json`);
    expect(
      spec.status === 200,
      `/docs-json returned ${spec.status} — set PARTNER_DOCS_PUBLIC=true`,
    );
    return `${caps.endpoints.length} endpoints advertised`;
  });

  console.log(c.bold('\nIdentity'));
  await step(1, 'Check the API key is valid', async () => {
    const res = await call('GET', '/v1/whoami');
    expectStatus(res, 200);
    expect(res.body.environment === 'SANDBOX', `key is ${res.body.environment}, not SANDBOX`);
    expect(res.headers.get('x-ratelimit-limit'), 'rate limit headers missing');
    state.companyId = res.body.companyId;
    return `${res.body.environment}, ${res.body.scopes.length} scope(s), ${res.body.rateLimitPerMin}/min`;
  });

  console.log(c.bold('\nCaller identification'));
  await step(2, 'Find who is calling, from their phone number', async () => {
    const res = await call('GET', `/v1/callers/lookup?phone=${encodeURIComponent(PHONE_FOUND)}`);
    expectStatus(res, 200);
    expect(res.body.result === 'found', `expected "found", got "${res.body.result}"`);
    expect(res.body.customer && res.body.customer.id, 'no customer on a "found" result');
    expect(res.body.summary, 'no summary on a "found" result');
    state.customerId = res.body.customer.id;
    const d = res.body.summary.degraded;
    if (d && d.length) {
      // Not a failure of this endpoint — but the operator must see it, because
      // it means a downstream service is down and the agent is told to stay quiet.
      console.log(c.yellow(`        note: degraded sections — ${d.join(', ')}`));
    }
    return `${res.body.customer.fullName}, owes $${res.body.summary.balanceDue}, ${res.body.ms || ''}`;
  });

  await step(2.1, 'Shared number returns "ambiguous", never a guess', async () => {
    const res = await call('GET', `/v1/callers/lookup?phone=${encodeURIComponent(PHONE_AMBIGUOUS)}`);
    expectStatus(res, 200);
    expect(res.body.result === 'ambiguous', `expected "ambiguous", got "${res.body.result}"`);
    expect(!res.body.customer, 'ambiguous result leaked a customer record');
    return `${res.body.matches} matches, no data leaked`;
  });

  await step(2.2, 'Unknown number returns "not_found"', async () => {
    const res = await call('GET', `/v1/callers/lookup?phone=${encodeURIComponent(PHONE_UNKNOWN)}`);
    expectStatus(res, 200);
    expect(res.body.result === 'not_found', `expected "not_found", got "${res.body.result}"`);
    return 'treated as a first-time caller';
  });

  await step(3, 'Confirm a customer by name and address', async () => {
    if (!state.customerId) skip('no customer resolved in step 2');
    const res = await call('POST', '/v1/callers/match', {
      firstName: 'Sarah',
      lastName: 'Jones',
      address: '12 Baker Street',
    });
    expectStatus(res, 200);
    expect(
      ['found', 'not_found'].includes(res.body.result),
      `unexpected result "${res.body.result}"`,
    );
    return `result: ${res.body.result}`;
  });

  console.log(c.bold('\nScheduling'));
  await step(4, 'Show free appointment times', async () => {
    const res = await call('GET', '/v1/availability?limit=3');
    expectStatus(res, 200);
    expect(Array.isArray(res.body.slots), 'no slots array');
    expect(res.body.timezone, 'no timezone — labels would be unreadable');
    if (res.body.slots.length) {
      const s = res.body.slots[0];
      expect(s.start && s.label, 'slot missing start or spoken label');
      state.slotStart = s.start;
      return `${res.body.slots.length} slot(s), ${res.body.timezone}, first: "${s.label}"`;
    }
    return `0 slots (${res.body.timezone}) — check technicians exist and are active`;
  });

  await step(5, 'Book an appointment', async () => {
    if (!state.customerId) skip('no customer resolved in step 2');
    if (!state.slotStart) skip('no bookable slot returned in step 4');
    const res = await call('POST', '/v1/bookings', {
      customerId: state.customerId,
      serviceType: 'AC repair',
      preferredDate: state.slotStart,
      description: 'Automated smoke test — safe to cancel',
    });
    expectStatus(res, 201);
    expect(res.body.requiresConfirmation === true, 'requiresConfirmation was not true');
    expect(
      String(res.body.booking.status).toUpperCase() === 'PENDING',
      `booking status was ${res.body.booking.status}, expected PENDING`,
    );
    state.bookingId = res.body.booking.id;
    return `${res.body.booking.id} — PENDING, confirmation required`;
  });

  await step(11, 'Send appointment confirmation', async () => {
    if (!state.bookingId) skip('no booking created in step 5');
    const res = await call('POST', `/v1/bookings/${state.bookingId}/confirmation`, {
      channel: 'sms',
    });
    expectStatus(res, 200);
    expect(res.body.simulated === true, 'sandbox key did NOT simulate — this would be a real SMS');
    expect(
      String(res.body.bookingStatus).toUpperCase() === 'PENDING',
      'confirmation did not reflect the pending status',
    );
    return `simulated to ${res.body.sentTo}`;
  });

  await step(6, 'Move an appointment to a new time', async () => {
    if (!state.bookingId) skip('no booking created in step 5');
    const later = new Date(new Date(state.slotStart).getTime() + 86400000).toISOString();
    const res = await call('PATCH', `/v1/bookings/${state.bookingId}/reschedule`, {
      preferredDate: later,
      reason: 'smoke test',
    });
    expectStatus(res, 200);
    expect(res.body.requiresConfirmation === true, 'reschedule did not re-flag confirmation');
    return 'moved, confirmation required again';
  });

  await step(7, 'Cancel an appointment', async () => {
    if (!state.bookingId) skip('no booking created in step 5');
    const res = await call('PATCH', `/v1/bookings/${state.bookingId}/cancel`, {
      reason: 'smoke test cleanup',
    });
    expectStatus(res, 200);
    return `status: ${res.body.booking.status}`;
  });

  console.log(c.bold('\nMoney'));
  await step(8, "Show customer's invoices and what they owe", async () => {
    if (!state.customerId) skip('no customer resolved in step 2');
    const res = await call('GET', `/v1/customers/${state.customerId}/invoices`);
    expectStatus(res, 200);
    expect(Array.isArray(res.body.invoices), 'no invoices array');
    expect(typeof res.body.totalOutstanding === 'number', 'totalOutstanding is not a number');
    const payable = res.body.invoices.find((i) => !i.isSettled && !i.isDraft);
    if (payable) state.invoiceId = payable.id;
    return `${res.body.invoices.length} invoice(s), $${res.body.totalOutstanding} outstanding`;
  });

  await step(9, "Show customer's quotes and estimates", async () => {
    if (!state.customerId) skip('no customer resolved in step 2');
    const res = await call('GET', `/v1/customers/${state.customerId}/quotes`);
    expectStatus(res, 200);
    expect(Array.isArray(res.body.quotes), 'no quotes array');
    if (res.body.quotes.length) state.quoteId = res.body.quotes[0].id;
    return `${res.body.quotes.length} quote(s)`;
  });

  await step(10, 'Send an invoice by SMS', async () => {
    if (!state.customerId || !state.invoiceId) skip('no payable invoice found in step 8');
    const res = await call('POST', '/v1/documents/send', {
      customerId: state.customerId,
      documentType: 'invoice',
      documentId: state.invoiceId,
      channel: 'sms',
    });
    expectStatus(res, 200);
    expect(res.body.simulated === true, 'sandbox key did NOT simulate — this would be a real SMS');
    return `simulated to ${res.body.sentTo}`;
  });

  await step(10.1, "Refuses another customer's document", async () => {
    if (!state.invoiceId) skip('no invoice found in step 8');
    const res = await call('POST', '/v1/documents/send', {
      customerId: 'sbx-cus-0002',
      documentType: 'invoice',
      documentId: state.invoiceId,
      channel: 'sms',
    });
    expect(
      res.status === 400 || res.status === 404,
      `cross-customer send returned ${res.status} — expected it to be refused`,
    );
    return `refused with ${res.status}`;
  });

  await step(12, 'Create a payment link', async () => {
    if (!state.customerId || !state.invoiceId) skip('no payable invoice found in step 8');
    const res = await call('POST', '/v1/payments/link', {
      customerId: state.customerId,
      invoiceId: state.invoiceId,
    });
    expectStatus(res, 200);
    expect(res.body.simulated === true, 'sandbox key did NOT simulate — this would hit Stripe');
    expect(res.body.paymentUrl, 'no payment link returned');
    expect(typeof res.body.amountDue === 'number', 'amountDue is not a number');
    return `$${res.body.amountDue}, simulated link`;
  });

  console.log(c.bold('\nWebhooks'));
  await step(13, 'List available event types', async () => {
    const res = await call('GET', '/v1/webhooks/events');
    expectStatus(res, 200);
    expect(res.body.events.length === 4, `expected 4 event types, got ${res.body.events.length}`);
    return res.body.events.join(', ');
  });

  await step(14, 'Register a webhook', async () => {
    const res = await call('POST', '/v1/webhooks', {
      url: 'https://smoke-test.example.com/hooks',
      events: ['job.completed', 'invoice.paid'],
      description: 'Automated smoke test — safe to delete',
    });
    expectStatus(res, 201);
    expect(res.body.secret && res.body.secret.startsWith('whsec_'), 'no signing secret returned');
    state.webhookId = res.body.id;
    return 'registered, secret issued once';
  });

  await step(14.1, 'Rejects an http or private-address endpoint', async () => {
    const res = await call('POST', '/v1/webhooks', {
      url: 'http://169.254.169.254/latest/meta-data',
      events: ['job.completed'],
    });
    expect(res.status === 400, `expected 400 for an internal address, got ${res.status}`);
    return 'SSRF attempt refused';
  });

  await step(15, 'List registered webhooks', async () => {
    const res = await call('GET', '/v1/webhooks');
    expectStatus(res, 200);
    expect(Array.isArray(res.body), 'expected an array');
    expect(
      res.body.every((w) => !w.secret),
      'a signing secret was exposed in the list',
    );
    return `${res.body.length} endpoint(s), no secrets exposed`;
  });

  await step(16, 'Show webhook delivery history', async () => {
    if (!state.webhookId) skip('no webhook registered in step 14');
    const res = await call('GET', `/v1/webhooks/${state.webhookId}/deliveries`);
    expectStatus(res, 200);
    expect(Array.isArray(res.body), 'expected an array');
    return `${res.body.length} delivery attempt(s) logged`;
  });

  await step(17, 'Delete a webhook', async () => {
    if (!state.webhookId) skip('no webhook registered in step 14');
    const res = await call('DELETE', `/v1/webhooks/${state.webhookId}`);
    expectStatus(res, 200);
    expect(res.body.deleted === true, 'webhook was not deleted');
    return 'removed (smoke test cleaned up after itself)';
  });

  console.log(c.bold('\nSecurity'));
  await step(18, 'A bad key is refused', async () => {
    const res = await fetch(`${BASE}/v1/whoami`, {
      headers: { 'x-api-key': 'pk_test_definitely_not_a_real_key' },
    });
    expect(res.status === 401, `expected 401, got ${res.status}`);
    return 'unknown key rejected with 401';
  });

  await step(19, 'A missing key is refused', async () => {
    const res = await fetch(`${BASE}/v1/whoami`);
    expect(res.status === 401, `expected 401, got ${res.status}`);
    return 'no key rejected with 401';
  });

  // --- summary ------------------------------------------------------------
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => r.ok === false).length;
  const skipped = results.filter((r) => r.skip).length;

  console.log(c.bold('\n─────────────────────────────────────────────'));
  console.log(
    `${c.green(`${passed} passed`)}   ${failed ? c.red(`${failed} failed`) : '0 failed'}   ${
      skipped ? c.yellow(`${skipped} skipped`) : '0 skipped'
    }\n`,
  );

  if (skipped) {
    console.log(c.yellow('Skipped steps could not run because something they needed was missing:'));
    for (const r of results.filter((x) => x.skip)) {
      console.log(c.dim(`  ${r.n}. ${r.name} — ${r.note}`));
    }
    console.log(c.dim('\nUsually means the sandbox data is not seeded: pnpm --filter partner-api seed:sandbox\n'));
  }

  if (failed) {
    console.log(c.red('Failures:'));
    for (const r of results.filter((x) => x.ok === false)) {
      console.log(`  ${r.n}. ${r.name}\n     ${c.dim(r.note)}`);
    }
    console.log('');
    process.exit(1);
  }

  if (skipped) {
    console.log(c.yellow('Not every feature was exercised — treat this as incomplete, not green.\n'));
    process.exit(1);
  }

  console.log(c.green('Every feature exercised end to end against a live stack.\n'));
}

main().catch((err) => {
  console.error(c.red(`\nSmoke test crashed: ${err.stack || err.message}\n`));
  process.exit(1);
});

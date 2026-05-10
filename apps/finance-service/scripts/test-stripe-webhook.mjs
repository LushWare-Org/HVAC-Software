import { readFileSync } from 'fs';
import { request } from 'http';
import { createHmac } from 'crypto';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '../../../.env');

function loadEnv(filePath) {
  try {
    const lines = readFileSync(filePath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
  }
}
loadEnv(envPath);

// ── Config ────────────────────────────────────────────────────────────────────
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';
const TARGET = 'http://localhost:3004/webhooks/stripe';

const invoiceId = process.argv[2];
const eventType = (process.argv[3] ?? 'succeeded') === 'failed'
  ? 'payment_intent.payment_failed'
  : 'payment_intent.succeeded';

if (!invoiceId) {
  console.error('');
  console.error('  Usage: node scripts/test-stripe-webhook.mjs <invoiceId> [succeeded|failed]');
  console.error('');
  console.error('  Example: node scripts/test-stripe-webhook.mjs cm1abc123xyz');
  console.error('');
  process.exit(1);
}

if (!WEBHOOK_SECRET || WEBHOOK_SECRET === 'whsec_placeholder') {
  console.error('');
  console.error('  ❌  STRIPE_WEBHOOK_SECRET is not set in .env');
  console.error('     Set it to any string for local dev, e.g.:');
  console.error('     STRIPE_WEBHOOK_SECRET=dev_local_webhook_secret');
  console.error('');
  process.exit(1);
}

// ── Build fake event payload 
const fakePaymentIntent = {
  id: `pi_test_${Date.now()}`,
  object: 'payment_intent',
  amount: 100000,
  currency: 'usd',
  status: eventType === 'payment_intent.succeeded' ? 'succeeded' : 'requires_payment_method',
  metadata: { invoiceId },
  last_payment_error: eventType === 'payment_intent.payment_failed'
    ? { message: 'Test card declined' }
    : null,
};

const eventPayload = JSON.stringify({
  id: `evt_test_${Date.now()}`,
  object: 'event',
  type: eventType,
  created: Math.floor(Date.now() / 1000),
  livemode: false,
  data: { object: fakePaymentIntent },
});

// ── Generate Stripe-compatible webhook signature ───────────────────────────────
// Stripe signature format: t=<timestamp>,v1=<hmac>
function generateSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = `${timestamp}.${payload}`;
  const hmac = createHmac('sha256', secret).update(signed, 'utf8').digest('hex');
  return `t=${timestamp},v1=${hmac}`;
}

const signature = generateSignature(eventPayload, WEBHOOK_SECRET);

// ── POST to local finance service ─────────────────────────────────────────────
console.log('');
console.log(`  🔔  Sending Stripe test webhook`);
console.log(`  Event : ${eventType}`);
console.log(`  Invoice: ${invoiceId}`);
console.log(`  Target : ${TARGET}`);
console.log('');

const url = new URL(TARGET);
const options = {
  hostname: url.hostname,
  port: parseInt(url.port || '80'),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(eventPayload),
    'stripe-signature': signature,
  },
};

const req = request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log(`  ✅  Webhook accepted (${res.statusCode}) — invoice should be updated`);
    } else {
      console.log(`  ❌  Webhook rejected (${res.statusCode}): ${body}`);
      console.log('');
      console.log('  Check that STRIPE_WEBHOOK_SECRET in .env matches what the script uses.');
    }
    console.log('');
  });
});

req.on('error', (err) => {
  console.error(`  ❌  Could not reach ${TARGET}: ${err.message}`);
  console.error('     Make sure the finance service is running on port 3004.');
  console.error('');
});

req.write(eventPayload);
req.end();

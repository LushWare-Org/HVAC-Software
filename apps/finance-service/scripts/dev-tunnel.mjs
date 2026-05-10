import { readFileSync } from 'fs';
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
  } catch {}
}
loadEnv(envPath);

// ── Validate config ───────────────────────────────────────────────────────────
const NGROK_AUTHTOKEN  = process.env.NGROK_AUTHTOKEN  ?? '';
// Strip protocol if user copied the full URL (e.g. https://xyz.ngrok-free.app → xyz.ngrok-free.app)
const NGROK_DOMAIN     = (process.env.NGROK_DOMAIN ?? '').replace(/^https?:\/\//, '');
const STRIPE_KEY       = process.env.STRIPE_SECRET_KEY ?? '';
const WEBHOOK_SECRET   = process.env.STRIPE_WEBHOOK_SECRET ?? '';
const LOCAL_PORT       = parseInt(process.env.FINANCE_PORT ?? '3004');

if (!NGROK_AUTHTOKEN) {
  console.error('\n  ❌  NGROK_AUTHTOKEN not set in .env');
  console.error('     1. Sign up free at https://ngrok.com');
  console.error('     2. Copy your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken');
  console.error('     3. Add to .env:  NGROK_AUTHTOKEN=your_token_here\n');
  process.exit(1);
}

if (!NGROK_DOMAIN) {
  console.error('\n  ❌  NGROK_DOMAIN not set in .env');
  console.error('     1. Go to https://dashboard.ngrok.com/domains');
  console.error('     2. Click "New Domain" — you get one free static domain');
  console.error('     3. Copy it and add to .env:  NGROK_DOMAIN=your-name.ngrok-free.app\n');
  process.exit(1);
}

if (!STRIPE_KEY || STRIPE_KEY.includes('placeholder')) {
  console.error('\n  ❌  STRIPE_SECRET_KEY is not set or is a placeholder in .env');
  console.error('     Get your test key from https://dashboard.stripe.com/test/apikeys\n');
  process.exit(1);
}

// ── Start ngrok tunnel ────────────────────────────────────────────────────────
console.log('\n  🚇  Starting ngrok tunnel...');
console.log(`     Local : http://localhost:${LOCAL_PORT}`);
console.log(`     Domain: https://${NGROK_DOMAIN}`);

let ngrokLib;
try {
  ngrokLib = await import('@ngrok/ngrok');
} catch {
  console.error('\n  ❌  @ngrok/ngrok not installed.');
  console.error('     Run:  pnpm add -D @ngrok/ngrok  in apps/finance-service/\n');
  process.exit(1);
}

const listener = await ngrokLib.default.forward({
  addr: LOCAL_PORT,
  authtoken: NGROK_AUTHTOKEN,
  domain: NGROK_DOMAIN,
});

const publicUrl = listener.url();
console.log(`\n  ✅  Tunnel active: ${publicUrl}`);

// ── Register or verify Stripe webhook ────────────────────────────────────────
const webhookUrl = `${publicUrl}/webhooks/stripe`;
const EVENTS    = ['payment_intent.succeeded', 'payment_intent.payment_failed', 'checkout.session.completed'];

let stripeLib;
try {
  stripeLib = await import('stripe');
} catch {
  console.error('\n  ❌  stripe package not found. Run pnpm install\n');
  process.exit(1);
}

const Stripe = stripeLib.default;
const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2023-10-16' });

// Check if webhook already exists for this URL
const existing = await stripe.webhookEndpoints.list({ limit: 100 });
const match = existing.data.find(w => w.url === webhookUrl);

if (match) {
  console.log(`\n  ℹ️   Stripe webhook already registered for this domain.`);
  if (!WEBHOOK_SECRET || WEBHOOK_SECRET === 'whsec_...' || WEBHOOK_SECRET === 'whsec_placeholder') {
    console.log('\n  ⚠️   STRIPE_WEBHOOK_SECRET is not set in .env.');
    console.log('     The secret is only shown once when the webhook is created.');
    console.log('     Delete the webhook in Stripe dashboard and restart this script to get a new secret.');
    console.log('     Stripe Dashboard → Developers → Webhooks → Delete → then rerun pnpm dev:tunnel\n');
  } else {
    console.log('  ✅  STRIPE_WEBHOOK_SECRET is already set in .env — you are good to go!\n');
  }
} else {
  console.log('\n  🔗  Registering Stripe webhook...');
  console.log(`     URL: ${webhookUrl}`);

  const endpoint = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: EVENTS,
    description: 'HVAC Software — dev tunnel (auto-created)',
  });

  console.log('\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ✅  Stripe webhook registered!');
  console.log('');
  console.log('  Add this to your .env file:');
  console.log('');
  console.log(`  STRIPE_WEBHOOK_SECRET=${endpoint.secret}`);
  console.log('');
  console.log('  ⚠️  This secret is shown ONLY ONCE. Copy it now.');
  console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('  📋  Running configuration:');
console.log(`     Finance service : http://localhost:${LOCAL_PORT}`);
console.log(`     Public URL      : ${publicUrl}`);
console.log(`     Webhook URL     : ${webhookUrl}`);
console.log(`     Stripe mode     : ${STRIPE_KEY.startsWith('sk_live') ? '🔴 LIVE' : '🟡 TEST'}`);
console.log('');
console.log('  Keep this terminal running. Press Ctrl+C to stop the tunnel.\n');

// Keep process alive until Ctrl+C
const keepAlive = setInterval(() => {}, 1000 * 60 * 60);

process.on('SIGINT', async () => {
  console.log('\n  Closing tunnel...');
  clearInterval(keepAlive);
  await ngrokLib.default.disconnect();
  process.exit(0);
});

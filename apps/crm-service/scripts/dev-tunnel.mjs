import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const rootEnv = resolve(__dir, '../../../.env');

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
  } catch { /* not found — rely on process.env */ }
}
loadEnv(rootEnv);

// Config 
const NGROK_AUTHTOKEN = process.env.NGROK_AUTHTOKEN ?? '';
const CRM_NGROK_DOMAIN = (process.env.CRM_NGROK_DOMAIN ?? '').replace(/^https?:\/\//, '');
const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN ?? '';
const LOCAL_PORT = parseInt(process.env.CRM_PORT ?? '3001');

if (!NGROK_AUTHTOKEN) {
  console.error('\n  ❌  NGROK_AUTHTOKEN not set in .env');
  console.error('     Get it free at https://dashboard.ngrok.com/get-started/your-authtoken\n');
  process.exit(1);
}

// Start tunnel
let ngrokLib;
try {
  ngrokLib = await import('@ngrok/ngrok');
} catch {
  console.error('\n  ❌  @ngrok/ngrok not installed.');
  console.error('     Run:  pnpm add -D @ngrok/ngrok  in apps/crm-service/\n');
  process.exit(1);
}

console.log('\n  🚇  Starting CRM ngrok tunnel...');
console.log(`     Local : http://localhost:${LOCAL_PORT}`);
if (CRM_NGROK_DOMAIN) console.log(`     Domain: https://${CRM_NGROK_DOMAIN}`);

const tunnelConfig = { addr: LOCAL_PORT, authtoken: NGROK_AUTHTOKEN };
if (CRM_NGROK_DOMAIN) tunnelConfig.domain = CRM_NGROK_DOMAIN;

const listener = await ngrokLib.default.forward(tunnelConfig);
const publicUrl = listener.url();

console.log(`\n  ✅  Tunnel active: ${publicUrl}`);

const webhookUrl = `${publicUrl}/meta/webhook`;

console.log('\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  📋  Meta Webhook Setup');
console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('  1. Open: https://developers.facebook.com/apps');
console.log('  2. Select your app → Webhooks (left sidebar)');
console.log('  3. Click "Add Subscription" or edit the Page object');
console.log('  4. Enter:');
console.log('');
console.log(`     Callback URL  : ${webhookUrl}`);
console.log(`     Verify Token  : ${VERIFY_TOKEN || '(set FACEBOOK_VERIFY_TOKEN in .env)'}`);
console.log('');
console.log('  5. Click "Verify and Save"');
console.log('  6. Subscribe to field: leadgen');
console.log('');
console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  📋  Running Configuration');
console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`     CRM service  : http://localhost:${LOCAL_PORT}`);
console.log(`     Public URL   : ${publicUrl}`);
console.log(`     Webhook URL  : ${webhookUrl}`);
if (!CRM_NGROK_DOMAIN) {
  console.log('');
  console.log('  ⚠️   Dynamic URL — changes every restart.');
  console.log('     For a persistent URL set CRM_NGROK_DOMAIN in .env.');
}
console.log('');
console.log('  Keep this terminal running. Press Ctrl+C to stop.\n');

// Keep alive
const keepAlive = setInterval(() => {}, 1_000 * 60 * 60);

process.on('SIGINT', async () => {
  console.log('\n  Closing CRM tunnel...');
  clearInterval(keepAlive);
  await ngrokLib.default.disconnect();
  process.exit(0);
});

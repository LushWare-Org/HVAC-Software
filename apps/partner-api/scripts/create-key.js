const fs = require('fs');
const path = require('path');
const { createHash, randomBytes } = require('crypto');

for (const rel of ['.env', '../../.env']) {
  const p = path.resolve(__dirname, '..', rel);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i < 1 || line.trim().startsWith('#')) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (/^".*"$|^'.*'$/.test(v)) v = v.slice(1, -1);
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

const { PrismaClient } = require('../src/prisma/generated');

/** Everything a voice agent needs, and nothing more. */
const VOICE_AGENT_SCOPES = [
  'customer:lookup',
  'customer:match',
  'availability:read',
  'booking:create',
  'booking:reschedule',
  'booking:cancel',
  'invoice:read',
  'quote:read',
  'document:send',
  'confirmation:send',
  'payment_link:create',
  'webhook:manage',
];

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function main() {
  const companyId = arg('--company');
  const name = arg('--name');
  const environment = (arg('--env', 'LIVE') || 'LIVE').toUpperCase();
  const rateLimitPerMin = Number(arg('--rate', '120'));
  const scopes = arg('--scopes') ? arg('--scopes').split(',') : VOICE_AGENT_SCOPES;

  if (!companyId || !name) {
    console.error('\nUsage:');
    console.error('  node scripts/create-key.js --company <companyId> --name "<label>" [--env LIVE|SANDBOX]\n');
    console.error('Options:');
    console.error('  --env     LIVE (default) or SANDBOX');
    console.error('  --rate    requests per minute (default 120)');
    console.error('  --scopes  comma-separated; defaults to the full voice-agent set\n');
    process.exit(2);
  }

  if (!['LIVE', 'SANDBOX'].includes(environment)) {
    console.error(`\nInvalid --env "${environment}". Use LIVE or SANDBOX.\n`);
    process.exit(2);
  }

  const prisma = new PrismaClient();
  try {
    const plaintext =
      (environment === 'SANDBOX' ? 'pk_test_' : 'pk_live_') + randomBytes(32).toString('hex');

    const key = await prisma.partnerApiKey.create({
      data: {
        companyId,
        name,
        environment,
        keyPrefix: plaintext.slice(0, 16),
        keyHash: createHash('sha256').update(plaintext, 'utf8').digest('hex'),
        scopes,
        rateLimitPerMin,
      },
    });

    console.log(`\n  Company      ${companyId}`);
    console.log(`  Name         ${name}`);
    console.log(`  Environment  ${environment}`);
    console.log(`  Rate limit   ${rateLimitPerMin}/min`);
    console.log(`  Scopes       ${scopes.length}`);
    console.log(`  Key id       ${key.id}`);
    console.log('\n  --- KEY (shown once, cannot be recovered) ---\n');
    console.log(`  ${plaintext}\n`);
    console.log('  Send it to the voice agent provider over a secure channel.\n');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(`\nFailed: ${err.message}\n`);
  process.exit(1);
});

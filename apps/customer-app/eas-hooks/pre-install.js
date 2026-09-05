/**
 * EAS Build "pre-install" hook (see package.json's "eas-build-pre-install"
 * script — Expo runs this automatically before its own dependency install).
 *
 * Why this exists: this is a pnpm workspace, and EAS Build's install step
 * runs a single `pnpm install` across the WHOLE monorepo, not just
 * customer-app — including crm-service, which depends on `pdf-to-img` for
 * its document-templates PDF-to-image feature. `pdf-to-img` requires the
 * native `canvas` addon, which needs system Cairo/Pango graphics libraries
 * that EAS's mobile build image doesn't have, so the install fails compiling
 * a dependency customer-app never touches.
 *
 * Fix: drop `pdf-to-img` from crm-service's manifest and regenerate the
 * lockfile — but ONLY inside this ephemeral EAS build checkout. EAS clones a
 * fresh copy of the repo into its own throwaway container per build; nothing
 * this script does is ever written back to the real repository, so
 * crm-service's actual dependencies (and its real PDF-to-image feature) are
 * completely untouched everywhere else — local dev, its own deploys, git.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const pkgPath = path.join(repoRoot, 'apps', 'crm-service', 'package.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

if (pkg.dependencies && pkg.dependencies['pdf-to-img']) {
  console.log('[eas-build-pre-install] Dropping pdf-to-img (native canvas dep) from crm-service for this build only.');
  delete pkg.dependencies['pdf-to-img'];
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  console.log('[eas-build-pre-install] Regenerating the lockfile for this ephemeral checkout...');
  execSync('pnpm install --no-frozen-lockfile', { cwd: repoRoot, stdio: 'inherit' });

  console.log('[eas-build-pre-install] Done — EAS\'s own install step should now find everything already consistent.');
} else {
  console.log('[eas-build-pre-install] pdf-to-img not present in crm-service deps — nothing to do.');
}

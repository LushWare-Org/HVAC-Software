function supportEmail(): string {
  return process.env.PARTNER_SUPPORT_EMAIL?.trim() || '';
}
function statusUrl(): string {
  return process.env.PARTNER_STATUS_URL?.trim() || '';
}
const CSS = `
:root {
  color-scheme: light;
  --fg:#14161a; --bg:#ffffff; --muted:#5b6472; --line:#e4e7ec;
  --code-bg:#f6f7f9; --panel:#fbfbfc; --accent:#0b62d6; --accent-soft:#e8f0fd;
  --ok:#0f7b43; --warn:#b45309; --no:#b42318;
  --ok-bg:#e7f6ed; --warn-bg:#fdf3e3; --no-bg:#fdeceb;
  --get:#0b62d6; --post:#0f7b43; --patch:#b45309; --delete:#b42318;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin:0; background:var(--bg); color:var(--fg);
  font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

/* ---- shell ---- */
.masthead {
  position: sticky; top: 0; z-index: 20;
  background: var(--bg); border-bottom: 1px solid var(--line);
  padding: 14px 28px; display:flex; align-items:baseline; gap:14px; flex-wrap:wrap;
}
.masthead .brand { font-weight: 650; letter-spacing:-0.01em; }
.masthead .ver {
  font-size:.72rem; letter-spacing:.06em; text-transform:uppercase;
  color:var(--accent); background:var(--accent-soft); padding:3px 8px; border-radius:20px;
}
.masthead .links { margin-left:auto; font-size:.88rem; display:flex; gap:18px; }
.layout { display:flex; align-items:flex-start; gap:48px; max-width:1180px; margin:0 auto; padding:0 28px; }

nav.toc {
  position: sticky; top: 61px; width: 232px; flex: 0 0 232px;
  max-height: calc(100vh - 61px); overflow-y:auto; padding: 30px 0 60px;
  font-size: .88rem;
}
nav.toc ol { list-style:none; margin:0; padding:0; }
nav.toc > ol > li { margin: 0 0 3px; }
nav.toc a { color: var(--muted); display:block; padding:4px 10px 4px 0; }
nav.toc a:hover { color: var(--fg); text-decoration:none; }
nav.toc .sub { padding-left: 14px; font-size:.84rem; }
nav.toc .grp {
  color: var(--fg); font-weight:600; font-size:.72rem; letter-spacing:.08em;
  text-transform:uppercase; margin:22px 0 8px;
}

main { flex: 1 1 auto; min-width: 0; max-width: 780px; padding: 34px 0 140px; }

/* ---- type ---- */
h1 { font-size:2.05rem; margin:0 0 10px; letter-spacing:-0.025em; line-height:1.2; }
h2 {
  font-size:1.35rem; margin:56px 0 14px; padding-top:26px;
  border-top:1px solid var(--line); letter-spacing:-0.015em; scroll-margin-top:76px;
}
h3 { font-size:1.02rem; margin:30px 0 8px; scroll-margin-top:76px; }
h4 { font-size:.85rem; margin:20px 0 6px; color:var(--muted); text-transform:uppercase; letter-spacing:.06em; }
.lede { color:var(--muted); font-size:1.08rem; margin:0 0 28px; }
p, li { margin: 0 0 12px; }
ul, ol { padding-left: 22px; }

code {
  background:var(--code-bg); padding:2px 6px; border-radius:4px; font-size:.88em;
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
pre {
  background:var(--code-bg); padding:14px 16px; border-radius:8px; overflow-x:auto;
  border:1px solid var(--line); margin:12px 0;
}
pre code { background:none; padding:0; font-size:.82rem; line-height:1.6; }

table { border-collapse:collapse; width:100%; margin:16px 0; display:block; overflow-x:auto; }
th, td {
  text-align:left; padding:9px 14px 9px 0; border-bottom:1px solid var(--line);
  font-size:.9rem; vertical-align:top;
}
th { color:var(--muted); font-weight:600; white-space:nowrap; font-size:.78rem;
     text-transform:uppercase; letter-spacing:.05em; }
td code { white-space:nowrap; }

.note {
  border-left:3px solid var(--accent); padding:12px 16px; margin:18px 0;
  background:var(--panel); border-radius:0 6px 6px 0; font-size:.94rem;
}
.note p:last-child { margin-bottom:0; }
.note.warn { border-left-color:var(--warn); }
.note.stop { border-left-color:var(--no); }

/* ---- endpoint blocks ---- */
.ep { border:1px solid var(--line); border-radius:9px; margin:20px 0; overflow:hidden; }
.ep > header {
  display:flex; align-items:center; gap:10px; padding:11px 14px;
  background:var(--panel); border-bottom:1px solid var(--line); flex-wrap:wrap;
}
.ep > header .path { font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size:.86rem; }
.ep > .body { padding:4px 14px 14px; }
.ep > .body > p:first-child { margin-top:12px; }
.m {
  font:600 .7rem/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  letter-spacing:.06em; padding:5px 7px; border-radius:4px; color:#fff;
}
.m.get { background:var(--get); } .m.post { background:var(--post); }
.m.patch { background:var(--patch); } .m.delete { background:var(--delete); }
.scope-tag {
  margin-left:auto; font-size:.74rem; color:var(--muted);
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}

/* ---- capability matrix ---- */
.pill {
  display:inline-block; font-size:.72rem; font-weight:600; padding:3px 9px;
  border-radius:20px; white-space:nowrap;
}
.pill.yes { color:var(--ok); background:var(--ok-bg); }
.pill.part { color:var(--warn); background:var(--warn-bg); }
.pill.no { color:var(--no); background:var(--no-bg); }
.qa { border-bottom:1px solid var(--line); padding:20px 0; }
.qa:last-child { border-bottom:none; }
.qa .q { font-weight:600; margin:0 0 8px; display:flex; gap:12px; align-items:flex-start; }
.qa .q span.n { color:var(--muted); font-variant-numeric:tabular-nums; }
.qa .a { margin:0 0 8px; }
.qa .ref { font-size:.86rem; color:var(--muted); }
.qa .ref code { font-size:.82rem; }

footer {
  margin-top:64px; padding-top:20px; border-top:1px solid var(--line);
  color:var(--muted); font-size:.88rem;
}

/* ---- print / save-as-PDF ----
   Vendors circulate this document as a PDF attachment during procurement, so
   printing is a first-class output, not an afterthought. Force the light
   palette (a dark-mode print wastes a cartridge and reads badly), drop the
   navigation chrome, and keep endpoint cards and tables off page seams. */
@media print {
  :root {
    --fg:#000; --bg:#fff; --muted:#444; --line:#bbb;
    --code-bg:#f4f4f4; --panel:#f8f8f8; --accent:#0b3d91; --accent-soft:#eef2fa;
    --ok:#0f5132; --warn:#7a4a06; --no:#842029;
    --ok-bg:#eaf3ee; --warn-bg:#faf1e0; --no-bg:#f8ecec;
    --get:#0b3d91; --post:#0f5132; --patch:#7a4a06; --delete:#842029;
  }
  body { font-size: 10.5pt; line-height: 1.5; }
  @page { margin: 18mm 16mm; }

  /* Navigation is meaningless on paper. */
  nav.toc, .masthead .links { display: none; }
  .masthead { position: static; padding: 0 0 10px; margin-bottom: 18px; }
  .layout { display: block; max-width: none; padding: 0; }
  main { max-width: none; padding: 0; }

  h1 { font-size: 20pt; }
  h2 { font-size: 14pt; margin-top: 26px; padding-top: 14px; }
  h3 { font-size: 11.5pt; }
  h1, h2, h3, h4 { break-after: avoid; page-break-after: avoid; }

  /* Never split a request/response example or a rule table across a page. */
  .ep, .note, .qa, table, pre { break-inside: avoid; page-break-inside: avoid; }
  .ep { border-color: #bbb; }
  pre { border-color: #ccc; white-space: pre-wrap; word-wrap: break-word; }
  table { display: table; width: 100%; }

  .m { color: #fff !important; }
  a { color: #000; text-decoration: none; }
  /* Only spell out links that leave the document; anchors are noise on paper. */
  a[href^="http"]::after, a[href^="mailto"]::after {
    content: " (" attr(href) ")"; font-size: 8.5pt; color: #555; word-break: break-all;
  }
  footer { margin-top: 28px; }
}

@media (max-width: 900px) {
  .layout { display:block; padding:0 20px; }
  nav.toc {
    position:static; width:auto; max-height:none; padding:22px 0 4px;
    border-bottom:1px solid var(--line); columns:2; column-gap:24px;
  }
  nav.toc .grp { margin-top:14px; }
  main { padding-top:24px; max-width:none; }
  .masthead { padding:12px 20px; }
  .masthead .links { width:100%; margin-left:0; }
}
`;

const TOC = `
<nav class="toc" aria-label="Contents">
<ol>
  <li class="grp">Start here</li>
  <li><a href="#overview">1. Overview</a></li>
  <li><a href="#quickstart">2. Quickstart</a></li>
  <li><a href="#auth">3. Authentication</a></li>
  <li><a href="#environments">4. Environments &amp; sandbox</a></li>
  <li><a href="#scopes">5. Permissions</a></li>
  <li><a href="#limits">6. Rate limits &amp; quotas</a></li>
  <li><a href="#conventions">7. Conventions</a></li>

  <li class="grp">API reference</li>
  <li><a href="#ref-identity">8.1 Identity</a></li>
  <li><a href="#ref-callers">8.2 Callers</a></li>
  <li><a href="#ref-availability">8.3 Availability</a></li>
  <li><a href="#ref-bookings">8.4 Bookings</a></li>
  <li><a href="#ref-documents">8.5 Invoices &amp; quotes</a></li>
  <li><a href="#ref-payments">8.6 Payments</a></li>
  <li><a href="#ref-webhooks">8.7 Webhook management</a></li>

  <li class="grp">Events</li>
  <li><a href="#events">9. Webhooks &amp; events</a></li>
  <li><a href="#events-catalogue" class="sub">Event catalogue</a></li>
  <li><a href="#events-verify" class="sub">Verifying signatures</a></li>
  <li><a href="#events-retry" class="sub">Retries &amp; suspension</a></li>
  <li><a href="#events-staff" class="sub">Internal staff alerts</a></li>

  <li class="grp">Building well</li>
  <li><a href="#errors">10. Errors</a></li>
  <li><a href="#agent-guide">11. Voice agent guidance</a></li>
  <li><a href="#security">12. Security &amp; data handling</a></li>
  <li><a href="#matrix">13. Capability matrix</a></li>
  <li><a href="#golive">14. Going live</a></li>
  <li><a href="#support">15. Versioning &amp; support</a></li>
</ol>
</nav>
`;

// ---------------------------------------------------------------------------
// 1–7 — orientation
// ---------------------------------------------------------------------------

const INTRO = `
<h1>Partner API</h1>
<p class="lede">The integration surface HVACtor exposes to external agents &mdash; AI voice
agents, chat agents and dialers &mdash; so they can identify an inbound caller, book work,
discuss invoices and quotes, send documents and take payment, all inside a live phone call.</p>

<div class="note">
  <p><strong>Two design rules explain almost every decision in this API.</strong></p>
  <p><strong>1. One caller at a time.</strong> There is no customer list, search or export
  endpoint, and no scope that would grant one. You resolve the person on the phone, and
  you get their record &mdash; nobody else's.</p>
  <p><strong>2. A human confirms anything you write.</strong> Bookings are created
  <code>PENDING</code>, records your agent creates are tagged for review, and outbound
  messages can only go to contact details already on file.</p>
</div>

<h2 id="overview">1. Overview</h2>

<p>The Partner API is a versioned REST API over HTTPS. Requests and responses are JSON.
Authentication is a single API key header. There is no OAuth handshake, no SDK to install
and no callback registration required before you can make your first call.</p>

<h4>Base URL</h4>
<pre><code>https://{your-tenant-host}/api/partner</code></pre>
<p>Your account manager gives you the host when your key is issued. Every path in this
document is relative to that base &mdash; so <code>/v1/whoami</code> is
<code>https://{your-tenant-host}/api/partner/v1/whoami</code>. The same base URL serves both
environments; sandbox versus live is decided by the key you present, not the address you call.</p>

<h4>What lives where</h4>
<table>
  <tr><th>Path</th><th>Auth</th><th>What it is</th></tr>
  <tr><td><code>/guide</code></td><td>public</td><td>This document.</td></tr>
  <tr><td><code>/docs</code></td><td>public</td><td>Interactive OpenAPI reference (Swagger UI). Every endpoint, every field, try-it-out with your key.</td></tr>
  <tr><td><code>/docs-json</code></td><td>public</td><td>The raw OpenAPI 3 spec. Point your code generator at this.</td></tr>
  <tr><td><code>/capabilities</code></td><td>public</td><td>Machine-readable summary: scopes, endpoints, events, limits. Useful for capability discovery at runtime.</td></tr>
  <tr><td><code>/health</code></td><td>public</td><td>Liveness probe.</td></tr>
  <tr><td><code>/v1/*</code></td><td>API key</td><td>The API itself.</td></tr>
</table>

<h4>What the API covers</h4>
<table>
  <tr><th>Area</th><th>You can</th></tr>
  <tr><td>Caller identity</td><td>Resolve an inbound number to exactly one customer, or confirm one specific person by name and address.</td></tr>
  <tr><td>Customer context</td><td>Read the resolved caller's profile, VIP flag, service agreement, job history counts, equipment count, open quotes, unpaid invoices and balance.</td></tr>
  <tr><td>Scheduling</td><td>Read bookable slots with real remaining capacity, then create, reschedule or cancel an appointment.</td></tr>
  <tr><td>Financial documents</td><td>List invoices and quotes with live status and balances, and send either to the customer by SMS or email.</td></tr>
  <tr><td>Payments</td><td>Create a Stripe-hosted payment link for a specific unpaid invoice, optionally delivered by SMS or email.</td></tr>
  <tr><td>Events</td><td>Subscribe to signed webhooks for job completion, invoice payment, quote acceptance and booking confirmation.</td></tr>
</table>

<h4>What the API deliberately does not cover</h4>
<p>These are boundaries, not gaps in a roadmap. Design around them.</p>
<table>
  <tr><th>Not available</th><th>Why</th></tr>
  <tr><td>Customer list, search or export</td><td>A partner key resolves the caller in front of it. Bulk access to a customer base is not a voice-agent capability.</td></tr>
  <tr><td>Technician identity, GPS position or live dispatch board</td><td>Staff location is employee data. You get bookable capacity instead &mdash; see <a href="#ref-availability">8.3</a>.</td></tr>
  <tr><td>Free-form outbound SMS or email</td><td>Every send endpoint is tied to a specific document or booking and a recipient already on file. There is no "send arbitrary text to arbitrary number" call.</td></tr>
  <tr><td>Card numbers, tokens or stored payment methods</td><td>Card data is entered on Stripe's hosted page. It never enters this API and never reaches your agent.</td></tr>
  <tr><td>Editing invoices, quotes or prices</td><td>Money documents are authored inside HVACtor by staff.</td></tr>
  <tr><td>Equipment detail records</td><td>You get a count on the caller profile so the agent knows equipment exists. Per-unit make, model and service history are not exposed.</td></tr>
</table>

<h2 id="quickstart">2. Quickstart</h2>
<p>Five requests, in order, using a sandbox key. Nothing here reaches a real person.</p>

<h4>1. Confirm the key</h4>
<pre><code>curl https://{host}/api/partner/v1/whoami \\
  -H "x-api-key: pk_test_..."</code></pre>
<pre><code>{
  "companyId": "co_sandbox_a1b2c3",
  "keyName": "Acme Voice — sandbox",
  "environment": "SANDBOX",
  "scopes": ["customer:lookup", "availability:read", "booking:create", "..."],
  "rateLimitPerMin": 60
}</code></pre>
<p>Start every integration here. It tells you exactly what your key may do, so you never
have to guess at a 403 later.</p>

<h4>2. Identify the caller</h4>
<pre><code>curl "https://{host}/api/partner/v1/callers/lookup?phone=%2B94771234567" \\
  -H "x-api-key: pk_test_..."</code></pre>

<h4>3. Offer real appointment times</h4>
<pre><code>curl "https://{host}/api/partner/v1/availability?limit=3" \\
  -H "x-api-key: pk_test_..."</code></pre>

<h4>4. Book one of them</h4>
<pre><code>curl -X POST https://{host}/api/partner/v1/bookings \\
  -H "x-api-key: pk_test_..." \\
  -H "content-type: application/json" \\
  -d '{"customerId":"cus_123","serviceType":"AC repair","preferredDate":"2026-09-10T10:00:00.000Z"}'</code></pre>

<h4>5. Subscribe to events</h4>
<pre><code>curl -X POST https://{host}/api/partner/v1/webhooks \\
  -H "x-api-key: pk_test_..." \\
  -H "content-type: application/json" \\
  -d '{"url":"https://you.example.com/hooks/tscrm","events":["job.completed","invoice.paid"]}'</code></pre>
<p>The signing secret comes back once, in that response. Store it before you move on.</p>

<h2 id="auth">3. Authentication</h2>

<p>Every request to <code>/v1/*</code> carries your key in the <code>x-api-key</code> header.
There is no other accepted credential.</p>
<pre><code>x-api-key: pk_live_9f3c...</code></pre>

<h4>How keys are issued</h4>
<p>Keys are created by the company's own administrator inside the HVACtor admin dashboard,
not by you. The full key is displayed once at creation and stored only as a hash on our side
&mdash; if it is lost it must be replaced, not recovered. When you request a key, tell the
administrator the exact scope list you need (section 5) so they can grant least privilege.</p>

<h4>Properties of a key</h4>
<table>
  <tr><th>Property</th><th>Meaning</th></tr>
  <tr><td>Company binding</td><td>A key belongs to exactly one company. Every query it makes is scoped to that company's data at the server. Cross-company access is not expressible in the API.</td></tr>
  <tr><td>Environment</td><td><code>LIVE</code> or <code>SANDBOX</code>. Fixed at creation.</td></tr>
  <tr><td>Scopes</td><td>An explicit allow-list. Anything not granted returns <code>403</code>.</td></tr>
  <tr><td>Rate limit</td><td>Per-minute ceiling, defaulting to 60 and settable per key.</td></tr>
  <tr><td>Expiry</td><td>Optional. An expired key behaves exactly like a revoked one.</td></tr>
  <tr><td>Revocation</td><td>Immediate, at the next request. No propagation delay.</td></tr>
</table>

<div class="note warn">
  <p><strong>Treat the key as a password.</strong> It is a bearer credential: whoever holds it
  can act as your integration. Keep it server-side, in a secret manager or environment variable
  &mdash; never in a browser bundle, a mobile app, a repository, or a prompt you hand to a
  language model. Rotate by asking for a second key, cutting traffic over, then having the
  first revoked.</p>
</div>

<h4>Failed authentication</h4>
<p>Missing, unknown, revoked and expired keys all return the same <code>401</code> with the
same message. That is deliberate &mdash; a caller cannot use error text to discover which of
their keys still exists.</p>

<h2 id="environments">4. Environments &amp; sandbox</h2>

<table>
  <tr><th>Prefix</th><th>Environment</th><th>Behaviour</th></tr>
  <tr><td><code>pk_test_</code></td><td>SANDBOX</td><td>Real code paths, real validation, seeded demo tenant. Every outward side effect is simulated.</td></tr>
  <tr><td><code>pk_live_</code></td><td>LIVE</td><td>Real customers. Messages are delivered and payment links are chargeable.</td></tr>
</table>

<h4>What "simulated" means precisely</h4>
<p>A sandbox request runs the identical service code as a live one. Every authentication
check, scope check, rate limit, ownership check and business rule executes and can fail
exactly as it would in production. Only the final delivery step is withheld:</p>
<ul>
  <li>No SMS or email leaves the system.</li>
  <li>No Stripe checkout session is created; the returned link points at
      <code>https://sandbox.invalid/...</code> and is not payable.</li>
</ul>
<p>Simulated responses carry two extra fields so you can never mistake one for the real thing:</p>
<pre><code>{
  "sent": true,
  "channel": "sms",
  "sentTo": "••••4567",
  "simulated": true,
  "notice": "Sandbox key: nothing was actually sent. Use a live key for real delivery."
}</code></pre>

<div class="note">
  <p>Because sandbox fails wherever live would fail, a flow that works end to end against
  <code>pk_test_</code> works against <code>pk_live_</code>. That is the point of building
  it this way &mdash; and the reason we ask you to certify in sandbox before a live key is
  issued.</p>
</div>

<h2 id="scopes">5. Permissions</h2>

<p>Each key carries an explicit scope list. A request to an endpoint whose scope you were
not granted returns <code>403</code> with the missing scope named in the message, so
diagnosis never requires a support ticket.</p>

<table>
  <tr><th>Scope</th><th>Grants</th></tr>
  <tr><td><code>customer:lookup</code></td><td><code>GET /v1/callers/lookup</code> &mdash; identify a caller by phone number.</td></tr>
  <tr><td><code>customer:match</code></td><td><code>POST /v1/callers/match</code> &mdash; confirm one specific customer by name and address.</td></tr>
  <tr><td><code>availability:read</code></td><td><code>GET /v1/availability</code> &mdash; read bookable slots.</td></tr>
  <tr><td><code>booking:create</code></td><td><code>POST /v1/bookings</code> &mdash; create a pending appointment. Also permits creating a customer record for a first-time caller as part of that booking.</td></tr>
  <tr><td><code>booking:reschedule</code></td><td><code>PATCH /v1/bookings/{id}/reschedule</code></td></tr>
  <tr><td><code>booking:cancel</code></td><td><code>PATCH /v1/bookings/{id}/cancel</code></td></tr>
  <tr><td><code>invoice:read</code></td><td><code>GET /v1/customers/{id}/invoices</code> &mdash; statuses and balances.</td></tr>
  <tr><td><code>quote:read</code></td><td><code>GET /v1/customers/{id}/quotes</code></td></tr>
  <tr><td><code>document:send</code></td><td><code>POST /v1/documents/send</code> &mdash; send an invoice or quote to the customer on file.</td></tr>
  <tr><td><code>confirmation:send</code></td><td><code>POST /v1/bookings/{id}/confirmation</code></td></tr>
  <tr><td><code>payment_link:create</code></td><td><code>POST /v1/payments/link</code></td></tr>
  <tr><td><code>webhook:manage</code></td><td>All of <code>/v1/webhooks/*</code>.</td></tr>
</table>

<p><code>GET /v1/whoami</code> requires no scope &mdash; a valid key is enough.</p>

<h4>Wildcards</h4>
<p>A grant of <code>invoice:*</code> satisfies every <code>invoice:</code> scope, and
<code>*</code> satisfies everything. Both exist for internal testing. Ask for the explicit
list instead: a compromised narrow key is a contained incident, a compromised
<code>*</code> key is not.</p>

<h4>A typical voice-agent grant</h4>
<pre><code>customer:lookup
customer:match
availability:read
booking:create
booking:reschedule
booking:cancel
invoice:read
quote:read
document:send
confirmation:send
payment_link:create
webhook:manage</code></pre>

<h2 id="limits">6. Rate limits &amp; quotas</h2>

<p>Limits are per key, per rolling 60-second window. The default is <strong>60 requests
per minute</strong>; a higher ceiling can be set on your key if your call volume justifies it.
Ask before you need it, not during a launch.</p>

<p>Every authenticated response carries your position:</p>
<pre><code>X-RateLimit-Limit: 60
X-RateLimit-Remaining: 57
X-RateLimit-Reset: 1788345480</code></pre>
<table>
  <tr><th>Header</th><th>Meaning</th></tr>
  <tr><td><code>X-RateLimit-Limit</code></td><td>Your ceiling for the window.</td></tr>
  <tr><td><code>X-RateLimit-Remaining</code></td><td>Requests left in the current window.</td></tr>
  <tr><td><code>X-RateLimit-Reset</code></td><td>Unix epoch seconds at which the window rolls over.</td></tr>
  <tr><td><code>Retry-After</code></td><td>On <code>429</code> only. Seconds to wait.</td></tr>
</table>

<p>Exceeding the limit returns <code>429</code>. Honour <code>Retry-After</code> and back off
&mdash; retrying immediately consumes the next window before it starts. A well-behaved agent
watches <code>X-RateLimit-Remaining</code> and slows down before it is refused.</p>

<h4>Business-rule quotas</h4>
<p>Separate from the request ceiling, two rules protect against a misbehaving or hijacked agent.
Both return <code>400</code> with a message written to be read aloud to the caller.</p>
<table>
  <tr><th>Rule</th><th>Default</th><th>Rationale</th></tr>
  <tr><td>First-time-caller bookings per phone number</td><td>1 per 24 hours</td><td>A repeat first-time booking from one number is either a mistake or abuse. Genuine repeat customers resolve to an existing record and are unaffected.</td></tr>
  <tr><td>Payment link for a customer record created on this same call</td><td>Blocked for 24 hours</td><td>That record's name, address and number are whatever the caller said. We do not take money against an unverified identity.</td></tr>
</table>

<h2 id="conventions">7. Conventions</h2>

<table>
  <tr><th>Topic</th><th>Convention</th></tr>
  <tr><td>Transport</td><td>HTTPS only. Requests over plain HTTP are not served in production.</td></tr>
  <tr><td>Content type</td><td><code>application/json</code> on request and response.</td></tr>
  <tr><td>Versioning</td><td>In the path: <code>/v1/</code>. New endpoints and response fields are added to <code>/v1</code> without notice; breaking changes ship as a new version path.</td></tr>
  <tr><td>Timestamps</td><td>ISO 8601 with an explicit UTC offset, e.g. <code>2026-09-10T10:00:00.000Z</code>. Human-facing slot labels are pre-rendered in the company's own timezone.</td></tr>
  <tr><td>Money</td><td>JSON numbers in dollars, two decimal places &mdash; <code>480.5</code> means $480.50. There are no cents-integers anywhere in this API.</td></tr>
  <tr><td>Status values</td><td><code>UPPER_SNAKE_CASE</code>: <code>PENDING</code>, <code>CONFIRMED</code>, <code>PAID</code>, <code>PARTIALLY_PAID</code>. Compare case-sensitively against the documented set and treat an unrecognised value as unknown rather than crashing.</td></tr>
  <tr><td>Identifiers</td><td>Opaque strings. Never parse, order or derive meaning from them.</td></tr>
  <tr><td>Unknown fields</td><td>We add response fields without a version bump. Your parser must ignore fields it does not recognise.</td></tr>
  <tr><td>Unknown request fields</td><td>Rejected with <code>400</code>. Send only documented fields &mdash; this catches typos rather than silently discarding them.</td></tr>
  <tr><td>Phone numbers</td><td>Send E.164 (<code>+94771234567</code>), URL-encoded in query strings (<code>%2B94771234567</code>). Matching is tolerant of formatting differences on our side.</td></tr>
  <tr><td>Retries</td><td>Safe to retry <code>GET</code> requests freely. Retrying a failed <code>POST /v1/bookings</code> may create a second booking &mdash; check before repeating.</td></tr>
</table>
`;

// ---------------------------------------------------------------------------
// 8 — endpoint reference
// ---------------------------------------------------------------------------

const REFERENCE = `
<h2 id="reference">8. API reference</h2>
<p>Every endpoint below is live and covered by tests. The interactive version, with full
schemas and a try-it-out console, is at <a href="/docs">/docs</a>.</p>

<h3 id="ref-identity">8.1 Identity</h3>

<div class="ep">
  <header><span class="m get">GET</span><span class="path">/v1/whoami</span>
    <span class="scope-tag">no scope required</span></header>
  <div class="body">
    <p>Confirms the key is valid and reports exactly what it may do. Call it at start-up and
    on deploy; it is the cheapest way to catch a mis-provisioned key before a customer is on
    the line.</p>
    <h4>Response</h4>
<pre><code>{
  "companyId": "co_9d41f7b2",
  "keyName": "Acme Voice — production",
  "environment": "LIVE",
  "scopes": ["customer:lookup", "booking:create", "invoice:read"],
  "rateLimitPerMin": 120
}</code></pre>
  </div>
</div>

<h3 id="ref-callers">8.2 Callers</h3>

<div class="ep">
  <header><span class="m get">GET</span><span class="path">/v1/callers/lookup</span>
    <span class="scope-tag">customer:lookup</span></header>
  <div class="body">
    <p>Resolves an inbound phone number to <em>exactly one</em> customer, and returns their
    profile together with a call-ready summary. This is the first call of almost every
    conversation.</p>

    <h4>Query parameters</h4>
    <table>
      <tr><th>Name</th><th>Required</th><th>Notes</th></tr>
      <tr><td><code>phone</code></td><td>yes</td><td>E.164, URL-encoded. Matching ignores spaces, dashes, brackets and country-code formatting.</td></tr>
    </table>

    <h4>Three possible results &mdash; handle all three</h4>
    <table>
      <tr><th>result</th><th>Meaning</th><th>What your agent should do</th></tr>
      <tr><td><code>found</code></td><td>Exactly one customer matched.</td><td>Greet them by name and use the summary.</td></tr>
      <tr><td><code>not_found</code></td><td>No customer has this number.</td><td>Treat as a first-time caller.</td></tr>
      <tr><td><code>ambiguous</code></td><td>Two or more customers share the number (a household, a landlord, an office line). <code>matches</code> gives the count.</td><td>Ask for their name and address, then call <code>/v1/callers/match</code>. Never guess which one it is.</td></tr>
    </table>

    <h4>Response &mdash; found</h4>
<pre><code>{
  "result": "found",
  "customer": {
    "id": "cus_7f21",
    "firstName": "Sarah",
    "lastName": "Jones",
    "fullName": "Sarah Jones",
    "type": "RESIDENTIAL",
    "isVip": true,
    "email": "sarah@example.com",
    "phone": "+94771234567",
    "address": "12 Baker Street",
    "city": "Colombo",
    "zipCode": "00300",
    "customerSince": "2023-04-11T09:22:14.000Z",
    "hasServiceAgreement": true
  },
  "summary": {
    "openJobs": 1,
    "totalJobs": 9,
    "lastJob": {
      "id": "job_4410",
      "type": "Annual AC service",
      "status": "COMPLETED",
      "scheduledAt": "2026-06-02T08:00:00.000Z"
    },
    "equipmentCount": 3,
    "unpaidInvoices": 1,
    "balanceDue": 480.00,
    "openQuotes": 1,
    "degraded": []
  }
}</code></pre>

    <h4>Response &mdash; ambiguous / not found</h4>
<pre><code>{ "result": "ambiguous", "matches": 2 }

{ "result": "not_found" }</code></pre>

    <div class="note warn">
      <p><strong>Always read <code>summary.degraded</code> before you speak about that area.</strong>
      The four summary sections &mdash; <code>jobs</code>, <code>invoices</code>,
      <code>quotes</code>, <code>equipment</code> &mdash; are fetched in parallel and each can
      fail independently, so a slow downstream never blocks the caller's greeting. Any section
      that could not be loaded is named in <code>degraded</code>, and its counters are
      <code>0</code> because they are <em>unknown</em>, not because they are zero.</p>
      <p>If <code>degraded</code> contains <code>"invoices"</code>, do not tell the caller they
      owe nothing. Say you cannot see their billing right now and offer a callback.</p>
    </div>
  </div>
</div>

<div class="ep">
  <header><span class="m post">POST</span><span class="path">/v1/callers/match</span>
    <span class="scope-tag">customer:match</span></header>
  <div class="body">
    <p>Confirms or denies <em>one specific person</em> from a name plus address. It never
    returns a list of candidates, and it cannot be used to browse. Use it in two situations:
    after an <code>ambiguous</code> lookup, and when an unrecognised number might belong to an
    existing customer calling from their mobile &mdash; which is what stops a regular customer
    becoming a duplicate record every time they change phones.</p>

    <h4>Request</h4>
<pre><code>{
  "firstName": "Sarah",
  "lastName": "Jones",
  "address": "12 Baker Street",
  "zipCode": "00300"
}</code></pre>
    <p><code>zipCode</code> is optional; everything else is required. Returns <code>200</code>
    with the same three-result shape as <code>/v1/callers/lookup</code>.</p>
  </div>
</div>

<h3 id="ref-availability">8.3 Availability</h3>

<div class="ep">
  <header><span class="m get">GET</span><span class="path">/v1/availability</span>
    <span class="scope-tag">availability:read</span></header>
  <div class="body">
    <p>Bookable appointment slots, computed live from the company's active technician
    headcount minus appointments already taken in each window, and rendered in the company's
    own timezone.</p>

    <h4>Query parameters</h4>
    <table>
      <tr><th>Name</th><th>Default</th><th>Range</th><th>Notes</th></tr>
      <tr><td><code>limit</code></td><td>6</td><td>1&ndash;50</td><td>How many slots to return.</td></tr>
      <tr><td><code>daysAhead</code></td><td>14</td><td>1&ndash;60</td><td>How far forward to search.</td></tr>
    </table>

    <h4>Response</h4>
<pre><code>{
  "timezone": "Asia/Colombo",
  "capacityPerSlot": 4,
  "slots": [
    {
      "start": "2026-09-10T04:30:00.000Z",
      "end": "2026-09-10T06:30:00.000Z",
      "label": "Thursday, Sep 10, 10 AM–12 PM",
      "remainingCapacity": 3
    }
  ]
}</code></pre>

    <div class="note">
      <p>Read <code>label</code> aloud verbatim &mdash; it is already correct for the company's
      timezone and needs no conversion. Pass <code>start</code> back unchanged as
      <code>preferredDate</code> when you book. Never compose a time yourself: an agent that
      invents "how about Tuesday morning?" books work nobody can staff.</p>
    </div>

    <p>Slots respect a minimum lead time, so a slot returned to you is genuinely offerable.
    Capacity is aggregate: you learn that three visits can still be booked at 10 AM, not who
    would attend them.</p>
  </div>
</div>

<h3 id="ref-bookings">8.4 Bookings</h3>

<div class="ep">
  <header><span class="m post">POST</span><span class="path">/v1/bookings</span>
    <span class="scope-tag">booking:create</span></header>
  <div class="body">
    <p>Creates an appointment request. It is always created <code>PENDING</code>; the office
    confirms before anyone is dispatched.</p>

    <h4>Request &mdash; existing customer</h4>
<pre><code>{
  "customerId": "cus_7f21",
  "serviceType": "AC repair",
  "preferredDate": "2026-09-10T04:30:00.000Z",
  "description": "Blowing warm air since Tuesday"
}</code></pre>

    <h4>Request &mdash; first-time caller</h4>
    <p>Omit <code>customerId</code> and supply the caller's details instead. A customer record
    and a lead are created, both tagged <code>ai-phone-agent</code> and annotated as
    caller-reported and unverified, so staff review them where they already review new signups.</p>
<pre><code>{
  "serviceType": "AC repair",
  "preferredDate": "2026-09-10T04:30:00.000Z",
  "firstName": "Sarah",
  "lastName": "Jones",
  "phone": "+94771234567",
  "email": "sarah@example.com",
  "address": "12 Baker Street",
  "city": "Colombo",
  "zipCode": "00300",
  "description": "No cooling in the upstairs unit"
}</code></pre>
    <p><code>firstName</code>, <code>lastName</code> and <code>phone</code> are all required in
    this form; a nameless customer record is worse than none, so the request is refused without
    them.</p>

    <h4>Response &mdash; 201</h4>
<pre><code>{
  "booking": {
    "id": "bkg_9931",
    "status": "PENDING",
    "serviceType": "AC repair",
    "preferredDate": "2026-09-10T04:30:00.000Z"
  },
  "customerId": "cus_7f21",
  "createdCustomer": false,
  "requiresConfirmation": true,
  "message": "Booking received and awaiting confirmation. The office will confirm shortly."
}</code></pre>

    <div class="note stop">
      <p><strong><code>requiresConfirmation</code> is always <code>true</code>. Say so.</strong>
      "That's booked in and the office will confirm shortly" is accurate.
      "You're confirmed for Thursday" is not, and it is the single most damaging thing a voice
      agent can get wrong &mdash; the customer waits in for a technician nobody dispatched.</p>
    </div>

    <p>A number that has already booked as a first-time caller in the last 24 hours is refused
    with <code>400</code> and a message you can read out. Existing customers booking with
    <code>customerId</code> are not affected by that rule.</p>
  </div>
</div>

<div class="ep">
  <header><span class="m patch">PATCH</span><span class="path">/v1/bookings/{id}/reschedule</span>
    <span class="scope-tag">booking:reschedule</span></header>
  <div class="body">
    <h4>Request</h4>
<pre><code>{ "preferredDate": "2026-09-12T04:30:00.000Z", "reason": "Caller is away Thursday" }</code></pre>
    <h4>Response</h4>
<pre><code>{
  "booking": { "id": "bkg_9931", "status": "PENDING", "preferredDate": "2026-09-12T04:30:00.000Z" },
  "requiresConfirmation": true
}</code></pre>
    <p>A rescheduled booking returns to awaiting confirmation. Take the new time from
    <code>/v1/availability</code>, not from the caller's suggestion.</p>
  </div>
</div>

<div class="ep">
  <header><span class="m patch">PATCH</span><span class="path">/v1/bookings/{id}/cancel</span>
    <span class="scope-tag">booking:cancel</span></header>
  <div class="body">
    <h4>Request</h4>
<pre><code>{ "reason": "Caller resolved the issue themselves" }</code></pre>
    <h4>Response</h4>
<pre><code>{ "booking": { "id": "bkg_9931", "status": "CANCELLED" } }</code></pre>
    <p><code>reason</code> is optional but strongly encouraged &mdash; it is what the office
    sees when they wonder why a slot freed up.</p>
  </div>
</div>

<h3 id="ref-documents">8.5 Invoices &amp; quotes</h3>

<div class="ep">
  <header><span class="m get">GET</span><span class="path">/v1/customers/{customerId}/invoices</span>
    <span class="scope-tag">invoice:read</span></header>
  <div class="body">
    <p>Live invoice status and balances for one resolved caller. Use it to answer
    "how much do I owe?" and "did my payment go through?" during the call.</p>

    <h4>Query parameters</h4>
    <table>
      <tr><th>Name</th><th>Default</th><th>Notes</th></tr>
      <tr><td><code>openOnly</code></td><td><code>true</code></td><td>Payable invoices only. Pass <code>openOnly=false</code> for the full history including paid and voided.</td></tr>
    </table>

    <h4>Response</h4>
<pre><code>{
  "invoices": [
    {
      "id": "inv_4471",
      "number": "INV-1042",
      "status": "PARTIALLY_PAID",
      "total": 640.00,
      "balanceDue": 480.00,
      "dueDate": "2026-09-15T00:00:00.000Z",
      "isSettled": false,
      "isDraft": false
    }
  ],
  "totalOutstanding": 480.00
}</code></pre>
    <table>
      <tr><th>Field</th><th>Meaning</th></tr>
      <tr><td><code>totalOutstanding</code></td><td>Everything still owed across all payable invoices. This is the number to read out.</td></tr>
      <tr><td><code>isSettled</code></td><td><code>PAID</code>, <code>VOID</code>, <code>CANCELLED</code> or <code>WRITTEN_OFF</code> &mdash; nothing to collect.</td></tr>
      <tr><td><code>isDraft</code></td><td>Prepared but never issued. The customer has never seen it, so it is excluded from <code>totalOutstanding</code> and must not be discussed or sent.</td></tr>
    </table>
  </div>
</div>

<div class="ep">
  <header><span class="m get">GET</span><span class="path">/v1/customers/{customerId}/quotes</span>
    <span class="scope-tag">quote:read</span></header>
  <div class="body">
    <p>Quotes (estimates) for one resolved caller. <code>openOnly</code> defaults to
    <code>true</code> and returns quotes the customer can still act on.</p>
<pre><code>{
  "quotes": [
    {
      "id": "qte_882",
      "number": "QTE-318",
      "status": "SENT",
      "total": 1250.00,
      "validUntil": "2026-09-30T00:00:00.000Z",
      "isOpen": true
    }
  ]
}</code></pre>
  </div>
</div>

<div class="ep">
  <header><span class="m post">POST</span><span class="path">/v1/documents/send</span>
    <span class="scope-tag">document:send</span></header>
  <div class="body">
    <p>Sends an invoice or quote to the customer, mid-call, by SMS or email. Email includes
    the rendered PDF as an attachment; SMS carries a link to the customer portal.</p>

    <h4>Request</h4>
<pre><code>{
  "customerId": "cus_7f21",
  "documentType": "invoice",
  "documentId": "inv_4471",
  "channel": "sms"
}</code></pre>
    <p><code>documentType</code> is <code>invoice</code> or <code>quote</code>;
    <code>channel</code> is <code>sms</code> or <code>email</code>. Returns <code>200</code>.</p>

    <h4>Response</h4>
<pre><code>{
  "sent": true,
  "channel": "sms",
  "sentTo": "••••4567",
  "documentType": "invoice",
  "documentId": "inv_4471"
}</code></pre>
    <p>On email, <code>attachmentIncluded</code> reports whether the PDF made it in. If PDF
    rendering is slow or unavailable the message still goes out with the link, and the field
    is <code>false</code> &mdash; the customer is never left with nothing.</p>

    <div class="note">
      <p><strong>There is no recipient field, by design.</strong> You name a customer and a
      document; the destination comes from the customer record. A caller who wants it sent
      somewhere new has to have the office update their details first. This means a stolen
      partner key cannot be used to mail one customer's invoice to an attacker's address.</p>
      <p>The response reports a <em>masked</em> destination so your agent can confirm delivery
      &mdash; "sent to the mobile ending 4567" &mdash; without reading a full number or email
      address onto a recording.</p>
    </div>
    <p>The document must belong to the customer you named, or the request is refused with
    <code>400</code>. A valid document id plus somebody else's customer id never succeeds.</p>
  </div>
</div>

<div class="ep">
  <header><span class="m post">POST</span><span class="path">/v1/bookings/{id}/confirmation</span>
    <span class="scope-tag">confirmation:send</span></header>
  <div class="body">
    <p>Sends the caller a written record of the appointment.</p>
<pre><code>{ "channel": "sms" }</code></pre>
<pre><code>{ "sent": true, "channel": "sms", "sentTo": "••••4567", "bookingStatus": "PENDING" }</code></pre>
    <p>The wording follows the booking's real status. A <code>PENDING</code> booking is
    described as requested and awaiting confirmation; only a genuinely <code>CONFIRMED</code>
    booking is described as confirmed. Your agent cannot accidentally send a customer a
    confirmation for something that is not confirmed.</p>
  </div>
</div>

<h3 id="ref-payments">8.6 Payments</h3>

<div class="ep">
  <header><span class="m post">POST</span><span class="path">/v1/payments/link</span>
    <span class="scope-tag">payment_link:create</span></header>
  <div class="body">
    <p>Creates a Stripe-hosted checkout link for one specific unpaid invoice, so a caller can
    pay while still on the phone or immediately after hanging up.</p>

    <h4>Request</h4>
<pre><code>{
  "customerId": "cus_7f21",
  "invoiceId": "inv_4471",
  "send": "sms"
}</code></pre>
    <p><code>send</code> is optional. Omit it to receive the link only in the response;
    set <code>sms</code> or <code>email</code> to also deliver it to the contact details on
    the customer record. Returns <code>200</code>.</p>

    <h4>Response</h4>
<pre><code>{
  "paymentUrl": "https://checkout.stripe.com/c/pay/cs_live_...",
  "invoiceId": "inv_4471",
  "invoiceNumber": "INV-1042",
  "amountDue": 480.00,
  "channel": "sms",
  "sentTo": "••••4567"
}</code></pre>

    <div class="note stop">
      <p><strong>Never ask a caller to read card details aloud.</strong> The card is entered on
      Stripe's page. No card number, expiry, CVC or stored payment method exists anywhere in
      this API, and none can be transmitted through it &mdash; there is no field that would
      accept one. Keeping card data out of your agent's audio and transcripts is what keeps
      both of us out of PCI scope.</p>
    </div>

    <h4>When a link is refused</h4>
    <table>
      <tr><th>Condition</th><th>Status</th><th>What to say</th></tr>
      <tr><td>Invoice already <code>PAID</code>, <code>VOID</code>, <code>CANCELLED</code> or <code>WRITTEN_OFF</code></td><td>400</td><td>Confirm there is nothing to pay.</td></tr>
      <tr><td>Invoice still <code>DRAFT</code></td><td>400</td><td>It has not been issued yet; the office will send it.</td></tr>
      <tr><td>No balance due</td><td>400</td><td>Nothing outstanding.</td></tr>
      <tr><td>Invoice belongs to a different customer</td><td>400</td><td>Re-resolve the caller.</td></tr>
      <tr><td>Customer record was created on this same call</td><td>400</td><td>The office will follow up about payment.</td></tr>
      <tr><td>Online payments not enabled for this company</td><td>403</td><td>Offer a callback from the office.</td></tr>
    </table>
    <p>Each of these returns a message written to be spoken to the caller as-is.</p>
  </div>
</div>

<h3 id="ref-webhooks">8.7 Webhook management</h3>

<div class="ep">
  <header><span class="m get">GET</span><span class="path">/v1/webhooks/events</span>
    <span class="scope-tag">webhook:manage</span></header>
  <div class="body">
    <p>The event types available to subscribe to.</p>
<pre><code>{ "events": ["job.completed", "invoice.paid", "quote.accepted", "booking.confirmed"] }</code></pre>
  </div>
</div>

<div class="ep">
  <header><span class="m post">POST</span><span class="path">/v1/webhooks</span>
    <span class="scope-tag">webhook:manage</span></header>
  <div class="body">
    <h4>Request</h4>
<pre><code>{
  "url": "https://acme-voice.example.com/hooks/tscrm",
  "events": ["job.completed", "invoice.paid"],
  "description": "Acme production listener"
}</code></pre>
    <h4>Response &mdash; 201</h4>
<pre><code>{
  "id": "whk_2210",
  "url": "https://acme-voice.example.com/hooks/tscrm",
  "events": ["job.completed", "invoice.paid"],
  "status": "ACTIVE",
  "createdAt": "2026-09-03T11:04:22.000Z",
  "secret": "whsec_4c1f...",
  "signatureNote": "Each delivery carries x-tscrm-timestamp and x-tscrm-signature..."
}</code></pre>
    <div class="note warn">
      <p><strong>The signing secret is returned once and cannot be retrieved afterwards.</strong>
      Store it in your secret manager before you do anything else. If you lose it, delete the
      subscription and register a new one.</p>
    </div>
    <p>The URL must be <code>https</code> and resolve to a publicly reachable host. Private and
    loopback addresses are refused &mdash; that check is what stops a webhook registration
    being used to probe our internal network.</p>
  </div>
</div>

<div class="ep">
  <header><span class="m get">GET</span><span class="path">/v1/webhooks</span>
    <span class="scope-tag">webhook:manage</span></header>
  <div class="body">
    <p>Your registered endpoints and their health. Secrets are never included.</p>
<pre><code>[
  {
    "id": "whk_2210",
    "url": "https://acme-voice.example.com/hooks/tscrm",
    "events": ["job.completed", "invoice.paid"],
    "status": "ACTIVE",
    "description": "Acme production listener",
    "failureCount": 0,
    "lastSuccessAt": "2026-09-03T10:58:01.000Z",
    "lastFailureAt": null,
    "createdAt": "2026-08-20T09:00:00.000Z"
  }
]</code></pre>
    <p>Watch <code>failureCount</code> and <code>status</code>. A <code>SUSPENDED</code>
    endpoint has stopped receiving events.</p>
  </div>
</div>

<div class="ep">
  <header><span class="m get">GET</span><span class="path">/v1/webhooks/{id}/deliveries</span>
    <span class="scope-tag">webhook:manage</span></header>
  <div class="body">
    <p>Every delivery attempt we made, newest first &mdash; the answer to "did you actually
    send it?". <code>limit</code> defaults to 20, maximum 100.</p>
<pre><code>[
  {
    "eventType": "invoice.paid",
    "entityId": "inv_4471",
    "attempt": 1,
    "statusCode": 200,
    "success": true,
    "error": null,
    "durationMs": 143,
    "createdAt": "2026-09-03T10:58:01.000Z"
  }
]</code></pre>
  </div>
</div>

<div class="ep">
  <header><span class="m delete">DELETE</span><span class="path">/v1/webhooks/{id}</span>
    <span class="scope-tag">webhook:manage</span></header>
  <div class="body">
    <p>Removes the subscription and stops delivery immediately.</p>
<pre><code>{ "id": "whk_2210", "deleted": true }</code></pre>
  </div>
</div>
`;

// ---------------------------------------------------------------------------
// 9 — events
// ---------------------------------------------------------------------------

const EVENTS = `
<h2 id="events">9. Webhooks &amp; events</h2>

<p>Business events are pushed to your endpoint as they happen. This is how your side learns
that a job finished, an invoice was paid, a quote was accepted or a booking was confirmed &mdash;
without polling.</p>

<h4>Delivery envelope</h4>
<p>Every delivery is a <code>POST</code> with this body shape:</p>
<pre><code>{
  "id": "invoice.paid:inv_4471:2026-09-03T10:57:59.000Z",
  "type": "invoice.paid",
  "occurredAt": "2026-09-03T10:57:59.000Z",
  "data": {
    "id": "inv_4471",
    "invoiceNumber": "INV-1042",
    "customerId": "cus_7f21",
    "amount": 640.00
  }
}</code></pre>
<p><code>data.id</code> is always the subject of the event. <code>occurredAt</code> is when it
actually happened, not when we delivered it.</p>

<h4>Delivery headers</h4>
<table>
  <tr><th>Header</th><th>Value</th></tr>
  <tr><td><code>x-tscrm-event</code></td><td>The event type, so you can route before parsing.</td></tr>
  <tr><td><code>x-tscrm-timestamp</code></td><td>Unix milliseconds at signing time. Part of the signed payload.</td></tr>
  <tr><td><code>x-tscrm-signature</code></td><td>HMAC-SHA256, hex encoded.</td></tr>
  <tr><td><code>x-tscrm-delivery-attempt</code></td><td><code>1</code>&ndash;<code>4</code>.</td></tr>
</table>

<h3 id="events-catalogue">Event catalogue</h3>

<table>
  <tr><th>Type</th><th>Fires when</th><th><code>data</code> fields (beyond <code>id</code>)</th></tr>
  <tr><td><code>job.completed</code></td><td>A technician marks a job complete.</td><td><code>jobNumber</code>, <code>jobType</code>, <code>customerId</code>, <code>customerName</code>, <code>completedAt</code></td></tr>
  <tr><td><code>invoice.paid</code></td><td>An invoice reaches paid in full.</td><td><code>invoiceNumber</code>, <code>customerId</code>, <code>amount</code></td></tr>
  <tr><td><code>quote.accepted</code></td><td>A customer accepts a quote &mdash; the sale closing.</td><td><code>quoteNumber</code>, <code>customerId</code>, <code>amount</code>, <code>acceptedByName</code></td></tr>
  <tr><td><code>booking.confirmed</code></td><td>Staff confirm a pending booking, including one your agent created.</td><td><code>serviceType</code>, <code>customerId</code>, <code>customerName</code>, <code>scheduledFor</code></td></tr>
</table>

<p><code>booking.confirmed</code> is the one to wire up first: it closes the loop on every
appointment your agent takes, and lets you call the customer back with a real confirmation.</p>

<h3 id="events-verify">Verifying signatures</h3>

<p>Sign over <code>timestamp + "." + raw request body</code> &mdash; the raw bytes as received,
before any JSON parsing or re-serialisation. Re-serialising changes whitespace and key order,
and the signature will not match.</p>

<h4>Node.js</h4>
<pre><code>const crypto = require('crypto');

function verify(req, rawBody, secret) {
  const timestamp = req.headers['x-tscrm-timestamp'];
  const presented = req.headers['x-tscrm-signature'] || '';

  // Reject anything older than five minutes: this is what makes a captured
  // request useless to replay later.
  if (Math.abs(Date.now() - Number(timestamp)) > 5 * 60 * 1000) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(timestamp + '.' + rawBody)
    .digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(presented, 'utf8');
  return a.length === b.length &amp;&amp; crypto.timingSafeEqual(a, b);
}</code></pre>

<h4>Python</h4>
<pre><code>import hmac, hashlib, time

def verify(headers, raw_body: bytes, secret: str) -> bool:
    timestamp = headers.get("x-tscrm-timestamp", "")
    presented = headers.get("x-tscrm-signature", "")

    if abs(time.time() * 1000 - float(timestamp or 0)) > 5 * 60 * 1000:
        return False

    expected = hmac.new(
        secret.encode(),
        (timestamp + ".").encode() + raw_body,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, presented)</code></pre>

<div class="note stop">
  <p>Compare in constant time (<code>timingSafeEqual</code> / <code>compare_digest</code>),
  never with <code>==</code>. And reject stale timestamps &mdash; a valid signature on a
  three-day-old body is still a replay.</p>
</div>

<h3 id="events-retry">Retries, ordering and suspension</h3>

<table>
  <tr><th>You return</th><th>We do</th></tr>
  <tr><td><code>2xx</code></td><td>Delivered. Failure counter resets.</td></tr>
  <tr><td><code>5xx</code>, <code>429</code>, timeout, connection error</td><td>Retry &mdash; up to 4 attempts total, at 1s, 4s and 9s.</td></tr>
  <tr><td>Any other <code>4xx</code></td><td>Stop immediately. We read it as "you rejected this payload"; resending an identical body will not help.</td></tr>
</table>

<table>
  <tr><th>Property</th><th>Behaviour</th></tr>
  <tr><td>Timeout</td><td>8 seconds per attempt. Acknowledge with <code>200</code> first and process asynchronously &mdash; do not do your work inside the request.</td></tr>
  <tr><td>Delivery guarantee</td><td>At least once. Retries mean you can see the same event twice; de-duplicate on the envelope <code>id</code>, which is stable across attempts.</td></tr>
  <tr><td>Ordering</td><td>Not guaranteed. Use <code>occurredAt</code> if sequence matters to you.</td></tr>
  <tr><td>Fan-out</td><td>Each event goes to every active subscription for that company that lists the type. Subscriptions are independent; a slow endpoint never delays another.</td></tr>
  <tr><td>Suspension</td><td>After 20 consecutive failures the endpoint is set <code>SUSPENDED</code> and stops receiving events. Fix your side, delete the subscription and register again.</td></tr>
  <tr><td>Auditing</td><td><code>GET /v1/webhooks/{id}/deliveries</code> shows every attempt with status code, error and duration.</td></tr>
</table>

<h3 id="events-staff">Internal staff alerts</h3>

<p>The same four events also raise <strong>push notifications to the company's own staff</strong>
&mdash; company admins, office managers and dispatchers with a registered device &mdash; the
moment they fire. That happens automatically alongside your webhook delivery; you do not
request it and cannot address it.</p>

<p>Staff SMS and email notifications are configured by the company inside HVACtor&rsquo;s own
automation rules, on its own triggers. The Partner API does not expose a way for an external
agent to message a company's staff directly &mdash; deliberately, since an integration that
can page a dispatcher at will is an integration that can be used to page a dispatcher at will.</p>
`;

// ---------------------------------------------------------------------------
// 10–12 — errors, agent guidance, security
// ---------------------------------------------------------------------------

const practice = () => `
<h2 id="errors">10. Errors</h2>

<p>Errors are JSON with a consistent shape:</p>
<pre><code>{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "API key is missing required scope(s): payment_link:create"
}</code></pre>
<p>On validation failures <code>message</code> is an array of field-level messages.</p>

<table>
  <tr><th>Status</th><th>Meaning</th><th>How your agent should handle it</th></tr>
  <tr><td><code>400</code></td><td>Rejected on validation or business grounds. Business messages are written to be spoken aloud as-is.</td><td>Read the message to the caller. Do not retry unchanged.</td></tr>
  <tr><td><code>401</code></td><td>Missing, unknown, revoked or expired key.</td><td>Configuration fault. Alert your operators; fall back to a human.</td></tr>
  <tr><td><code>403</code></td><td>The key lacks a scope, or the company has the feature disabled (e.g. online payments). The message says which.</td><td>Do not retry. Offer the caller a callback from the office.</td></tr>
  <tr><td><code>404</code></td><td>Not found &mdash; or not yours. The two are reported identically so ids from another company cannot be probed.</td><td>Re-resolve the caller and try again with fresh ids.</td></tr>
  <tr><td><code>429</code></td><td>Rate limit exceeded.</td><td>Wait <code>Retry-After</code> seconds. Stall gracefully rather than failing the call.</td></tr>
  <tr><td><code>500</code>/<code>503</code></td><td>Fault on our side.</td><td>Retry a <code>GET</code> once with backoff. Never blind-retry a booking or a payment link &mdash; check first.</td></tr>
</table>

<div class="note">
  <p><strong>Never read a raw error object to a caller.</strong> Speak the
  <code>message</code> field on a <code>400</code>; for everything else use your own wording
  and offer a callback. A caller should never hear a status code.</p>
</div>

<h2 id="agent-guide">11. Voice agent guidance</h2>

<p>These are the rules that separate an integration that helps from one that damages the
company's relationship with its customers. They are worth encoding as hard constraints in your
agent, not as prompt suggestions.</p>

<table>
  <tr><th>Situation</th><th>Do</th><th>Never</th></tr>
  <tr><td>Booking made</td><td>"That's booked in &mdash; the office will confirm shortly."</td><td>"You're confirmed for Thursday."</td></tr>
  <tr><td><code>ambiguous</code> lookup</td><td>Ask for name and address, then call <code>/v1/callers/match</code>.</td><td>Pick the first or most likely customer.</td></tr>
  <tr><td><code>degraded</code> includes <code>invoices</code></td><td>"I can't see your billing right now &mdash; let me have the office call you."</td><td>"You have nothing outstanding."</td></tr>
  <tr><td>Offering a time</td><td>Read a slot <code>label</code> verbatim.</td><td>Invent or approximate a time.</td></tr>
  <tr><td>Taking payment</td><td>Send the Stripe link and stay on the line.</td><td>Ask for a card number, CVC or expiry.</td></tr>
  <tr><td>Confirming a send</td><td>"Sent to the mobile ending 4567."</td><td>Read the full number or email address aloud.</td></tr>
  <tr><td>Draft invoice</td><td>Ignore it. It has not been issued.</td><td>Quote it or send it.</td></tr>
  <tr><td>Anything refused with 400</td><td>Read the message; offer a callback.</td><td>Retry in a loop or improvise a workaround.</td></tr>
</table>

<h4>Disclosure</h4>
<p>Tell callers they are speaking to an automated assistant, and hand off to a human on
request. Several jurisdictions require the first; every customer deserves the second. Call
recording and transcript consent are your responsibility as the party operating the call.</p>

<h4>Latency</h4>
<p>The caller profile is built by fetching jobs, invoices, quotes and equipment in parallel,
and each section degrades independently rather than holding up the response &mdash; the API is
shaped for use inside a live conversation. Measure real round-trip times from your own
infrastructure against the sandbox before you commit to a conversational design, and consider
starting your greeting while the lookup is still in flight.</p>

<h2 id="security">12. Security &amp; data handling</h2>

<p>The short version for a security review: the key is a bearer credential bound to one
company and one scope list; a compromised key cannot enumerate customers, cannot redirect a
message to an attacker-controlled address, cannot reach another company's data, and cannot
touch card data because none exists in this API.</p>

<table>
  <tr><th>Control</th><th>Implementation</th></tr>
  <tr><td>Transport</td><td>TLS only. Plain HTTP is not served in production.</td></tr>
  <tr><td>Credential storage</td><td>Keys are stored as hashes. The plaintext exists only at creation, shown once.</td></tr>
  <tr><td>Tenant isolation</td><td>The company is derived from the key server-side and applied to every downstream query. No request field can widen it.</td></tr>
  <tr><td>Least privilege</td><td>Per-key scopes, enforced by a guard that runs on every route by default. A new endpoint is protected unless it is explicitly marked public.</td></tr>
  <tr><td>No bulk access</td><td>There is no customer list, search or export scope in the catalogue at all &mdash; not merely ungranted.</td></tr>
  <tr><td>No recipient control</td><td>Send endpoints take a customer, never a destination. Delivery addresses come from the HVACtor customer record.</td></tr>
  <tr><td>Cross-record checks</td><td>A document or invoice must belong to the customer named in the request, or it is refused.</td></tr>
  <tr><td>Unverified-identity hold</td><td>No payment link against a customer record the agent itself created in the last 24 hours.</td></tr>
  <tr><td>PII minimisation</td><td>Send responses report masked destinations. The caller profile carries what an agent needs to serve the call and no internal identifiers beyond it.</td></tr>
  <tr><td>Card data</td><td>Never present. Payment is a Stripe-hosted page; no field in this API accepts card data.</td></tr>
  <tr><td>Webhook authenticity</td><td>HMAC-SHA256 over timestamp and raw body, with a per-subscription secret shown once.</td></tr>
  <tr><td>Webhook egress</td><td>Registered URLs must be https and publicly routable; private, loopback and link-local hosts are refused.</td></tr>
  <tr><td>Audit</td><td>Every partner request is logged with key, route, status and latency. Every webhook attempt is logged and readable by you.</td></tr>
  <tr><td>Abuse limits</td><td>Per-key rate limiting plus the business-rule quotas in section 6.</td></tr>
  <tr><td>Revocation</td><td>Immediate, at the next request.</td></tr>
</table>

<h4>Your obligations</h4>
<ul>
  <li>Keep keys and webhook secrets in a secret manager. Never in source control, a client
      application, or the context of a language model.</li>
  <li>Verify every webhook signature and reject stale timestamps.</li>
  <li>Store only the customer data you need, for only as long as you need it. Ids are enough
      to re-fetch.</li>
  <li>Keep card details out of your audio, transcripts and logs. If a caller starts reading a
      card number, stop them.</li>
  <li>Report a suspected key compromise ${
    supportEmail()
      ? `to <a href="mailto:${supportEmail()}">${supportEmail()}</a>`
      : 'to your account manager'
  } immediately so it can be revoked.</li>
</ul>
`;

// ---------------------------------------------------------------------------
// 13 — capability matrix (the procurement questions)
// ---------------------------------------------------------------------------

const MATRIX = `
<h2 id="matrix">13. Capability matrix</h2>

<p>The questions integration teams ask us before they commit, answered against what is
actually built. A <span class="pill part">Partial</span> here is a real boundary, not a
hedge &mdash; the note says exactly where the line is.</p>

<div class="qa">
  <p class="q"><span class="n">1.</span> Do you have public API docs and a sandbox?</p>
  <p class="a"><span class="pill yes">Yes</span> &nbsp;This document is public and needs no key.
  The full interactive reference is at <a href="/docs">/docs</a>, the raw OpenAPI 3 spec at
  <a href="/docs-json">/docs-json</a>, and a machine-readable capability summary at
  <a href="/capabilities">/capabilities</a>. Sandbox access is a <code>pk_test_</code> key
  against a seeded demo tenant: real code paths and real validation, with every outward side
  effect simulated.</p>
  <p class="ref">See <a href="#environments">4. Environments &amp; sandbox</a>.</p>
</div>

<div class="qa">
  <p class="q"><span class="n">2.</span> What customer data is available &mdash; history, VIP status, equipment, invoices, estimates?</p>
  <p class="a"><span class="pill part">Partial &mdash; by design</span> &nbsp;For the one caller
  you have resolved, you get: identity and contact details, <code>isVip</code>,
  <code>hasServiceAgreement</code>, <code>customerSince</code>, total and open job counts plus
  the most recent job (type, status, date), equipment count, open quote count, unpaid invoice
  count and total balance due. Then full invoice and quote lists with live statuses, totals,
  balances and due dates.</p>
  <p class="a"><strong>Not available:</strong> any customer list, search or export; per-unit
  equipment records (make, model, serial, service history) &mdash; you get the count only;
  full job detail beyond the most recent job's summary.</p>
  <p class="ref"><code>GET /v1/callers/lookup</code> &middot; <code>GET /v1/customers/{id}/invoices</code> &middot; <code>GET /v1/customers/{id}/quotes</code> &mdash; see <a href="#ref-callers">8.2</a> and <a href="#ref-documents">8.5</a>.</p>
</div>

<div class="qa">
  <p class="q"><span class="n">3.</span> Can the API create, modify, reschedule or cancel appointments?</p>
  <p class="a"><span class="pill yes">Yes</span> &nbsp;All four. Create for an existing customer
  or a first-time caller, reschedule to a new slot, and cancel with a reason. Every booking is
  created <code>PENDING</code> and confirmed by a human before dispatch, and every response
  carries <code>requiresConfirmation: true</code> to keep your agent honest with the caller.</p>
  <p class="ref"><code>POST /v1/bookings</code> &middot; <code>PATCH /v1/bookings/{id}/reschedule</code> &middot; <code>PATCH /v1/bookings/{id}/cancel</code> &mdash; see <a href="#ref-bookings">8.4</a>.</p>
</div>

<div class="qa">
  <p class="q"><span class="n">4.</span> Is there access to dispatch info and technician availability, in real time?</p>
  <p class="a"><span class="pill part">Partial</span> &nbsp;You get real-time
  <em>bookable capacity</em>: <code>GET /v1/availability</code> computes slots live from the
  company's active technician headcount minus appointments already taken, honours a minimum
  lead time, and returns <code>remainingCapacity</code> per slot with a spoken label in the
  company's timezone. That is everything needed to offer a time you know can be staffed.</p>
  <p class="a"><strong>Not available:</strong> technician identity, GPS position, live dispatch
  board, en-route status or ETA. Staff location is employee data and is not exposed to external
  partners. HVACtor&rsquo;s own dispatch board and GPS tracking remain internal to the company.</p>
  <p class="ref"><code>GET /v1/availability</code> &mdash; see <a href="#ref-availability">8.3</a>.</p>
</div>

<div class="qa">
  <p class="q"><span class="n">5.</span> Can we retrieve and send documents &mdash; invoices, estimates &mdash; by email or SMS during a call, and discuss their status in real time?</p>
  <p class="a"><span class="pill yes">Yes</span> &nbsp;Read live invoice and quote status,
  totals, balances, due dates and validity, then send either document by SMS or email while
  still on the call. Email carries the rendered PDF; SMS carries a portal link. The response
  reports a masked destination so the agent can confirm delivery without reading a full number
  aloud. Status is read live at request time &mdash; there is no cache to go stale mid-conversation.</p>
  <p class="a">Recipients cannot be supplied: delivery goes to the phone or email on the
  customer record, which is what makes a stolen key useless for exfiltrating documents.</p>
  <p class="ref"><code>GET /v1/customers/{id}/invoices</code> &middot; <code>GET /v1/customers/{id}/quotes</code> &middot; <code>POST /v1/documents/send</code> &mdash; see <a href="#ref-documents">8.5</a>.</p>
</div>

<div class="qa">
  <p class="q"><span class="n">6.</span> Can the API send out communications, like payment links or appointment confirmations?</p>
  <p class="a"><span class="pill yes">Yes</span> &nbsp;Two purpose-built sends:
  <code>POST /v1/payments/link</code> creates a Stripe-hosted payment link for a specific
  unpaid invoice and optionally delivers it by SMS or email, and
  <code>POST /v1/bookings/{id}/confirmation</code> sends an appointment confirmation whose
  wording follows the booking's real status.</p>
  <p class="a"><strong>Not available:</strong> free-form outbound messaging. There is no
  "send arbitrary text to arbitrary recipient" endpoint, and no scope that would grant one.</p>
  <p class="ref">See <a href="#ref-payments">8.6</a> and <a href="#ref-documents">8.5</a>.</p>
</div>

<div class="qa">
  <p class="q"><span class="n">7.</span> Are there webhooks or event notifications, like job completed or sale closed?</p>
  <p class="a"><span class="pill yes">Yes</span> &nbsp;Four event types:
  <code>job.completed</code>, <code>invoice.paid</code>, <code>quote.accepted</code> (the sale
  closing) and <code>booking.confirmed</code>. Deliveries are HMAC-SHA256 signed over
  timestamp and raw body, retried up to four times with backoff on failure, and every attempt
  is readable through <code>GET /v1/webhooks/{id}/deliveries</code>. You register endpoints
  yourself &mdash; no ticket required.</p>
  <p class="ref">See <a href="#events">9. Webhooks &amp; events</a>.</p>
</div>

<div class="qa">
  <p class="q"><span class="n">8.</span> Can those events trigger internal SMS, email or push notifications to staff?</p>
  <p class="a"><span class="pill part">Partial &mdash; push, automatically</span> &nbsp;The same
  four events raise push notifications to the company's own company admins, office managers and
  dispatchers with a registered device, at the same moment your webhook fires. That is automatic
  and requires nothing from you.</p>
  <p class="a"><strong>Not partner-controlled:</strong> staff SMS and email run on HVACtor&rsquo;s own
  automation rules, configured by the company on its own triggers. The Partner API deliberately
  gives an external integration no way to message a company's staff directly.</p>
  <p class="ref">See <a href="#events-staff">Internal staff alerts</a>.</p>
</div>

<div class="qa">
  <p class="q"><span class="n">9.</span> What are the API rate limits and permission restrictions?</p>
  <p class="a"><span class="pill yes">Documented and enforced</span> &nbsp;60 requests per
  minute per key by default, raisable per key on request; every response carries
  <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code> and
  <code>X-RateLimit-Reset</code>, and <code>429</code> carries <code>Retry-After</code>.
  Permissions are a per-key scope allow-list of twelve scopes, enforced on every route by
  default; a key is bound to one company and one environment and can carry an expiry.</p>
  <p class="a">Two further business quotas: one first-time-caller booking per phone number per
  24 hours, and no payment link against a customer record the agent created in the last 24 hours.</p>
  <p class="ref">See <a href="#scopes">5. Permissions</a> and <a href="#limits">6. Rate limits</a>.</p>
</div>

<div class="qa">
  <p class="q"><span class="n">10.</span> Does the API support real-time lookups during a call &mdash; and does it expose payment info or generate secure payment links so an agent can help a customer pay on the call?</p>
  <p class="a"><span class="pill yes">Yes to both</span> &nbsp;Lookups are live reads, not a
  nightly export. The caller profile fans out to jobs, invoices, quotes and equipment in
  parallel and each section degrades independently, so one slow subsystem never holds up the
  greeting &mdash; and <code>summary.degraded</code> tells your agent exactly what it must not
  claim to know.</p>
  <p class="a">On payment: balances, statuses and due dates are exposed, and
  <code>POST /v1/payments/link</code> returns a Stripe-hosted checkout link for one specific
  unpaid invoice, optionally delivered by SMS or email. Card numbers, tokens and stored payment
  methods are <strong>never</strong> exposed and cannot be transmitted through this API &mdash;
  no field accepts them. The customer enters their card on Stripe's page, which keeps card data
  out of your agent's audio and transcripts entirely.</p>
  <p class="ref"><code>GET /v1/callers/lookup</code> &middot; <code>POST /v1/payments/link</code> &mdash; see <a href="#ref-callers">8.2</a> and <a href="#ref-payments">8.6</a>.</p>
</div>
`;

// ---------------------------------------------------------------------------
// 14–15 — going live, support
// ---------------------------------------------------------------------------

const closing = () => `
<h2 id="golive">14. Going live</h2>

<p>A live key is issued once you can demonstrate the following against sandbox. Most of it is
things you would want to have handled anyway.</p>

<h4>Integration</h4>
<ul>
  <li>All three <code>lookup</code> results are handled, including <code>ambiguous</code> via
      <code>/v1/callers/match</code>.</li>
  <li><code>summary.degraded</code> is read before the agent makes any claim about jobs,
      invoices, quotes or equipment.</li>
  <li>Appointment times come from <code>/v1/availability</code> labels, never from the agent.</li>
  <li>Bookings are announced as awaiting confirmation, never as confirmed.</li>
  <li><code>400</code> messages are spoken to the caller rather than swallowed or retried.</li>
  <li><code>429</code> is handled with <code>Retry-After</code> backoff, not a tight retry.</li>
</ul>

<h4>Webhooks</h4>
<ul>
  <li>Signatures verified in constant time; stale timestamps rejected.</li>
  <li>Endpoint answers within 8 seconds and processes asynchronously.</li>
  <li>Duplicate events de-duplicated on envelope <code>id</code>.</li>
</ul>

<h4>Security</h4>
<ul>
  <li>Keys and webhook secrets held server-side in a secret manager.</li>
  <li>The scope list you request is the minimum your flows actually use.</li>
  <li>No card details are ever captured, spoken back, or written to transcripts or logs.</li>
</ul>

<h4>Operations</h4>
<ul>
  <li>A human handoff path exists for every failure mode, including <code>401</code> and
      <code>403</code>.</li>
  <li>Someone is alerted when your integration starts failing.</li>
</ul>

<p>Then ask the company administrator for a <code>pk_live_</code> key with the same scope list.
Nothing in your code changes but the key.</p>

<h2 id="support">15. Versioning &amp; support</h2>

<h4>Versioning policy</h4>
<p>This is the promise your integration is built on: what we may change under you, and what
we may not.</p>
<table>
  <tr><th>Change</th><th>How it ships</th></tr>
  <tr><td>New endpoints, new optional request fields, new response fields, new event types</td><td>Added to <code>/v1</code> without notice. Your client must ignore response fields and event types it does not recognise.</td></tr>
  <tr><td>Removing or renaming a field, changing a type, changing a status code, tightening validation</td><td>A new version path (<code>/v2</code>). <code>/v1</code> keeps being served through an announced deprecation window.</td></tr>
</table>
<p>Scopes and event types are additive: a scope you were granted keeps working. The webhook
signing scheme and the <code>x-tscrm-*</code> header names are part of the <code>/v1</code>
contract and will not change within it.</p>

<h4>Getting a key</h4>
<p>Keys are issued by the HVACtor company administrator whose data you will be working with
&mdash; not by HVACtor centrally, and not self-service. Ask them for a
<code>pk_test_</code> sandbox key and give them the exact scope list you need (section 5);
they create it in their admin dashboard and send it to you over a secure channel. The key is
shown once at creation and cannot be recovered afterwards. Move to a
<code>pk_live_</code> key once you have worked through section 14.</p>

<h4>Support</h4>
<p>Integration questions, key and scope requests, rate-limit increases and suspected key
compromise: ${
  supportEmail()
    ? `<a href="mailto:${supportEmail()}">${supportEmail()}</a>`
    : 'contact your account manager, who will route it to the API team'
}.</p>
<p>When reporting a problem, include the endpoint, the UTC timestamp, your key <em>name</em>
(never the key itself), and the full error body. Every partner request is logged with its key,
route, status and latency, so a timestamp is usually enough for us to find it.</p>
${statusUrl() ? `<p>Service status: <a href="${statusUrl()}">${statusUrl()}</a></p>` : ''}

<footer>
  <p><strong>HVACtor Partner API v1.</strong>
  Interactive reference <a href="/docs">/docs</a> &middot;
  OpenAPI spec <a href="/docs-json">/docs-json</a> &middot;
  Machine-readable capabilities <a href="/capabilities">/capabilities</a> &middot;
  Health <a href="/health">/health</a></p>
</footer>
`;

export function renderGuide(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>HVACtor Partner API — Integration Guide</title>
<meta name="description" content="Public integration guide for the HVACtor Partner API: caller identification, scheduling, invoices and quotes, payment links and signed webhooks for external AI voice agents.">
<style>${CSS}</style>
</head>
<body>
<div class="masthead">
  <span class="brand">HVACtor Partner API</span>
  <span class="ver">v1</span>
  <span class="links">
    <a href="/docs">API reference</a>
    <a href="/capabilities">Capabilities</a>
    <a href="#matrix">Capability matrix</a>
  </span>
</div>
<div class="layout">
${TOC}
<main>
${INTRO}
${REFERENCE}
${EVENTS}
${practice()}
${MATRIX}
${closing()}
</main>
</div>
</body>
</html>`;
}

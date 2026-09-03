export const GUIDE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>T&amp;S CRM Partner API — Integration Guide</title>
<style>
  :root { color-scheme: light dark; --fg:#1a1a1a; --bg:#fff; --muted:#666; --line:#e3e3e3; --code-bg:#f6f7f9; --accent:#0b62d6; }
  @media (prefers-color-scheme: dark) {
    :root { --fg:#e6e6e6; --bg:#16181d; --muted:#9aa0a6; --line:#2c2f36; --code-bg:#1e2127; --accent:#6aa9ff; }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--fg);
         font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
  .wrap { max-width: 820px; margin: 0 auto; padding: 48px 24px 96px; }
  h1 { font-size: 1.9rem; margin: 0 0 8px; letter-spacing:-0.02em; }
  h2 { font-size: 1.25rem; margin: 44px 0 12px; padding-top: 20px; border-top: 1px solid var(--line); }
  h3 { font-size: 1rem; margin: 26px 0 8px; }
  p, li { color: var(--fg); }
  .lede { color: var(--muted); font-size: 1.05rem; margin-bottom: 28px; }
  code { background: var(--code-bg); padding: 2px 6px; border-radius: 4px; font-size: 0.9em;
         font-family: ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; }
  pre { background: var(--code-bg); padding: 14px 16px; border-radius: 8px; overflow-x: auto;
        border: 1px solid var(--line); }
  pre code { background: none; padding: 0; font-size: 0.85rem; line-height:1.55; }
  table { border-collapse: collapse; width: 100%; margin: 14px 0; display:block; overflow-x:auto; }
  th, td { text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--line); font-size: 0.92rem; vertical-align: top; }
  th { color: var(--muted); font-weight: 600; white-space: nowrap; }
  .note { border-left: 3px solid var(--accent); padding: 10px 16px; margin: 18px 0;
          background: var(--code-bg); border-radius: 0 6px 6px 0; }
  .warn { border-left-color: #d97706; }
  a { color: var(--accent); }
  footer { margin-top: 56px; padding-top: 18px; border-top: 1px solid var(--line); color: var(--muted); font-size: 0.88rem; }
</style>
</head>
<body>
<div class="wrap">

<h1>Partner API — Integration Guide</h1>
<p class="lede">Everything an external agent (voice, chat or otherwise) needs to identify a caller,
book work, send documents and take payment. Start in the sandbox; nothing there reaches a real customer.</p>

<div class="note">
  <strong>Two rules shape this whole API.</strong><br>
  1. You resolve <em>one</em> caller at a time — there is no customer list or search endpoint.<br>
  2. Anything your agent writes lands as <code>PENDING</code> for a human to confirm.
</div>

<h2>1. Authenticate</h2>
<p>Send your key on every request:</p>
<pre><code>curl https://YOUR-HOST/api/partner/v1/whoami \\
  -H "x-api-key: pk_test_..."</code></pre>
<p><code>/v1/whoami</code> confirms the key works and lists exactly what it may do. Start there.</p>

<table>
  <tr><th>Key prefix</th><th>Meaning</th></tr>
  <tr><td><code>pk_test_</code></td><td>Sandbox. Real code paths, real seeded data, but no SMS, email or Stripe charge ever leaves the system.</td></tr>
  <tr><td><code>pk_live_</code></td><td>Production. Messages and payments are real.</td></tr>
</table>

<h2>2. Permissions</h2>
<p>Each key carries an explicit scope list. Asking for something outside it returns <code>403</code>
naming the missing scope. Request only what your flow needs.</p>
<pre><code>customer:lookup      identify a caller by phone number
customer:match       confirm an existing customer by name + address
customer:create      create a first-time caller
availability:read    offer appointment slots
booking:create       book, as PENDING
booking:reschedule   move an appointment
booking:cancel       cancel an appointment
invoice:read         read invoice status and balances
quote:read           read quotes
document:send        send an invoice or quote to the customer
confirmation:send    send an appointment confirmation
payment_link:create  create a payment link for an unpaid invoice
webhook:manage       subscribe to events</code></pre>

<h2>3. Rate limits</h2>
<p>Per key, per minute. Every response carries your position:</p>
<pre><code>X-RateLimit-Limit: 60
X-RateLimit-Remaining: 57
X-RateLimit-Reset: 1788345480</code></pre>
<p>Over the limit returns <code>429</code> with <code>Retry-After</code> in seconds. Back off; don't hammer.</p>

<h2>4. A whole call, end to end</h2>

<h3>Identify the caller</h3>
<pre><code>GET /v1/callers/lookup?phone=%2B94771234567</code></pre>
<p>Returns one of three results — handle all three:</p>
<table>
  <tr><th>result</th><th>What it means</th><th>What to do</th></tr>
  <tr><td><code>found</code></td><td>Exactly one customer</td><td>Greet them by name</td></tr>
  <tr><td><code>not_found</code></td><td>Unknown number</td><td>Treat as a first-time caller</td></tr>
  <tr><td><code>ambiguous</code></td><td>The number is shared</td><td>Ask for their name, then use <code>/v1/callers/match</code>. Never guess.</td></tr>
</table>

<div class="note warn">
  <strong>Read <code>summary.degraded</code> before you speak.</strong> It names any section that could not
  be loaded. If it contains <code>"invoices"</code>, do not tell the caller they owe nothing — you don't know.
</div>

<h3>Existing customer on a new number</h3>
<pre><code>POST /v1/callers/match
{ "firstName":"Sarah", "lastName":"Jones", "address":"12 Baker Street" }</code></pre>
<p>Confirms or denies one specific person. Do this before creating anyone — it is what stops
a regular customer becoming a duplicate record every time they ring from their mobile.</p>

<h3>Offer real times</h3>
<pre><code>GET /v1/availability?limit=3</code></pre>
<p>Each slot has a spoken <code>label</code> ("Wednesday, Sep 2, 10 AM–12 PM") in the company's own
timezone. Read those out; don't invent times.</p>

<h3>Book</h3>
<pre><code>POST /v1/bookings
{ "customerId":"...", "serviceType":"AC repair", "preferredDate":"&lt;slot.start&gt;" }</code></pre>
<p>For a first-time caller omit <code>customerId</code> and send <code>firstName</code>,
<code>lastName</code> and <code>phone</code> instead. A customer and a lead are created and tagged for staff review.</p>
<div class="note warn">
  The response always has <code>requiresConfirmation: true</code>. Say
  <em>"that's booked in, the office will confirm"</em> — not <em>"you're confirmed"</em>.
  One number may book once per 24 hours as a first-time caller.
</div>

<h3>Talk about money</h3>
<pre><code>GET  /v1/customers/{customerId}/invoices
POST /v1/documents/send   { "customerId":"...", "documentType":"invoice",
                            "documentId":"...", "channel":"sms" }
POST /v1/payments/link    { "customerId":"...", "invoiceId":"...", "send":"sms" }</code></pre>
<p>You cannot choose a recipient — there is no field for it. Delivery goes to the phone or email on
the customer record, and the response reports a masked destination (<code>••••4567</code>) you can
read back safely. Card details are entered on Stripe's page; they never reach your agent or this API.</p>

<h2>5. Webhooks</h2>
<pre><code>POST /v1/webhooks
{ "url":"https://you.example.com/hooks", "events":["job.completed","invoice.paid"] }</code></pre>
<p>The signing secret is returned <strong>once</strong>. Events available:
<code>job.completed</code>, <code>invoice.paid</code>, <code>quote.accepted</code>,
<code>booking.confirmed</code>.</p>

<h3>Verify every delivery</h3>
<p>Each request carries <code>x-tscrm-timestamp</code> and <code>x-tscrm-signature</code>.
Recompute over <code>"&lt;timestamp&gt;.&lt;raw body&gt;"</code> — the raw bytes, before any JSON parsing:</p>
<pre><code>const expected = crypto
  .createHmac('sha256', secret)
  .update(\\\`\\\${req.headers['x-tscrm-timestamp']}.\\\${rawBody}\\\`)
  .digest('hex');

if (!crypto.timingSafeEqual(Buffer.from(expected),
                            Buffer.from(req.headers['x-tscrm-signature']))) {
  return res.sendStatus(401);
}</code></pre>
<p>Also reject a timestamp far from now — that is what makes a captured request unusable later.</p>

<h3>What we expect back</h3>
<table>
  <tr><th>You return</th><th>We do</th></tr>
  <tr><td><code>2xx</code></td><td>Done.</td></tr>
  <tr><td><code>5xx</code> or timeout</td><td>Retry up to 4 times (1s, 4s, 9s).</td></tr>
  <tr><td><code>4xx</code></td><td>Stop — we assume you rejected the payload.</td></tr>
</table>
<p>Answer fast and process asynchronously. After sustained failures the endpoint is suspended;
re-register to resume. <code>GET /v1/webhooks/{id}/deliveries</code> shows every attempt we made.</p>

<h2>6. Errors</h2>
<table>
  <tr><th>Code</th><th>Meaning</th></tr>
  <tr><td>400</td><td>Rejected on business grounds. The message is written to be spoken aloud.</td></tr>
  <tr><td>401</td><td>Missing, unknown, revoked or expired key.</td></tr>
  <tr><td>403</td><td>Key lacks a required scope — the message names it.</td></tr>
  <tr><td>404</td><td>Not found, or not yours.</td></tr>
  <tr><td>429</td><td>Rate limited. Honour <code>Retry-After</code>.</td></tr>
</table>

<h2>7. Going live</h2>
<ol>
  <li>Build against a <code>pk_test_</code> key until your flows are stable.</li>
  <li>Confirm you handle all three lookup results, and never announce a booking as confirmed.</li>
  <li>Verify webhook signatures and reject stale timestamps.</li>
  <li>Ask for a <code>pk_live_</code> key with the same scopes.</li>
</ol>

<footer>
  Full endpoint reference: <a href="/docs">/docs</a> · Machine-readable summary:
  <a href="/capabilities">/capabilities</a>
</footer>

</div>
</body>
</html>`;

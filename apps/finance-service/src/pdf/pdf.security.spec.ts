/**
 * Pins the two controls that keep tenant-authored document styling from
 * turning the PDF renderer into a foothold on the host.
 *
 *  - isSafeResourceUrl: what Chromium is allowed to fetch while rendering.
 *    The metadata server, loopback and private ranges must never be reachable
 *    from inside a document.
 *  - blockStyle / blockStyleOverride: helpers that emit unescaped CSS built
 *    from template config. A value that closes the <style> tag must not survive.
 */
import * as Handlebars from 'handlebars';
import { PdfService } from './pdf.service';

describe('PdfService.isSafeResourceUrl', () => {
  const ok = (u: string) => expect(PdfService.isSafeResourceUrl(u)).toBe(true);
  const no = (u: string) => expect(PdfService.isSafeResourceUrl(u)).toBe(false);

  it('allows public http(s) hosts that a logo or letterhead would live on', () => {
    ok('https://storage.googleapis.com/bucket/logo.png');
    ok('http://cdn.example.com/letterhead.jpg');
    ok('https://8.8.8.8/x.png');
  });

  it('blocks the Cloud Run metadata server by IP and by name', () => {
    no('http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token');
    no('http://metadata.google.internal/computeMetadata/v1/');
    no('http://metadata/computeMetadata/v1/'); // resolves via .internal search domain
  });

  it('blocks loopback, link-local and private ranges', () => {
    no('http://127.0.0.1:3004/health');
    no('http://localhost/');
    no('http://10.0.0.5/');
    no('http://172.16.0.1/');
    no('http://172.31.255.255/');
    no('http://192.168.1.1/');
    no('http://100.64.0.1/');
    no('http://0.0.0.0/');
    no('http://[::1]/');
    no('http://[fe80::1]/');
    no('http://[fd00::1]/');
    no('http://[::ffff:169.254.169.254]/');
  });

  it('allows only http and https', () => {
    no('file:///etc/passwd');
    no('ftp://example.com/x');
    no('javascript:alert(1)');
    no('data:text/html,<script>1</script>');
  });

  it('rejects things that are not URLs', () => {
    no('');
    no('not a url');
  });
});

describe('PDF style helpers reject injection', () => {
  const render = (src: string, ctx: Record<string, unknown>) => Handlebars.compile(src)(ctx);

  it('drops a fontFamily that tries to close the style tag', () => {
    const out = render('{{{blockStyleOverride id style}}}', {
      id: 'brand',
      style: { fontFamily: 'x}</style><script>fetch("http://169.254.169.254/")</script>', color: '#123456' },
    });
    expect(out).not.toContain('<script');
    expect(out).not.toContain('</style><');
    expect(out).toContain('color: #123456');
  });

  it('drops an id that is not a plain identifier, emitting nothing', () => {
    const out = render('{{{blockStyleOverride id style}}}', {
      id: 'a"]{}</style><script>1</script>',
      style: { color: 'red' },
    });
    expect(out).toBe('');
  });

  it('rejects url() and expression payloads in colour and background', () => {
    const out = render('{{{blockStyle style}}}', {
      style: { background: 'url(http://169.254.169.254/x)', color: 'expression(alert(1))', borderColor: 'red' },
    });
    expect(out).not.toContain('url(');
    expect(out).not.toContain('expression');
    expect(out).toContain('border-color: red');
  });

  it('keeps every legitimate value an admin would actually set', () => {
    const out = render('{{{blockStyleOverride id style}}}', {
      id: 'doc-card',
      style: {
        fontFamily: "'Segoe UI', Helvetica, sans-serif", fontSize: 14, fontWeight: 'bold',
        color: 'rgb(20, 30, 40)', align: 'center', background: '#fafafa', borderColor: 'hsl(210, 50%, 40%)',
        borderRadiusPx: 6, paddingPx: 12,
      },
    });
    expect(out).toContain("font-family: 'Segoe UI', Helvetica, sans-serif !important;");
    expect(out).toContain('font-size: 14px !important;');
    expect(out).toContain('font-weight: bold !important;');
    expect(out).toContain('color: rgb(20, 30, 40) !important;');
    expect(out).toContain('text-align: center !important;');
    expect(out).toContain('background: #fafafa !important;');
    expect(out).toContain('border-radius: 6px !important;');
    expect(out).toContain('padding: 12px !important;');
    expect(out).toMatch(/^<style>\[data-block-id="doc-card"\] > \* \{ .* \}<\/style>$/s);
  });

  it('caps numeric sizes rather than passing absurd values through', () => {
    const out = render('{{{blockStyle style}}}', { style: { fontSize: 999999, paddingPx: -5 } });
    expect(out).not.toContain('999999');
    expect(out).not.toContain('-5');
  });
});

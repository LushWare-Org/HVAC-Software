import { withCompanyLogo } from './company-logo';

describe('withCompanyLogo', () => {
  const html = '<!DOCTYPE html><html><body style="margin:0"><p>Hi</p></body></html>';

  it('puts the logo first inside the body', () => {
    const out = withCompanyLogo(html, 'https://cdn.example.com/logo.png', 'Acme HVAC');
    expect(out).toMatch(/<body style="margin:0"><div data-company-logo[^>]*><img src="https:\/\/cdn\.example\.com\/logo\.png" alt="Acme HVAC"/);
    expect(out.indexOf('data-company-logo')).toBeLessThan(out.indexOf('<p>Hi</p>'));
  });

  it('prepends the logo when the email has no body tag', () => {
    expect(withCompanyLogo('<p>Hi</p>', 'https://cdn.example.com/logo.png', 'Acme').startsWith('<div data-company-logo')).toBe(true);
  });

  it('leaves the email unchanged with no logo, a non-https logo, or a logo already present', () => {
    expect(withCompanyLogo(html, null, 'Acme')).toBe(html);
    expect(withCompanyLogo(html, 'http://cdn.example.com/logo.png', 'Acme')).toBe(html);
    const once = withCompanyLogo(html, 'https://cdn.example.com/logo.png', 'Acme');
    expect(withCompanyLogo(once, 'https://cdn.example.com/logo.png', 'Acme')).toBe(once);
  });

  it('escapes the company name and URL so they cannot break out of the attribute', () => {
    const out = withCompanyLogo(html, 'https://cdn.example.com/a.png?x="><script>', 'Acme "Best" <HVAC>');
    expect(out).not.toContain('<script>');
    expect(out).toContain('alt="Acme &#34;Best&#34; &#60;HVAC&#62;"');
  });
});

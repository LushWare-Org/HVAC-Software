const attr = (v: string) => v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Puts the tenant's logo, centred, at the top of an email. Only https images
 * are used (mail clients block or warn on anything else), and an email that
 * already carries one is left alone, so it is safe to call more than once.
 */
export function withCompanyLogo(html: string, logoUrl: string | null | undefined, companyName: string): string {
  if (!logoUrl || !/^https:\/\//i.test(logoUrl) || html.includes('data-company-logo')) return html;
  const block =
    `<div data-company-logo style="text-align:center;padding:0 0 18px;">` +
    `<img src="${attr(logoUrl)}" alt="${attr(companyName)}" height="56" ` +
    `style="height:56px;width:auto;max-width:200px;display:inline-block;border:0;" /></div>`;
  const body = html.match(/<body[^>]*>/i);
  return body ? html.replace(body[0], body[0] + block) : block + html;
}

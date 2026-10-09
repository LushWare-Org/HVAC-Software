import { renderEmail } from './email-layout';

const brand = { name: 'Orrix Cooling', phone: '+94 11 555 0100', email: 'hello@orrix.lk', website: 'https://orrix.lk', address: '12 Galle Rd, Colombo' };

describe('renderEmail', () => {
  const html = renderEmail({
    brand, eyebrow: 'Visit booked', title: 'Your visit is booked', greeting: 'Hi Hana,',
    facts: [{ label: 'When', value: 'Mon 12 Oct, 9:00 AM' }, { label: 'Technician', value: 'Silva' }],
    person: { name: 'Silva', role: 'Your technician' },
    ctas: [{ label: 'Confirm this time', url: 'https://p.example/jobs?confirm=1' }, { label: 'Ask for another time', url: 'https://p.example/jobs?reschedule=1', primary: false }],
  });
  it('names the company at the top and gives its contact details at the bottom', () => {
    expect(html).toContain('Orrix Cooling');
    expect(html).toContain('12 Galle Rd, Colombo');
    expect(html).toContain('+94 11 555 0100');
    expect(html).toContain('hello@orrix.lk');
    expect(html).toContain('orrix.lk');
  });
  it('lays out facts, the person and the buttons', () => {
    expect(html).toContain('Mon 12 Oct, 9:00 AM');
    expect(html).toContain('Your technician');
    expect(html).toContain('Confirm this time');
    expect(html).toContain('https://p.example/jobs?reschedule=1');
  });
  it('escapes text and refuses unsafe links', () => {
    const bad = renderEmail({ brand: { name: '<i>x</i>' }, eyebrow: 'e', title: 't', ctas: [{ label: 'Go', url: 'javascript:alert(1)' }], intro: ['<script>1</script>'] });
    expect(bad).not.toContain('<script>');
    expect(bad).not.toContain('<i>x</i>');
    expect(bad).toContain('href="#"');
  });
  it('shows the logo when the company has one', () => {
    expect(renderEmail({ brand: { name: 'A', logoUrl: 'https://cdn.example/logo.png' }, eyebrow: 'e', title: 't' })).toContain('https://cdn.example/logo.png');
  });
});

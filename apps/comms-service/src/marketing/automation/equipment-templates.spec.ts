import { EQUIPMENT_TEMPLATES } from './equipment-templates';

const vars = {
  customerName: 'John Smith',
  equipmentType: 'AC Unit',
  brand: 'Carrier',
  trackedLink: 'https://example.com/m/r/abc',
  unsubLink: 'https://example.com/m/u/xyz',
  warrantyEndDate: 'June 15, 2026',
  companyName: 'T&S Services',
};

describe('Equipment Templates', () => {
  describe('hvac-tune-up-6mo', () => {
    const t = EQUIPMENT_TEMPLATES['hvac-tune-up-6mo'];

    it('SMS body includes customer name, equipment type, and tracked link', () => {
      const body = t.smsBody(vars);
      expect(body).toContain('John Smith');
      expect(body).toContain('AC Unit');
      expect(body).toContain('https://example.com/m/r/abc');
      expect(body).toContain('STOP');
    });

    it('email subject references equipment type', () => {
      expect(t.emailSubject(vars)).toContain('AC Unit');
    });

    it('email body contains brand name and unsubscribe link', () => {
      const html = t.emailBody(vars);
      expect(html).toContain('Carrier');
      expect(html).toContain('John Smith');
      expect(html).toContain('https://example.com/m/u/xyz');
    });
  });

  describe('hvac-replacement-7yr', () => {
    const t = EQUIPMENT_TEMPLATES['hvac-replacement-7yr'];

    it('SMS mentions 40% energy saving claim', () => {
      expect(t.smsBody(vars)).toContain('40%');
    });

    it('email body mentions end-of-life and free assessment', () => {
      const html = t.emailBody(vars);
      expect(html).toContain('end-of-life');
      expect(html).toContain('free');
    });

    it('email subject mentions upgrade', () => {
      expect(t.emailSubject(vars)).toMatch(/upgrade/i);
    });
  });

  describe('warranty-expiry-30d', () => {
    const t = EQUIPMENT_TEMPLATES['warranty-expiry-30d'];

    it('SMS includes warranty expiry date', () => {
      expect(t.smsBody(vars)).toContain('June 15, 2026');
    });

    it('email subject references warranty expiry date', () => {
      expect(t.emailSubject(vars)).toContain('June 15, 2026');
    });

    it('email body mentions protection plan', () => {
      expect(t.emailBody(vars)).toContain('protection plan');
    });

    it('falls back gracefully when warrantyEndDate is undefined', () => {
      const noDate = { ...vars, warrantyEndDate: undefined };
      const body = t.smsBody(noDate);
      expect(body).toContain('soon');
    });
  });
});

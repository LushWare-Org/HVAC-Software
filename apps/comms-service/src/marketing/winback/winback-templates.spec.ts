import { step1Sms, step2EmailSubject, step2EmailBody, step3Sms } from './winback-templates';

const vars = {
  customerName: 'Bob Jones',
  companyName: 'T&S Services',
  trackedLink: 'https://example.com/m/r/tok',
  unsubLink: 'https://example.com/m/u/tok',
  offerText: '15% off your next service',
};

describe('Winback Templates', () => {
  describe('step1Sms', () => {
    it('includes customer name and tracked link', () => {
      const body = step1Sms(vars);
      expect(body).toContain('Bob Jones');
      expect(body).toContain('https://example.com/m/r/tok');
      expect(body).toContain('STOP');
    });
  });

  describe('step2Email', () => {
    it('subject contains customer name', () => {
      expect(step2EmailSubject(vars)).toContain('Bob Jones');
    });

    it('body includes offer text block', () => {
      const html = step2EmailBody(vars);
      expect(html).toContain('15% off your next service');
      expect(html).toContain('Exclusive offer');
    });

    it('body includes unsubscribe link', () => {
      expect(step2EmailBody(vars)).toContain('https://example.com/m/u/tok');
    });

    it('body renders without offer block when offerText is undefined', () => {
      const noOffer = { ...vars, offerText: undefined };
      const html = step2EmailBody(noOffer);
      expect(html).not.toContain('Exclusive offer');
      expect(html).toContain('Bob Jones');
    });
  });

  describe('step3Sms', () => {
    it('includes last-chance urgency and offer', () => {
      const body = step3Sms(vars);
      expect(body).toContain('last chance');
      expect(body).toContain('15% off');
      expect(body).toContain('https://example.com/m/r/tok');
      expect(body).toContain('STOP');
    });

    it('works without offerText', () => {
      const noOffer = { ...vars, offerText: undefined };
      const body = step3Sms(noOffer);
      expect(body).toContain('Bob Jones');
      expect(body).not.toContain('undefined');
    });
  });
});

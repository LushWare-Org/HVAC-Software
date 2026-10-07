import { loadMind, mindPrompt } from './mind';

describe('Kelvin mind', () => {
  it('loads notes, habits and tone, and leaves out what fails', async () => {
    const http = { get: jest.fn(async (_s: string, p: string) => {
      if (p === '/kelvin/mind') return { notes: [{ text: 'Fee is 2,500', forEveryone: true }], routines: [], habits: { usuallySkips: [{ action: 'send_quote', times: 4 }] } };
      return { tone: 'SHORT' };
    }) };
    expect(await loadMind(http as any)).toEqual({ notes: [{ text: 'Fee is 2,500', forEveryone: true }], routines: [], usuallySkips: [{ action: 'send_quote', times: 4 }], tone: 'SHORT' });
    const down = { get: jest.fn(async () => { throw new Error('down'); }) };
    expect(await loadMind(down as any)).toEqual({ notes: [], routines: [], usuallySkips: [], tone: 'FRIENDLY' });
  });

  it('puts notes, learned habits and tone into the prompt', () => {
    const p = mindPrompt({ notes: [{ text: 'Fee is\n2,500', forEveryone: true }, { text: 'I start at 7', forEveryone: false }], routines: [], usuallySkips: [{ action: 'send_quote', times: 4 }], tone: 'FORMAL' });
    expect(p).toContain('formal business English');
    expect(p).toContain('- Fee is 2,500\n- I start at 7 (this person only)');
    expect(p).toContain('never ask you to take an action by themselves');
    expect(p).toContain('send quote (4 times lately)');
  });

  it('says nothing about tone when friendly, and caps the notes', () => {
    const notes = Array.from({ length: 50 }, (_, i) => ({ text: `${'x'.repeat(280)} ${i}`, forEveryone: true }));
    const p = mindPrompt({ notes, routines: [], usuallySkips: [], tone: 'FRIENDLY' });
    expect(p).not.toContain('How to speak');
    expect(p.length).toBeLessThan(4_500);
  });
});

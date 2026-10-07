import { dependents, isRef, PlanError, refsIn, resolveArgs } from './refs';

describe('plan references', () => {
  it('recognises "@N" and "@N.field"', () => {
    expect(isRef('@1')).toBe(true);
    expect(isRef('@2.customerId')).toBe(true);
    expect(isRef('@x')).toBe(false);
    expect(isRef('email@1.com')).toBe(false);
    expect(isRef(3)).toBe(false);
  });

  it('finds every step an argument tree points at', () => {
    expect(refsIn({ customerId: '@1.customerId', lines: [{ itemId: 'p1' }, { note: '@2.jobId' }], n: 4 }).sort()).toEqual([1, 2]);
    expect(refsIn({ a: 'plain' })).toEqual([]);
  });

  it('replaces references with earlier results, deep inside the args', () => {
    const results = [{ customerId: 'c-9', customerName: 'R&R' }, { jobId: 'j-7' }];
    expect(resolveArgs({ customerId: '@1.customerId', name: '@1.customerName', nested: { jobId: '@2.jobId' }, list: ['@2.jobId'], keep: 'x' }, results))
      .toEqual({ customerId: 'c-9', name: 'R&R', nested: { jobId: 'j-7' }, list: ['j-7'], keep: 'x' });
  });

  it('"@N" alone means the step\'s main id', () => {
    expect(resolveArgs({ customerId: '@1' }, [{ id: 'c-9', customerId: 'c-9' }])).toEqual({ customerId: 'c-9' });
  });

  it('refuses a reference to a step that has no result, or a missing field', () => {
    expect(() => resolveArgs({ a: '@3.jobId' }, [{ jobId: 'j' }])).toThrow(PlanError);
    expect(() => resolveArgs({ a: '@1.quoteId' }, [{ jobId: 'j' }])).toThrow('Step 1 has no quoteId');
  });

  it('skipping a step skips everything that depends on it, transitively', () => {
    const steps = [{ dependsOn: [] }, { dependsOn: [1] }, { dependsOn: [2] }, { dependsOn: [] }, { dependsOn: [1, 4] }];
    expect([...dependents(steps, [1])].sort()).toEqual([1, 2, 3, 5]);
    expect([...dependents(steps, [4])].sort()).toEqual([4, 5]);
    expect([...dependents(steps, [])]).toEqual([]);
  });
});

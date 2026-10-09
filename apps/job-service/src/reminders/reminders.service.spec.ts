import { RemindersService } from './reminders.service';

describe('RemindersService', () => {
  it('hands the sweep to the visit care service', async () => {
    const care: any = { sweep: jest.fn().mockResolvedValue({ scanned: 2, sent: 1 }) };
    expect(await new RemindersService(care).sweep()).toEqual({ scanned: 2, sent: 1 });
    expect(care.sweep).toHaveBeenCalled();
  });
});

import { calculateTriggerDate } from '../src/services/notifications/reminderService';

describe('Reminder Trigger Date Calculator', () => {
  it('calculates trigger date at 9:00 AM on the offset day', () => {
    // Pick date 60 days in the future
    const future = new Date();
    future.setDate(future.getDate() + 60);
    const dateStr = future.toISOString().split('T')[0];

    // 30 days before
    const trigger = calculateTriggerDate(dateStr, 30);
    expect(trigger).not.toBeNull();
    expect(trigger?.getHours()).toBe(9);
    expect(trigger?.getMinutes()).toBe(0);

    // Difference between target and trigger should be exactly 30 days
    const targetDate = new Date(`${dateStr}T09:00:00`);
    const diffMs = targetDate.getTime() - trigger!.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(30);
  });

  it('returns null if the trigger date would be in the past', () => {
    // Target date in 5 days, but offset is 30 days before -> trigger was 25 days ago!
    const nearFuture = new Date();
    nearFuture.setDate(nearFuture.getDate() + 5);
    const dateStr = nearFuture.toISOString().split('T')[0];

    const trigger = calculateTriggerDate(dateStr, 30);
    expect(trigger).toBeNull();
  });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_BUSINESS_SCHEDULE, isBusinessOpenNow, timeToMinutes } from './businessSchedule.ts';

test('timeToMinutes parses 24h values correctly', () => {
  assert.equal(timeToMinutes('11:30'), 690);
  assert.equal(timeToMinutes('00:00'), 0);
  assert.equal(timeToMinutes('23:59'), 1439);
});

test('manual mode respects the explicit open flag', () => {
  assert.equal(isBusinessOpenNow({ open: true, scheduleMode: 'manual', schedule: DEFAULT_BUSINESS_SCHEDULE }, new Date('2026-09-14T12:00:00')), true);
  assert.equal(isBusinessOpenNow({ open: false, scheduleMode: 'manual', schedule: DEFAULT_BUSINESS_SCHEDULE }, new Date('2026-09-14T12:00:00')), false);
});

test('automatic schedule opens only within configured hours', () => {
  const schedule = {
    ...DEFAULT_BUSINESS_SCHEDULE,
    monday: { enabled: true, ranges: [{ open: '11:30', close: '17:00' }] },
    tuesday: { enabled: false, ranges: [] },
  };

  assert.equal(isBusinessOpenNow({ open: true, scheduleMode: 'automatic', schedule }, new Date('2026-09-14T11:30:00')), true);
  assert.equal(isBusinessOpenNow({ open: true, scheduleMode: 'automatic', schedule }, new Date('2026-09-14T17:01:00')), false);
  assert.equal(isBusinessOpenNow({ open: true, scheduleMode: 'automatic', schedule }, new Date('2026-09-15T12:00:00')), false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_BUSINESS_SCHEDULE, getEffectiveOpen, getNextOpeningInfo, isBusinessOpenNow, timeToMinutes } from './businessSchedule.ts';

test('timeToMinutes parses HH:MM correctly', () => {
  assert.equal(timeToMinutes('11:30'), 690);
  assert.equal(timeToMinutes('00:00'), 0);
  assert.equal(timeToMinutes('23:59'), 1439);
});

test('automatic schedule opens and closes by range', () => {
  const schedule = {
    ...DEFAULT_BUSINESS_SCHEDULE,
    monday: {
      enabled: true,
      ranges: [{ open: '11:30', close: '17:00' }],
    },
  };

  const openNow = getEffectiveOpen({ open: true, scheduleMode: 'automatic', schedule }, new Date('2026-09-14T12:00:00'));
  const closedNow = getEffectiveOpen({ open: true, scheduleMode: 'automatic', schedule }, new Date('2026-09-14T18:00:00'));

  assert.equal(openNow, true);
  assert.equal(closedNow, false);
  assert.equal(isBusinessOpenNow({ open: true, scheduleMode: 'automatic', schedule }, new Date('2026-09-14T16:30:00')), true);
  assert.equal(isBusinessOpenNow({ open: true, scheduleMode: 'automatic', schedule }, new Date('2026-09-14T18:00:00')), false);
});

test('next opening reports today or the next configured day', () => {
  const schedule = {
    ...DEFAULT_BUSINESS_SCHEDULE,
    monday: { enabled: true, ranges: [{ open: '11:30', close: '17:00' }] },
    tuesday: { enabled: false, ranges: [{ open: '12:00', close: '18:00' }] },
  };

  assert.deepEqual(getNextOpeningInfo(schedule, new Date('2026-09-14T09:00:00')), {
    day: 'hoy',
    open: '11:30',
    close: '17:00',
    isToday: true,
  });
  assert.deepEqual(getNextOpeningInfo(schedule, new Date('2026-09-14T18:00:00')), {
    day: 'miércoles',
    open: '11:30',
    close: '21:00',
    isToday: false,
  });
});

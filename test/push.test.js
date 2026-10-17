// The reminder schedule sent to the reminder server.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { VAPID_PUBLIC } from '../js/config.js';
import { st } from '../js/state.js';
import { buildReminders, keyBytes } from '../js/push.js';

beforeEach(() => {
  st.reminders = {
    water: true, waterEvery: 2, waterFrom: 8, waterTo: 12,
    workout: true, workoutTime: '17:30',
    nudge: true, nudgeAfter: 3,
  };
});

const timesFor = (title, list = buildReminders()) => list.find(r => r.title === title)?.times;

test('water every few hours, workout and nudge on weekdays', () => {
  const list = buildReminders();
  assert.deepEqual(timesFor('Drink water', list), ['08:00', '10:00', '12:00']);
  assert.deepEqual(timesFor('Time to train', list), ['17:30']);
  assert.deepEqual(timesFor('Still time to train', list), ['20:30']);
  assert.deepEqual(list.find(r => r.title === 'Time to train').days, [1, 2, 3, 4, 5]);
});

test('no nudge past midnight, and no water reminder when "from" is after "to"', () => {
  Object.assign(st.reminders, { workoutTime: '22:00', waterFrom: 20, waterTo: 8 });
  const list = buildReminders();
  assert.deepEqual(list.map(r => r.title), ['Time to train']);
});

test('turned-off reminders are left out', () => {
  Object.assign(st.reminders, { water: false, workout: false, nudge: false });
  assert.deepEqual(buildReminders(), []);
});

test('the VAPID key in config.js is a valid public key, and a broken one is explained', () => {
  assert.equal(keyBytes(VAPID_PUBLIC).length, 65);
  assert.equal(keyBytes(` ${VAPID_PUBLIC.slice(0, 40)}\n${VAPID_PUBLIC.slice(40)} `).length, 65);
  assert.throws(() => keyBytes('PASTE-YOUR-KEY'), /isn't a valid public key/);
});

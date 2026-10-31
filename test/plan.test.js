// Training logic. Run with `npm test` (Node 20 or newer, no install needed).

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES, EASIER, MAX_LEVEL, GROWTH } from '../js/data.js';
import { st } from '../js/state.js';
import {
  levelPlan, planItems, todaysItems, minutes, restSeconds, restFor, nextExercise, streak, levelReview, changeLevel, setLevel,
} from '../js/plan.js';
import { dateKey } from '../js/util.js';

// Monday 5 October 2026 to Friday 16 October 2026 are two training weeks.
const day = key => new Date(key + 'T12:00');
const MON = '2026-10-19';
const TWO_WEEKS = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09',
  '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'];

beforeEach(() => {
  Object.assign(st, { level: 3, levelStart: '2026-09-01', levelAskedOn: '', log: {} });
});

const complete = (days, extra = {}) => days.forEach(d => { st.log[d] = { sets: {}, done: true, ...extra }; });

test('dateKey is the local date as YYYY-MM-DD', () => {
  assert.equal(dateKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.equal(dateKey(new Date(2026, 11, 31, 0, 0)), '2026-12-31');
});

test('every exercise used anywhere exists and has an animation or a video', () => {
  for (let level = 1; level <= MAX_LEVEL; level++) {
    for (const [id] of levelPlan(level)) assert.ok(EXERCISES[id], `level ${level}: ${id}`);
  }
  for (const [from, to] of Object.entries(EASIER)) assert.ok(EXERCISES[from] && EXERCISES[to], `${from} -> ${to}`);
  for (const [id, ex] of Object.entries(EXERCISES)) assert.ok(ex.gif || ex.video, id);
});

test('levels above 6 grow slowly from level 6, within the limits, and neck work stays the same', () => {
  const six = new Map(levelPlan(6).map(([id, sets, amount]) => [id, { sets, amount }]));
  const eight = new Map(levelPlan(8).map(([id, sets, amount]) => [id, { sets, amount }]));
  assert.deepEqual(eight.get('pushUp'), { sets: 3, amount: 10 });            // 3 × 8 at level 6
  assert.deepEqual(eight.get('pikePushUp'), { sets: 3, amount: 8 });         // 2 × 6: gains a set
  assert.deepEqual(eight.get('plank'), { sets: 3, amount: 40 });             // 3 × 30 sec
  assert.deepEqual(eight.get('neckIsometrics'), six.get('neckIsometrics'));
  assert.deepEqual(eight.get('chinTuck'), six.get('chinTuck'));
  for (const [id, sets, amount] of levelPlan(MAX_LEVEL)) {
    const ex = EXERCISES[id];
    const max = ex.unit === 'seconds' ? GROWTH.maxSeconds : ex.per ? GROWTH.maxRepsPerSide : GROWTH.maxReps;
    assert.ok(sets <= GROWTH.maxSets && amount <= Math.max(max, six.get(id).amount), id);
  }
});

test('every level is harder than the one before, and the longest session stays under 80 minutes', () => {
  for (let level = 2; level <= MAX_LEVEL; level++) {
    const before = new Map(levelPlan(level - 1).map(([id, sets, amount]) => [id, sets * amount]));
    assert.ok(levelPlan(level).some(([id, sets, amount]) => sets * amount > (before.get(id) ?? 0)), `level ${level}`);
  }
  assert.ok(minutes(planItems(levelPlan(MAX_LEVEL)), MAX_LEVEL) <= 80);
});

test('every level has a plank (2 × 15 s at level 1) that never gets easier, and no level has sit-ups', () => {
  const plank = level => levelPlan(level).find(([id]) => id === 'plank');
  assert.deepEqual(plank(1), ['plank', 2, 15]);
  for (let level = 2; level <= MAX_LEVEL; level++) {
    const [, sets, amount] = plank(level) ?? [];
    assert.ok(sets >= plank(level - 1)[1] && amount >= plank(level - 1)[2], `level ${level}`);
  }
  for (let level = 1; level <= MAX_LEVEL; level++) {
    assert.ok(levelPlan(level).every(([id]) => !/sit.?up/i.test(id + EXERCISES[id].name)), `level ${level}`);
  }
});

test('rest between sets follows the level, unless the exercise sets its own', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, MAX_LEVEL].map(level => restSeconds(level)), [30, 30, 45, 60, 60, 60, 60]);
  const [plank, neck, chinTuck] = planItems([['plank', 2, 15], ['neckIsometrics', 1, 5], ['chinTuck', 2, 5]]);
  assert.equal(restFor(plank, 3), 45);
  assert.equal(restFor(neck, 1), 60);
  assert.equal(restFor(chinTuck, 1), 60);
});

test('the next exercise is the next unfinished one, wrapping round to any skipped earlier', () => {
  const items = planItems([['wallPushUp', 2, 8], ['chairSquat', 2, 8], ['plank', 2, 15], ['gluteBridge', 1, 8]]);
  const log = { sets: {} };
  assert.equal(nextExercise(items, log)?.id, 'wallPushUp');                 // after the warm-up
  log.sets = { wallPushUp: 2 };
  assert.equal(nextExercise(items, log, 'wallPushUp')?.id, 'chairSquat');
  log.sets = { wallPushUp: 2, plank: 2 };                                   // chair squat skipped
  assert.equal(nextExercise(items, log, 'plank')?.id, 'gluteBridge');
  log.sets = { wallPushUp: 2, plank: 2, gluteBridge: 1 };
  assert.equal(nextExercise(items, log, 'gluteBridge')?.id, 'chairSquat');
  log.sets = { wallPushUp: 2, chairSquat: 2, plank: 2, gluteBridge: 1 };
  assert.equal(nextExercise(items, log, 'gluteBridge'), undefined);         // all done: straight to the cool-down
});

test('neck work only on Monday, Wednesday and Friday', () => {
  const ids = key => todaysItems(day(key)).map(item => item.id);
  assert.ok(ids('2026-10-12').includes('neckIsometrics'));
  assert.ok(!ids('2026-10-13').includes('neckIsometrics'));
  assert.ok(ids('2026-10-14').includes('chinTuck'));
});

test('"Too hard today" swaps to an easier exercise or lightens the dose', () => {
  st.level = 6;
  st.log['2026-10-12'] = { sets: {}, easier: { pushUp: true, plank: true } };
  const items = todaysItems(day('2026-10-12'));
  const pushUp = items.find(i => i.planned === 'pushUp');
  const plank = items.find(i => i.planned === 'plank');
  assert.deepEqual([pushUp.id, pushUp.sets, pushUp.amount, pushUp.easier], ['kneePushUp', 3, 8, true]);
  assert.deepEqual([plank.id, plank.sets, plank.amount, plank.easier], ['plank', 2, 20, true]);
});

test('session length counts every neck direction, rest between sets and the move between exercises', () => {
  assert.equal(minutes(planItems([['neckIsometrics', 2, 15]]), 1), 3);                  // 2 × 4 × 15 s + one 60 s rest
  assert.equal(minutes(planItems([['squat', 2, 10], ['pushUp', 1, 10]]), 1), 3);        // 90 s work + 30 s rest + 75 s move
  st.level = 1;
  const six = planItems(levelPlan(6));
  assert.equal(minutes(six), minutes(six, 1)); // defaults to the current level
  assert.ok(minutes(six, 6) > minutes(six, 1)); // level 6 rests 60 s between sets, not 30 s
});

test('streak counts completed weekdays, skips weekends, and today only counts once done', () => {
  complete(['2026-10-14', '2026-10-15', '2026-10-16']);
  assert.equal(streak(day(MON)), 3);           // Monday not done yet; the weekend doesn't break it
  complete([MON]);
  assert.equal(streak(day(MON)), 4);
  delete st.log['2026-10-15'];
  assert.equal(streak(day(MON)), 2);
});

test('level review waits until 2 weeks at the level', () => {
  complete(TWO_WEEKS);
  st.levelStart = '2026-10-06';
  assert.equal(levelReview(day(MON)), null);
  st.levelStart = '2026-10-05';
  assert.equal(levelReview(day(MON))?.kind, 'up');
});

test('level review suggests levelling up after 2 good weeks, ignoring older weeks', () => {
  complete(TWO_WEEKS.slice(1));                // 9 of 10; the weeks before (since 1 September) were all missed
  assert.deepEqual(levelReview(day(MON)), { kind: 'up', total: 10, done: 9, hard: 0 });
});

test('level review suggests going easier when most sessions were hard', () => {
  complete(TWO_WEEKS.slice(0, 3), { feel: 'hard' });
  complete(TWO_WEEKS.slice(3, 5), { easier: { squat: true } });
  complete(TWO_WEEKS.slice(5, 7), { feel: 'right' });
  assert.deepEqual(levelReview(day(MON)), { kind: 'down', total: 10, done: 7, hard: 5 });
});

test('level review never suggests going below level 1 or above the top level', () => {
  complete(TWO_WEEKS, { feel: 'hard' });
  st.level = 1;
  assert.equal(levelReview(day(MON)), null);
  complete(TWO_WEEKS, { feel: 'easy' });
  st.level = MAX_LEVEL;
  assert.equal(levelReview(day(MON)), null);
});

test('answering the level prompt stays within the levels and hides it for 2 weeks', () => {
  complete(TWO_WEEKS);
  st.level = MAX_LEVEL;
  changeLevel('up', day(MON));
  assert.equal(st.level, MAX_LEVEL);
  assert.equal(levelReview(day(MON)), null);
  assert.equal(levelReview(day('2026-10-20')), null);
  st.level = 1;
  changeLevel('down', day(MON));
  assert.equal(st.level, 1);
  setLevel(99, day(MON));
  assert.equal(st.level, MAX_LEVEL);
});

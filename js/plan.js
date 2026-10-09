// Training logic: what to do today, how long it takes, streaks and the level review.

import { EXERCISES, LEVELS, EASIER } from './data.js';
import { st, readLog } from './state.js';
import { dateKey, isTrainingDay, isNeckDay } from './util.js';

/** Rest between sets grows a little once sessions get longer. */
export const restSeconds = () => (st.level >= 5 ? 45 : 30);

/** A level's plan as [exercise, sets, amount]. Levels above 6 grow from level 6. */
export function levelPlan(level) {
  if (level <= LEVELS.length) return LEVELS[level - 1];
  const extra = level - LEVELS.length;
  return LEVELS.at(-1).map(([id, sets, amount]) => [
    id,
    Math.min(4, sets + Math.floor(extra / 2)),                       // one more set every second level, max 4
    amount + (EXERCISES[id].unit === 'seconds' ? 5 : 2) * extra,     // +2 reps or +5 seconds per level
  ]);
}

/**
 * Today's exercises as items: { id, sets, amount, planned, easier }.
 * `id` is what to show; `planned` is the level's exercise and is the key used in the day's log,
 * so logged sets survive switching "Too hard today" on and off.
 */
export function todaysItems(date = new Date()) {
  const swaps = readLog(dateKey(date)).easier || {};
  return levelPlan(st.level)
    .filter(([id]) => !EXERCISES[id].neck || isNeckDay(date))
    .map(([id, sets, amount]) => {
      const item = { id, sets, amount, planned: id, easier: false };
      return swaps[id] ? makeEasier(item) : item;
    });
}

function makeEasier(item) {
  const swap = EASIER[item.planned];
  if (swap) return { ...item, id: swap, easier: true };
  const seconds = EXERCISES[item.id].unit === 'seconds';
  return {
    ...item,
    sets: Math.max(1, item.sets - 1),
    amount: seconds
      ? Math.max(5, Math.round((item.amount * 0.6) / 5) * 5)
      : Math.max(3, Math.round(item.amount * 0.6)),
    easier: true,
  };
}

/** Turn a level plan into items (for the Plan tab). */
export const planItems = plan => plan.map(([id, sets, amount]) => ({ id, sets, amount, planned: id, easier: false }));

/** "2 × 8", "3 × 20 sec per direction". */
export function dose(item) {
  const ex = EXERCISES[item.id];
  return `${item.sets} × ${item.amount}${ex.unit === 'seconds' ? ' sec' : ''}${ex.per ? ' ' + ex.per : ''}`;
}

/** Rough session length: ~3 s per rep, neck holds × 4 directions, plus rest between sets. */
export function minutes(items) {
  const total = items.reduce((sum, item) => {
    const ex = EXERCISES[item.id];
    const work = ex.unit === 'seconds' ? item.amount * (ex.neck ? 4 : 1) : item.amount * 3;
    return sum + item.sets * (work + restSeconds());
  }, 0);
  return Math.round(total / 60) || 1;
}

export function youtubeSearch(id) {
  const ex = EXERCISES[id];
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(ex.search || `${ex.name} beginner form`).replace(/%20/g, '+');
}

/** Consecutive completed training days. Today doesn't break the streak until it's over. */
export function streak(today = new Date()) {
  let count = 0;
  const d = new Date(today);
  for (let i = 0; i < 400; i++, d.setDate(d.getDate() - 1)) {
    if (!isTrainingDay(d)) continue;
    if (readLog(dateKey(d)).done) count++;
    else if (i > 0) break;
  }
  return count;
}

/**
 * Looks at training days since the level started, once at least 2 weeks have passed.
 * A session counts as "hard" if it was rated Hard or used any "Too hard today" swap.
 *   { kind: 'down' } when more than half of 4+ completed sessions were hard
 *   { kind: 'up' }   when 80%+ of sessions were completed and at most a quarter were hard
 *   null otherwise (keep going at this level)
 */
export function levelReview(today = new Date()) {
  const todayKey = dateKey(today);
  if (st.levelAskedOn === todayKey) return null;
  const start = new Date(st.levelStart + 'T00:00');
  const end = new Date(todayKey + 'T00:00');
  if ((end - start) / 864e5 < 14) return null;

  let total = 0, done = 0, hard = 0;
  for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    if (!isTrainingDay(d)) continue;
    total++;
    const log = readLog(dateKey(d));
    if (!log.done) continue;
    done++;
    if (log.feel === 'hard' || Object.keys(log.easier || {}).length) hard++;
  }
  if (!total) return null;
  if (done >= 4 && hard / done > 0.5) return { kind: 'down', total, done, hard };
  if (done / total >= 0.8 && hard / done <= 0.25) return { kind: 'up', total, done, hard };
  return null;
}

/** Answer the level prompt: 'up', 'down' or 'stay'. Starts a fresh 2-week window either way. */
export function changeLevel(choice, today = new Date()) {
  const step = choice === 'up' ? 1 : choice === 'down' ? -1 : 0;
  st.level = Math.max(1, st.level + step);
  st.levelStart = st.levelAskedOn = dateKey(today);
}

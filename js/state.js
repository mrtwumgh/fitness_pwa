// Everything the app remembers, saved in the browser's localStorage.
// `st` is the single shared state object; call save() after changing it.

import { dateKey } from './util.js';

const STORAGE_KEY = 'ss';

const DEFAULTS = {
  version: 2,
  level: 1,
  levelStart: dateKey(),   // when the current level began (the level review looks at time since then)
  levelAskedOn: '',        // last day the level prompt was answered, so it doesn't repeat that day
  log: {},                 // per day, keyed "YYYY-MM-DD": see logFor() below
  water: {},               // per day: glasses drunk
  waterGoal: 8,
  sound: true,             // timer beeps
  deviceId: '',            // random ID identifying this phone to the reminder server
  pushOn: false,
  pushSent: '',            // the last schedule sent to the server, to skip identical re-sends
  reminders: {
    water: true, waterEvery: 2, waterFrom: 8, waterTo: 20,
    workout: true, workoutTime: '17:00',
    nudge: true, nudgeAfter: 3,
  },
};

export function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(st)); } catch { /* storage unavailable */ }
}

export function resetAll() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
}

/**
 * A day's log, created if missing. Shape:
 *   sets:     { exerciseId: sets done }
 *   done:     day marked complete
 *   feel:     'easy' | 'right' | 'hard' (optional)
 *   easier:   { exerciseId: true } for "Too hard today" swaps
 *   warmup, cooldown: routine finished
 */
export function logFor(day = dateKey()) {
  const log = (st.log[day] ||= { sets: {}, done: false });
  log.sets ||= {};
  return log;
}

/** Read a day's log without creating it. */
export function readLog(day = dateKey()) {
  return st.log[day] || { sets: {} };
}

// ---------- loading ----------

function load() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { /* fresh start */ }
  saved = migrateV1(saved);
  const state = {
    ...DEFAULTS,
    ...withoutUndefined(saved),
    reminders: { ...DEFAULTS.reminders, ...withoutUndefined(saved.reminders || {}) },
    version: 2,
  };
  if (!state.deviceId) state.deviceId = randomId();
  return state;
}

function randomId() {
  return [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
}

function withoutUndefined(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

// Version 1 (the single app.js) used short field names and exercise ids.
const V1_IDS = {
  wp: 'wallPushUp', ip: 'inclinePushUp', kp: 'kneePushUp', pu: 'pushUp', pk: 'pikePushUp',
  cd: 'chairDip', br: 'backpackRow', su: 'superman', fp: 'plank', db: 'deadBug', bd: 'birdDog',
  cs: 'chairSquat', sq: 'squat', rl: 'reverseLunge', gb: 'gluteBridge', cr: 'calfRaise',
  ni: 'neckIsometrics', ct: 'chinTuck',
};

function migrateV1(s) {
  if (s.version >= 2 || !Object.keys(s).length) return s;
  const renameIds = obj => Object.fromEntries(Object.entries(obj || {}).map(([id, v]) => [V1_IDS[id] || id, v]));
  const bool = v => (v === undefined ? undefined : !!v);
  const r = s.rem || {};
  const log = {};
  for (const [day, l] of Object.entries(s.log || {})) {
    const easier = Object.fromEntries(Object.keys(renameIds(l.e)).map(id => [id, true]));
    log[day] = { sets: renameIds(l.s), done: !!l.ok, easier, warmup: !!l.wu, cooldown: !!l.cd };
  }
  return {
    level: s.level, levelStart: s.lvStart, levelAskedOn: s.asked,
    log, water: s.water, waterGoal: s.goal, sound: bool(s.snd),
    deviceId: s.id, pushOn: !!s.push, pushSent: s.pushSig,
    reminders: {
      water: bool(r.w), waterEvery: r.wi, waterFrom: r.ws, waterTo: r.we,
      workout: bool(r.x), workoutTime: r.wt, nudge: bool(r.n), nudgeAfter: r.nh,
    },
  };
}

// Loaded last, once everything above (including V1_IDS) is defined.
export const st = load();

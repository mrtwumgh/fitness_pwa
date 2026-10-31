// Entry point: renders the current tab, handles taps and setting changes, and sets up the service worker.

import { EXERCISES, WARMUP, COOLDOWN } from './data.js';
import { st, save, logFor, resetAll } from './state.js';
import { todaysItems, restFor, nextExercise, TRANSITION_SECONDS, WARMUP_TRANSITION_SECONDS, changeLevel, setLevel } from './plan.js';
import { startTimer, runSteps, skipTimer, addTime } from './timer.js';
import { workoutActive, endWorkout, resumeWakeLock } from './awake.js';
import { syncReminders, turnOnReminders, turnOffReminders, sendTest } from './push.js';
import { openVideo, closeVideo } from './video.js';
import { toast } from './toast.js';
import { $, clamp, dateKey } from './util.js';
import { todayView, upNext } from './views/today.js';
import { planView } from './views/plan.js';
import { settingsView } from './views/settings.js';
import './media.js';

let tab = 'today';
let storageProtected = null;

/** Redraw the current tab. Keyboard focus stays on the same control (matched by its data- attributes). */
function render() {
  const app = $('#app');
  const active = document.activeElement?.closest('#app [data-action], #app [data-field]');
  const focused = active && controlKey(active);
  app.innerHTML =
    tab === 'today' ? todayView()
    : tab === 'plan' ? planView()
    : settingsView({ storageProtected });
  if (focused) [...app.querySelectorAll('[data-action], [data-field]')].find(el => controlKey(el) === focused)?.focus({ preventScroll: true });
  document.querySelectorAll('nav button').forEach(b => {
    const on = b.dataset.tab === tab;
    b.classList.toggle('on', on);
    if (on) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
}

const controlKey = el => JSON.stringify(el.dataset);

/** Save, redraw, and let the reminder server know if anything it cares about changed. */
function commit() {
  save();
  render();
  syncReminders();
}

/** Today's item for a planned exercise; undefined if the page is out of date (e.g. left open past midnight). */
const todaysItem = planned => todaysItems().find(i => i.planned === planned);

// ---------- taps ----------

document.addEventListener('click', event => {
  // Tapping the dark area around the video sheet closes it.
  if (event.target.id === 'player') { closeVideo(); return; }

  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, id, value } = button.dataset;

  switch (action) {
    case 'tab':
      tab = button.dataset.tab;
      render();
      return;

    case 'video':
      openVideo(button.dataset.exercise);
      return;

    case 'close-video':
      closeVideo();
      return;

    case 'skip':
      skipTimer();
      return;

    case 'add-time':
      addTime(15);
      return;

    case 'set': {
      // Tapping set N marks sets 1..N done; tapping the last done set again undoes it.
      const item = todaysItem(id);
      if (!item) break;   // out of date: just redraw
      const log = logFor();
      const before = log.sets[id] || 0;
      const index = +button.dataset.index;
      log.sets[id] = index < before ? index : index + 1;
      if (log.sets[id] > before) afterSet(item, log);
      break;
    }

    case 'hold':
      startHold(id);
      return;

    case 'easier': {
      const log = logFor();
      log.easier ||= {};
      if (log.easier[id]) delete log.easier[id];
      else log.easier[id] = true;
      log.sets[id] = 0;   // the dose changed, so start this exercise's sets again
      break;
    }

    case 'routine':
      runRoutine(id, id === 'warmup' ? WARMUP : COOLDOWN);
      return;

    case 'done': {
      const log = logFor();
      log.done = !log.done;
      if (log.done) endWorkout();
      break;
    }

    case 'feel': {
      const log = logFor();
      log.feel = log.feel === value ? undefined : value;
      break;
    }

    case 'water': {
      const today = dateKey();
      st.water[today] = Math.max(0, (st.water[today] || 0) + Number(value));
      break;
    }

    case 'level':
      changeLevel(value);
      break;

    case 'push-on':
      turnOnReminders().then(message => { toast(message); render(); });
      return;

    case 'push-off':
      turnOffReminders().then(message => { toast(message); render(); });
      return;

    case 'push-test':
      sendTest().then(toast);
      return;

    case 'reset':
      if (confirm('Erase all progress and settings?')) {
        turnOffReminders().finally(() => { resetAll(); location.reload(); });
      }
      return;

    default:
      return;
  }
  commit();
});

/** After a set is done: rest if the exercise has sets left, otherwise move on to the next exercise. */
function afterSet(item, log) {
  workoutActive();
  if (log.sets[item.planned] < item.sets) startTimer('Rest', restFor(item), { extend: true });
  else moveOn(item.planned, TRANSITION_SECONDS);
}

/**
 * Count down to the next unfinished exercise, showing what it is; `after` is the exercise just finished
 * (left out after the warm-up). With none left, go straight to the cool-down.
 */
function moveOn(after, seconds) {
  const next = nextExercise(todaysItems(), logFor(), after);
  if (!next) { showCard('cooldown'); return; }
  startTimer('Up next', seconds, { button: "I'm ready", advance: true, next: upNext(next), onEnd: () => showCard(next.planned) });
}

/** Scroll a Today card into view, once the redraw that may follow this tap is done. */
function showCard(key) {
  requestAnimationFrame(() => document.querySelector(`[data-card="${key}"]`)?.scrollIntoView({ block: 'start' }));
}

/**
 * One timed set: 5 seconds to get into position, then the hold (each position in turn for neck work).
 * When it finishes the set is ticked off, then it's rest or the next exercise as for any set.
 * Stopping part-way doesn't count the set.
 */
function startHold(planned) {
  const item = todaysItem(planned);
  if (!item) { render(); return; }
  const ex = EXERCISES[item.id];
  const holds = ex.holds
    ? ex.holds.map((position, i) => ({ label: `${i + 1}/${ex.holds.length} ${position}`, seconds: item.amount }))
    : [{ label: ex.name, seconds: item.amount }];
  const steps = [
    { label: 'Get ready', seconds: 5, button: 'Start now' },
    ...holds.map(hold => ({ ...hold, button: 'Stop', advance: false })),
  ];
  runSteps(steps, () => {
    const now = todaysItem(planned) ?? item;   // "Too hard today" may have changed the dose meanwhile
    const log = logFor();
    log.sets[planned] = Math.min(now.sets, (log.sets[planned] || 0) + 1);
    afterSet(now, log);
    commit();
  });
}

/** Warm-up or cool-down. The warm-up leads into the first exercise; finishing the cool-down ends the workout. */
function runRoutine(id, steps) {
  runSteps(steps.map(({ name, seconds }, i) => ({ label: `${i + 1}/${steps.length} ${name}`, seconds })), () => {
    logFor()[id] = true;
    if (id === 'warmup') moveOn(undefined, WARMUP_TRANSITION_SECONDS);
    else endWorkout();
    commit();
  });
}

// ---------- settings ----------

/** Settings kept in st.reminders; the others (waterGoal, sound) are kept on st itself. */
const REMINDER_FIELDS = ['water', 'waterEvery', 'waterFrom', 'waterTo', 'workout', 'workoutTime', 'nudge', 'nudgeAfter'];

document.addEventListener('change', event => {
  const input = event.target;
  const field = input.dataset.field;
  if (!field) return;

  if (field === 'level') {
    setLevel(Number(input.value));
  } else {
    const target = REMINDER_FIELDS.includes(field) ? st.reminders : st;
    target[field] = inputValue(input, target[field]);
    if (input.type !== 'checkbox') input.value = target[field];   // show any correction
  }
  save();
  if (field === 'level' || field === 'waterGoal') render();
  syncReminders();
});

/** An input's value, falling back to the saved one if it was cleared, and kept within the input's min and max. */
function inputValue(input, saved) {
  if (input.type === 'checkbox') return input.checked;
  if (input.type === 'number') {
    const n = Math.round(input.valueAsNumber);
    return Number.isNaN(n) ? saved : clamp(n, Number(input.min || -Infinity), Number(input.max || Infinity));
  }
  return input.value || saved;
}

// ---------- coming back to the app ----------

document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  render();            // the date may have changed while the app was in the background
  resumeWakeLock();
  syncReminders();
});

// ---------- storage and updates ----------

/** Ask the browser not to clear our data when the phone is low on space. */
async function protectStorage() {
  try {
    if (!navigator.storage?.persist) return;
    storageProtected = (await navigator.storage.persisted()) || (await navigator.storage.persist());
    if (tab === 'settings') render();
  } catch { /* not supported */ }
}

/**
 * A new version installs in the background and waits. When it's ready we show a banner;
 * tapping Reload tells it to take over, and the page reloads once it has.
 */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const hadController = !!navigator.serviceWorker.controller;
  const reg = await navigator.serviceWorker.register('sw.js');

  const offerUpdate = () => {
    if (!reg.waiting || !navigator.serviceWorker.controller) return;
    const banner = $('#update');
    banner.hidden = false;
    banner.querySelector('button').onclick = () => reg.waiting?.postMessage('skip-waiting');
  };
  offerUpdate();
  reg.addEventListener('updatefound', () => {
    const worker = reg.installing;
    worker?.addEventListener('statechange', () => { if (worker.state === 'installed') offerUpdate(); });
  });

  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;   // first install: nothing to reload
    reloading = true;
    location.reload();
  });

  // Check for a new version whenever the app comes back to the foreground.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
}

// ---------- start ----------

render();
syncReminders();
protectStorage();
registerServiceWorker();

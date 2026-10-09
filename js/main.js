// Entry point: renders the current tab, handles taps and setting changes, and sets up the service worker.

import { EXERCISES, WARMUP, COOLDOWN } from './data.js';
import { st, save, logFor, resetAll } from './state.js';
import { todaysItems, restSeconds, changeLevel } from './plan.js';
import { startTimer, skipTimer, resumeWakeLock } from './timer.js';
import { syncReminders, turnOnReminders, turnOffReminders, sendTest } from './push.js';
import { toast } from './toast.js';
import { $, dateKey } from './util.js';
import { todayView } from './views/today.js';
import { planView } from './views/plan.js';
import { settingsView } from './views/settings.js';

let tab = 'today';
let storageProtected = null;

function render() {
  $('#app').innerHTML =
    tab === 'today' ? todayView()
    : tab === 'plan' ? planView()
    : settingsView({ storageProtected });
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
}

/** Save, redraw, and let the reminder server know if anything it cares about changed. */
function commit() {
  save();
  render();
  syncReminders();
}

// ---------- taps ----------

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, id, value } = button.dataset;

  switch (action) {
    case 'tab':
      tab = button.dataset.tab;
      render();
      return;

    case 'skip':
      skipTimer();
      return;

    case 'set': {
      // Tapping set N marks sets 1..N done; tapping the last done set again undoes it.
      const log = logFor();
      const item = todaysItems().find(i => i.planned === id);
      const before = log.sets[id] || 0;
      const index = +button.dataset.index;
      log.sets[id] = index < before ? index : index + 1;
      if (log.sets[id] > before && log.sets[id] < item.sets) startTimer('Rest', restSeconds());
      break;
    }

    case 'hold': {
      const item = todaysItems().find(i => i.planned === id);
      startTimer(EXERCISES[item.id].name, item.amount, () => {
        const log = logFor();
        const sets = todaysItems().find(i => i.planned === id).sets;
        log.sets[id] = Math.min(sets, (log.sets[id] || 0) + 1);
        commit();
      });
      return;
    }

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

function runRoutine(id, steps) {
  let step = 0;
  const next = () => {
    if (step >= steps.length) {
      logFor()[id] = true;
      commit();
      return;
    }
    const { name, seconds } = steps[step++];
    startTimer(`${step}/${steps.length} ${name}`, seconds, next, true);
  };
  next();
}

// ---------- settings ----------

const REMINDER_FIELDS = ['water', 'waterEvery', 'waterFrom', 'waterTo', 'workout', 'workoutTime', 'nudge', 'nudgeAfter'];

document.addEventListener('change', event => {
  const input = event.target;
  const field = input.dataset.field;
  if (!field) return;
  const value = input.type === 'checkbox' ? input.checked
    : input.type === 'number' || field === 'level' ? Number(input.value)
    : input.value;

  if (REMINDER_FIELDS.includes(field)) {
    st.reminders[field] = value;
  } else if (field === 'level') {
    st.level = value;
    st.levelStart = dateKey();
  } else if (field === 'waterGoal') {
    st.waterGoal = Math.max(1, value || 8);
  } else if (field === 'sound') {
    st.sound = value;
  }
  save();
  if (field === 'level' || field === 'waterGoal') render();
  syncReminders();
});

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

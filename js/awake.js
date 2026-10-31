// Keeps the screen on during a workout, where the browser supports it (Screen Wake Lock API).
// The workout starts with the first set or timer. It ends when the day is marked complete, the cool-down
// finishes, or after 10 minutes without a set or timer, in case the app is left open.

const IDLE_MS = 10 * 60 * 1000;

let active = false;
let idleTimeout = 0;
let request = null;   // the wake lock request (a promise of the lock) while the screen is held on

/** Call on every set and timer. Starts the workout if needed and restarts the 10-minute idle clock. */
export function workoutActive() {
  active = true;
  hold();
  clearTimeout(idleTimeout);
  idleTimeout = setTimeout(endWorkout, IDLE_MS);
}

export function endWorkout() {
  active = false;
  clearTimeout(idleTimeout);
  const lock = request;
  request = null;
  lock?.then(sentinel => sentinel?.release()).catch(() => {});
}

/** The browser drops the lock when the app goes to the background; call this when it comes back. */
export function resumeWakeLock() {
  if (active) hold();
}

// One request at a time, so two quick calls can't leave an extra lock that is never released.
function hold() {
  if (request || !navigator.wakeLock) return;
  const lock = (request = navigator.wakeLock.request('screen').catch(() => null));
  lock.then(sentinel => {
    if (!sentinel) { if (request === lock) request = null; return; }   // refused, e.g. in the background
    sentinel.addEventListener('release', () => { if (request === lock) request = null; });
  });
}

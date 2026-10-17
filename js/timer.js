// The countdown bar at the bottom of the screen: rest timers, hold timers and guided routines.
// While a timer runs it keeps the screen awake and beeps for the last 3 seconds.

import { $ } from './util.js';
import { st } from './state.js';

let current = null;       // { label, endsAt, left, onEnd, button, advance }
let intervalId = 0;
let audio = null;
let wakeLock = null;
let releaseTimeout = 0;

/**
 * Start a countdown, replacing any running one. `onEnd` runs when it reaches zero.
 *   button:  the bar's button label
 *   advance: true = the button also runs `onEnd` (moves a sequence on); false = it just stops the timer
 */
export function startTimer(label, seconds, { onEnd, button = 'Skip', advance = false } = {}) {
  unlockAudio();
  clearInterval(intervalId);
  current = { label, endsAt: Date.now() + seconds * 1000, left: seconds, onEnd, button, advance };
  intervalId = setInterval(tick, 250);
  clearTimeout(releaseTimeout);
  keepAwake(true);
  draw();
}

/** Run timed steps ({ label, seconds, button, advance }) one after another, then call `onDone`. */
export function runSteps(steps, onDone) {
  let i = 0;
  const next = () => {
    if (i === steps.length) { onDone(); return; }
    const { label, seconds, button = 'Next', advance = true } = steps[i++];
    startTimer(label, seconds, { onEnd: next, button, advance });
  };
  next();
}

export function skipTimer() {
  if (!current) return;
  const next = current.advance ? current.onEnd : null;
  stop();
  next?.();
}

/** The wake lock is dropped when the app goes to the background; call this when it comes back. */
export function resumeWakeLock() {
  if (current) keepAwake(true);
}

// Counts down to an end time rather than counting ticks, so the timer stays right
// even when the phone slows the page down or it briefly goes to the background.
function tick() {
  const left = Math.ceil((current.endsAt - Date.now()) / 1000);
  if (left === current.left) return;
  current.left = left;
  if (left > 0) {
    if (left <= 3) beep(660, 0.12);
    draw();
    return;
  }
  beep(990, 0.45);
  navigator.vibrate?.([200, 100, 200]);
  const onEnd = current.onEnd;
  stop();
  onEnd?.();
}

function stop() {
  clearInterval(intervalId);
  current = null;
  draw();
  // Wait a moment before releasing, in case another timer starts straight away (rest after a set).
  releaseTimeout = setTimeout(() => { if (!current) keepAwake(false); }, 1500);
}

// The bar's elements stay in place and only their text changes, so the button keeps keyboard focus.
function draw() {
  const bar = $('#timer');
  bar.hidden = !current;
  if (!current) return;
  bar.querySelector('.timer-label').textContent = current.label;
  bar.querySelector('.timer-left').textContent = `${current.left}s`;
  bar.querySelector('button').textContent = current.button;
}

// ---------- screen awake ----------

async function keepAwake(on) {
  try {
    if (on && !wakeLock && navigator.wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch { /* not supported or not allowed: timers still work */ }
}

// ---------- sound ----------
// Browsers only allow audio after a tap, so the audio context is created/resumed when a timer starts.

function unlockAudio() {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
  } catch { /* no audio support */ }
}

function beep(frequency, duration) {
  if (!st.sound || !audio) return;
  try {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const t = audio.currentTime;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + duration);
  } catch { /* ignore */ }
}

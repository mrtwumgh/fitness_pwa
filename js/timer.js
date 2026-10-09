// The countdown bar at the bottom of the screen: rest timers, hold timers and guided routines.
// While a timer runs it keeps the screen awake and beeps for the last 3 seconds.

import { $ } from './util.js';
import { st } from './state.js';

let current = null;       // { label, left, onEnd, sequence, intervalId }
let audio = null;
let wakeLock = null;
let releaseTimeout = 0;

/**
 * Start a countdown. `onEnd` runs when it reaches zero.
 * In a sequence (warm-up, cool-down) the button says "Next" and skipping also runs `onEnd`.
 */
export function startTimer(label, seconds, onEnd, sequence = false) {
  unlockAudio();
  if (current) clearInterval(current.intervalId);
  current = { label, left: seconds, onEnd, sequence };
  current.intervalId = setInterval(tick, 1000);
  draw();
}

export function skipTimer() {
  if (!current) return;
  clearInterval(current.intervalId);
  const next = current.sequence ? current.onEnd : null;
  current = null;
  draw();
  next?.();
}

/** The wake lock is dropped when the app goes to the background; call this when it comes back. */
export function resumeWakeLock() {
  if (current) keepAwake(true);
}

function tick() {
  current.left--;
  if (current.left > 0) {
    if (current.left <= 3) beep(660, 0.12);
    draw();
    return;
  }
  clearInterval(current.intervalId);
  beep(990, 0.45);
  navigator.vibrate?.([200, 100, 200]);
  const onEnd = current.onEnd;
  current = null;
  draw();
  onEnd?.();
}

function draw() {
  const bar = $('#timer');
  bar.hidden = !current;
  clearTimeout(releaseTimeout);
  if (current) {
    keepAwake(true);
    bar.innerHTML = `<span>${current.label}</span><b>${current.left}s</b>`
      + `<button type="button" data-action="skip">${current.sequence ? 'Next' : 'Skip'}</button>`;
  } else {
    // Wait a moment before releasing, in case another timer starts straight away (rest after a set).
    releaseTimeout = setTimeout(() => { if (!current) keepAwake(false); }, 1500);
  }
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

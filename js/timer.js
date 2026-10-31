// The countdown panel at the bottom of the screen: rest between sets, the move to the next exercise,
// hold timers and guided routines. It beeps for the last 3 seconds, then beeps and vibrates at the end.

import { $, pad } from './util.js';
import { st } from './state.js';
import { workoutActive } from './awake.js';

let current = null;       // { label, endsAt, left, onEnd, button, advance }
let intervalId = 0;
let audio = null;

/**
 * Start a countdown, replacing any running one. `onEnd` runs when it reaches zero.
 *   button:  the main button's label
 *   advance: true = the button also runs `onEnd` (moves a sequence on); false = it just stops the timer
 *   extend:  show a "+15s" button
 *   next:    HTML for an "Up next" preview
 */
export function startTimer(label, seconds, { onEnd, button = 'Skip', advance = false, extend = false, next = '' } = {}) {
  unlockAudio();
  workoutActive();
  clearInterval(intervalId);
  current = { label, endsAt: Date.now() + seconds * 1000, left: seconds, onEnd, button, advance };
  intervalId = setInterval(tick, 250);
  const panel = $('#timer');
  panel.querySelector('.timer-next').innerHTML = next;
  panel.querySelector('.timer-next').hidden = !next;
  panel.querySelector('[data-action="add-time"]').hidden = !extend;
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

/** Add time to the running countdown (the "+15s" button). */
export function addTime(seconds) {
  if (!current) return;
  current.endsAt += seconds * 1000;
  current.left += seconds;
  draw();
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
}

// The panel's elements stay in place and only their text changes, so the buttons keep keyboard focus.
function draw() {
  const panel = $('#timer');
  panel.hidden = !current;
  if (!current) return;
  panel.querySelector('.timer-label').textContent = current.label;
  panel.querySelector('.timer-left').textContent = `${Math.floor(current.left / 60)}:${pad(current.left % 60)}`;
  panel.querySelector('[data-action="skip"]').textContent = current.button;
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

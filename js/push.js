// Web Push reminders: subscribe this phone and keep the reminder server's copy of the schedule up to date.
//
// Flow: the browser gives us a push subscription -> we POST it with the schedule to the worker's /sync ->
// the worker's 5-minute cron sends due reminders -> sw.js shows them.

import { PUSH_URL, VAPID_PUBLIC } from './config.js';
import { st, save, readLog } from './state.js';
import { dateKey, pad, WEEKDAYS } from './util.js';

/** Last error message from the server, for showing to the user. */
export let lastError = '';

const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const configured = () => !PUSH_URL.includes('YOUR-') && !VAPID_PUBLIC.startsWith('PASTE');

/** The reminder schedule in the worker's format. */
export function buildReminders() {
  const r = st.reminders;
  const list = [];
  if (r.water) {
    const times = [];
    for (let h = +r.waterFrom; h <= +r.waterTo; h += Math.max(1, +r.waterEvery || 2)) times.push(`${pad(h)}:00`);
    list.push({ tag: 'water', title: 'Drink water', body: 'Have a glass of water now.', days: [0, 1, 2, 3, 4, 5, 6], times });
  }
  if (r.workout) {
    list.push({ tag: 'workout', title: 'Time to train', body: 'Your session is short. Start now.', days: WEEKDAYS, times: [r.workoutTime] });
  }
  // The nudge shares the "workout" tag, so marking the day complete cancels it too.
  if (r.nudge) {
    const [h, m] = r.workoutTime.split(':');
    const hour = +h + Math.max(1, +r.nudgeAfter || 3);
    if (hour < 24) {
      list.push({ tag: 'workout', title: 'Still time to train', body: 'A few minutes counts. Mark today complete when you finish.', days: WEEKDAYS, times: [`${pad(hour)}:${m}`] });
    }
  }
  return list;
}

/** Which reminders to skip today: water once the goal is reached, workout once the day is complete. */
function doneToday() {
  const today = dateKey();
  const tags = [];
  if ((st.water[today] || 0) >= st.waterGoal) tags.push('water');
  if (readLog(today).done) tags.push('workout');
  return tags.length ? { date: today, tags } : null;
}

async function post(path, data) {
  const res = await fetch(PUSH_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: st.deviceId, ...data }),
  });
  if (!res.ok) {
    let message = '';
    try { message = (await res.json()).error; } catch { /* no JSON body */ }
    lastError = message || `The reminder server replied ${res.status}.`;
  }
  return res;
}

async function currentSubscription() {
  if (!supported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

/**
 * Send the schedule to the server, but only if it changed since last time (saves the free tier's writes).
 * Safe to call often. Returns true when the server is up to date.
 */
export async function syncReminders(force = false) {
  if (!st.pushOn) return false;
  lastError = '';
  try {
    const sub = await currentSubscription();
    if (!sub) { st.pushOn = false; save(); return false; }
    const data = {
      sub: sub.toJSON(),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      reminders: buildReminders(),
      done: doneToday(),
    };
    const fingerprint = JSON.stringify(data);
    if (!force && fingerprint === st.pushSent) return true;
    const res = await post('/sync', data);
    if (!res.ok) return false;
    st.pushSent = fingerprint;
    save();
    return true;
  } catch {
    lastError = 'Could not reach the reminder server. Check your connection.';
    return false;
  }
}

// The functions below return a message to show the user.

export async function turnOnReminders() {
  if (!supported()) return 'This browser cannot receive reminders. Use Chrome on Android, ideally with the app installed.';
  if (!configured()) return 'Reminders are not set up yet: add PUSH_URL and VAPID_PUBLIC in js/config.js.';
  if (await Notification.requestPermission() !== 'granted') {
    return 'Notifications are blocked. Allow them for this app in Android settings, then try again.';
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    const options = { userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC) };
    let sub = await reg.pushManager.getSubscription();
    try {
      sub ||= await reg.pushManager.subscribe(options);
    } catch {
      // An old subscription made with a different key blocks a new one; replace it.
      if (sub) await sub.unsubscribe();
      sub = await reg.pushManager.subscribe(options);
    }
    st.pushOn = true;
    save();
    if (await syncReminders(true)) return 'Reminders are on.';
    st.pushOn = false;
    save();
    return lastError || 'Could not reach the reminder server.';
  } catch (e) {
    return 'Could not turn on reminders: ' + e.message;
  }
}

export async function turnOffReminders() {
  try {
    const sub = await currentSubscription();
    if (sub) await sub.unsubscribe();
    await post('/remove', {});
  } catch { /* offline: the server drops the subscription once pushes start failing */ }
  st.pushOn = false;
  st.pushSent = '';
  save();
  return 'Reminders are off.';
}

export async function sendTest() {
  if (!await syncReminders()) return lastError || 'Could not reach the reminder server.';
  try {
    const res = await post('/test', {});
    return res.ok ? 'Test sent. It should arrive in a few seconds.' : lastError;
  } catch {
    return 'Could not reach the reminder server.';
  }
}

/** VAPID keys are base64url text; the browser wants raw bytes. */
function keyBytes(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64url.length + 3) % 4);
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

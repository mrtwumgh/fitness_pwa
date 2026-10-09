// The Settings tab. Inputs carry data-field="<name>"; main.js saves them on change.

import { st } from '../state.js';

const checked = on => (on ? 'checked' : '');

/** storageProtected: true, false, or null if unknown. */
export function settingsView({ storageProtected }) {
  const r = st.reminders;
  const levels = Array.from({ length: 12 }, (_, i) =>
    `<option value="${i + 1}"${i + 1 === st.level ? ' selected' : ''}>Level ${i + 1}</option>`).join('');

  const storageNote = storageProtected === null ? ''
    : `<p class="note">${storageProtected
      ? 'Your progress is protected: the phone won\'t clear it to free up space.'
      : 'Your progress could be cleared if the phone runs low on space. Installing the app to your home screen usually fixes this.'}</p>`;

  const reminderButtons = st.pushOn
    ? `<button type="button" class="btn" data-action="push-test">Send test</button>
       <button type="button" class="btn" data-action="push-off">Turn off</button>`
    : `<button type="button" class="btn" data-action="push-on">Turn on reminders</button>`;

  return `<h1>Settings</h1>
  <section class="card">
    <h2>Level</h2>
    <select data-field="level" aria-label="Level">${levels}</select>
    <h2 class="gap">Daily water goal</h2>
    <input type="number" min="1" max="20" value="${st.waterGoal}" data-field="waterGoal" aria-label="Glasses per day"> glasses
    <label><input type="checkbox" data-field="sound" ${checked(st.sound)}> Timer sound (beeps for the last 3 seconds and at the end)</label>
    ${storageNote}
  </section>

  <section class="card">
    <h2>Reminders</h2>
    <p class="cue">${st.pushOn ? 'On for this phone. Changes here apply from the next reminder.' : 'Water and workout reminders on this phone, even when the app is closed.'}</p>
    <label><input type="checkbox" data-field="water" ${checked(r.water)}> Water every
      <input type="number" min="1" max="6" value="${r.waterEvery}" data-field="waterEvery" aria-label="Hours between water reminders"> h, from
      <input type="number" min="0" max="23" value="${r.waterFrom}" data-field="waterFrom" aria-label="First water reminder hour"> to
      <input type="number" min="0" max="23" value="${r.waterTo}" data-field="waterTo" aria-label="Last water reminder hour"></label>
    <label><input type="checkbox" data-field="workout" ${checked(r.workout)}> Workout, Monday to Friday at
      <input type="time" value="${r.workoutTime}" data-field="workoutTime" aria-label="Workout time"></label>
    <label><input type="checkbox" data-field="nudge" ${checked(r.nudge)}> If not done, remind again
      <input type="number" min="1" max="6" value="${r.nudgeAfter}" data-field="nudgeAfter" aria-label="Hours after the workout reminder"> h later</label>
    <div class="row">${reminderButtons}</div>
    <p class="note">Water reminders stop for the day once you hit your goal, and workout reminders skip days you've marked complete.
    If reminders don't pop up or vibrate, open this app's notification settings in Android and set them to Alerting.</p>
  </section>

  <button type="button" class="btn danger" data-action="reset">Reset all data</button>`;
}

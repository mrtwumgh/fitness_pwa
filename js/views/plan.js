// The Plan tab: every level with its exercises and form cues. The current level is open.

import { EXERCISES, MAX_LEVEL, DEMO_GIF_CREDIT, videoChannel } from '../data.js';
import { st } from '../state.js';
import { levelPlan, planItems, dose, minutes } from '../plan.js';

export function planView() {
  const intro = `<h1>Plan</h1>
    <p class="note">Stop if you feel sharp pain. If you have an injury or medical condition, check with a doctor first.
    Train Monday to Friday, with neck work on Monday, Wednesday and Friday. After each session, rate how it felt;
    once you've been on a level for 2 weeks, the app uses the last 2 weeks of ratings to suggest levelling up or going easier.
    On hard days, tap "Too hard today" on any exercise for an easier version.</p>`;

  const levels = Array.from({ length: MAX_LEVEL }, (_, i) => {
    const level = i + 1;
    const current = level === st.level;
    const items = planItems(levelPlan(level));
    const rows = items.map(item => {
      const ex = EXERCISES[item.id];
      return `<p><b>${ex.name}</b> ${dose(item)}${ex.neck ? ' (neck days)' : ''}<br><span class="cue">${ex.cue}</span></p>`;
    }).join('');
    return `<details class="card${current ? ' current' : ''}"${current ? ' open' : ''}>
      <summary>Level ${level}${current ? ' (your level)' : ''}, about ${minutes(items, level)} min</summary>${rows}</details>`;
  }).join('');

  // Credit everyone whose demo appears in the app.
  const videoSources = [...new Set(Object.values(EXERCISES).filter(ex => ex.video).map(ex => videoChannel(ex.video)))];
  const credits = `<p class="note">Exercise demos: ${DEMO_GIF_CREDIT}. Videos from YouTube by ${listOf(videoSources)}.</p>`;

  return intro + levels + credits;
}

const listOf = names => names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;

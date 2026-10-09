// The Plan tab: every level with its exercises and form cues.

import { EXERCISES, LEVELS } from '../data.js';
import { planItems, dose, minutes } from '../plan.js';

export function planView() {
  const intro = `<h1>Plan</h1>
    <p class="note">Stop if you feel sharp pain. If you have an injury or medical condition, check with a doctor first.
    Train Monday to Friday, with neck work on Monday, Wednesday and Friday. After each session, rate how it felt;
    every 2 weeks the app uses those ratings to suggest staying, levelling up or going easier.
    On hard days, tap "Too hard today" on any exercise for an easier version.</p>`;

  const levels = LEVELS.map((plan, i) => {
    const items = planItems(plan);
    const rows = items.map(item => {
      const ex = EXERCISES[item.id];
      return `<p><b>${ex.name}</b> ${dose(item)}${ex.neck ? ' (neck days)' : ''}<br><span class="cue">${ex.cue}</span></p>`;
    }).join('');
    return `<details class="card"><summary>Level ${i + 1}, about ${minutes(items)} min</summary>${rows}</details>`;
  }).join('');

  return intro + levels;
}

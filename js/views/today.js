// The Today tab: streak, level prompt, warm-up, exercises, cool-down, effort rating and water.

import { EXERCISES, WARMUP, COOLDOWN, FEELINGS, DEMO_GIF_URL, VIDEO_THUMB_URL, videoChannel } from '../data.js';
import { st, readLog } from '../state.js';
import { todaysItems, dose, minutes, streak, levelReview, youtubeSearch } from '../plan.js';
import { imageFailed } from '../media.js';
import { dateKey, isTrainingDay } from '../util.js';

export function todayView(now = new Date()) {
  const day = dateKey(now);
  const log = readLog(day);
  const training = isTrainingDay(now);
  const items = training ? todaysItems(now) : [];

  const header = `
    <p class="sub">${now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
    <div class="big">${streak(now)}</div>
    <p class="sub">day streak. Level ${st.level}${training ? `, about ${minutes(items)} min today` : ', rest day'}.</p>`;

  const session = training
    ? routineCard('warmup', 'Warm-up', WARMUP, log)
      + items.map(item => exerciseCard(item, log)).join('')
      + routineCard('cooldown', 'Cool-down', COOLDOWN, log)
      + finishSection(log)
    : `<section class="card"><h2>Rest day</h2><p class="cue">Recover and drink water.</p></section>`;

  return header + levelPrompt(now) + session + waterCard(day);
}

function levelPrompt(now) {
  const review = levelReview(now);
  if (!review) return '';
  const summary = `You finished ${review.done} of ${review.total} sessions`
    + (review.hard ? ` and ${review.hard} of them felt hard.` : '.');
  if (review.kind === 'up') {
    return `<section class="card"><h2>Ready to level up?</h2><p class="cue">${summary}</p>
      <div class="row">${levelButton('up', 'Level up')}${levelButton('stay', 'Stay')}${st.level > 1 ? levelButton('down', 'Go easier') : ''}</div></section>`;
  }
  return `<section class="card"><h2>This level has felt hard</h2><p class="cue">${summary} Dropping a level is how you keep progressing.</p>
    <div class="row">${levelButton('down', 'Go easier')}${levelButton('stay', 'Stay')}</div></section>`;
}

const levelButton = (choice, label) => `<button type="button" class="btn" data-action="level" data-value="${choice}">${label}</button>`;

function exerciseCard(item, log) {
  const ex = EXERCISES[item.id];
  const doneSets = log.sets[item.planned] || 0;
  const chips = Array.from({ length: item.sets }, (_, i) =>
    `<button type="button" class="chip${i < doneSets ? ' on' : ''}" data-action="set" data-id="${item.planned}" data-index="${i}" aria-label="Set ${i + 1}" aria-pressed="${i < doneSets}">${i + 1}</button>`).join('');
  const holdButton = ex.unit === 'seconds'
    ? `<button type="button" class="btn" data-action="hold" data-id="${item.planned}">Start ${ex.holds ? `${ex.holds.length} × ` : ''}${item.amount}s timer</button>`
    : '';
  // With an animation on the card, the video (if any) is a link; without one, the video is the demo.
  const videoLink = ex.gif && ex.video
    ? `<button type="button" class="link" data-action="video" data-exercise="${item.id}">Watch video</button>`
    : '';
  return `<section class="card${doneSets >= item.sets ? ' ok' : ''}" data-card="${item.planned}">
    <h2>${ex.name}</h2>
    ${item.easier ? `<p class="sub">Easier version of ${EXERCISES[item.planned].name.toLowerCase()} today</p>` : ''}
    <p class="dose">${dose(item)}</p>
    ${demo(item.id)}
    <p class="cue">${ex.cue}</p>
    <div class="row">${chips}${holdButton}</div>
    <div class="links">
      ${videoLink}
      <button type="button" class="link" data-action="easier" data-id="${item.planned}">${item.easier ? 'Back to normal' : 'Too hard today'}</button>
    </div>
  </section>`;
}

/**
 * The exercise demo: a looping animation if there is one, otherwise a tap-to-play video.
 * If an animation can't load (e.g. offline before it was ever saved), media.js removes it;
 * the card's "Watch video" link remains, or for animation-only exercises a YouTube search link appears.
 */
function demo(id) {
  const ex = EXERCISES[id];
  if (!ex.gif) return videoButton(id);
  const src = DEMO_GIF_URL(ex.gif);
  const failed = imageFailed(src);
  const fallback = ex.video ? ''
    : `<a class="demo-fallback" href="${youtubeSearch(id)}" target="_blank" rel="noopener"${failed ? '' : ' hidden'}>Animation unavailable. Find a video on YouTube</a>`;
  if (failed) return fallback && `<figure class="demo">${fallback}</figure>`;
  return `<figure class="demo">
      <img class="demo-gif" src="${src}" alt="Animation of ${ex.name.toLowerCase()}" width="180" height="180" loading="lazy">
      <figcaption>${ex.gifNote ? `<span class="demo-note">${ex.gifNote}</span>` : ''}<span class="credit">© Gym visual</span></figcaption>
      ${fallback}
    </figure>`;
}

function videoButton(id) {
  const ex = EXERCISES[id];
  const thumb = VIDEO_THUMB_URL(ex.video.id);
  return `<button type="button" class="demo-video" data-action="video" data-exercise="${id}" aria-label="Play video: ${ex.name}">
      ${imageFailed(thumb) ? '' : `<img class="demo-thumb" src="${thumb}" alt="" loading="lazy">`}
      <span class="play" aria-hidden="true"></span>
      <span class="label">Watch demo · ${videoChannel(ex.video)}</span>
    </button>`;
}

/** The "Up next" preview in the countdown between exercises: the animation (or video thumbnail), name and dose. */
export function upNext(item) {
  const ex = EXERCISES[item.id];
  const gif = ex.gif && DEMO_GIF_URL(ex.gif);
  const thumb = ex.video && VIDEO_THUMB_URL(ex.video.id);
  const src = [gif, thumb].find(url => url && !imageFailed(url));
  const img = src ? `<img class="${src === gif ? 'demo-gif' : 'demo-thumb'}" src="${src}" alt="" width="88" height="88">` : '';
  return `${img}<div><b>${ex.name}</b><span class="dose">${dose(item)}</span></div>`;
}

function routineCard(id, title, steps, log) {
  const done = log[id];
  const mins = Math.round(steps.reduce((sum, s) => sum + s.seconds, 0) / 30) / 2;
  return `<section class="card${done ? ' ok' : ''}" data-card="${id}">
    <h2>${title}</h2>
    <p class="dose">About ${mins} min, optional</p>
    <ol class="steps cue">${steps.map(s => `<li><b>${s.name}</b>, ${s.seconds}s. ${s.cue}</li>`).join('')}</ol>
    <button type="button" class="btn" data-action="routine" data-id="${id}">${done ? 'Do it again' : `Start ${title.toLowerCase()}`}</button>
  </section>`;
}

function finishSection(log) {
  const button = `<button type="button" class="btn wide" data-action="done">${log.done ? 'Completed. Tap to undo' : 'Mark today complete'}</button>`;
  if (!log.done) return button;
  const options = FEELINGS.map(([value, label]) =>
    `<button type="button" class="pill${log.feel === value ? ' on' : ''}" data-action="feel" data-value="${value}" aria-pressed="${log.feel === value}">${label}</button>`).join('');
  return button + `<section class="card"><h2>How did it feel?</h2><div class="row">${options}</div>
    <p class="cue">Your answers decide when the app suggests changing level.</p></section>`;
}

function waterCard(day) {
  const glasses = st.water[day] || 0;
  return `<section class="card">
    <h2>Water</h2>
    <p class="dose">${glasses} of ${st.waterGoal} glasses</p>
    <div class="bar"><i style="width:${Math.min(100, (glasses / st.waterGoal) * 100)}%"></i></div>
    <div class="row">
      <button type="button" class="btn" data-action="water" data-value="-1" aria-label="Remove a glass">−</button>
      <button type="button" class="btn" data-action="water" data-value="1">+ Glass</button>
    </div>
  </section>`;
}

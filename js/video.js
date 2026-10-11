// The in-app video player: a sheet over the screen with the exercise's YouTube video.
//
// It lives outside #app, so the redraws that happen on every tap don't interrupt playback.
// Opening it adds a history entry, so Android's back button closes the video instead of the app.

import { EXERCISES, VIDEO_EMBED_URL } from './data.js';
import { toast } from './toast.js';
import { $ } from './util.js';

let open = false;

export function openVideo(exerciseId) {
  const ex = EXERCISES[exerciseId];
  if (!ex?.video) return;
  if (!navigator.onLine) {
    toast('Videos need an internet connection. The written steps are on the card.');
    return;
  }

  const player = $('#player');
  player.querySelector('#player-title').textContent = ex.name;
  player.querySelector('.player-by').textContent = `Video: ${ex.video.by}`;
  player.querySelector('.player-cue').textContent = ex.cue;

  const frame = document.createElement('iframe');
  frame.setAttribute('src', VIDEO_EMBED_URL(ex.video.id));
  frame.setAttribute('title', `${ex.name} video`);
  frame.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
  frame.setAttribute('allowfullscreen', '');
  frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');   // YouTube needs to know the embedding site
  player.querySelector('.player-frame').replaceChildren(frame);

  player.hidden = false;
  document.body.classList.add('no-scroll');
  if (!open) history.pushState({ video: true }, '');
  open = true;
  player.querySelector('[data-action="close-video"]').focus();
}

/** Close from the ✕ button or the backdrop: step back through history, which then hides the player. */
export function closeVideo() {
  if (!open) return;
  if (history.state?.video) history.back();
  else hidePlayer();
}

function hidePlayer() {
  const player = $('#player');
  player.querySelector('.player-frame').replaceChildren();   // removing the iframe stops playback
  player.hidden = true;
  document.body.classList.remove('no-scroll');
  open = false;
}

// Back button (or history.back() above) while the player is open.
window.addEventListener('popstate', () => { if (open) hidePlayer(); });

document.addEventListener('keydown', event => { if (open && event.key === 'Escape') closeVideo(); });

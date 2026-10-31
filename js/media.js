// Exercise demo images (animations and video thumbnails) that fail to load, e.g. offline before
// an animation was ever saved. The page is redrawn after every tap, so failures are remembered:
// otherwise each redraw would try again and the page would jump as the broken images are removed.

/** Must match MEDIA_CACHE in sw.js. */
const MEDIA_CACHE = 'ss-media-v1';

const failed = new Set();

/** True if this image already failed to load; the views leave it out. */
export const imageFailed = src => failed.has(src);

// Image errors don't bubble, so listen in the capture phase.
document.addEventListener('error', event => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement)) return;

  if (img.classList.contains('demo-gif')) {
    failed.add(img.src);
    // Forget any saved copy so the next try goes to the network.
    if ('caches' in window) caches.open(MEDIA_CACHE).then(cache => cache.delete(img.src)).catch(() => {});
    const figure = img.closest('.demo');
    const fallback = figure?.querySelector('.demo-fallback');
    if (fallback) {
      img.remove();
      figure.querySelector('figcaption')?.remove();
      fallback.hidden = false;
    } else {
      (figure ?? img).remove();   // the card's "Watch video" link (or the "Up next" name) is still there
    }
  } else if (img.classList.contains('demo-thumb')) {
    failed.add(img.src);
    img.remove();   // the play button still works on a plain background
  }
}, true);

// Back online: give failed images another try on the next redraw.
window.addEventListener('online', () => failed.clear());

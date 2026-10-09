// A short message bar that replaces browser alert() pop-ups.

let hideTimeout = 0;

export function toast(message, ms = 4000) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => { el.hidden = true; }, ms);
}

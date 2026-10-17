// Small helpers used across the app.

export const $ = selector => document.querySelector(selector);

export const pad = n => String(n).padStart(2, '0');

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/** A local date as "YYYY-MM-DD". Used as the key for each day's log, so built by hand rather than with a locale. */
export const dateKey = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Training happens Monday to Friday (Date.getDay() numbers). */
export const TRAINING_DAYS = [1, 2, 3, 4, 5];

export const isTrainingDay = (date = new Date()) => TRAINING_DAYS.includes(date.getDay());

/** Neck work happens Monday, Wednesday and Friday. */
export const isNeckDay = (date = new Date()) => [1, 3, 5].includes(date.getDay());

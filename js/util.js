// Small helpers used across the app.

export const $ = selector => document.querySelector(selector);

export const pad = n => String(n).padStart(2, '0');

/** A local date as "YYYY-MM-DD". Used as the key for each day's log. */
export const dateKey = (date = new Date()) => date.toLocaleDateString('en-CA');

/** Training happens Monday to Friday. */
export const isTrainingDay = (date = new Date()) => date.getDay() >= 1 && date.getDay() <= 5;

/** Neck work happens Monday, Wednesday and Friday. */
export const isNeckDay = (date = new Date()) => [1, 3, 5].includes(date.getDay());

export const WEEKDAYS = [1, 2, 3, 4, 5];

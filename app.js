// ---- Reminder setup: paste your values here (see SETUP.md) ----
const PUSH_URL = "https://strength-push.strength-push.workers.dev";
const VAPID_PUBLIC =
  "BEgaVhIiJCHn586sNP1UfjlJlZUolQydNk1_J0ieDrj3Df349mrXIR36dv6ifiXTYeJE1SxyijWHk4NiiNZSNmQ";
// ----------------------------------------------------------------
const $ = (s) => document.querySelector(s),
  pad = (n) => String(n).padStart(2, "0"),
  td = (d = new Date()) => d.toLocaleDateString("en-CA");
const E = {
  wp: {
    n: "Wall push-up",
    u: "r",
    c: "Hands on a wall at shoulder height, body straight. Bend your elbows (about 45° from your body) to bring your chest to the wall, then push back.",
  },
  ip: {
    n: "Incline push-up",
    u: "r",
    c: "Hands on a sturdy table, body straight. Lower your chest to the edge with elbows about 45°, then press up.",
  },
  kp: {
    n: "Knee push-up",
    u: "r",
    c: "Hands under shoulders, knees down, body straight from head to knees. Lower your chest, then press up.",
  },
  pu: {
    n: "Push-up",
    u: "r",
    c: "Hands slightly wider than shoulders, body straight from head to heels. Lower your chest with elbows about 45°, press up without sagging your hips.",
  },
  pk: {
    n: "Pike push-up",
    u: "r",
    c: "Hips high in an upside-down V. Bend your elbows to lower your head toward the floor between your hands, then press up.",
  },
  cd: {
    n: "Chair dip",
    u: "r",
    q: "bench dips beginner form",
    c: "Hands on the edge of a sturdy chair placed against a wall, knees bent. Lower your elbows straight back only as deep as is comfortable, then press up.",
  },
  br: {
    n: "Backpack row",
    u: "r",
    q: "backpack bent over row form",
    c: "Hold a loaded backpack, hinge at the hips with a flat back. Pull the bag to your lower ribs, squeeze your shoulder blades, lower slowly. Start light.",
  },
  su: {
    n: "Superman",
    u: "r",
    c: "Lie face down, arms forward. Lift arms and legs slightly with a neutral neck, hold 2 seconds, lower.",
  },
  fp: {
    n: "Forearm plank",
    u: "s",
    c: "Forearms down, elbows under shoulders, body straight from head to heels, stomach tight, hips not sagging.",
  },
  db: {
    n: "Dead bug",
    u: "r",
    p: "per side",
    c: "On your back, arms up, knees bent 90° over your hips. Lower the opposite arm and leg with your lower back pressed down, then switch.",
  },
  bd: {
    n: "Bird dog",
    u: "r",
    p: "per side",
    c: "On hands and knees, extend the opposite arm and leg with level hips, hold 2 seconds, switch.",
  },
  cs: {
    n: "Chair squat",
    u: "r",
    c: "Feet shoulder-width in front of a chair. Push your hips back and bend your knees until you lightly touch the seat, then stand through your heels.",
  },
  sq: {
    n: "Squat",
    u: "r",
    c: "Feet shoulder-width, hips back, chest up, knees over toes. Lower to about parallel, then stand.",
  },
  rl: {
    n: "Reverse lunge",
    u: "r",
    p: "per side",
    c: "Step one foot back and lower until both knees are about 90°. Push through the front heel and alternate legs. Hold a wall if needed.",
  },
  gb: {
    n: "Glute bridge",
    u: "r",
    c: "On your back, knees bent. Lift your hips, squeezing your glutes, until shoulders to knees is a straight line. Pause 1 second, lower slowly.",
  },
  cr: {
    n: "Calf raise",
    u: "r",
    c: "Hold a wall, rise onto your toes, lower slowly.",
  },
  ni: {
    n: "Neck isometrics",
    u: "s",
    p: "per direction",
    nk: 1,
    q: "neck isometric exercises physiotherapist",
    c: "Sit tall. Press your palm against your forehead, then each side of your head, then the back of your head. Your head must not move. Push gently and hold. One round = all 4 directions. Go gently, never jerk, stop if you feel pain or dizziness.",
  },
  ct: {
    n: "Chin tuck",
    u: "r",
    nk: 1,
    q: "chin tucks physiotherapist",
    c: "Sit tall looking ahead. Draw your chin straight back without tilting your head, hold 5 seconds.",
  },
};
const L = [
  [
    ["wp", 1, 8],
    ["cs", 1, 8],
    ["ni", 1, 5],
  ],
  [
    ["wp", 2, 8],
    ["cs", 2, 8],
    ["fp", 1, 10],
    ["gb", 1, 8],
    ["ni", 2, 5],
  ],
  [
    ["ip", 2, 6],
    ["cs", 2, 10],
    ["br", 2, 8],
    ["fp", 2, 15],
    ["gb", 2, 10],
    ["ni", 2, 8],
    ["ct", 1, 5],
  ],
  [
    ["ip", 2, 10],
    ["sq", 2, 8],
    ["br", 2, 10],
    ["cd", 1, 6],
    ["db", 2, 6],
    ["fp", 2, 20],
    ["gb", 2, 12],
    ["ni", 3, 8],
    ["ct", 2, 5],
  ],
  [
    ["kp", 3, 8],
    ["sq", 3, 10],
    ["rl", 2, 6],
    ["br", 3, 10],
    ["cd", 2, 8],
    ["su", 2, 8],
    ["db", 2, 8],
    ["bd", 2, 6],
    ["fp", 3, 20],
    ["cr", 2, 12],
    ["ni", 3, 10],
    ["ct", 2, 8],
  ],
  [
    ["pu", 3, 8],
    ["pk", 2, 6],
    ["sq", 3, 12],
    ["rl", 3, 8],
    ["br", 3, 12],
    ["cd", 3, 10],
    ["su", 3, 10],
    ["db", 3, 10],
    ["bd", 3, 8],
    ["fp", 3, 30],
    ["gb", 3, 15],
    ["cr", 3, 15],
    ["ni", 3, 10],
    ["ct", 3, 10],
  ],
];

let st = Object.assign(
  {
    level: 1,
    lvStart: td(),
    log: {},
    water: {},
    goal: 8,
    id: "",
    asked: "",
    push: 0,
    pushSig: "",
    snd: 1,
  },
  JSON.parse(localStorage.getItem("ss") || "{}"),
);
st.rem = Object.assign(
  { w: 1, x: 1, n: 1, nh: 3, ws: 8, we: 20, wi: 2, wt: "17:00" },
  st.rem,
);
if (!st.id)
  st.id = [...crypto.getRandomValues(new Uint8Array(16))]
    .map((b) => pad(b.toString(16)))
    .join("");
delete st.topic;
delete st.sched;
const save = () => localStorage.setItem("ss", JSON.stringify(st));
let tab = "today",
  tm = null;

const rest = () => (st.level >= 5 ? 45 : 30);
const mins = (it) =>
  Math.round(
    it.reduce(
      (t, [k, s, a]) =>
        t + s * ((E[k].u == "s" ? a * (E[k].nk ? 4 : 1) : a * 3) + rest()),
      0,
    ) / 60,
  ) || 1;
const yt = (e) =>
  "https://www.youtube.com/results?search_query=" +
  encodeURIComponent(e.q || e.n + " beginner form").replace(/%20/g, "+");
function lv(n) {
  if (n <= 6) return L[n - 1];
  const x = n - 6;
  return L[5].map(([k, s, a]) => [
    k,
    Math.min(4, s + (x >> 1)),
    a + (E[k].u == "s" ? 5 : 2) * x,
  ]);
}
// "Too hard today": swap to an easier variant if there is one, otherwise lighten the dose.
const EZ = { pu: "kp", kp: "ip", ip: "wp", pk: "ip", sq: "cs", rl: "cs" };
function easier([k, s, a]) {
  const v = EZ[k];
  if (v) return [v, s, a, k];
  return [
    k,
    Math.max(1, s - 1),
    E[k].u == "s"
      ? Math.max(5, Math.round((a * 0.6) / 5) * 5)
      : Math.max(3, Math.round(a * 0.6)),
    k,
  ];
}
// Each item: [shown exercise, sets, reps/seconds, planned exercise (used as the log key)]
const items = () => {
  const ez = (st.log[td()] || {}).e || {};
  return lv(st.level)
    .filter(([k]) => !E[k].nk || [1, 3, 5].includes(new Date().getDay()))
    .map((it) => (ez[it[0]] ? easier(it) : [...it, it[0]]));
};
const WU = [
  [
    "March in place",
    "Lift your knees toward hip height and swing your arms.",
    30,
  ],
  ["Arm circles", "Start small and grow bigger. Switch direction halfway.", 30],
  ["Shoulder rolls", "Roll your shoulders up, back and down, slowly.", 15],
  [
    "Hip circles",
    "Hands on hips, circle slowly. Switch direction halfway.",
    15,
  ],
];
const CD = [
  [
    "Chest stretch",
    "Forearm on a door frame, step through gently until you feel it across your chest. Switch sides halfway.",
    30,
  ],
  [
    "Shoulder stretch",
    "Pull one arm across your chest with the other. Switch sides halfway.",
    30,
  ],
  [
    "Neck side tilt",
    "Tilt one ear toward your shoulder without pulling with your hand. Switch sides halfway.",
    30,
  ],
  [
    "Quad stretch",
    "Hold a wall and pull one heel toward your bottom. Switch sides halfway.",
    30,
  ],
  [
    "Child's pose",
    "Kneel, sit back on your heels and reach your arms forward on the floor. Breathe slowly.",
    30,
  ],
];
function streak() {
  let n = 0;
  const d = new Date();
  for (let i = 0; i < 400; i++, d.setDate(d.getDate() - 1)) {
    const w = d.getDay();
    if (w == 0 || w == 6) continue;
    const l = st.log[td(d)];
    if (l && l.ok) n++;
    else if (i > 0) break;
  }
  return n;
}
function lvCheck() {
  const t = td();
  if (st.asked == t) return 0;
  const a = new Date(st.lvStart + "T00:00"),
    n = new Date(t + "T00:00");
  if ((n - a) / 864e5 < 14) return 0;
  let tot = 0,
    ok = 0;
  for (const d = new Date(a); d < n; d.setDate(d.getDate() + 1)) {
    const w = d.getDay();
    if (w > 0 && w < 6) {
      tot++;
      const l = st.log[td(d)];
      if (l && l.ok) ok++;
    }
  }
  return tot && ok / tot >= 0.8;
}

const dose = ([k, s, a]) => {
  const e = E[k];
  return `${s} × ${a}${e.u == "s" ? " sec" : ""}${e.p ? " " + e.p : ""}`;
};
const card = (it) => {
  const [k, s, a, o] = it,
    e = E[k],
    lg = st.log[td()] || {},
    n = (lg.s || {})[o] || 0,
    ez = (lg.e || {})[o];
  return `<section class="card${n >= s ? " ok" : ""}"><h2>${e.n}</h2>${ez ? `<p class=sub>Easier version of ${E[o].n.toLowerCase()} today</p>` : ""}<p class=dose>${dose(it)}</p><p class=cue>${e.c}</p><div class=row>${Array.from({ length: s }, (_, i) => `<button class="chip${i < n ? " on" : ""}" data-a=set data-k=${o} data-i=${i} aria-label="Set ${i + 1}">${i + 1}</button>`).join("")}${e.u == "s" ? `<button class=btn data-a=hold data-k=${o} data-s=${a}>Start ${a}s timer</button>` : ""}</div><div class=links><a href="${yt(e)}" target=_blank rel=noopener>Watch how</a><button class=link data-a=ez data-k=${o}>${ez ? "Back to normal" : "Too hard today"}</button></div></section>`;
};
const routine = (id, title, steps) => {
  const done = (st.log[td()] || {})[id],
    m = Math.round(steps.reduce((t, x) => t + x[2], 0) / 30) / 2;
  return `<section class="card${done ? " ok" : ""}"><h2>${title}</h2><p class=dose>About ${m} min, optional</p><ol class="steps cue">${steps.map((x) => `<li><b>${x[0]}</b>, ${x[2]}s. ${x[1]}</li>`).join("")}</ol><button class=btn data-a=seq data-r=${id}>${done ? "Do it again" : "Start " + title.toLowerCase()}</button></section>`;
};
const water = () => {
  const w = st.water[td()] || 0;
  return `<section class=card><h2>Water</h2><p class=dose>${w} of ${st.goal} glasses</p><div class=bar><i style="width:${Math.min(100, (w / st.goal) * 100)}%"></i></div><div class=row><button class=btn data-a=w data-d=-1 aria-label="Remove a glass">−</button><button class=btn data-a=w data-d=1>+ Glass</button></div></section>`;
};

function today() {
  const d = new Date(),
    w = d.getDay(),
    lg = st.log[td()] || { ok: 0 },
    tr = w > 0 && w < 6,
    it = tr ? items() : [];
  return (
    `<p class=sub>${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p><div class=big>${streak()}</div><p class=sub>day streak. Level ${st.level}${tr ? ", about " + mins(it) + " min today" : ", rest day"}.</p>` +
    (lvCheck()
      ? `<section class=card><h2>Ready to level up?</h2><p class=cue>You finished most sessions over the last 2 weeks.</p><div class=row><button class=btn data-a=lvl data-v=up>Level up</button><button class=btn data-a=lvl data-v=stay>Stay</button><button class=btn data-a=lvl data-v=down>Go easier</button></div></section>`
      : "") +
    (tr
      ? routine("wu", "Warm-up", WU) +
        it.map(card).join("") +
        routine("cd", "Cool-down", CD) +
        `<button class="btn wide" data-a=ok>${lg.ok ? "Completed. Tap to undo" : "Mark today complete"}</button>`
      : `<section class=card><h2>Rest day</h2><p class=cue>Recover and drink water.</p></section>`) +
    water()
  );
}

function plan() {
  return (
    `<h1>Plan</h1><p class=note>Stop if you feel sharp pain. If you have an injury or medical condition, check with a doctor first. Train Monday to Friday, with neck work on Monday, Wednesday and Friday. Every 2 weeks the app asks whether to level up. On hard days, tap "Too hard today" on any exercise for an easier version. An optional warm-up and cool-down appear on training days.</p>` +
    L.map(
      (l, i) =>
        `<details class=card><summary>Level ${i + 1}, about ${mins(l)} min</summary>${l
          .map((it) => {
            const e = E[it[0]];
            return `<p><b>${e.n}</b> ${dose(it)}${e.nk ? " (neck days)" : ""}<br><span class=cue>${e.c}</span></p>`;
          })
          .join("")}</details>`,
    ).join("")
  );
}

function sett() {
  const r = st.rem;
  return `<h1>Settings</h1>
<section class=card><h2>Level</h2><select data-f=level aria-label="Level">${Array.from({ length: 12 }, (_, i) => `<option value=${i + 1}${i + 1 == st.level ? " selected" : ""}>Level ${i + 1}</option>`).join("")}</select><h2 style="margin-top:.8rem">Daily water goal</h2><input type=number min=1 max=20 value=${st.goal} data-f=goal aria-label="Glasses per day"> glasses<label><input type=checkbox data-f=snd ${st.snd ? "checked" : ""}> Timer sound (beeps for the last 3 seconds and at the end)</label></section>
<section class=card><h2>Reminders</h2><p class=cue>${st.push ? "On for this phone. Changes here apply from the next reminder." : "Water and workout reminders on this phone, even when the app is closed."}</p>
<label><input type=checkbox data-f=w ${r.w ? "checked" : ""}> Water every <input type=number min=1 max=6 value=${r.wi} data-f=wi aria-label="Hours between reminders"> h, from <input type=number min=0 max=23 value=${r.ws} data-f=ws aria-label="Start hour"> to <input type=number min=0 max=23 value=${r.we} data-f=we aria-label="End hour"></label>
<label><input type=checkbox data-f=x ${r.x ? "checked" : ""}> Workout, Monday to Friday at <input type=time value=${r.wt} data-f=wt aria-label="Workout time"></label>
<label><input type=checkbox data-f=n ${r.n ? "checked" : ""}> If not done, remind again <input type=number min=1 max=6 value=${r.nh} data-f=nh aria-label="Hours after workout reminder"> h later</label>
<div class=row>${st.push ? "<button class=btn data-a=test>Send test</button><button class=btn data-a=poff>Turn off</button>" : "<button class=btn data-a=pon>Turn on reminders</button>"}</div>
<p class=note>Water reminders stop for the day once you hit your goal, and the workout reminder skips days you've marked complete. If reminders don't pop up on screen, open this app's notification settings in Android and allow pop-up alerts.</p></section>
<button class="btn danger" data-a=reset>Reset all data</button>`;
}

function render() {
  $("#app").innerHTML =
    tab == "today" ? today() : tab == "plan" ? plan() : sett();
  document
    .querySelectorAll("nav button")
    .forEach((b) => b.classList.toggle("on", b.dataset.t == tab));
}

// Sound: the audio context is unlocked on the tap that starts a timer (browsers require a tap).
let ac = null,
  wl = null,
  wlOff = 0;
function unlock() {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    ac.resume();
  } catch (e) {}
}
function beep(f, d) {
  if (!st.snd || !ac) return;
  try {
    const o = ac.createOscillator(),
      g = ac.createGain(),
      t = ac.currentTime;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + d);
  } catch (e) {}
}
// Keep the screen on while a timer runs (released a moment after the last timer ends).
async function wake(on) {
  try {
    if (on && !wl && navigator.wakeLock) {
      wl = await navigator.wakeLock.request("screen");
      wl.addEventListener("release", () => {
        wl = null;
      });
    } else if (!on && wl) {
      await wl.release();
      wl = null;
    }
  } catch (e) {}
}
function bar() {
  const b = $("#tb");
  b.hidden = !tm;
  clearTimeout(wlOff);
  if (tm) {
    wake(true);
    b.innerHTML = `<span>${tm.l}</span><b>${tm.left}s</b><button data-a=skip>${tm.seq ? "Next" : "Skip"}</button>`;
  } else
    wlOff = setTimeout(() => {
      if (!tm) wake(false);
    }, 1500);
}
function timer(l, s, end, seq) {
  unlock();
  if (tm) clearInterval(tm.id);
  tm = { l, left: s, end, seq };
  tm.id = setInterval(() => {
    tm.left--;
    if (tm.left > 0 && tm.left <= 3) beep(660, 0.12);
    bar();
    if (tm && tm.left <= 0) {
      clearInterval(tm.id);
      beep(990, 0.45);
      navigator.vibrate && navigator.vibrate([200, 100, 200]);
      const f = tm.end;
      tm = null;
      bar();
      f && f();
    }
  }, 1000);
  bar();
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && tm) wake(true);
});

// ---- Web Push ----
const canPush = () =>
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;
const keyBytes = (s) =>
  Uint8Array.from(
    atob(
      s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4),
    ),
    (c) => c.charCodeAt(0),
  );
const api = (path, data) =>
  fetch(PUSH_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.assign({ id: st.id }, data)),
  });
function reminders() {
  const r = st.rem,
    out = [];
  if (r.w) {
    const t = [];
    for (let h = +r.ws; h <= +r.we; h += Math.max(1, r.wi | 0))
      t.push(pad(h) + ":00");
    out.push({
      tag: "water",
      title: "Drink water",
      body: "Have a glass of water now.",
      days: [0, 1, 2, 3, 4, 5, 6],
      times: t,
    });
  }
  if (r.x)
    out.push({
      tag: "workout",
      title: "Time to train",
      body: "Your session is short. Start now.",
      days: [1, 2, 3, 4, 5],
      times: [r.wt],
    });
  // The nudge shares the "workout" tag, so marking the day complete cancels it too.
  if (r.n) {
    const [H, M] = r.wt.split(":"),
      h = +H + Math.max(1, +r.nh || 3);
    if (h < 24)
      out.push({
        tag: "workout",
        title: "Still time to train",
        body: "A few minutes counts. Mark today complete when you finish.",
        days: [1, 2, 3, 4, 5],
        times: [pad(h) + ":" + M],
      });
  }
  return out;
}
async function currentSub() {
  if (!canPush()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}
// Sends the schedule to the worker only when something changed, to save KV writes.
async function pushSync(force) {
  if (!st.push) return false;
  try {
    const sub = await currentSub();
    if (!sub) {
      st.push = 0;
      save();
      return false;
    }
    const t = td(),
      tags = [];
    if ((st.water[t] || 0) >= st.goal) tags.push("water");
    if ((st.log[t] || {}).ok) tags.push("workout");
    const data = {
        sub: sub.toJSON(),
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        reminders: reminders(),
        done: tags.length ? { date: t, tags } : null,
      },
      sig = JSON.stringify(data);
    if (!force && sig == st.pushSig) return true;
    const res = await api("/sync", data);
    if (!res.ok) return false;
    st.pushSig = sig;
    save();
    return true;
  } catch (e) {
    return false;
  }
}
async function pushOn() {
  if (!canPush())
    return alert(
      "This browser cannot receive push reminders. Use Chrome on Android, ideally with the app installed.",
    );
  if (PUSH_URL.includes("YOUR-") || VAPID_PUBLIC.startsWith("PASTE"))
    return alert(
      "Reminders are not configured yet: set PUSH_URL and VAPID_PUBLIC at the top of app.js.",
    );
  if ((await Notification.requestPermission()) !== "granted")
    return alert(
      "Notifications are blocked. Allow them for this app in Android settings, then try again.",
    );
  try {
    const reg = await navigator.serviceWorker.ready,
      opts = {
        userVisibleOnly: true,
        applicationServerKey: keyBytes(VAPID_PUBLIC),
      };
    let sub = await reg.pushManager.getSubscription();
    try {
      sub = sub || (await reg.pushManager.subscribe(opts));
    } catch (e) {
      if (sub) await sub.unsubscribe();
      sub = await reg.pushManager.subscribe(opts);
    }
    st.push = 1;
    save();
    const ok = await pushSync(true);
    if (!ok) {
      st.push = 0;
      save();
    }
    render();
    alert(
      ok
        ? "Reminders are on."
        : "Could not reach the reminder server. Check PUSH_URL and your connection, then try again.",
    );
  } catch (e) {
    alert("Could not turn on reminders: " + e.message);
  }
}
async function pushOff() {
  try {
    const sub = await currentSub();
    if (sub) await sub.unsubscribe();
    await api("/remove", {});
  } catch (e) {}
  st.push = 0;
  st.pushSig = "";
  save();
  render();
}
async function pushTest() {
  if (!(await pushSync())) return alert("Could not reach the reminder server.");
  try {
    const r = await api("/test", {});
    alert(
      r.ok
        ? "Test sent. It should arrive in a few seconds."
        : "The push service rejected the test. Try turning reminders off and on again.",
    );
  } catch (e) {
    alert("Could not reach the reminder server.");
  }
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-a]");
  if (!b) return;
  const a = b.dataset.a,
    k = b.dataset.k,
    t = td(),
    lg = (st.log[t] = st.log[t] || { s: {}, ok: 0 });
  if (a == "tab") tab = b.dataset.t;
  else if (a == "skip") {
    if (tm) {
      clearInterval(tm.id);
      const f = tm.seq ? tm.end : null;
      tm = null;
      bar();
      f && f();
    }
    return;
  } else if (a == "set") {
    const i = +b.dataset.i,
      c = lg.s[k] || 0,
      s = items().find((x) => x[3] == k)[1];
    lg.s[k] = i < c ? i : i + 1;
    if (lg.s[k] > c && lg.s[k] < s) timer("Rest", rest());
  } else if (a == "hold") {
    const it = items().find((x) => x[3] == k);
    timer(E[it[0]].n, +b.dataset.s, () => {
      const s = items().find((x) => x[3] == k)[1];
      lg.s[k] = Math.min(s, (lg.s[k] || 0) + 1);
      save();
      render();
    });
  } else if (a == "ez") {
    lg.e = lg.e || {};
    if (lg.e[k]) delete lg.e[k];
    else lg.e[k] = 1;
    lg.s[k] = 0;
  } else if (a == "seq") {
    const id = b.dataset.r,
      steps = id == "wu" ? WU : CD;
    let i = 0;
    const next = () => {
      if (i >= steps.length) {
        lg[id] = 1;
        save();
        render();
        return;
      }
      const [n, , s] = steps[i++];
      timer(`${i}/${steps.length} ${n}`, s, next, 1);
    };
    next();
    return;
  } else if (a == "ok") lg.ok = lg.ok ? 0 : 1;
  else if (a == "w")
    st.water[t] = Math.max(0, (st.water[t] || 0) + +b.dataset.d);
  else if (a == "lvl") {
    const v = b.dataset.v;
    st.level = Math.max(1, st.level + (v == "up" ? 1 : v == "down" ? -1 : 0));
    st.lvStart = st.asked = t;
  } else if (a == "pon") {
    pushOn();
    return;
  } else if (a == "poff") {
    pushOff();
    return;
  } else if (a == "test") {
    pushTest();
    return;
  } else if (a == "reset") {
    if (confirm("Erase all progress and settings?"))
      pushOff().finally(() => {
        localStorage.removeItem("ss");
        location.reload();
      });
    return;
  }
  save();
  render();
  pushSync();
});

document.addEventListener("change", (e) => {
  const f = e.target.dataset.f;
  if (!f) return;
  const v = e.target.type == "checkbox" ? +e.target.checked : e.target.value;
  if (f == "goal") st.goal = Math.max(1, +v || 8);
  else if (f == "snd") st.snd = v;
  else if (f == "level") {
    st.level = +v;
    st.lvStart = td();
  } else st.rem[f] = f == "wt" ? v : +v;
  save();
  if (f == "level" || f == "goal") render();
  pushSync();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) pushSync();
});

render();
pushSync();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");

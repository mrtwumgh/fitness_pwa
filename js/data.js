// The training content: exercises, levels, easier swaps, warm-up and cool-down.
// Edit this file to change the program. Nothing else needs to change.

/**
 * Every exercise the program uses.
 *   unit:   'reps' or 'seconds' (seconds get a hold timer)
 *   per:    extra label after the dose, e.g. 'per side'
 *   neck:   true = only on neck days (Mon, Wed, Fri)
 *   search: YouTube search text; defaults to "<name> beginner form"
 */
export const EXERCISES = {
  wallPushUp: {
    name: 'Wall push-up', unit: 'reps',
    cue: 'Hands on a wall at shoulder height, body straight. Bend your elbows (about 45° from your body) to bring your chest to the wall, then push back.',
  },
  inclinePushUp: {
    name: 'Incline push-up', unit: 'reps',
    cue: 'Hands on a sturdy table, body straight. Lower your chest to the edge with elbows about 45°, then press up.',
  },
  kneePushUp: {
    name: 'Knee push-up', unit: 'reps',
    cue: 'Hands under shoulders, knees down, body straight from head to knees. Lower your chest, then press up.',
  },
  pushUp: {
    name: 'Push-up', unit: 'reps',
    cue: 'Hands slightly wider than shoulders, body straight from head to heels. Lower your chest with elbows about 45°, press up without sagging your hips.',
  },
  pikePushUp: {
    name: 'Pike push-up', unit: 'reps',
    cue: 'Hips high in an upside-down V. Bend your elbows to lower your head toward the floor between your hands, then press up.',
  },
  chairDip: {
    name: 'Chair dip', unit: 'reps', search: 'bench dips beginner form',
    cue: 'Hands on the edge of a sturdy chair placed against a wall, knees bent. Lower your elbows straight back only as deep as is comfortable, then press up.',
  },
  backpackRow: {
    name: 'Backpack row', unit: 'reps', search: 'backpack bent over row form',
    cue: 'Hold a loaded backpack, hinge at the hips with a flat back. Pull the bag to your lower ribs, squeeze your shoulder blades, lower slowly. Start light.',
  },
  superman: {
    name: 'Superman', unit: 'reps',
    cue: 'Lie face down, arms forward. Lift arms and legs slightly with a neutral neck, hold 2 seconds, lower.',
  },
  plank: {
    name: 'Forearm plank', unit: 'seconds',
    cue: 'Forearms down, elbows under shoulders, body straight from head to heels, stomach tight, hips not sagging.',
  },
  deadBug: {
    name: 'Dead bug', unit: 'reps', per: 'per side',
    cue: 'On your back, arms up, knees bent 90° over your hips. Lower the opposite arm and leg with your lower back pressed down, then switch.',
  },
  birdDog: {
    name: 'Bird dog', unit: 'reps', per: 'per side',
    cue: 'On hands and knees, extend the opposite arm and leg with level hips, hold 2 seconds, switch.',
  },
  chairSquat: {
    name: 'Chair squat', unit: 'reps',
    cue: 'Feet shoulder-width in front of a chair. Push your hips back and bend your knees until you lightly touch the seat, then stand through your heels.',
  },
  squat: {
    name: 'Squat', unit: 'reps',
    cue: 'Feet shoulder-width, hips back, chest up, knees over toes. Lower to about parallel, then stand.',
  },
  reverseLunge: {
    name: 'Reverse lunge', unit: 'reps', per: 'per side',
    cue: 'Step one foot back and lower until both knees are about 90°. Push through the front heel and alternate legs. Hold a wall if needed.',
  },
  gluteBridge: {
    name: 'Glute bridge', unit: 'reps',
    cue: 'On your back, knees bent. Lift your hips, squeezing your glutes, until shoulders to knees is a straight line. Pause 1 second, lower slowly.',
  },
  calfRaise: {
    name: 'Calf raise', unit: 'reps',
    cue: 'Hold a wall, rise onto your toes, lower slowly.',
  },
  neckIsometrics: {
    name: 'Neck isometrics', unit: 'seconds', per: 'per direction', neck: true,
    search: 'neck isometric exercises physiotherapist',
    cue: 'Sit tall. Press your palm against your forehead, then each side of your head, then the back of your head. Your head must not move. Push gently and hold. One round = all 4 directions. Go gently, never jerk, stop if you feel pain or dizziness.',
  },
  chinTuck: {
    name: 'Chin tuck', unit: 'reps', neck: true, search: 'chin tucks physiotherapist',
    cue: 'Sit tall looking ahead. Draw your chin straight back without tilting your head, hold 5 seconds.',
  },
};

/**
 * Levels 1 to 6. Each entry is [exercise, sets, reps or seconds].
 * Levels 7 and up are generated from level 6 (see levelPlan in plan.js).
 */
export const LEVELS = [
  [['wallPushUp', 1, 8], ['chairSquat', 1, 8], ['neckIsometrics', 1, 5]],
  [['wallPushUp', 2, 8], ['chairSquat', 2, 8], ['plank', 1, 10], ['gluteBridge', 1, 8], ['neckIsometrics', 2, 5]],
  [['inclinePushUp', 2, 6], ['chairSquat', 2, 10], ['backpackRow', 2, 8], ['plank', 2, 15], ['gluteBridge', 2, 10],
   ['neckIsometrics', 2, 8], ['chinTuck', 1, 5]],
  [['inclinePushUp', 2, 10], ['squat', 2, 8], ['backpackRow', 2, 10], ['chairDip', 1, 6], ['deadBug', 2, 6], ['plank', 2, 20],
   ['gluteBridge', 2, 12], ['neckIsometrics', 3, 8], ['chinTuck', 2, 5]],
  [['kneePushUp', 3, 8], ['squat', 3, 10], ['reverseLunge', 2, 6], ['backpackRow', 3, 10], ['chairDip', 2, 8], ['superman', 2, 8],
   ['deadBug', 2, 8], ['birdDog', 2, 6], ['plank', 3, 20], ['calfRaise', 2, 12], ['neckIsometrics', 3, 10], ['chinTuck', 2, 8]],
  [['pushUp', 3, 8], ['pikePushUp', 2, 6], ['squat', 3, 12], ['reverseLunge', 3, 8], ['backpackRow', 3, 12], ['chairDip', 3, 10],
   ['superman', 3, 10], ['deadBug', 3, 10], ['birdDog', 3, 8], ['plank', 3, 30], ['gluteBridge', 3, 15], ['calfRaise', 3, 15],
   ['neckIsometrics', 3, 10], ['chinTuck', 3, 10]],
];

/** "Too hard today" swaps. Exercises not listed here get a lighter dose instead. */
export const EASIER = {
  pushUp: 'kneePushUp',
  kneePushUp: 'inclinePushUp',
  inclinePushUp: 'wallPushUp',
  pikePushUp: 'inclinePushUp',
  squat: 'chairSquat',
  reverseLunge: 'chairSquat',
};

/** Guided routines: each step is { name, seconds, cue }. */
export const WARMUP = [
  { name: 'March in place', seconds: 30, cue: 'Lift your knees toward hip height and swing your arms.' },
  { name: 'Arm circles', seconds: 30, cue: 'Start small and grow bigger. Switch direction halfway.' },
  { name: 'Shoulder rolls', seconds: 15, cue: 'Roll your shoulders up, back and down, slowly.' },
  { name: 'Hip circles', seconds: 15, cue: 'Hands on hips, circle slowly. Switch direction halfway.' },
];

export const COOLDOWN = [
  { name: 'Chest stretch', seconds: 30, cue: 'Forearm on a door frame, step through gently until you feel it across your chest. Switch sides halfway.' },
  { name: 'Shoulder stretch', seconds: 30, cue: 'Pull one arm across your chest with the other. Switch sides halfway.' },
  { name: 'Neck side tilt', seconds: 30, cue: 'Tilt one ear toward your shoulder without pulling with your hand. Switch sides halfway.' },
  { name: 'Quad stretch', seconds: 30, cue: 'Hold a wall and pull one heel toward your bottom. Switch sides halfway.' },
  { name: "Child's pose", seconds: 30, cue: 'Kneel, sit back on your heels and reach your arms forward on the floor. Breathe slowly.' },
];

/** Effort ratings offered after each completed session. */
export const FEELINGS = [
  ['easy', 'Easy'],
  ['right', 'About right'],
  ['hard', 'Hard'],
];

export const EXERCISE_VIDEO_MAP = {
  squat: 'ultWZbUMPL8',
  'barbell squats': 'SW_C1A-rejs',
  pushup: 'IODxDxX7oi4',
  'push-ups': 'IODxDxX7oi4',
  plank: 'pSHjTRCQxIw',
  lunge: 'QOVaHwm-Q6U',
  'bicep curls': 'ykJmrZ5v0Oo',
  'dumbbell chest press': 'VmB1G1K7v94',
  'shoulder press': 'B-aVuyhvLHU',
  'tricep dips': '0326dy_-CzM',
  'triceps dips': '0326dy_-CzM',
  'lat pulldown': 'CAwf7n6Luuc',
  'seated cable row': 'HJSVR_67OlM',
  'dumbbell shrugs': 'cJRVVxmytaM',
  'leg press': 'IZxyjW7MPJQ',
  'calf raises': 'YMmgqO8Jo-k',
  'jumping jacks': 'c4DAnQ6DtF8',
  'high knees': '8opcQdC-V-U',
  burpees: 'TU8QYVW0gDU',
  'mountain climbers': 'nmwgirgXLYM',
  deadlift: 'op9kVnSso6Q',
  crunches: 'Xyd_fa5zoEU',
  'leg raises': 'JB2oyawG9KI',
  'full body stretch': 'qULTwquOuT4',
  'plank hold': 'pSHjTRCQxIw',
  'romanian deadlift': 'JCXUYuzwNrM',
  'glute bridge': 'wPM8icPu6H8',
  jacks: 'c4DAnQ6DtF8',
  curl: 'ykJmrZ5v0Oo',
};

export const EXERCISE_ID_MAP = {
  squat: 'squat',
  'barbell squats': 'squat',
  pushup: 'pushup',
  'push-ups': 'pushup',
  plank: 'plank',
  lunge: 'lunge',
  'lunges': 'lunge',
  curl: 'curl',
  'bicep curls': 'curl',
  'dumbbell chest press': 'pushup',
  'shoulder press': 'pushup',
  'tricep dips': 'pushup',
  'triceps dips': 'pushup',
  'lat pulldown': 'curl',
  'seated cable row': 'curl',
  'dumbbell shrugs': 'curl',
  'leg press': 'squat',
  'calf raises': 'lunge',
  'jumping jacks': 'jacks',
  'high knees': 'jacks',
  burpees: 'jacks',
  'mountain climbers': 'plank',
  deadlift: 'squat',
  crunches: 'plank',
  'leg raises': 'plank',
  'full body stretch': 'stretch',
  'plank hold': 'plank',
  'romanian deadlift': 'squat',
  'glute bridge': 'lunge',
  jacks: 'jacks',
  stretch: 'stretch',
};

export function getExerciseVideoId(exercise) {
  if (!exercise) return null;
  const byId = (exercise.id || '').toLowerCase();
  const byName = (exercise.name || '').toLowerCase();
  return EXERCISE_VIDEO_MAP[byId] || EXERCISE_VIDEO_MAP[byName] || null;
}

export function getExerciseResolvedId(exercise) {
  if (!exercise) return 'squat';
  const byId = (exercise.id || '').toLowerCase();
  const byName = (exercise.name || '').toLowerCase();
  return EXERCISE_ID_MAP[byId] || EXERCISE_ID_MAP[byName] || 'squat';
}

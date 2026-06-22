// Rule-Based AI Plan Generator
// MCQ answers ke basis pe personalized plan generate karta hai

const EXERCISE_LIBRARY = {
  weight_loss: {
    beginner: {
      exercises: ['squat', 'pushup', 'plank', 'lunge'],
      sets: 2, reps: 10, restDays: [2, 4, 6, 7],
    },
    intermediate: {
      exercises: ['squat', 'pushup', 'plank', 'lunge', 'curl'],
      sets: 3, reps: 12, restDays: [3, 6, 7],
    },
    advanced: {
      exercises: ['squat', 'pushup', 'plank', 'lunge', 'curl'],
      sets: 4, reps: 15, restDays: [4, 7],
    },
  },
  muscle_gain: {
    beginner: {
      exercises: ['pushup', 'curl', 'squat'],
      sets: 3, reps: 8, restDays: [2, 4, 6, 7],
    },
    intermediate: {
      exercises: ['pushup', 'curl', 'squat', 'lunge'],
      sets: 4, reps: 10, restDays: [3, 6, 7],
    },
    advanced: {
      exercises: ['pushup', 'curl', 'squat', 'lunge', 'plank'],
      sets: 5, reps: 12, restDays: [4, 7],
    },
  },
  stay_fit: {
    beginner: {
      exercises: ['squat', 'plank', 'pushup'],
      sets: 2, reps: 10, restDays: [2, 4, 6, 7],
    },
    intermediate: {
      exercises: ['squat', 'plank', 'pushup', 'lunge'],
      sets: 3, reps: 12, restDays: [3, 6, 7],
    },
    advanced: {
      exercises: ['squat', 'plank', 'pushup', 'lunge', 'curl'],
      sets: 3, reps: 15, restDays: [4, 7],
    },
  },
  rehabilitation: {
    beginner: {
      exercises: ['plank', 'squat'],
      sets: 2, reps: 8, restDays: [2, 3, 5, 6, 7],
    },
    intermediate: {
      exercises: ['plank', 'squat', 'curl'],
      sets: 2, reps: 10, restDays: [2, 4, 6, 7],
    },
    advanced: {
      exercises: ['plank', 'squat', 'curl', 'lunge'],
      sets: 3, reps: 10, restDays: [3, 6, 7],
    },
  },
};

// Health issue filters — unsafe exercises hata do
const HEALTH_FILTERS = {
  knee: ['lunge', 'squat'],        // Ghutne me dard — ye avoid karein (modify honge)
  back: ['squat', 'lunge'],        // Kamar dard — careful
  shoulder: ['pushup'],             // Kandha — push-up avoid
  none: [],
};

const DIET_MACROS = {
  weight_loss: { calories: 1800, protein: '150g', carbs: '150g', fat: '60g' },
  muscle_gain: { calories: 2800, protein: '200g', carbs: '300g', fat: '80g' },
  stay_fit: { calories: 2200, protein: '160g', carbs: '220g', fat: '70g' },
  rehabilitation: { calories: 2000, protein: '140g', carbs: '200g', fat: '65g' },
};

const TIME_ADJUSTMENTS = {
  '15min': { sets: -1, reps: -2 },
  '30min': { sets: 0, reps: 0 },
  '60min': { sets: 1, reps: 3 },
};

export function generatePlan(answers) {
  const { goal = 'stay_fit', level = 'beginner', body_type, time = '30min', health_issue = 'none' } = answers;

  const baseConfig = EXERCISE_LIBRARY[goal]?.[level] || EXERCISE_LIBRARY.stay_fit.beginner;
  const timeAdj = TIME_ADJUSTMENTS[time] || { sets: 0, reps: 0 };
  const avoidExercises = HEALTH_FILTERS[health_issue] || [];

  const finalSets = Math.max(1, baseConfig.sets + timeAdj.sets);
  const finalReps = Math.max(5, baseConfig.reps + timeAdj.reps);
  const safeExercises = baseConfig.exercises.filter(ex => !avoidExercises.includes(ex));

  const todayExercises = safeExercises.slice(0, Math.min(4, safeExercises.length)).map(ex => ({
    id: ex,
    sets: finalSets,
    reps: finalReps,
  }));

  const macros = DIET_MACROS[goal] || DIET_MACROS.stay_fit;

  // Body type adjustments
  if (body_type === 'endomorph') {
    macros.calories = Math.round(macros.calories * 0.9);
    macros.carbs = `${Math.round(parseInt(macros.carbs) * 0.8)}g`;
  } else if (body_type === 'ectomorph') {
    macros.calories = Math.round(macros.calories * 1.1);
    macros.protein = `${Math.round(parseInt(macros.protein) * 1.1)}g`;
  }

  return {
    goal,
    level,
    body_type,
    time,
    health_issue,
    todayExercises,
    weeklyExercises: safeExercises,
    sets: finalSets,
    reps: finalReps,
    restDays: baseConfig.restDays,
    diet: macros,
    generatedAt: new Date().toISOString(),
    message: generateMessage(goal, level, health_issue),
  };
}

function generateMessage(goal, level, healthIssue) {
  const messages = {
    weight_loss: 'Aapka plan fat burn ke liye design kiya gaya hai. Cardio elements include hain.',
    muscle_gain: 'Aapka plan muscle building ke liye optimize kiya gaya hai. High protein diet zaruri hai.',
    stay_fit: 'Balanced plan jo aapko fit aur healthy rakhega.',
    rehabilitation: 'Safe recovery plan jo dheere dheere strength build karega.',
  };

  const healthNote = healthIssue !== 'none'
    ? ` ${healthIssue === 'knee' ? 'Knee-safe exercises select ki gayi hain.' : healthIssue === 'back' ? 'Back-friendly modifications include hain.' : 'Shoulder-safe exercises hain.'}`
    : '';

  return (messages[goal] || messages.stay_fit) + healthNote;
}

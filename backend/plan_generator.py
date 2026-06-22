"""
AI Plan Generator — Gemini 2.0 Flash + Rule-Based Fallback
MCQ answers ke basis pe personalized exercise + diet plan generate karta hai
Primary: Google Gemini API (rich, intelligent plans)
Fallback: Rule-based logic (agar internet na ho)
"""

import json
import re
import os
import google.generativeai as genai

# ─── GEMINI CONFIG ────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)

# Best available model — latest se pehle try karta hai
GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
]
gemini_model = genai.GenerativeModel(GEMINI_MODELS[0])

# ─── FALLBACK DATA ────────────────────────────────────────────────────────────

EXERCISE_LIBRARY = {
    'weight_loss': {
        'beginner':     {'exercises': ['squat', 'pushup', 'plank'],                      'sets': 2, 'reps': 10},
        'intermediate': {'exercises': ['squat', 'pushup', 'plank', 'lunge'],             'sets': 3, 'reps': 12},
        'advanced':     {'exercises': ['squat', 'pushup', 'plank', 'lunge', 'curl'],     'sets': 4, 'reps': 15},
    },
    'muscle_gain': {
        'beginner':     {'exercises': ['pushup', 'curl', 'squat'],                       'sets': 3, 'reps': 8},
        'intermediate': {'exercises': ['pushup', 'curl', 'squat', 'lunge'],              'sets': 4, 'reps': 10},
        'advanced':     {'exercises': ['pushup', 'curl', 'squat', 'lunge', 'plank'],     'sets': 5, 'reps': 12},
    },
    'stay_fit': {
        'beginner':     {'exercises': ['squat', 'plank', 'pushup'],                      'sets': 2, 'reps': 10},
        'intermediate': {'exercises': ['squat', 'plank', 'pushup', 'lunge'],             'sets': 3, 'reps': 12},
        'advanced':     {'exercises': ['squat', 'plank', 'pushup', 'lunge', 'curl'],     'sets': 3, 'reps': 15},
    },
    'rehabilitation': {
        'beginner':     {'exercises': ['plank', 'squat'],                                'sets': 1, 'reps': 8},
        'intermediate': {'exercises': ['plank', 'squat', 'curl'],                        'sets': 2, 'reps': 10},
        'advanced':     {'exercises': ['plank', 'squat', 'curl', 'lunge'],               'sets': 2, 'reps': 12},
    },
}

FALLBACK_DIET = {
    'weight_loss': {
        'calories': 1800, 'protein': '150g', 'carbs': '150g', 'fat': '60g',
        'breakfast': ['Oatmeal (280 cal)', '3 Egg whites (50 cal)', 'Green tea (5 cal)'],
        'lunch': ['Grilled chicken breast (220 cal)', 'Brown rice half cup (110 cal)', 'Mixed vegetables (80 cal)'],
        'snack': ['Almonds handful (160 cal)', 'Apple (80 cal)'],
        'dinner': ['Dal lentils (230 cal)', 'Roti 2 small (140 cal)', 'Salad (50 cal)'],
        'tips': ['Drink enough water', 'Limit sugary foods', 'Keep dinner light and balanced'],
    },
    'muscle_gain': {
        'calories': 2800, 'protein': '200g', 'carbs': '300g', 'fat': '80g',
        'breakfast': ['4 Eggs (280 cal)', 'Whole wheat bread (160 cal)', 'Milk 1 glass (150 cal)', 'Banana (90 cal)'],
        'lunch': ['Chicken biryani (450 cal)', 'Raita (80 cal)'],
        'snack': ['Peanut butter toast (280 cal)', 'Protein shake (200 cal)'],
        'dinner': ['Beef or chicken curry (350 cal)', 'Rice 1 cup (200 cal)', 'Vegetables (100 cal)'],
        'tips': ['Eat every 3-4 hours', 'Include post-workout protein', 'Get full night sleep'],
    },
    'stay_fit': {
        'calories': 2200, 'protein': '160g', 'carbs': '220g', 'fat': '70g',
        'breakfast': ['Greek yogurt with fruits (200 cal)', 'Granola bar (180 cal)'],
        'lunch': ['Grilled fish (250 cal)', 'Quinoa (180 cal)', 'Salad (80 cal)'],
        'snack': ['Mixed nuts (170 cal)', 'Fruit (80 cal)'],
        'dinner': ['Daal chawal (380 cal)', 'Chicken piece (180 cal)'],
        'tips': ['Follow a balanced diet', 'Avoid ultra-processed foods'],
    },
    'rehabilitation': {
        'calories': 2000, 'protein': '140g', 'carbs': '200g', 'fat': '65g',
        'breakfast': ['Oatmeal (280 cal)', '2 Eggs (140 cal)'],
        'lunch': ['Chicken soup (200 cal)', 'Brown rice (150 cal)', 'Vegetables (100 cal)'],
        'snack': ['Banana (90 cal)', 'Milk (150 cal)'],
        'dinner': ['Fish curry (280 cal)', 'Roti 2 (140 cal)'],
        'tips': ['Use anti-inflammatory foods', 'Maintain healthy vitamin D levels'],
    },
}

HEALTH_AVOID = {
    'knee': ['lunge', 'squat'],
    'back': ['squat', 'lunge'],
    'shoulder': ['pushup'],
    'none': [],
}

TIME_ADJUSTMENTS = {
    '15min': (-1, -2),
    '30min': (0, 0),
    '60min': (+1, +3),
}

REST_PATTERNS = {
    'weight_loss':    [True, False, True, False, True, False, False],
    'muscle_gain':    [True, True, False, True, True, False, False],
    'stay_fit':       [True, False, True, False, True, False, False],
    'rehabilitation': [True, False, False, True, False, False, False],
}

# ─── MAIN FUNCTION ────────────────────────────────────────────────────────────

def generate_plan(profile: dict) -> dict:
    """
    Pehle Gemini se try karo — agar fail ho toh rule-based fallback
    """
    try:
        gemini_result = generate_plan_with_gemini(profile)
        if gemini_result:
            print("✅ Gemini plan generated successfully")
            return gemini_result
    except Exception as e:
        print(f"⚠️ Gemini failed ({e}), using fallback plan...")

    return generate_plan_fallback(profile)


# ─── GEMINI PLAN GENERATOR ────────────────────────────────────────────────────

def generate_plan_with_gemini(profile: dict) -> dict:
    """
    Gemini se intelligent plan generate karo — multiple models try karta hai
    """
    last_error = None
    for model_name in GEMINI_MODELS:
        try:
            model = genai.GenerativeModel(model_name)
            return _call_gemini_plan(model, profile)
        except Exception as e:
            print(f"  ⚠️ {model_name} failed: {e}")
            last_error = e
    raise last_error


def _call_gemini_plan(model, profile: dict) -> dict:
    """Actual Gemini API call"""
    goal = profile.get('goal', 'stay_fit')
    level = profile.get('level', 'beginner')
    body_type = profile.get('body_type', 'mesomorph')
    time_pref = profile.get('time', '30min')
    health_issue = profile.get('health_issue', 'none')

    avoid = HEALTH_AVOID.get(health_issue, [])
    supported_exercises = ['squat', 'pushup', 'plank', 'lunge', 'curl']
    safe_exercises = [ex for ex in supported_exercises if ex not in avoid]

    prompt = f"""
You are a certified fitness trainer and nutritionist AI. Generate a personalized fitness plan in strict JSON format.

USER PROFILE:
- Goal: {goal.replace('_', ' ').title()}
- Fitness Level: {level.title()}
- Body Type: {body_type.title()}
- Available Time: {time_pref}
- Health Issue: {health_issue.replace('_', ' ').title() if health_issue != 'none' else 'None'}

RULES:
1. Only use these exercises (IDs): {safe_exercises}
   (These are supported by our camera AI system)
2. {"AVOID these exercises due to health issue: " + str(avoid) if avoid else "No exercise restrictions"}
3. Adjust sets/reps for the fitness level and time available
4. Generate realistic Pakistani-friendly diet meals

Return ONLY valid JSON (no markdown, no explanation) in this EXACT format:
{{
  "goal": "{goal}",
  "level": "{level}",
  "body_type": "{body_type}",
  "health_issue": "{health_issue}",
  "message": "Motivational message in Urdu/English mix (1-2 sentences)",
  "ai_advice": "Personalized fitness advice based on their profile (2-3 sentences)",
  "exercises": {safe_exercises},
  "sets": <number>,
  "reps": <number>,
  "todayExercises": [
    {{"id": "squat", "sets": 3, "reps": 12, "rest_seconds": 60, "tips": "tip here"}},
    ...
  ],
  "weeklySchedule": {{
    "Monday": [{{"id": "squat", "sets": 3, "reps": 12}}],
    "Tuesday": "Rest",
    "Wednesday": [{{"id": "pushup", "sets": 3, "reps": 10}}],
    "Thursday": "Rest",
    "Friday": [{{"id": "plank", "sets": 3, "reps": 10}}],
    "Saturday": "Rest",
    "Sunday": "Rest"
  }},
  "diet": {{
    "calories": <number>,
    "protein": "<Xg>",
    "carbs": "<Xg>",
    "fat": "<Xg>",
    "breakfast": ["food item (cal)", "..."],
    "lunch": ["food item (cal)", "..."],
    "snack": ["food item (cal)", "..."],
    "dinner": ["food item (cal)", "..."],
    "tips": ["diet tip 1", "diet tip 2", "diet tip 3"],
    "water_intake": "X liters per day"
  }},
  "weekly_tips": ["tip for week 1", "tip for week 2", "tip for week 3"]
}}
"""

    response = model.generate_content(prompt)
    raw = response.text.strip()

    raw = re.sub(r'^```json\s*', '', raw)
    raw = re.sub(r'^```\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)
    raw = raw.strip()

    parsed = json.loads(raw)
    parsed['generated_by'] = 'gemini-2.0-flash'
    return parsed


# ─── FALLBACK PLAN GENERATOR ──────────────────────────────────────────────────

def generate_plan_fallback(profile: dict) -> dict:
    """Rule-based fallback jab Gemini available na ho"""
    goal = profile.get('goal', 'stay_fit')
    level = profile.get('level', 'beginner')
    body_type = profile.get('body_type', 'mesomorph')
    time_pref = profile.get('time', '30min')
    health_issue = profile.get('health_issue', 'none')

    base = EXERCISE_LIBRARY.get(goal, {}).get(level, EXERCISE_LIBRARY['stay_fit']['beginner'])
    time_adj = TIME_ADJUSTMENTS.get(time_pref, (0, 0))
    final_sets = max(1, base['sets'] + time_adj[0])
    final_reps = max(5, base['reps'] + time_adj[1])

    avoid = HEALTH_AVOID.get(health_issue, [])
    safe_exercises = [ex for ex in base['exercises'] if ex not in avoid]

    diet = FALLBACK_DIET.get(goal, FALLBACK_DIET['stay_fit']).copy()
    if body_type == 'endomorph':
        diet['calories'] = int(diet['calories'] * 0.9)
    elif body_type == 'ectomorph':
        diet['calories'] = int(diet['calories'] * 1.1)

    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    pattern = REST_PATTERNS.get(goal, REST_PATTERNS['stay_fit'])
    weekly_schedule = {}
    for i, day in enumerate(days):
        if pattern[i]:
            weekly_schedule[day] = [{'id': ex, 'sets': final_sets, 'reps': final_reps} for ex in safe_exercises]
        else:
            weekly_schedule[day] = 'Rest'

    return {
        'goal': goal,
        'level': level,
        'body_type': body_type,
        'health_issue': health_issue,
        'exercises': safe_exercises,
        'sets': final_sets,
        'reps': final_reps,
        'todayExercises': [{'id': ex, 'sets': final_sets, 'reps': final_reps, 'rest_seconds': 60} for ex in safe_exercises[:3]],
        'weeklySchedule': weekly_schedule,
        'diet': diet,
        'message': _build_message(goal, level, health_issue),
        'ai_advice': 'Consistent rehna zaroori hai. Pehle form seekhein, phir weight/reps barhayen.',
        'generated_by': 'rule-based-fallback',
    }


def _build_message(goal, level, health_issue):
    msgs = {
        'weight_loss': 'Aapka plan fat burn ke liye banaya gaya hai! 🔥',
        'muscle_gain': 'High protein diet ke saath ye plan muscles build karega! 💪',
        'stay_fit': 'Balanced plan jo aapko fit aur healthy rakhega! ✨',
        'rehabilitation': 'Safe recovery plan — dheere dheere progress karain! 🌱',
    }
    health_note = {
        'knee': ' Knee-safe exercises select ki gayi hain.',
        'back': ' Back-friendly modifications hain.',
        'shoulder': ' Shoulder-safe exercises hain.',
        'none': '',
    }
    return msgs.get(goal, '') + health_note.get(health_issue, '')

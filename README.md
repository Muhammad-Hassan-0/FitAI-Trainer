# Gym Trainer AI — Android App

**University of Lahore — Final Year Project 2025-26**
- Muhammad Hassan (70138485)
- M. Adil Nadeem (70139389)
- Muneeb Waseem (70139133)

---

## Project Structure

```
hassan project/
├── GymTrainerApp/        ← React Native (Expo) Android App
│   ├── src/
│   │   ├── screens/      ← All app screens
│   │   ├── navigation/   ← Bottom tab + stack navigation
│   │   ├── services/     ← API calls
│   │   └── utils/        ← Plan generator logic
│   ├── App.js
│   └── package.json
└── backend/              ← Python Flask API
    ├── app.py            ← Main Flask server
    ├── pose_detection.py ← MediaPipe pose analysis
    ├── plan_generator.py ← AI plan logic
    └── requirements.txt
```

---

## App Screens

| Screen | Description |
|---|---|
| Splash | Animated launch screen |
| Onboarding | 5 MCQ questions — goal, level, body type, time, health |
| Auth | Login / Register |
| Dashboard | Home — quick stats, today's plan |
| Exercise Plan | Weekly schedule by day |
| Live Exercise | **MAIN** — Camera + MediaPipe pose detection |
| Diet Plan | Personalized meals with calorie tracking |
| Progress | Charts, achievements, session history |
| Profile | User settings, stats, logout |

---

## How to Run

### Step 1: Backend (Python)
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Server will start at: `http://localhost:5000`

### Step 2: Mobile App (React Native)
```bash
cd GymTrainerApp
npm install
npx expo start --android
```

### Android Emulator Note
Backend URL in app: `http://10.0.2.2:5000/api`
Real device: Change to your PC's IP address in `src/services/api.js`

---

## AI Models Used

### Pose Detection
- **MediaPipe Pose** (Google) — 33 body landmarks, real-time, CPU-only
- Runs on backend Python server
- Sends angle + feedback to mobile app every 500ms

### Plan Generation
- **Rule-Based Logic** — offline, no internet needed
- MCQ answers → exercise + diet plan
- Health issue filters unsafe exercises automatically

---

## Features

✅ MCQ Onboarding (5 questions)
✅ AI Exercise Plan Generation
✅ Live Camera Exercise Monitoring
✅ Real-time Posture Feedback (MediaPipe)
✅ Automatic Rep Counting
✅ Joint Angle Display
✅ Voice/Vibration Alerts
✅ Personalized Diet Plan
✅ Progress Charts
✅ Achievements System
✅ Session History
✅ Admin-ready structure

---

## Supported Exercises

| Exercise | Joint Tracked | Correct Angle |
|---|---|---|
| Squats | Knee | 80-100° (bottom) |
| Push-Ups | Elbow | 80-100° (down) |
| Bicep Curls | Elbow | 30-50° (top) |
| Plank | Back/Hip | 160-180° |
| Lunges | Knee | 85-95° |

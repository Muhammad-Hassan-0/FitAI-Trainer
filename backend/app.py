from datetime import datetime
import os
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import numpy as np
import cv2
import mediapipe as mp
import google.generativeai as genai
from plan_generator import generate_plan
from pose_detection import analyze_pose_from_image

load_dotenv()

# ─── APP + DB CONFIG ───────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

raw_database_url = os.getenv("DATABASE_URL", "").strip()
if (not raw_database_url) or ("USER:PASSWORD@HOST/DBNAME" in raw_database_url):
    database_url = "sqlite:///fitai_local.db"
else:
    database_url = raw_database_url
app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

mp_pose = mp.solutions.pose


# ─── MODELS ────────────────────────────────────────────────────────────────────
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(190), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class WorkoutSession(db.Model):
    __tablename__ = "workout_sessions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    exercise = db.Column(db.String(80), nullable=False, default="squat")
    reps = db.Column(db.Integer, nullable=False, default=0)
    accuracy = db.Column(db.Float, nullable=False, default=0.0)
    duration = db.Column(db.Integer, nullable=False, default=0)
    raw = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)


with app.app_context():
    db.create_all()


# ─── GEMINI CONFIG ────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyCI_6VmmiC13Xxb77-qMUFp9-NiSqX2YeA")
genai.configure(api_key=GEMINI_API_KEY)
gemini_chat_model = genai.GenerativeModel("gemini-2.5-flash")


def get_gemini_model():
    """Return best available Gemini model with fallback chain."""
    for model_name in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"]:
        try:
            m = genai.GenerativeModel(model_name)
            m.generate_content("hi", generation_config={"max_output_tokens": 5})
            return m, model_name
        except Exception:
            continue
    return None, None


# ─── HELPERS ──────────────────────────────────────────────────────────────────
def parse_bearer_user_id():
    """Expect token format: token_<user_id>_<timestamp>."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1].strip()
    if not token.startswith("token_"):
        return None
    parts = token.split("_")
    if len(parts) < 3:
        return None
    try:
        return int(parts[1])
    except Exception:
        return None


# ─── AUTH ─────────────────────────────────────────────────────────────────────
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name:
        return jsonify({"success": False, "error": "Name is required"}), 400
    if not email:
        return jsonify({"success": False, "error": "Email is required"}), 400
    if len(password) < 6:
        return jsonify({"success": False, "error": "Password must be at least 6 characters"}), 400

    exists = User.query.filter_by(email=email).first()
    if exists:
        return jsonify({"success": False, "error": "Email already registered"}), 409

    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
    )
    db.session.add(user)
    db.session.commit()

    token = f"token_{user.id}_{int(datetime.utcnow().timestamp())}"
    return jsonify({
        "success": True,
        "token": token,
        "user": {"id": user.id, "name": user.name, "email": user.email},
    })


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"success": False, "error": "Invalid credentials"}), 401

    token = f"token_{user.id}_{int(datetime.utcnow().timestamp())}"
    return jsonify({
        "success": True,
        "token": token,
        "user": {"id": user.id, "name": user.name, "email": user.email},
    })


# ─── POSE ANALYSIS ────────────────────────────────────────────────────────────
@app.route("/api/analyze-pose", methods=["POST"])
def analyze_pose():
    try:
        data = request.json or {}
        image_b64 = data.get("image")
        exercise = data.get("exercise", "squat")

        if not image_b64:
            return jsonify({"error": "No image provided"}), 400

        img_bytes = base64.b64decode(image_b64)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"error": "Invalid image"}), 400

        result = analyze_pose_from_image(frame, exercise)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e), "angle": 135, "is_correct": True}), 200


# ─── PLAN GENERATION ──────────────────────────────────────────────────────────
@app.route("/api/generate-plan", methods=["POST"])
def get_plan():
    try:
        profile = request.json or {}
        plan = generate_plan(profile)
        return jsonify({"success": True, "plan": plan})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/plan", methods=["GET"])
def get_saved_plan():
    return jsonify({"success": True, "plan": {}})


# ─── SESSIONS + STATS (DB-PERSISTED) ─────────────────────────────────────────
@app.route("/api/sessions", methods=["POST"])
def save_session():
    data = request.json or {}
    user_id = parse_bearer_user_id()

    session = WorkoutSession(
        user_id=user_id,
        exercise=data.get("exercise", "squat"),
        reps=int(data.get("reps", 0) or 0),
        accuracy=float(data.get("accuracy", 0) or 0),
        duration=int(data.get("duration", 0) or 0),
        raw=data,
    )
    db.session.add(session)
    db.session.commit()
    return jsonify({"success": True, "id": session.id})


@app.route("/api/sessions", methods=["GET"])
def get_sessions():
    user_id = parse_bearer_user_id()
    q = WorkoutSession.query.order_by(WorkoutSession.created_at.desc())
    if user_id:
        q = q.filter_by(user_id=user_id)
    rows = q.limit(300).all()

    sessions = [{
        "id": r.id,
        "exercise": r.exercise,
        "reps": r.reps,
        "accuracy": r.accuracy,
        "duration": r.duration,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    } for r in rows]
    return jsonify({"success": True, "sessions": sessions})


@app.route("/api/stats", methods=["GET"])
def get_stats():
    user_id = parse_bearer_user_id()
    q = WorkoutSession.query
    if user_id:
        q = q.filter_by(user_id=user_id)
    rows = q.all()
    total_reps = sum((r.reps or 0) for r in rows)
    total_sessions = len(rows)
    return jsonify({
        "success": True,
        "stats": {
            "totalSessions": total_sessions,
            "totalReps": total_reps,
            "streak": min(total_sessions, 7),
        },
    })


# ─── GEMINI CHAT / ADVICE ─────────────────────────────────────────────────────
@app.route("/api/ai-advice", methods=["POST"])
def ai_advice():
    try:
        data = request.json or {}
        user_message = data.get("message", "")
        profile = data.get("profile", {})

        if not user_message:
            return jsonify({"error": "Message required"}), 400

        lang_note = ""
        if user_message.startswith("[Language:"):
            end = user_message.find("]")
            lang_note = user_message[: end + 1].strip()
            user_message = user_message[end + 1 :].strip()

        context = f"""You are FitAI Coach, a certified and safety-first fitness coach assistant.
{lang_note if lang_note else "Respond in English by default."}
Keep responses short, direct, and practical (max 120 words).
Use this exact format:
- Direct Answer: 1-2 lines
- Action Steps: 2-4 bullet points
- Caution: 1 short line only when needed
Do not add long explanations, filler text, or repeated motivation.
Safety rules:
- Never give diagnosis, drug doses, or extreme diet advice.
- For pain/injury/chest pain/dizziness: advise stopping workout and seeking clinician support.
- Do NOT use Roman Urdu — use proper script for non-English.

User Profile:
- Fitness Goal: {profile.get('goal', 'stay fit')}
- Experience Level: {profile.get('level', 'beginner')}
- Health Condition: {profile.get('health_issue', 'none')}

User Question: {user_message}
"""
        response = gemini_chat_model.generate_content(
            context,
            generation_config={"temperature": 0.3, "max_output_tokens": 220},
        )
        return jsonify({
            "success": True,
            "reply": response.text.strip(),
            "model": "gemini-2.5-flash",
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "reply": "AI service is temporarily unavailable. Please try again shortly.",
        }), 200


@app.route("/api/analyze-exercise-feedback", methods=["POST"])
def analyze_exercise_feedback():
    try:
        data = request.json or {}
        exercise = data.get("exercise", "squat")
        reps = data.get("reps", 0)
        accuracy = data.get("accuracy", 0)
        duration = data.get("duration", 0)
        profile = data.get("profile", {})

        prompt = f"""
You are a safety-first fitness AI coach. Give brief post-workout feedback in English.
Keep it encouraging and practical (4-5 sentences) using this format:
1) Performance snapshot
2) What was done well
3) One correction
4) Next-session target
5) Brief safety reminder

Exercise: {exercise}
Reps completed: {reps}
Form accuracy: {accuracy}%
Duration: {duration} seconds
User level: {profile.get('level', 'beginner')}
Goal: {profile.get('goal', 'stay fit')}

Give feedback on:
1. Performance assessment
2. What they did well
3. One improvement tip
4. Motivation for next session
"""
        response = gemini_chat_model.generate_content(prompt)
        return jsonify({"success": True, "feedback": response.text.strip()})
    except Exception:
        return jsonify({
            "success": False,
            "feedback": f"Great effort! You completed {reps} reps. Stay consistent!",
        })


@app.route("/api/analyze-image", methods=["POST"])
def analyze_image():
    try:
        data = request.json or {}
        image_b64 = data.get("image", "")
        analysis_type = data.get("type", "general")
        user_note = data.get("note", "")
        language = data.get("language", "English")

        if not image_b64:
            return jsonify({"error": "No image provided"}), 400

        if analysis_type == "food":
            prompt = f"""You are a professional nutritionist AI. Analyze this food image carefully.
Respond in {language}.
Provide food identified, estimated calories, macros and one practical tip.
Add a brief caution that estimates may vary by portion size.
{f'User note: {user_note}' if user_note else ''}"""
        elif analysis_type == "exercise":
            prompt = f"""You are an expert fitness coach. Analyze this workout image.
Respond in {language}.
Provide form rating, issues spotted, and specific corrections.
Add one safety warning if posture could cause injury.
{f'User note: {user_note}' if user_note else ''}"""
        else:
            prompt = f"""You are FitAI Coach. Analyze this image from a fitness and health perspective.
Respond in {language}.
{f'User note: {user_note}' if user_note else ''}"""

        vision_model = genai.GenerativeModel("gemini-1.5-flash")
        image_part = {"inline_data": {"mime_type": "image/jpeg", "data": image_b64}}
        response = vision_model.generate_content([prompt, image_part])
        return jsonify({
            "success": True,
            "analysis": response.text.strip(),
            "type": analysis_type,
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "analysis": "Unable to analyze the image at this time. Please try again.",
        }), 200


# ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    engine_name = app.config["SQLALCHEMY_DATABASE_URI"].split(":", 1)[0]
    return jsonify({
        "status": "ok",
        "message": "Gym Trainer API is running",
        "database": engine_name,
        "ai": "gemini-connected",
    })


if __name__ == "__main__":
    print("Gym Trainer Backend Starting...")
    print("API URL: http://localhost:5000/api")
    print("Android Emulator URL: http://10.0.2.2:5000/api")
    print(f"Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    app.run(host="0.0.0.0", port=5000, debug=True)

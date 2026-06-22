import cv2
import mediapipe as mp
import numpy as np

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

# ── Exercise config — joint triplets + angle thresholds + English feedback ──
EXERCISE_CONFIG = {
    'squat': {
        'joints': ('LEFT_HIP', 'LEFT_KNEE', 'LEFT_ANKLE'),
        'joints_alt': ('RIGHT_HIP', 'RIGHT_KNEE', 'RIGHT_ANKLE'),
        'down_angle': 90,
        'up_angle': 160,
        'feedback_down':    'Drive up — push through heels!',
        'feedback_up':      'Squat down — reach full depth!',
        'feedback_correct': 'Perfect depth! Hold it!',
        'feedback_wrong':   'Knees caving in — push them out!',
        'common_error':     'knee_cave',
    },
    'pushup': {
        'joints': ('LEFT_SHOULDER', 'LEFT_ELBOW', 'LEFT_WRIST'),
        'joints_alt': ('RIGHT_SHOULDER', 'RIGHT_ELBOW', 'RIGHT_WRIST'),
        'down_angle': 90,
        'up_angle': 160,
        'feedback_down':    'Push up — fully extend arms!',
        'feedback_up':      'Lower chest to the floor!',
        'feedback_correct': 'Great form — squeeze at the top!',
        'feedback_wrong':   'Keep your body in a straight line!',
        'common_error':     'hip_sag',
    },
    'curl': {
        'joints': ('LEFT_SHOULDER', 'LEFT_ELBOW', 'LEFT_WRIST'),
        'joints_alt': ('RIGHT_SHOULDER', 'RIGHT_ELBOW', 'RIGHT_WRIST'),
        'down_angle': 160,
        'up_angle': 40,
        'feedback_down':    'Curl up — squeeze your bicep!',
        'feedback_up':      'Lower slowly — full extension!',
        'feedback_correct': 'Perfect contraction!',
        'feedback_wrong':   'Keep elbows pinned to your sides!',
        'common_error':     'elbow_drift',
    },
    'lunge': {
        'joints': ('LEFT_HIP', 'LEFT_KNEE', 'LEFT_ANKLE'),
        'joints_alt': ('RIGHT_HIP', 'RIGHT_KNEE', 'RIGHT_ANKLE'),
        'down_angle': 90,
        'up_angle': 160,
        'feedback_down':    'Drive back up — press through heel!',
        'feedback_up':      'Step forward — lower the back knee!',
        'feedback_correct': '90° front knee — excellent!',
        'feedback_wrong':   'Front knee must stay above ankle!',
        'common_error':     'knee_forward',
    },
    'plank': {
        'joints': ('LEFT_SHOULDER', 'LEFT_HIP', 'LEFT_KNEE'),
        'joints_alt': ('RIGHT_SHOULDER', 'RIGHT_HIP', 'RIGHT_KNEE'),
        'correct_min': 160,
        'correct_max': 185,
        'feedback_correct': 'Perfect plank — hold strong!',
        'feedback_wrong':   'Hips too high or too low — level them!',
        'common_error':     'hip_position',
    },
}

LANDMARK_MAP = {
    'LEFT_SHOULDER':  mp_pose.PoseLandmark.LEFT_SHOULDER,
    'RIGHT_SHOULDER': mp_pose.PoseLandmark.RIGHT_SHOULDER,
    'LEFT_ELBOW':     mp_pose.PoseLandmark.LEFT_ELBOW,
    'RIGHT_ELBOW':    mp_pose.PoseLandmark.RIGHT_ELBOW,
    'LEFT_WRIST':     mp_pose.PoseLandmark.LEFT_WRIST,
    'RIGHT_WRIST':    mp_pose.PoseLandmark.RIGHT_WRIST,
    'LEFT_HIP':       mp_pose.PoseLandmark.LEFT_HIP,
    'RIGHT_HIP':      mp_pose.PoseLandmark.RIGHT_HIP,
    'LEFT_KNEE':      mp_pose.PoseLandmark.LEFT_KNEE,
    'RIGHT_KNEE':     mp_pose.PoseLandmark.RIGHT_KNEE,
    'LEFT_ANKLE':     mp_pose.PoseLandmark.LEFT_ANKLE,
    'RIGHT_ANKLE':    mp_pose.PoseLandmark.RIGHT_ANKLE,
    'NOSE':           mp_pose.PoseLandmark.NOSE,
    'LEFT_SHOULDER':  mp_pose.PoseLandmark.LEFT_SHOULDER,
}


def calculate_angle(a, b, c):
    """
    Calculate angle at joint b between segments b->a and b->c.
    Returns degrees (0–180).
    """
    a, b, c = np.array(a), np.array(b), np.array(c)
    ba = a - b
    bc = c - b
    cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
    cos_angle = np.clip(cos_angle, -1.0, 1.0)
    return float(np.degrees(np.arccos(cos_angle)))


def get_coords(landmarks, name):
    lm = landmarks[LANDMARK_MAP[name].value]
    return [lm.x, lm.y], lm.visibility


def average_angle(landmarks, joints_left, joints_alt):
    """Average left and right side angles for bilateral symmetry."""
    angles = []
    for joints in [joints_left, joints_alt]:
        try:
            (a, va), (b, vb), (c, vc) = [get_coords(landmarks, j) for j in joints]
            min_vis = min(va, vb, vc)
            if min_vis > 0.35:
                angles.append((calculate_angle(a, b, c), min_vis))
        except Exception:
            pass
    if not angles:
        return 135.0, 0.0
    # Weight by visibility
    total_w = sum(w for _, w in angles)
    avg = sum(a * w for a, w in angles) / total_w
    avg_vis = total_w / len(angles)
    return float(avg), float(avg_vis)


def compute_confidence(landmarks, joints):
    """Return mean landmark visibility for the exercise joints."""
    vis_scores = []
    for j in joints:
        try:
            _, v = get_coords(landmarks, j)
            vis_scores.append(v)
        except Exception:
            pass
    return round(float(np.mean(vis_scores)) * 100, 1) if vis_scores else 0.0


def analyze_pose_from_image(frame, exercise='squat'):
    """
    Core pose analysis function.
    Uses MediaPipe BlazePose (model_complexity=1, Full model).
    Returns: angle, feedback, is_correct, stage, confidence, landmarks.
    """
    config = EXERCISE_CONFIG.get(exercise, EXERCISE_CONFIG['squat'])

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # model_complexity=1 = Full BlazePose (best balance of speed + accuracy)
    # model_complexity=2 = Heavy (most accurate, slowest)
    with mp_pose.Pose(
        static_image_mode=True,
        model_complexity=1,           # Full model — accurate joint tracking
        smooth_landmarks=True,
        enable_segmentation=False,
        min_detection_confidence=0.55,
        min_tracking_confidence=0.5,
    ) as pose:
        results = pose.process(rgb)

        if not results.pose_landmarks:
            return {
                'detected': False,
                'angle': 135,
                'feedback': 'Step closer to camera — full body must be visible',
                'is_correct': False,
                'stage': 'none',
                'confidence': 0,
                'landmarks': [],
            }

        landmarks = results.pose_landmarks.landmark
        joints_primary = config.get('joints', ('LEFT_HIP', 'LEFT_KNEE', 'LEFT_ANKLE'))
        joints_alt = config.get('joints_alt', joints_primary)

        # Average angle from both sides
        angle, vis = average_angle(landmarks, joints_primary, joints_alt)

        # Confidence score (0–100)
        confidence = compute_confidence(landmarks, list(joints_primary) + list(joints_alt))

        # Extract key landmarks for frontend overlay
        all_landmarks = extract_key_landmarks(landmarks)

        # ── Stage + feedback logic ──
        if exercise == 'plank':
            correct_min = config.get('correct_min', 160)
            correct_max = config.get('correct_max', 185)
            is_correct = correct_min <= angle <= correct_max
            feedback = config['feedback_correct'] if is_correct else config['feedback_wrong']
            stage = 'hold' if is_correct else 'wrong'
        else:
            down_ang = config.get('down_angle', 90)
            up_ang   = config.get('up_angle', 160)

            if angle < down_ang:
                stage = 'down'
                feedback = config.get('feedback_down', 'Drive up!')
                is_correct = True
            elif angle > up_ang:
                stage = 'up'
                feedback = config.get('feedback_up', 'Go down!')
                is_correct = True
            else:
                stage = 'mid'
                feedback = config.get('feedback_correct', 'Good!')
                is_correct = True

        return {
            'detected': True,
            'angle': round(angle, 1),
            'feedback': feedback,
            'is_correct': is_correct,
            'stage': stage,
            'confidence': round(confidence, 1),
            'joint': joints_primary[1].lower().replace('_', ' '),
            'landmarks': all_landmarks,
        }


def extract_key_landmarks(landmarks):
    """Return normalized (0–1) coordinates for all key joints."""
    key_points = [
        'LEFT_SHOULDER', 'RIGHT_SHOULDER',
        'LEFT_ELBOW',    'RIGHT_ELBOW',
        'LEFT_WRIST',    'RIGHT_WRIST',
        'LEFT_HIP',      'RIGHT_HIP',
        'LEFT_KNEE',     'RIGHT_KNEE',
        'LEFT_ANKLE',    'RIGHT_ANKLE',
    ]
    result = {}
    for name in key_points:
        lm_idx = LANDMARK_MAP[name].value
        lm = landmarks[lm_idx]
        result[name] = {
            'x':          round(lm.x, 4),
            'y':          round(lm.y, 4),
            'z':          round(lm.z, 4),
            'visibility': round(lm.visibility, 3),
        }
    return result


def draw_pose_on_frame(frame, exercise='squat'):
    """Draw skeleton + angle overlay on frame (for debugging/preview)."""
    config = EXERCISE_CONFIG.get(exercise, EXERCISE_CONFIG['squat'])
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    with mp_pose.Pose(
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
        model_complexity=1,
    ) as pose:
        results = pose.process(rgb)

        if results.pose_landmarks:
            mp_drawing.draw_landmarks(
                frame,
                results.pose_landmarks,
                mp_pose.POSE_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(0, 255, 136), thickness=2, circle_radius=4),
                mp_drawing.DrawingSpec(color=(255, 255, 255), thickness=2),
            )

            landmarks = results.pose_landmarks.landmark
            joints = config.get('joints', ('LEFT_HIP', 'LEFT_KNEE', 'LEFT_ANKLE'))
            try:
                (a, _), (b, _), (c, _) = [get_coords(landmarks, j) for j in joints]
                angle = calculate_angle(a, b, c)

                h, w = frame.shape[:2]
                bx, by = int(b[0] * w), int(b[1] * h)
                cv2.putText(
                    frame, f'{angle:.0f}°',
                    (bx - 20, by - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8,
                    (0, 255, 136), 2,
                )
            except Exception:
                pass

    return frame

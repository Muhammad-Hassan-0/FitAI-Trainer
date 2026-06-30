import cv2
import mediapipe as mp
import numpy as np

mp_pose = mp.solutions.pose

EXERCISE_CONFIG = {
    'squat': {
        'joints': ('LEFT_HIP', 'LEFT_KNEE', 'LEFT_ANKLE'),
        'joints_alt': ('RIGHT_HIP', 'RIGHT_KNEE', 'RIGHT_ANKLE'),
        'down_enter': 110,
        'up_enter': 150,
        'inverted': False,
        'feedback_down': 'Nice depth — drive up through your heels!',
        'feedback_up': 'Squat down until thighs are parallel',
        'feedback_correct': 'Good control — keep going!',
        'common_error': 'knee_cave',
    },
    'pushup': {
        'joints': ('LEFT_SHOULDER', 'LEFT_ELBOW', 'LEFT_WRIST'),
        'joints_alt': ('RIGHT_SHOULDER', 'RIGHT_ELBOW', 'RIGHT_WRIST'),
        'down_enter': 110,
        'up_enter': 150,
        'inverted': False,
        'feedback_down': 'Push up — arms fully extended!',
        'feedback_up': 'Lower down — chest toward the floor',
        'feedback_correct': 'Strong rep — stay tight!',
        'common_error': 'hip_sag',
    },
    'curl': {
        'joints': ('LEFT_SHOULDER', 'LEFT_ELBOW', 'LEFT_WRIST'),
        'joints_alt': ('RIGHT_SHOULDER', 'RIGHT_ELBOW', 'RIGHT_WRIST'),
        'down_enter': 50,
        'up_enter': 140,
        'inverted': True,
        'feedback_down': 'Curl up — squeeze at the top!',
        'feedback_up': 'Lower with control — full extension',
        'feedback_correct': 'Good curl — keep elbows still',
        'common_error': 'elbow_drift',
    },
    'lunge': {
        'joints': ('LEFT_HIP', 'LEFT_KNEE', 'LEFT_ANKLE'),
        'joints_alt': ('RIGHT_HIP', 'RIGHT_KNEE', 'RIGHT_ANKLE'),
        'down_enter': 110,
        'up_enter': 150,
        'inverted': False,
        'feedback_down': 'Press up — front heel down!',
        'feedback_up': 'Step and lower — back knee down',
        'feedback_correct': 'Good lunge — chest tall!',
        'common_error': 'knee_forward',
    },
    'plank': {
        'joints': ('LEFT_SHOULDER', 'LEFT_HIP', 'LEFT_KNEE'),
        'joints_alt': ('RIGHT_SHOULDER', 'RIGHT_HIP', 'RIGHT_KNEE'),
        'correct_min': 155,
        'correct_max': 190,
        'feedback_correct': 'Perfect plank — hold steady!',
        'feedback_wrong': 'Level your hips — straight line head to heels',
        'common_error': 'hip_position',
    },
}

LANDMARK_MAP = {
    'LEFT_SHOULDER': mp_pose.PoseLandmark.LEFT_SHOULDER,
    'RIGHT_SHOULDER': mp_pose.PoseLandmark.RIGHT_SHOULDER,
    'LEFT_ELBOW': mp_pose.PoseLandmark.LEFT_ELBOW,
    'RIGHT_ELBOW': mp_pose.PoseLandmark.RIGHT_ELBOW,
    'LEFT_WRIST': mp_pose.PoseLandmark.LEFT_WRIST,
    'RIGHT_WRIST': mp_pose.PoseLandmark.RIGHT_WRIST,
    'LEFT_HIP': mp_pose.PoseLandmark.LEFT_HIP,
    'RIGHT_HIP': mp_pose.PoseLandmark.RIGHT_HIP,
    'LEFT_KNEE': mp_pose.PoseLandmark.LEFT_KNEE,
    'RIGHT_KNEE': mp_pose.PoseLandmark.RIGHT_KNEE,
    'LEFT_ANKLE': mp_pose.PoseLandmark.LEFT_ANKLE,
    'RIGHT_ANKLE': mp_pose.PoseLandmark.RIGHT_ANKLE,
    'NOSE': mp_pose.PoseLandmark.NOSE,
}

_pose_instance = None


def _get_pose():
    global _pose_instance
    if _pose_instance is None:
        _pose_instance = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            enable_segmentation=False,
            min_detection_confidence=0.45,
            min_tracking_confidence=0.45,
        )
    return _pose_instance


def calculate_angle(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    ba, bc = a - b, c - b
    cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
    return float(np.degrees(np.arccos(np.clip(cos_angle, -1.0, 1.0))))


def get_coords(landmarks, name):
    lm = landmarks[LANDMARK_MAP[name].value]
    return [lm.x, lm.y], lm.visibility


def average_angle(landmarks, joints_left, joints_alt):
    angles = []
    for joints in (joints_left, joints_alt):
        try:
            pts = [get_coords(landmarks, j) for j in joints]
            min_vis = min(p[1] for p in pts)
            if min_vis > 0.3:
                angles.append((calculate_angle(pts[0][0], pts[1][0], pts[2][0]), min_vis))
        except Exception:
            pass
    if not angles:
        return 135.0, 0.0
    total_w = sum(w for _, w in angles)
    return sum(a * w for a, w in angles) / total_w, total_w / len(angles)


def compute_confidence(landmarks, joints):
    vis_scores = []
    for j in joints:
        try:
            vis_scores.append(get_coords(landmarks, j)[1])
        except Exception:
            pass
    return round(float(np.mean(vis_scores)) * 100, 1) if vis_scores else 0.0


def _safe_coords(landmarks, name, min_vis=0.28):
    try:
        pt, vis = get_coords(landmarks, name)
        if vis >= min_vis:
            return pt
    except Exception:
        pass
    return None


def _midpoint(a, b):
    if a and b:
        return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    return a or b


def detect_form_issues(landmarks, exercise, angle, vis, position):
    """Return (errors, warnings) — errors = no depth; warnings = form tips."""
    errors = []
    warnings = []

    if vis < 0.32:
        warnings.append({
            'code': 'low_visibility',
            'message': 'Move back slightly — keep your full body in frame',
        })
        return errors, warnings

    at_bottom = position == 'bottom'

    if exercise == 'squat':
        lk, rk = _safe_coords(landmarks, 'LEFT_KNEE'), _safe_coords(landmarks, 'RIGHT_KNEE')
        la, ra = _safe_coords(landmarks, 'LEFT_ANKLE'), _safe_coords(landmarks, 'RIGHT_ANKLE')
        lh, rh = _safe_coords(landmarks, 'LEFT_HIP'), _safe_coords(landmarks, 'RIGHT_HIP')
        nose = _safe_coords(landmarks, 'NOSE')

        if at_bottom:
            if lk and rk and la and ra:
                knee_w = abs(lk[0] - rk[0])
                ankle_w = abs(la[0] - ra[0])
                if ankle_w > 0.04 and knee_w < ankle_w * 0.78:
                    warnings.append({
                        'code': 'knee_cave',
                        'message': 'Push knees out — line them with your toes',
                    })
            if lh and rh and nose:
                hip_x = (lh[0] + rh[0]) / 2
                if abs(nose[0] - hip_x) > 0.14:
                    warnings.append({
                        'code': 'torso_lean',
                        'message': 'Chest up — keep your back straighter',
                    })
            if angle > 118:
                errors.append({
                    'code': 'shallow_squat',
                    'message': 'Go lower — hips should reach knee level',
                })

    elif exercise == 'pushup':
        ls, rs = _safe_coords(landmarks, 'LEFT_SHOULDER'), _safe_coords(landmarks, 'RIGHT_SHOULDER')
        lh, rh = _safe_coords(landmarks, 'LEFT_HIP'), _safe_coords(landmarks, 'RIGHT_HIP')
        lk = _safe_coords(landmarks, 'LEFT_KNEE')

        if ls and lh and lk:
            shoulder = _midpoint(ls, rs)
            hip = _midpoint(lh, rh)
            back_angle = calculate_angle(shoulder, hip, lk)
            if back_angle < 150:
                warnings.append({
                    'code': 'hip_sag',
                    'message': 'Tighten core — hips sagging slightly',
                })
            elif back_angle > 178:
                warnings.append({
                    'code': 'hip_pike',
                    'message': 'Lower hips — body should be one straight line',
                })

        if at_bottom and angle > 118:
            errors.append({
                'code': 'shallow_pushup',
                'message': 'Lower more — chest closer to the floor',
            })

    elif exercise == 'curl':
        le, re = _safe_coords(landmarks, 'LEFT_ELBOW'), _safe_coords(landmarks, 'RIGHT_ELBOW')
        ls, rs = _safe_coords(landmarks, 'LEFT_SHOULDER'), _safe_coords(landmarks, 'RIGHT_SHOULDER')

        if le and ls:
            shoulder = _midpoint(ls, rs)
            elbow = _midpoint(le, re)
            if shoulder and elbow and abs(elbow[0] - shoulder[0]) > 0.1:
                warnings.append({
                    'code': 'elbow_drift',
                    'message': 'Keep elbows close to your sides',
                })

        if at_bottom and angle > 60:
            errors.append({
                'code': 'incomplete_curl',
                'message': 'Curl higher — squeeze at the top',
            })

    elif exercise == 'lunge':
        lk, rk = _safe_coords(landmarks, 'LEFT_KNEE'), _safe_coords(landmarks, 'RIGHT_KNEE')
        la, ra = _safe_coords(landmarks, 'LEFT_ANKLE'), _safe_coords(landmarks, 'RIGHT_ANKLE')

        if lk and la and rk and ra:
            front_knee, front_ankle = (lk, la) if (lk[1] - la[1]) > (rk[1] - ra[1]) else (rk, ra)
            if abs(front_knee[0] - front_ankle[0]) > 0.12:
                warnings.append({
                    'code': 'knee_forward',
                    'message': 'Front knee over ankle — take a longer step',
                })

        if at_bottom and angle > 118:
            errors.append({
                'code': 'shallow_lunge',
                'message': 'Lower more — back knee toward the floor',
            })

    elif exercise == 'plank':
        cfg = EXERCISE_CONFIG['plank']
        if angle < cfg['correct_min']:
            warnings.append({
                'code': 'hip_sag',
                'message': 'Lift hips — keep a straight line',
            })
        elif angle > cfg['correct_max']:
            warnings.append({
                'code': 'hip_pike',
                'message': 'Lower hips — level with shoulders',
            })

    return errors, warnings


def get_position(angle, config):
    inverted = config.get('inverted', False)
    down_enter = config.get('down_enter', 110)
    up_enter = config.get('up_enter', 150)

    if inverted:
        if angle <= down_enter:
            return 'bottom'
        if angle >= up_enter:
            return 'top'
        return 'mid'

    if angle <= down_enter:
        return 'bottom'
    if angle >= up_enter:
        return 'top'
    return 'mid'


def pick_feedback(config, position, errors, warnings, exercise):
    if errors:
        return errors[0]['message']
    if warnings:
        return warnings[0]['message']
    if exercise == 'plank':
        return config.get('feedback_correct', 'Hold strong!')
    if position == 'bottom':
        return config.get('feedback_down', 'Drive up!')
    if position == 'top':
        return config.get('feedback_up', 'Go down!')
    return config.get('feedback_correct', 'Good form!')


def preprocess_frame(frame, max_side=520):
    h, w = frame.shape[:2]
    if max(h, w) <= max_side:
        return frame
    scale = max_side / max(h, w)
    return cv2.resize(frame, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)


def analyze_pose_from_image(frame, exercise='squat'):
    config = EXERCISE_CONFIG.get(exercise, EXERCISE_CONFIG['squat'])
    frame = preprocess_frame(frame)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    pose = _get_pose()
    results = pose.process(rgb)

    thresholds = {
        'down_enter': config.get('down_enter', 110),
        'up_enter': config.get('up_enter', 150),
        'inverted': config.get('inverted', False),
    }

    if not results.pose_landmarks:
        return {
            'detected': False,
            'angle': 135,
            'feedback': 'Stand back — show your full body in the camera',
            'is_correct': True,
            'depth_ok': False,
            'stage': 'none',
            'position': 'none',
            'form_errors': [],
            'form_warnings': [{'code': 'no_pose', 'message': 'Body not detected — adjust your position'}],
            'confidence': 0,
            'landmarks': [],
            'thresholds': thresholds,
        }

    landmarks = results.pose_landmarks.landmark
    joints_primary = config.get('joints', ('LEFT_HIP', 'LEFT_KNEE', 'LEFT_ANKLE'))
    joints_alt = config.get('joints_alt', joints_primary)

    angle, vis = average_angle(landmarks, joints_primary, joints_alt)
    confidence = compute_confidence(landmarks, list(joints_primary) + list(joints_alt))

    if exercise == 'plank':
        position = 'hold'
        errors, warnings = detect_form_issues(landmarks, exercise, angle, vis, 'hold')
        is_correct = len(warnings) == 0
        feedback = pick_feedback(config, position, errors, warnings, exercise)
        return {
            'detected': True,
            'angle': round(angle, 1),
            'feedback': feedback,
            'is_correct': is_correct,
            'depth_ok': is_correct,
            'stage': 'hold' if is_correct else 'wrong',
            'position': position,
            'form_errors': errors,
            'form_warnings': warnings,
            'confidence': round(confidence, 1),
            'joint': joints_primary[1].lower().replace('_', ' '),
            'landmarks': extract_key_landmarks(landmarks),
            'thresholds': thresholds,
        }

    position = get_position(angle, config)
    errors, warnings = detect_form_issues(landmarks, exercise, angle, vis, position)
    depth_ok = position == 'bottom' and len(errors) == 0
    is_correct = len(errors) == 0 and len(warnings) == 0
    feedback = pick_feedback(config, position, errors, warnings, exercise)

    return {
        'detected': True,
        'angle': round(angle, 1),
        'feedback': feedback,
        'is_correct': is_correct,
        'depth_ok': depth_ok,
        'stage': position,
        'position': position,
        'form_errors': errors,
        'form_warnings': warnings,
        'confidence': round(confidence, 1),
        'joint': joints_primary[1].lower().replace('_', ' '),
        'landmarks': extract_key_landmarks(landmarks),
        'thresholds': thresholds,
    }


def extract_key_landmarks(landmarks):
    key_points = [
        'LEFT_SHOULDER', 'RIGHT_SHOULDER', 'LEFT_ELBOW', 'RIGHT_ELBOW',
        'LEFT_WRIST', 'RIGHT_WRIST', 'LEFT_HIP', 'RIGHT_HIP',
        'LEFT_KNEE', 'RIGHT_KNEE', 'LEFT_ANKLE', 'RIGHT_ANKLE',
    ]
    result = {}
    for name in key_points:
        lm = landmarks[LANDMARK_MAP[name].value]
        result[name] = {
            'x': round(lm.x, 4),
            'y': round(lm.y, 4),
            'z': round(lm.z, 4),
            'visibility': round(lm.visibility, 3),
        }
    return result

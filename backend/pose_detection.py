import cv2
import mediapipe as mp
import numpy as np

mp_pose = mp.solutions.pose

EXERCISE_CONFIG = {
    'squat': {
        'joints': ('LEFT_HIP', 'LEFT_KNEE', 'LEFT_ANKLE'),
        'joints_alt': ('RIGHT_HIP', 'RIGHT_KNEE', 'RIGHT_ANKLE'),
        'track_joints': ('LEFT_HIP', 'LEFT_KNEE', 'LEFT_ANKLE', 'RIGHT_HIP', 'RIGHT_KNEE', 'RIGHT_ANKLE'),
        'body_scope': 'full',
        'down_enter': 115,
        'up_enter': 145,
        'inverted': False,
        'min_vis': 0.22,
        'camera_hint': 'Step back 2m — show full body head to feet',
        'feedback_down': 'Drive up through your heels!',
        'feedback_up': 'Squat down — thighs parallel to floor',
        'feedback_correct': 'Good squat — keep going!',
    },
    'pushup': {
        'joints': ('LEFT_SHOULDER', 'LEFT_ELBOW', 'LEFT_WRIST'),
        'joints_alt': ('RIGHT_SHOULDER', 'RIGHT_ELBOW', 'RIGHT_WRIST'),
        'track_joints': ('LEFT_SHOULDER', 'LEFT_ELBOW', 'LEFT_WRIST', 'RIGHT_SHOULDER', 'RIGHT_ELBOW', 'RIGHT_WRIST', 'LEFT_HIP', 'RIGHT_HIP'),
        'body_scope': 'upper',
        'down_enter': 115,
        'up_enter': 145,
        'inverted': False,
        'min_vis': 0.2,
        'camera_hint': 'Side view — show shoulders, arms and hips in frame',
        'feedback_down': 'Push up — arms straight!',
        'feedback_up': 'Lower chest toward the floor',
        'feedback_correct': 'Strong push-up!',
    },
    'curl': {
        'joints': ('LEFT_SHOULDER', 'LEFT_ELBOW', 'LEFT_WRIST'),
        'joints_alt': ('RIGHT_SHOULDER', 'RIGHT_ELBOW', 'RIGHT_WRIST'),
        'track_joints': ('LEFT_SHOULDER', 'LEFT_ELBOW', 'LEFT_WRIST', 'RIGHT_SHOULDER', 'RIGHT_ELBOW', 'RIGHT_WRIST'),
        'body_scope': 'upper',
        'down_enter': 65,
        'up_enter': 130,
        'inverted': True,
        'min_vis': 0.18,
        'camera_hint': 'Show your arms — shoulders, elbows and hands in frame',
        'feedback_down': 'Curl up — squeeze bicep at top!',
        'feedback_up': 'Lower arm — full extension',
        'feedback_correct': 'Good curl!',
    },
    'lunge': {
        'joints': ('LEFT_HIP', 'LEFT_KNEE', 'LEFT_ANKLE'),
        'joints_alt': ('RIGHT_HIP', 'RIGHT_KNEE', 'RIGHT_ANKLE'),
        'track_joints': ('LEFT_HIP', 'LEFT_KNEE', 'LEFT_ANKLE', 'RIGHT_HIP', 'RIGHT_KNEE', 'RIGHT_ANKLE'),
        'body_scope': 'full',
        'down_enter': 115,
        'up_enter': 145,
        'inverted': False,
        'min_vis': 0.22,
        'camera_hint': 'Step back — show legs and hips fully',
        'feedback_down': 'Press up through front heel!',
        'feedback_up': 'Lower — back knee toward floor',
        'feedback_correct': 'Good lunge!',
    },
    'plank': {
        'joints': ('LEFT_SHOULDER', 'LEFT_HIP', 'LEFT_KNEE'),
        'joints_alt': ('RIGHT_SHOULDER', 'RIGHT_HIP', 'RIGHT_KNEE'),
        'track_joints': ('LEFT_SHOULDER', 'LEFT_HIP', 'LEFT_KNEE', 'RIGHT_SHOULDER', 'RIGHT_HIP', 'RIGHT_KNEE'),
        'body_scope': 'upper',
        'correct_min': 150,
        'correct_max': 195,
        'min_vis': 0.2,
        'camera_hint': 'Side view — show body line shoulder to feet',
        'feedback_correct': 'Hold strong — great plank!',
        'feedback_wrong': 'Level your hips — straight line',
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
            static_image_mode=True,
            model_complexity=1,
            smooth_landmarks=True,
            enable_segmentation=False,
            min_detection_confidence=0.35,
            min_tracking_confidence=0.35,
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


def best_side_angle(landmarks, joints_left, joints_alt, min_vis=0.18):
    """Pick the side with best visibility — works for single-arm / angled camera."""
    best_angle, best_vis = None, 0.0
    for joints in (joints_left, joints_alt):
        try:
            pts = [get_coords(landmarks, j) for j in joints]
            vis = min(p[1] for p in pts)
            if vis >= min_vis and vis > best_vis:
                ang = calculate_angle(pts[0][0], pts[1][0], pts[2][0])
                best_angle, best_vis = ang, vis
        except Exception:
            pass
    if best_angle is not None:
        return float(best_angle), float(best_vis)
    return None, 0.0


def compute_confidence(landmarks, joint_names):
    vis_scores = []
    for j in joint_names:
        try:
            vis_scores.append(get_coords(landmarks, j)[1])
        except Exception:
            pass
    return round(float(np.mean(vis_scores)) * 100, 1) if vis_scores else 0.0


def _safe_coords(landmarks, name, min_vis=0.18):
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


def detect_form_issues(landmarks, exercise, angle, vis, position, config):
    errors, warnings = [], []
    min_vis = config.get('min_vis', 0.2)

    if vis < min_vis:
        hint = config.get('camera_hint', 'Adjust camera position')
        warnings.append({'code': 'low_visibility', 'message': hint})
        return errors, warnings

    at_bottom = position == 'bottom'

    if exercise == 'squat' and at_bottom:
        if angle > 125:
            errors.append({'code': 'shallow_squat', 'message': 'Go lower — hips to knee level'})

    elif exercise == 'pushup':
        if at_bottom and angle > 125:
            errors.append({'code': 'shallow_pushup', 'message': 'Lower more — chest toward floor'})

    elif exercise == 'curl':
        le = _safe_coords(landmarks, 'LEFT_ELBOW', min_vis)
        re = _safe_coords(landmarks, 'RIGHT_ELBOW', min_vis)
        ls = _safe_coords(landmarks, 'LEFT_SHOULDER', min_vis)
        rs = _safe_coords(landmarks, 'RIGHT_SHOULDER', min_vis)
        if le and ls:
            shoulder, elbow = _midpoint(ls, rs), _midpoint(le, re)
            if shoulder and elbow and abs(elbow[0] - shoulder[0]) > 0.12:
                warnings.append({'code': 'elbow_drift', 'message': 'Keep elbows at your sides'})
        if at_bottom and angle > 75:
            errors.append({'code': 'incomplete_curl', 'message': 'Curl higher — squeeze at top'})

    elif exercise == 'lunge' and at_bottom:
        if angle > 125:
            errors.append({'code': 'shallow_lunge', 'message': 'Lower more — back knee down'})

    elif exercise == 'plank':
        lo, hi = config.get('correct_min', 150), config.get('correct_max', 195)
        if angle < lo:
            warnings.append({'code': 'hip_sag', 'message': 'Lift hips — straight line'})
        elif angle > hi:
            warnings.append({'code': 'hip_pike', 'message': 'Lower hips to shoulder level'})

    return errors, warnings


def get_position(angle, config):
    inverted = config.get('inverted', False)
    down_enter = config.get('down_enter', 115)
    up_enter = config.get('up_enter', 145)
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
        return config.get('feedback_correct', 'Hold!')
    if position == 'bottom':
        return config.get('feedback_down', 'Drive up!')
    if position == 'top':
        return config.get('feedback_up', 'Go down!')
    return config.get('feedback_correct', 'Good!')


def preprocess_frame(frame, max_side=640):
    h, w = frame.shape[:2]
    if max(h, w) <= max_side:
        return frame
    scale = max_side / max(h, w)
    return cv2.resize(frame, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)


def _no_pose_response(config, message=None):
    hint = message or config.get('camera_hint', 'Adjust camera — body not visible')
    return {
        'detected': False,
        'angle': None,
        'feedback': hint,
        'is_correct': False,
        'depth_ok': False,
        'stage': 'none',
        'position': 'none',
        'form_errors': [],
        'form_warnings': [{'code': 'no_pose', 'message': hint}],
        'confidence': 0,
        'landmarks': [],
        'body_scope': config.get('body_scope', 'full'),
        'camera_hint': config.get('camera_hint', ''),
        'thresholds': {
            'down_enter': config.get('down_enter', 115),
            'up_enter': config.get('up_enter', 145),
            'inverted': config.get('inverted', False),
        },
    }


def analyze_pose_from_image(frame, exercise='squat'):
    config = EXERCISE_CONFIG.get(exercise, EXERCISE_CONFIG['squat'])
    frame = preprocess_frame(frame)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = _get_pose().process(rgb)

    thresholds = {
        'down_enter': config.get('down_enter', 115),
        'up_enter': config.get('up_enter', 145),
        'inverted': config.get('inverted', False),
    }

    if not results.pose_landmarks:
        return _no_pose_response(config)

    landmarks = results.pose_landmarks.landmark
    joints_primary = config.get('joints', ('LEFT_HIP', 'LEFT_KNEE', 'LEFT_ANKLE'))
    joints_alt = config.get('joints_alt', joints_primary)
    track_joints = config.get('track_joints', list(joints_primary) + list(joints_alt))
    min_vis = config.get('min_vis', 0.2)

    angle, vis = best_side_angle(landmarks, joints_primary, joints_alt, min_vis)
    if angle is None:
        return _no_pose_response(config, config.get('camera_hint'))

    confidence = compute_confidence(landmarks, track_joints)

    if exercise == 'plank':
        position = 'hold'
        errors, warnings = detect_form_issues(landmarks, exercise, angle, vis, position, config)
        is_correct = len(errors) == 0 and len(warnings) == 0
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
            'body_scope': config.get('body_scope', 'upper'),
            'camera_hint': config.get('camera_hint', ''),
            'thresholds': thresholds,
        }

    position = get_position(angle, config)
    errors, warnings = detect_form_issues(landmarks, exercise, angle, vis, position, config)
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
        'confidence': round(max(confidence, vis * 100), 1),
        'joint': joints_primary[1].lower().replace('_', ' '),
        'landmarks': extract_key_landmarks(landmarks),
        'body_scope': config.get('body_scope', 'full'),
        'camera_hint': config.get('camera_hint', ''),
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

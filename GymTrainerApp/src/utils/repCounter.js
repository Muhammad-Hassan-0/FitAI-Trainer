/**
 * Rep counter — full ROM cycle with smoothing.
 * Curl (inverted): extended (top) → curled (bottom) → extended = 1 rep
 * Squat etc: standing (top) → down (bottom) → standing = 1 rep
 */

const DEFAULTS = {
  minRepIntervalMs: 600,
  minConfidence: 20,
  bottomFramesRequired: 1,
  angleSmoothingWindow: 3,
};

export function createRepCounter(options = {}) {
  const cfg = { ...DEFAULTS, ...options };
  const state = {
    phase: 'top',
    bottomStreak: 0,
    depthReached: false,
    bottomHadError: false,
    bottomWarnings: [],
    lastRepAt: 0,
    angles: [],
  };

  const smoothAngle = (raw) => {
    if (raw == null || Number.isNaN(raw)) return null;
    state.angles.push(raw);
    if (state.angles.length > cfg.angleSmoothingWindow) state.angles.shift();
    return state.angles.reduce((a, b) => a + b, 0) / state.angles.length;
  };

  const getPosition = (angle, thresholds) => {
    const { down_enter: d, up_enter: u, inverted } = thresholds;
    if (inverted) {
      if (angle <= d) return 'bottom';
      if (angle >= u) return 'top';
      return 'mid';
    }
    if (angle <= d) return 'bottom';
    if (angle >= u) return 'top';
    return 'mid';
  };

  const reset = () => {
    state.phase = 'top';
    state.bottomStreak = 0;
    state.depthReached = false;
    state.bottomHadError = false;
    state.bottomWarnings = [];
    state.lastRepAt = 0;
    state.angles = [];
  };

  const process = (rawAngle, poseData) => {
    const angle = smoothAngle(rawAngle);
    if (angle == null) return { event: 'none' };

    const thresholds = poseData?.thresholds || {
      down_enter: cfg.downEnter ?? 115,
      up_enter: cfg.upEnter ?? 145,
      inverted: !!cfg.inverted,
    };

    const position = poseData?.position || getPosition(angle, thresholds);
    const confidence = poseData?.confidence ?? 0;
    const errors = poseData?.form_errors || [];
    const warnings = poseData?.form_warnings || [];
    const now = Date.now();

    if (position === 'bottom') {
      state.phase = 'bottom';
      state.bottomStreak += 1;
      if (state.bottomStreak >= cfg.bottomFramesRequired) {
        state.depthReached = true;
        state.bottomHadError = errors.length > 0;
        state.bottomWarnings = [...warnings, ...errors];
      }
    } else if (position === 'top') {
      const canCount =
        state.depthReached &&
        state.phase === 'bottom' &&
        now - state.lastRepAt >= cfg.minRepIntervalMs &&
        confidence >= cfg.minConfidence;

      if (canCount) {
        if (state.bottomHadError) {
          state.depthReached = false;
          state.bottomStreak = 0;
          state.phase = 'top';
          return {
            event: 'shallow',
            quality: 'warn',
            message: state.bottomWarnings[0]?.message || 'Not enough range — rep not counted',
          };
        }
        state.lastRepAt = now;
        state.depthReached = false;
        state.bottomStreak = 0;
        state.phase = 'top';
        const hasWarnings = state.bottomWarnings.length > 0;
        return {
          event: 'rep',
          quality: hasWarnings ? 'warn' : 'good',
          message: hasWarnings ? state.bottomWarnings[0]?.message : 'Good rep!',
        };
      }
      if (!state.depthReached) {
        state.phase = 'top';
        state.bottomStreak = 0;
      }
    }

    return { event: 'none', position, angle: Math.round(angle) };
  };

  return { process, reset, getState: () => ({ ...state }) };
}

/** Per-exercise camera + rep settings */
export const EXERCISE_TRACKING = {
  squat:  { facing: 'back', inverted: false, downEnter: 115, upEnter: 145, cameraHint: 'Step back 2m — full body visible' },
  pushup: { facing: 'back', inverted: false, downEnter: 115, upEnter: 145, cameraHint: 'Side view — arms & shoulders visible' },
  curl:   { facing: 'front', inverted: true, downEnter: 65, upEnter: 130, cameraHint: 'Show arms — shoulders to hands in frame' },
  lunge:  { facing: 'back', inverted: false, downEnter: 115, upEnter: 145, cameraHint: 'Step back — legs fully visible' },
  plank:  { facing: 'side', inverted: false, downEnter: 115, upEnter: 145, cameraHint: 'Side view — full body line visible' },
};

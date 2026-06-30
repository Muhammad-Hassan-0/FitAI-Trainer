/**
 * Stable rep counter — full ROM cycle with angle smoothing & debounce.
 * Counts reps when user goes top → bottom (depth) → top.
 */

const DEFAULTS = {
  minRepIntervalMs: 700,
  minConfidence: 30,
  bottomFramesRequired: 2,
  angleSmoothingWindow: 4,
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
    if (state.angles.length > cfg.angleSmoothingWindow) {
      state.angles.shift();
    }
    const sum = state.angles.reduce((a, b) => a + b, 0);
    return sum / state.angles.length;
  };

  const getPosition = (angle, thresholds) => {
    const { down_enter: downEnter, up_enter: upEnter, inverted } = thresholds;
    if (inverted) {
      if (angle <= downEnter) return 'bottom';
      if (angle >= upEnter) return 'top';
      return 'mid';
    }
    if (angle <= downEnter) return 'bottom';
    if (angle >= upEnter) return 'top';
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

  /**
   * @returns {{ event: 'none'|'rep'|'shallow', quality: 'good'|'warn', repNumber?: number, message?: string }}
   */
  const process = (rawAngle, poseData) => {
    const angle = smoothAngle(rawAngle);
    if (angle == null) return { event: 'none' };

    const thresholds = poseData?.thresholds || {
      down_enter: cfg.downEnter ?? 110,
      up_enter: cfg.upEnter ?? 150,
      inverted: !!cfg.inverted,
    };

    const position = poseData?.position || getPosition(angle, thresholds);
    const confidence = poseData?.confidence ?? 100;
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
            message: state.bottomWarnings[0]?.message || 'Not deep enough — rep not counted',
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
          message: hasWarnings
            ? state.bottomWarnings[0]?.message
            : 'Good rep!',
        };
      }

      if (!state.depthReached) {
        state.phase = 'top';
        state.bottomStreak = 0;
      }
    }

    return { event: 'none', position, angle: Math.round(angle) };
  };

  return { process, reset, smoothAngle, getState: () => ({ ...state }) };
}

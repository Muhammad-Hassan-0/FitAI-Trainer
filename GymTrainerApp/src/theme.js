// ─────────────────────────────────────────────────────────────────────────────
// FitAI Trainer — Design System
// Brand: Athletic Black + Electric Orange (premium fitness, not AI-template)
// ─────────────────────────────────────────────────────────────────────────────

const DARK = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bg:         '#090909',   // near-pure black
  surface:    '#111111',
  surface2:   '#181818',
  surface3:   '#202020',
  border:     '#282828',
  borderHi:   '#353535',

  // ── Brand — Electric Orange ───────────────────────────────────────────────
  brand:      '#FF5C2B',   // primary action / CTA
  brandLight: '#FF7A52',
  brandDark:  '#D94010',
  brandGlow:  '#FF5C2B30',
  brandSoft:  '#FF5C2B18',

  // ── Accent Colours ────────────────────────────────────────────────────────
  lime:       '#C8FF00',   // success / active / streak
  limeLight:  '#D9FF44',
  limeDark:   '#96CC00',
  limeSoft:   '#C8FF0018',

  teal:       '#00D4AA',   // diet / nutrition
  tealSoft:   '#00D4AA18',
  blue:       '#4F8EF7',   // info / progress
  blueSoft:   '#4F8EF718',
  gold:       '#FFB800',   // achievements / rewards
  goldSoft:   '#FFB80018',
  red:        '#FF4040',   // errors / warnings
  redSoft:    '#FF404018',

  // ── Typography ────────────────────────────────────────────────────────────
  text:       '#FFFFFF',
  textSub:    '#BBBBBB',
  textMuted:  '#777777',
  textDim:    '#444444',

  // ── Utility ──────────────────────────────────────────────────────────────
  white10:    '#FFFFFF1A',
  white20:    '#FFFFFF33',
  black50:    '#00000080',
  black80:    '#000000CC',
};

const LIGHT = {
  bg:         '#F5F7FB',
  surface:    '#FFFFFF',
  surface2:   '#EEF2F8',
  surface3:   '#E7ECF5',
  border:     '#D7DEE9',
  borderHi:   '#C7D0DF',

  brand:      '#FF5C2B',
  brandLight: '#FF7A52',
  brandDark:  '#D94010',
  brandGlow:  '#FF5C2B30',
  brandSoft:  '#FF5C2B18',

  lime:       '#7FB000',
  limeLight:  '#96CC00',
  limeDark:   '#618800',
  limeSoft:   '#7FB00018',

  teal:       '#009B7B',
  tealSoft:   '#009B7B18',
  blue:       '#2E6BE6',
  blueSoft:   '#2E6BE618',
  gold:       '#C98D00',
  goldSoft:   '#C98D0018',
  red:        '#D63636',
  redSoft:    '#D6363618',

  text:       '#1D2430',
  textSub:    '#3D4656',
  textMuted:  '#697487',
  textDim:    '#9AA5B8',

  white10:    '#00000010',
  white20:    '#00000020',
  black50:    '#00000040',
  black80:    '#00000080',
};

export const C = { ...LIGHT };

export const SHADOW = {
  brand: {
    shadowColor: '#FF5C2B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  lime: {
    shadowColor: '#C8FF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const applyTheme = (darkMode = false) => {
  const palette = darkMode ? DARK : LIGHT;
  Object.keys(C).forEach((k) => { C[k] = palette[k]; });
};

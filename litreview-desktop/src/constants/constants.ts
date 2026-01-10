/**
 * LitReview Pro Constants
 * 应用程序常量定义
 */

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  GENERATION_COUNT: 'litreview_generation_count',
  POLISH_COUNT: 'litreview_polish_count',
  TOTAL_CHARACTERS: 'litreview_total_characters',
  DRAFT_PROMPT: 'litreview_draft_prompt',
  HISTORY: 'litreview_history',
} as const;

// ============================================================================
// History & Limits
// ============================================================================

export const HISTORY_MAX_ITEMS = 50;
export const TOAST_DEFAULT_DURATION = 3000;
export const AUTO_SAVE_DELAY = 1000;

// ============================================================================
// Animation Delays
// ============================================================================

export const ANIMATION_DELAY_BASE = 100;
export const STAGGER_DELAY = 100;

// ============================================================================
// Toast Durations
// ============================================================================

export const TOAST_DURATION = {
  SHORT: 2000,
  DEFAULT: 3000,
  LONG: 5000,
} as const;

// ============================================================================
// UI Constants
// ============================================================================

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// ============================================================================
// Chart Defaults
// ============================================================================

export const CHART_DEFAULTS = {
  HEIGHT: 40,
  POINTS: 7,
} as const;

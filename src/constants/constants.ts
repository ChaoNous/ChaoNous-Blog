export const PAGE_SIZE = 8;

export const LIGHT_MODE = "light",
  DARK_MODE = "dark";
export const DEFAULT_THEME = DARK_MODE;

// Page width: rem
export const PAGE_WIDTH = 90;

// ── Responsive breakpoints (px) ──
export const BP_PHONE_XS = 479; // Extra small phones
export const BP_TABLET = 768; // Tablet / phablet
export const BP_MOBILE = 1279; // Max-width for mobile behavior
export const BP_DESKTOP = 1280; // Min-width for desktop layout

// ── Runtime timing (ms) ──
export const SCROLL_THROTTLE_MS = 16; // ≈60fps
export const IDLE_FALLBACK_MS = 100;
export const TOC_CLEAR_DELAY_MS = 200;
export const NAVBAR_SCROLL_THRESHOLD = 20; // px scroll before navbar solidifies

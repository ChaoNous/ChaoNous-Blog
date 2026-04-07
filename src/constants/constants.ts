export const PAGE_SIZE = 8;

export const LIGHT_MODE: "light" = "light";
export const DARK_MODE: "dark" = "dark";
export const DEFAULT_THEME: "light" | "dark" = DARK_MODE;

// Page width: rem
export const PAGE_WIDTH: number = 90;

// Responsive breakpoints (px)
export const BP_PHONE_XS: number = 479; // Extra small phones
export const BP_TABLET: number = 768; // Tablet / phablet
export const BP_MOBILE: number = 1279; // Max-width for mobile behavior
export const BP_DESKTOP: number = 1280; // Min-width for desktop layout

// Runtime timing (ms)
export const SCROLL_THROTTLE_MS: number = 16; // ~60fps
export const IDLE_FALLBACK_MS: number = 100;
export const TOC_CLEAR_DELAY_MS: number = 200;
export const NAVBAR_SCROLL_THRESHOLD: number = 20; // px scroll before navbar solidifies

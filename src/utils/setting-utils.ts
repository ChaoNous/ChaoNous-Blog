import type { LIGHT_DARK_MODE } from "@/types/config";
import { setThemePreference } from "./theme-utils";

const UI_TO_HUE_MULTIPLIER = 1;
const DEFAULT_HUE = 10;
const HUE_STORAGE_KEY = "hue";

function parseHue(value: string | null | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function uiToHue(uiValue: number): number {
  return Math.round(uiValue * UI_TO_HUE_MULTIPLIER);
}

export function hueToUi(hue: number): number {
  return Math.round(hue / UI_TO_HUE_MULTIPLIER);
}

export function getDefaultHue(): number {
  const configCarrier = document.getElementById("config-carrier");
  if (!configCarrier) {
    return DEFAULT_HUE;
  }
  return parseHue(configCarrier.dataset.hue, DEFAULT_HUE);
}

export function getHueUI(): number {
  const stored = localStorage.getItem(HUE_STORAGE_KEY);
  const actualHue = parseHue(stored, getDefaultHue());
  return hueToUi(actualHue);
}

export function setHueUI(uiValue: number): void {
  const actualHue = uiToHue(uiValue);
  localStorage.setItem(HUE_STORAGE_KEY, String(actualHue));
  document.documentElement.style.setProperty("--hue", String(actualHue));

  document.documentElement.setAttribute("data-theme-material", "silk");
}

export function setTheme(theme: LIGHT_DARK_MODE): void {
  setThemePreference(theme);
}

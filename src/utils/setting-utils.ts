import { DARK_MODE } from "@constants/constants";
import type { LIGHT_DARK_MODE } from "@/types/config";

const UI_TO_HUE_MULTIPLIER = 1;

function uiToHue(uiValue: number): number {
  return Math.round(uiValue * UI_TO_HUE_MULTIPLIER);
}

export function hueToUi(hue: number): number {
  return Math.round(hue / UI_TO_HUE_MULTIPLIER);
}

export function getDefaultHue(): number {
  const fallback = "150";
  const configCarrier = document.getElementById("config-carrier");
  if (!configCarrier) {
    return Number.parseInt(fallback, 10);
  }
  return Number.parseInt(configCarrier.dataset.hue || fallback, 10);
}

export function getHueUI(): number {
  const stored = localStorage.getItem("hue");
  const actualHue = stored ? Number.parseInt(stored, 10) : getDefaultHue();
  return hueToUi(actualHue);
}

export function setHueUI(uiValue: number): void {
  const actualHue = uiToHue(uiValue);
  localStorage.setItem("hue", String(actualHue));
  document.documentElement.style.setProperty("--hue", String(actualHue));
}

function applyThemeToDocument(theme: LIGHT_DARK_MODE): void {
  const isDark = theme === DARK_MODE;
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "github-dark" : "github-light",
  );

  const body = document.body;
  if (body) {
    const bgColor = window.getComputedStyle(body).backgroundColor;
    document
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", bgColor);
  }
}

export function setTheme(theme: LIGHT_DARK_MODE): void {
  localStorage.setItem("theme", theme);
  applyThemeToDocument(theme);
}

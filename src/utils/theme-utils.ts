import { DARK_MODE, LIGHT_MODE } from "@constants/constants";
import type { LIGHT_DARK_MODE } from "@/types/config";

export const THEME_STORAGE_KEY = "theme";

const DARK_COLOR_SCHEME = "dark";
const LIGHT_COLOR_SCHEME = "light";
const DARK_SHIKI_THEME = "github-dark";
const LIGHT_SHIKI_THEME = "github-light";

export function isThemeMode(
	value: string | null | undefined,
): value is LIGHT_DARK_MODE {
	return value === LIGHT_MODE || value === DARK_MODE;
}

export function getStoredThemePreference(): LIGHT_DARK_MODE | null {
	const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
	return isThemeMode(storedTheme) ? storedTheme : null;
}

export function getSystemThemePreference(): LIGHT_DARK_MODE {
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? DARK_MODE
		: LIGHT_MODE;
}

export function resolveThemePreference(
	defaultTheme?: LIGHT_DARK_MODE,
): LIGHT_DARK_MODE {
	return getStoredThemePreference() ?? defaultTheme ?? getSystemThemePreference();
}

export function syncThemeMetaColor(): void {
	const body = document.body;
	if (!body) return;

	const bgColor = window.getComputedStyle(body).backgroundColor;
	document
		.querySelector("meta[name='theme-color']")
		?.setAttribute("content", bgColor);
}

export function applyThemeToDocument(theme: LIGHT_DARK_MODE): void {
	const isDark = theme === DARK_MODE;
	const root = document.documentElement;

	root.classList.toggle("dark", isDark);
	root.setAttribute("data-theme", theme);
	root.setAttribute(
		"data-color-scheme",
		isDark ? DARK_COLOR_SCHEME : LIGHT_COLOR_SCHEME,
	);
	root.setAttribute(
		"data-shiki-theme",
		isDark ? DARK_SHIKI_THEME : LIGHT_SHIKI_THEME,
	);

	syncThemeMetaColor();
}

export function setThemePreference(theme: LIGHT_DARK_MODE): void {
	localStorage.setItem(THEME_STORAGE_KEY, theme);
	applyThemeToDocument(theme);
}

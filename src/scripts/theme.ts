import { DARK_MODE, DEFAULT_THEME, LIGHT_MODE } from "@constants/constants";

declare global {
  interface Window {
    theme?: {
      themeValue: string;
      getTheme: () => string;
      setTheme: (value: string) => void;
      setPreference?: () => void;
      reflectPreference?: () => void;
    };
  }
}

const THEME_KEY = "theme";
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
const initialColorScheme = DEFAULT_THEME;

function getPreferredTheme(): string {
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme === LIGHT_MODE || storedTheme === DARK_MODE) {
    return storedTheme;
  }

  if (initialColorScheme) {
    return initialColorScheme;
  }

  return mediaQuery.matches ? DARK_MODE : LIGHT_MODE;
}

let themeValue = window.theme?.themeValue ?? getPreferredTheme();

function reflectPreference(): void {
  const isDark = themeValue === DARK_MODE;
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

function setPreference(): void {
  localStorage.setItem(THEME_KEY, themeValue);
  reflectPreference();
}

if (window.theme) {
  window.theme.setPreference = setPreference;
  window.theme.reflectPreference = reflectPreference;
  window.theme.setTheme = (value: string) => {
    themeValue = value;
    window.theme!.themeValue = value;
  };
} else {
  window.theme = {
    themeValue,
    getTheme: () => themeValue,
    setTheme: (value: string) => {
      themeValue = value;
      window.theme!.themeValue = value;
    },
    setPreference,
    reflectPreference,
  };
}

reflectPreference();

document.addEventListener("swup:page:view", () => {
  // Re-sync theme from localStorage on page navigation
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme === LIGHT_MODE || storedTheme === DARK_MODE) {
    themeValue = storedTheme;
    if (window.theme) {
      window.theme.themeValue = storedTheme;
    }
  }
  reflectPreference();
});

mediaQuery.addEventListener("change", ({ matches }) => {
  // Only auto-switch if user hasn't set a preference
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme === LIGHT_MODE || storedTheme === DARK_MODE) {
    return;
  }
  themeValue = matches ? DARK_MODE : LIGHT_MODE;
  window.theme?.setTheme(themeValue);
  setPreference();
});

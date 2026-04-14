import { DARK_MODE, LIGHT_MODE } from "@constants/constants";
import type { LIGHT_DARK_MODE } from "@/types/config";
import { applyThemeToDocument, getStoredThemePreference, resolveThemePreference, setThemePreference, } from "@utils/theme-utils";
declare global {
    interface Window {
        theme?: {
            themeValue: LIGHT_DARK_MODE;
            getTheme: () => LIGHT_DARK_MODE;
            setTheme: (value: LIGHT_DARK_MODE) => void;
            setPreference?: () => void;
            reflectPreference?: () => void;
        };
    }
}
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
let themeValue = window.theme?.themeValue ?? resolveThemePreference();
function reflectPreference(): void {
    applyThemeToDocument(themeValue);
}
function setPreference(): void {
    setThemePreference(themeValue);
}
function syncThemeValue(nextTheme: LIGHT_DARK_MODE): void {
    themeValue = nextTheme;
    if (window.theme) {
        window.theme.themeValue = nextTheme;
    }
}
if (window.theme) {
    window.theme.setPreference = setPreference;
    window.theme.reflectPreference = reflectPreference;
    window.theme.setTheme = (value: LIGHT_DARK_MODE) => {
        syncThemeValue(value);
    };
}
else {
    window.theme = {
        themeValue,
        getTheme: () => themeValue,
        setTheme: (value: LIGHT_DARK_MODE) => {
            syncThemeValue(value);
        },
        setPreference,
        reflectPreference,
    };
}
reflectPreference();
document.addEventListener("swup:page:view", () => {
    const resolvedTheme = getStoredThemePreference() ?? themeValue;
    syncThemeValue(resolvedTheme);
    reflectPreference();
});
mediaQuery.addEventListener("change", ({ matches }) => {
    if (getStoredThemePreference()) {
        return;
    }
    const systemTheme = matches ? DARK_MODE : LIGHT_MODE;
    syncThemeValue(systemTheme);
    applyThemeToDocument(systemTheme);
});

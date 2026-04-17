import { DARK_MODE, LIGHT_MODE } from "@constants/constants";
import type { LIGHT_DARK_MODE } from "@/types/config";
import {
    applyThemeToDocument,
    getStoredThemePreference,
    resolveThemePreference,
} from "@utils/theme-utils";
declare global {
    interface Window {
        theme?: {
            themeValue: LIGHT_DARK_MODE;
            setTheme: (value: LIGHT_DARK_MODE) => void;
        };
    }
}
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
let themeValue = window.theme?.themeValue ?? resolveThemePreference();
function reflectPreference(): void {
    applyThemeToDocument(themeValue);
}
function syncThemeValue(nextTheme: LIGHT_DARK_MODE): void {
    themeValue = nextTheme;
    if (window.theme) {
        window.theme.themeValue = nextTheme;
    }
}
if (window.theme) {
    window.theme.setTheme = (value: LIGHT_DARK_MODE) => {
        syncThemeValue(value);
    };
}
else {
    window.theme = {
        themeValue,
        setTheme: (value: LIGHT_DARK_MODE) => {
            syncThemeValue(value);
        },
    };
}
reflectPreference();
mediaQuery.addEventListener("change", ({ matches }) => {
    if (getStoredThemePreference()) {
        return;
    }
    const systemTheme = matches ? DARK_MODE : LIGHT_MODE;
    syncThemeValue(systemTheme);
    applyThemeToDocument(systemTheme);
});

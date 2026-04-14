import { storageKeys } from "./state.js";
export function createSessionController({ dom, setMessage, setTheme, resetSelection, }) {
    function setAuthenticated(isAuthenticated) {
        dom.loginScreen.classList.toggle("hidden", isAuthenticated);
        dom.adminApp.classList.toggle("hidden", !isAuthenticated);
    }
    function handleUnauthorized(message) {
        setAuthenticated(false);
        resetSelection();
        dom.loginPasswordInput.value = "";
        setMessage(dom.loginMessage, message || "\u4f1a\u8bdd\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55\u3002", "error");
    }
    async function tryLogin(bootstrapApp) {
        const password = dom.loginPasswordInput.value.trim();
        if (!password) {
            setMessage(dom.loginMessage, "\u8bf7\u5148\u8f93\u5165\u540e\u53f0\u5bc6\u7801\u3002", "error");
            return;
        }
        dom.loginSubmit.disabled = true;
        setMessage(dom.loginMessage, "\u6b63\u5728\u521b\u5efa\u540e\u53f0\u4f1a\u8bdd\u2026", "info");
        try {
            const response = await fetch("/api/admin/session", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "content-type": "application/json; charset=utf-8",
                    Accept: "application/json",
                },
                body: JSON.stringify({ password }),
            });
            if (!response.ok) {
                let message = "\u767b\u5f55\u5931\u8d25\u3002";
                try {
                    const payload = await response.json();
                    message = payload.message || message;
                }
                catch {
                }
                throw new Error(message);
            }
            dom.loginPasswordInput.value = "";
            setAuthenticated(true);
            await bootstrapApp();
        }
        catch (error) {
            setMessage(dom.loginMessage, error instanceof Error ? error.message : "\u767b\u5f55\u5931\u8d25\u3002", "error");
        }
        finally {
            dom.loginSubmit.disabled = false;
        }
    }
    async function logout(options) {
        try {
            await fetch("/api/admin/session", {
                method: "DELETE",
                credentials: "same-origin",
            });
        }
        catch {
        }
        resetSelection();
        dom.loginPasswordInput.value = "";
        setAuthenticated(false);
        setMessage(dom.loginMessage, options && options.expired
            ? "\u4f1a\u8bdd\u5df2\u8fc7\u671f\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55\u3002"
            : "\u5df2\u9000\u51fa\u3002", options && options.expired ? "error" : "info");
    }
    async function restoreSession(bootstrapApp) {
        const savedTheme = localStorage.getItem(storageKeys.theme) || "light";
        setTheme(savedTheme);
        try {
            const response = await fetch("/api/admin/session", {
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                },
            });
            if (!response.ok) {
                throw new Error("\u4f1a\u8bdd\u72b6\u6001\u8bfb\u53d6\u5931\u8d25\u3002");
            }
            const payload = await response.json();
            if (!payload.authenticated) {
                setAuthenticated(false);
                return;
            }
            setAuthenticated(true);
            await bootstrapApp();
        }
        catch {
            await logout({ expired: true });
        }
    }
    return {
        setAuthenticated,
        handleUnauthorized,
        tryLogin,
        logout,
        restoreSession,
    };
}

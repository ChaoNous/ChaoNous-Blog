import { storageKeys } from "./state.js";

export function createSessionController({
	state,
	dom,
	setMessage,
	setTheme,
	resetSelection,
}) {
	function setAuthenticated(isAuthenticated) {
		dom.loginScreen.classList.toggle("hidden", isAuthenticated);
		dom.adminApp.classList.toggle("hidden", !isAuthenticated);
	}

	function handleUnauthorized(message) {
		setAuthenticated(false);
		resetSelection();
		dom.loginPasswordInput.value = "";
		setMessage(
			dom.loginMessage,
			message || "????????????",
			"error",
		);
	}

	async function tryLogin(bootstrapApp) {
		const password = dom.loginPasswordInput.value.trim();
		if (!password) {
			setMessage(dom.loginMessage, "?????????", "error");
			return;
		}

		dom.loginSubmit.disabled = true;
		setMessage(dom.loginMessage, "?????????", "info");

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
				let message = "?????";
				try {
					const payload = await response.json();
					message = payload.message || message;
				} catch {
					/* ignore */
				}
				throw new Error(message);
			}

			dom.loginPasswordInput.value = "";
			setAuthenticated(true);
			await bootstrapApp();
		} catch (error) {
			setMessage(
				dom.loginMessage,
				error instanceof Error ? error.message : "?????",
				"error",
			);
		} finally {
			dom.loginSubmit.disabled = false;
		}
	}

	async function logout(options) {
		try {
			await fetch("/api/admin/session", {
				method: "DELETE",
				credentials: "same-origin",
			});
		} catch {
			/* ignore */
		}

		resetSelection();
		dom.loginPasswordInput.value = "";
		setAuthenticated(false);
		setMessage(
			dom.loginMessage,
			options && options.expired ? "????????????" : "????",
			options && options.expired ? "error" : "info",
		);
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
				throw new Error("?????????");
			}

			const payload = await response.json();
			if (!payload.authenticated) {
				setAuthenticated(false);
				return;
			}

			setAuthenticated(true);
			await bootstrapApp();
		} catch {
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

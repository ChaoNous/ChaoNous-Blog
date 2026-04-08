import { renderLoginScreen } from "./templates-login.js";
import { renderAdminApp } from "./templates-shell.js";

export function renderAdminShell() {
  return `${renderLoginScreen()}${renderAdminApp()}`;
}

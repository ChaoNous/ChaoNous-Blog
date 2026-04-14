export function syncNavbarHomeState(isHomePage: boolean): void {
    const navbar = document.getElementById("navbar");
    if (navbar) {
        navbar.setAttribute("data-is-home", isHomePage.toString());
    }
}
export function refreshNavbarTransparency(): void {
    const navbar = document.getElementById("navbar");
    if (!navbar)
        return;
    const transparentMode = navbar.getAttribute("data-transparent-mode");
    if (transparentMode === "semifull" &&
        typeof window.initSemifullScrollDetection === "function") {
        window.initSemifullScrollDetection();
    }
}
export function handleNavbarLinkClick(_scrollTop: number): void {
}

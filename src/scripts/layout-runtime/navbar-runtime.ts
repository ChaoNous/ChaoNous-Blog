export function syncNavbarHomeState(isHomePage: boolean): void {
  const navbar = document.getElementById("navbar");
  if (navbar) {
    navbar.setAttribute("data-is-home", isHomePage.toString());
  }
}

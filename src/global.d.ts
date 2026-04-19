export {};
declare global {
  interface HTMLElementTagNameMap {
    "table-of-contents": HTMLElement & {
      init?: () => void;
    };
  }
  interface Window {
    siteConfig: any;
  }
}

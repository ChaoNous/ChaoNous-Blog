export {};
declare global {
    interface HTMLElementTagNameMap {
        "table-of-contents": HTMLElement & {
            init?: () => void;
        };
    }
    interface Window {
        initSemifullScrollDetection?: () => void;
        semifullScrollHandler?: () => void;
        __mainGridRuntimeConfig?: Record<string, unknown>;
        siteConfig: any;
    }
}

export {};
declare global {
    interface HTMLElementTagNameMap {
        "table-of-contents": HTMLElement & {
            init?: () => void;
        };
    }
    interface Window {
        swup: any;
        pagefind: {
            search: (query: string) => Promise<{
                results: Array<{
                    data: () => Promise<SearchResult>;
                }>;
            }>;
        };
        initSemifullScrollDetection?: () => void;
        semifullScrollHandler?: () => void;
        __mainGridRuntimeConfig?: Record<string, unknown>;
        siteConfig: any;
    }
}
interface SearchResult {
    url: string;
    meta: {
        title: string;
    };
    excerpt: string;
}
export { SearchResult };

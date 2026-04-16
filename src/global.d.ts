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
        __pendingLayoutMode?: string;
        __mainGridRuntimeConfig?: Record<string, unknown>;
        __mainGridRuntimeHooksRegistered?: boolean;
        siteConfig: any;
        registerPageScript?: (name: string, options: {
            shouldRun?: () => boolean;
            init: () => void | (() => void) | Promise<void | (() => void)>;
        }) => () => void;
        cleanupPageScripts?: () => void;
    }
}
interface SearchResult {
    url: string;
    meta: {
        title: string;
    };
    excerpt: string;
    content?: string;
    word_count?: number;
    filters?: Record<string, unknown>;
    anchors?: Array<{
        element: string;
        id: string;
        text: string;
        location: number;
    }>;
    weighted_locations?: Array<{
        weight: number;
        balanced_score: number;
        location: number;
    }>;
    locations?: number[];
    raw_content?: string;
    raw_url?: string;
    sub_results?: SearchResult[];
}
export { SearchResult };

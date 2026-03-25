export {};

declare global {
  interface HTMLElementTagNameMap {
    "table-of-contents": HTMLElement & {
      init?: () => void;
    };
  }

  interface Window {
    // Define swup directly because @swup/astro does not export AstroIntegration.
    swup: any;
    closeAnnouncement: () => void;
    pagefind: {
      search: (query: string) => Promise<{
        results: Array<{
          data: () => Promise<SearchResult>;
        }>;
      }>;
    };

    initSemifullScrollDetection?: () => void;
    /** Navbar scroll handler reference used to remove stale listeners across Swup page swaps. */
    semifullScrollHandler?: () => void;
    /** Temporary layout mode captured during `content:replace`, written and consumed by `layout-runtime`. */
    __pendingLayoutMode?: string;
    /** Runtime configuration injected for `main-grid-runtime`. */
    __mainGridRuntimeConfig?: Record<string, unknown>;
    __mainGridRuntimeHooksRegistered?: boolean;
    iconifyLoaded?: boolean;
    __iconifyLoader?: {
      load: () => Promise<void>;
      addToPreloadQueue: (icons: string[]) => void;
      onLoad: (callback: () => void) => void;
      isLoaded: boolean;
    };
    siteConfig: any;
    mermaidInitialized?: boolean;
    renderMermaidDiagrams?: () => Promise<void>;
    __wallpaper_cleanup?: (() => void) | null;
    registerPageScript?: (
      name: string,
      options: {
        shouldRun?: () => boolean;
        init: () => void | (() => void) | Promise<void | (() => void)>;
      },
    ) => () => void;
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

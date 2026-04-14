interface WebVitalsMetric {
    name: string;
    value: number;
    rating: "good" | "needs-improvement" | "poor" | "unknown";
    delta: number;
    id?: string;
    navigationType?: string;
}
interface VitalPayload {
    name: string;
    value: number;
    rating: string;
    delta: number;
    id: string;
    navigationType: string;
    url: string;
    ts: number;
}
export {};
declare global {
    interface Window {
        webVitals?: {
            onCLS: (cb: (m: WebVitalsMetric) => void) => void;
            onLCP: (cb: (m: WebVitalsMetric) => void) => void;
            onINP: (cb: (m: WebVitalsMetric) => void) => void;
            onFCP: (cb: (m: WebVitalsMetric) => void) => void;
            onTTFB: (cb: (m: WebVitalsMetric) => void) => void;
        };
    }
}
(function initWebVitalsMonitor() {
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1")
        return;
    function report(metric: WebVitalsMetric): void {
        if (!("sendBeacon" in navigator))
            return;
        const payload: VitalPayload = {
            name: metric.name,
            value: Math.round(metric.value * 1000) / 1000,
            rating: metric.rating || "unknown",
            delta: Math.round(metric.delta * 1000) / 1000,
            id: metric.id || "",
            navigationType: metric.navigationType || "",
            url: location.href,
            ts: Date.now(),
        };
        console.log(`[vitals] ${payload.name}: ${payload.value} (${payload.rating})`);
    }
    const WEB_VITALS_CDN = "https://unpkg.com/web-vitals@4/dist/web-vitals.attribution.iife.js";
    function loadWebVitals(): void {
        const script = document.createElement("script");
        script.src = WEB_VITALS_CDN;
        script.crossOrigin = "anonymous";
        script.onload = function () {
            if (!window.webVitals)
                return;
            const wv = window.webVitals;
            wv.onCLS?.(report);
            wv.onLCP?.(report);
            wv.onINP?.(report);
            wv.onFCP?.(report);
            wv.onTTFB?.(report);
        };
        script.onerror = function () {
            observeLCPFallback();
        };
        document.head.appendChild(script);
    }
    function observeLCPFallback(): void {
        if (!("PerformanceObserver" in window))
            return;
        try {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                if (entries.length === 0)
                    return;
                const lastEntry = entries[entries.length - 1];
                console.log(`[vitals] LCP (fallback): ${Math.round(lastEntry.startTime)}ms`);
            });
            lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
        }
        catch {
        }
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadWebVitals, { once: true });
    }
    else {
        loadWebVitals();
    }
})();

/**
 * Web Vitals monitoring — measures and reports Core Web Vitals.
 * Loaded inline in <head> for early instrumentation.
 * Uses navigator.sendBeacon for reliable delivery on page exit.
 */

(function () {
  // Only run in production
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") return;

  // ── Report function: sends metrics to the console + optional endpoint ──
  function report(metric) {
    if (!("sendBeacon" in navigator)) return;

    const payload = {
      name: metric.name,
      value: Math.round(metric.value * 1000) / 1000,
      rating: metric.rating || "unknown",
      delta: Math.round(metric.delta * 1000) / 1000,
      id: metric.id || "",
      navigationType: metric.navigationType || "",
      url: location.href,
      ts: Date.now(),
    };

    // Log to console for debugging
    console.log(`[vitals] ${payload.name}: ${payload.value} (${payload.rating})`);

    // Send to analytics endpoint — replace with your actual endpoint
    // const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    // navigator.sendBeacon("/api/vitals", blob);
  }

  // ── Dynamic import of web-vitals library ──
  // We use the web-vitals library from CDN for accurate measurement.
  // If the CDN fails, we silently fall back (no console errors).
  const WEB_VITALS_CDN =
    "https://unpkg.com/web-vitals@4/dist/web-vitals.attribution.iife.js";

  function loadWebVitals() {
    const script = document.createElement("script");
    script.src = WEB_VITALS_CDN;
    script.crossOrigin = "anonymous";
    script.onload = function () {
      if (!window.webVitals) return;
      var wv = window.webVitals;

      // Measure each metric and report
      if (wv.onCLS) wv.onCLS(report);
      if (wv.onLCP) wv.onLCP(report);
      if (wv.onINP) wv.onINP(report);
      if (wv.onFCP) wv.onFCP(report);
      if (wv.onTTFB) wv.onTTFB(report);
    };
    script.onerror = function () {
      // Fallback: use native PerformanceObserver for LCP
      observeLCPFallback();
    };
    document.head.appendChild(script);
  }

  // ── Fallback LCP observer (no external library) ──
  function observeLCPFallback() {
    if (!("PerformanceObserver" in window)) return;

    try {
      var lcpObserver = new PerformanceObserver(function (list) {
        var entries = list.getEntries();
        if (entries.length === 0) return;
        var lastEntry = entries[entries.length - 1];
        console.log(
          "[vitals] LCP (fallback): " +
            Math.round(lastEntry.startTime) +
            "ms"
        );
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch (e) {
      // Observer not supported
    }
  }

  // ── Initialize ──
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadWebVitals, { once: true });
  } else {
    loadWebVitals();
  }
})();

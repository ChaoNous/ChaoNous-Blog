import { BTC_DATA_URL, ECHARTS_CDN_URL } from "./constants";
import type { BtcData } from "./types";

export function loadEcharts(): Promise<typeof window.echarts> {
  if (window.echarts) {
    return Promise.resolve(window.echarts);
  }

  if (window.__btcAnalysisEchartsPromise) {
    return window.__btcAnalysisEchartsPromise;
  }

  window.__btcAnalysisEchartsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${ECHARTS_CDN_URL}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.echarts), {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load ECharts")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = ECHARTS_CDN_URL;
    script.async = true;
    script.onload = () => resolve(window.echarts);
    script.onerror = () => reject(new Error("Failed to load ECharts"));
    document.head.appendChild(script);
  });

  return window.__btcAnalysisEchartsPromise;
}

export function loadBtcData(): Promise<BtcData> {
  if (!window.__btcAnalysisDataPromise) {
    window.__btcAnalysisDataPromise = fetch(BTC_DATA_URL).then((response) => {
      if (!response.ok) {
        throw new Error(`BTC analysis data request failed: ${response.status}`);
      }

      return response.json() as Promise<BtcData>;
    });
  }

  return window.__btcAnalysisDataPromise;
}

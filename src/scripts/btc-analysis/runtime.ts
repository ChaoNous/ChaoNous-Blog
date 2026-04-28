import { buildMainChartOption, buildMiniChartOption } from "./chart-options";
import {
  getChartElements,
  getChartMountElement,
  hasBtcChartElements,
} from "./dom";
import { loadBtcData, loadEcharts } from "./data-loader";
import { renderForecastTable } from "./forecast-table";
import type { BtcChartState } from "./types";

const DATA_LOAD_ERROR =
  "\u6570\u636e\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002";

export { hasBtcChartElements };

function getBtcChartState(): BtcChartState {
  if (!window.__btcAnalysisChartState) {
    window.__btcAnalysisChartState = {
      mainChart: null,
      miniChart: null,
      resizeHandler: null,
      intersectionObserver: null,
      idleTimer: null,
      initPromise: null,
    };
  }

  return window.__btcAnalysisChartState;
}

export function cleanupBtcCharts(): void {
  const state = getBtcChartState();

  if (state.intersectionObserver) {
    state.intersectionObserver.disconnect();
    state.intersectionObserver = null;
  }

  if (state.idleTimer) {
    window.clearTimeout(state.idleTimer);
    state.idleTimer = null;
  }

  if (state.resizeHandler) {
    window.removeEventListener("resize", state.resizeHandler);
    state.resizeHandler = null;
  }

  [state.mainChart, state.miniChart].forEach((chart) => {
    if (chart && !chart.isDisposed()) {
      chart.dispose();
    }
  });

  state.mainChart = null;
  state.miniChart = null;
  state.initPromise = null;
}

async function initBtcAnalysisCharts(): Promise<void | (() => void)> {
  const state = getBtcChartState();
  if (state.initPromise) {
    return state.initPromise;
  }

  state.initPromise = (async () => {
    const { mainEl, miniEl, tableEl } = getChartElements();
    if (!mainEl || !miniEl || !tableEl) {
      cleanupBtcCharts();
      return cleanupBtcCharts;
    }

    try {
      const [echarts, data] = await Promise.all([loadEcharts(), loadBtcData()]);
      if (!echarts) {
        throw new Error("ECharts failed to load");
      }
      if (!hasBtcChartElements()) {
        return;
      }

      cleanupBtcCharts();
      const mainChart = echarts.init(mainEl);
      const miniChart = echarts.init(miniEl);
      mainChart.setOption(buildMainChartOption(data.history, data.forecast));
      miniChart.setOption(buildMiniChartOption(data.forecast));
      renderForecastTable(data.forecast, tableEl);

      const resizeHandler = () => {
        mainChart.resize();
        miniChart.resize();
      };
      window.addEventListener("resize", resizeHandler);
      requestAnimationFrame(() => {
        resizeHandler();
        setTimeout(resizeHandler, 120);
      });
      state.mainChart = mainChart;
      state.miniChart = miniChart;
      state.resizeHandler = resizeHandler;
    } catch (error) {
      console.warn("BTC chart initialization failed:", error);
      tableEl.innerHTML = `<p style="padding:1rem;color:#9a7a5a;text-align:center">${DATA_LOAD_ERROR}</p>`;
    }

    return cleanupBtcCharts;
  })();

  return state.initPromise.finally(() => {
    state.initPromise = null;
  });
}

export function scheduleChartInitialization(): void {
  const state = getBtcChartState();
  const mountEl = getChartMountElement();
  if (!mountEl) {
    return;
  }

  const runInit = () => {
    if (state.intersectionObserver) {
      state.intersectionObserver.disconnect();
      state.intersectionObserver = null;
    }
    state.idleTimer = null;
    void initBtcAnalysisCharts();
  };

  if ("IntersectionObserver" in window) {
    state.intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          runInit();
        }
      },
      { rootMargin: "240px 0px" },
    );
    state.intersectionObserver.observe(mountEl);
    return;
  }

  state.idleTimer = globalThis.setTimeout(runInit, 300) as unknown as number;
}

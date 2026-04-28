import type { BtcForecastEntry, BtcHistoryEntry } from "./types";

const SERIES_LABELS = {
  upper95: "95% \u4e0a\u6cbf",
  lower95: "95% \u4e0b\u6cbf",
  upper68: "68% \u4e0a\u6cbf",
  lower68: "68% \u4e0b\u6cbf",
  historyPrice: "\u5386\u53f2\u4ef7\u683c",
  forecastMedian: "\u9884\u6d4b\u4e2d\u503c",
  connector: "\u8fde\u63a5",
  forecastPrice: "\u9884\u6d4b\u4ef7\u683c",
  forecast: "\u9884\u6d4b",
};

export function calcMovingAverage(
  data: number[],
  period: number,
): (number | null)[] {
  return data.map((_, index) => {
    if (index < period - 1) {
      return null;
    }

    let sum = 0;
    for (let cursor = index - period + 1; cursor <= index; cursor += 1) {
      sum += data[cursor];
    }

    return Number((sum / period).toFixed(2));
  });
}

export function buildMainChartOption(
  history: BtcHistoryEntry[],
  forecast: BtcForecastEntry[],
) {
  const histDates = history.map((item) => item.date);
  const histPrices = history.map((item) => item.price);
  const fcDates = forecast.map((item) => item.date);
  const fcPrices = forecast.map((item) => item.forecast);
  const fc95Up = forecast.map((item) => item.upper_95);
  const fc95Dn = forecast.map((item) => item.lower_95);
  const fc68Up = forecast.map((item) => item.upper_68);
  const fc68Dn = forecast.map((item) => item.lower_68);
  const allDates = histDates.concat(fcDates);
  const ma200 = calcMovingAverage(histPrices, 200);
  const nullHist = new Array(histDates.length).fill(null);
  const nullFc = new Array(fcDates.length).fill(null);

  return {
    backgroundColor: "transparent",
    animation: true,
    tooltip: {
      trigger: "axis" as const,
      backgroundColor: "#1a2744",
      borderColor: "#1e3a5f",
      textStyle: { color: "#c0d0e8", fontSize: 12 },
      formatter(points: unknown[]) {
        const pts = points as Array<{
          axisValue: string;
          marker: string;
          seriesName: string;
          value: number | [string, number] | null;
        }>;
        let html = `<div style="font-weight:600;margin-bottom:4px;color:#7090b0">${pts[0].axisValue}</div>`;
        pts.forEach((point) => {
          if (point.value == null) return;
          const value = Array.isArray(point.value)
            ? point.value[1]
            : point.value;
          if (value == null) return;
          html += `<div style="display:flex;justify-content:space-between;gap:16px;margin:1px 0"><span>${point.marker}${point.seriesName}</span><span style="font-weight:600">$${Math.round(value).toLocaleString()}</span></div>`;
        });
        return html;
      },
    },
    grid: { top: 20, right: 70, bottom: 80, left: 80 },
    xAxis: {
      type: "category" as const,
      data: allDates,
      boundaryGap: false,
      axisLine: { lineStyle: { color: "#1e3a5f" } },
      axisLabel: { color: "#4a6a8a", fontSize: 11 },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: {
        color: "#4a6a8a",
        fontSize: 11,
        formatter(value: number) {
          return value >= 1000 ? `$${(value / 1000).toFixed(0)}K` : `$${value}`;
        },
      },
      splitLine: { lineStyle: { color: "#111e30", type: "dashed" } },
      axisLine: { lineStyle: { color: "#1e3a5f" } },
    },
    dataZoom: [
      { type: "inside" as const, start: 0, end: 100 },
      {
        type: "slider" as const,
        bottom: 10,
        height: 28,
        backgroundColor: "#0a1020",
        borderColor: "#1e3a5f",
        fillerColor: "rgba(247,147,26,0.08)",
        handleStyle: { color: "#f7931a" },
        textStyle: { color: "#4a6a8a" },
      },
    ],
    series: [
      {
        name: SERIES_LABELS.upper95,
        type: "line" as const,
        data: nullHist.concat(fc95Up),
        lineStyle: { opacity: 0 },
        areaStyle: { color: "rgba(0,200,150,0.06)", origin: "auto" as const },
        symbol: "none",
        showInLegend: false,
        smooth: true,
        z: 1,
      },
      {
        name: SERIES_LABELS.lower95,
        type: "line" as const,
        data: nullHist.concat(fc95Dn),
        lineStyle: { opacity: 0 },
        areaStyle: { color: "#0d1520", origin: "auto" as const },
        symbol: "none",
        showInLegend: false,
        smooth: true,
        z: 1,
      },
      {
        name: SERIES_LABELS.upper68,
        type: "line" as const,
        data: nullHist.concat(fc68Up),
        lineStyle: { opacity: 0 },
        areaStyle: { color: "rgba(0,200,150,0.14)", origin: "auto" as const },
        symbol: "none",
        showInLegend: false,
        smooth: true,
        z: 2,
      },
      {
        name: SERIES_LABELS.lower68,
        type: "line" as const,
        data: nullHist.concat(fc68Dn),
        lineStyle: { opacity: 0 },
        areaStyle: { color: "#0d1520", origin: "auto" as const },
        symbol: "none",
        showInLegend: false,
        smooth: true,
        z: 2,
      },
      {
        name: "MA200",
        type: "line" as const,
        data: ma200.concat(nullFc),
        smooth: true,
        symbol: "none",
        lineStyle: {
          color: "#4a7aff",
          width: 1.2,
          type: "dashed",
          opacity: 0.6,
        },
        z: 3,
      },
      {
        name: SERIES_LABELS.historyPrice,
        type: "line" as const,
        data: histPrices.concat(nullFc),
        smooth: false,
        symbol: "none",
        lineStyle: { color: "#f7931a", width: 2 },
        areaStyle: {
          color: {
            type: "linear" as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(247,147,26,0.22)" },
              { offset: 1, color: "rgba(247,147,26,0.02)" },
            ],
          },
        },
        z: 5,
      },
      {
        name: SERIES_LABELS.forecastMedian,
        type: "line" as const,
        data: nullHist.concat(fcPrices),
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#00c896", width: 2.5, type: "dashed" },
        z: 6,
      },
      {
        name: SERIES_LABELS.connector,
        type: "line" as const,
        data: nullHist
          .slice(0, -1)
          .concat([histPrices[histPrices.length - 1], fcPrices[0]])
          .concat(nullFc.slice(1)),
        smooth: false,
        symbol: "none",
        lineStyle: {
          color: "#00c896",
          width: 1.5,
          type: "dashed",
          opacity: 0.5,
        },
        showInLegend: false,
        z: 6,
      },
    ],
  };
}

export function buildMiniChartOption(forecast: BtcForecastEntry[]) {
  const fcDates = forecast.map((item) => item.date);
  const fcPrices = forecast.map((item) => item.forecast);
  const fc95Up = forecast.map((item) => item.upper_95);
  const fc95Dn = forecast.map((item) => item.lower_95);
  const fc68Up = forecast.map((item) => item.upper_68);
  const fc68Dn = forecast.map((item) => item.lower_68);

  return {
    backgroundColor: "transparent",
    animation: true,
    tooltip: {
      trigger: "axis" as const,
      backgroundColor: "#1a2744",
      borderColor: "#1e3a5f",
      textStyle: { color: "#c0d0e8", fontSize: 11 },
      formatter(points: unknown[]) {
        const pts = points as Array<{
          dataIndex: number;
        }>;
        const row = forecast[pts[0].dataIndex];
        return `<b>${row.date}</b><br/>${SERIES_LABELS.forecast}: <b style="color:#00c896">$${Math.round(row.forecast).toLocaleString()}</b><br/>68%: $${Math.round(row.lower_68).toLocaleString()} ~ $${Math.round(row.upper_68).toLocaleString()}`;
      },
    },
    grid: { top: 10, right: 20, bottom: 30, left: 70 },
    xAxis: {
      type: "category" as const,
      data: fcDates,
      boundaryGap: false,
      axisLabel: { color: "#3a5a7a", fontSize: 10, interval: 29 },
      axisLine: { lineStyle: { color: "#1a2e4a" } },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: {
        color: "#3a5a7a",
        fontSize: 10,
        formatter(value: number) {
          return `$${(value / 1000).toFixed(0)}K`;
        },
      },
      splitLine: { lineStyle: { color: "#0f1e2e", type: "dashed" } },
      axisLine: { lineStyle: { color: "#1a2e4a" } },
    },
    series: [
      {
        name: "95%",
        type: "line" as const,
        data: fc95Up,
        lineStyle: { opacity: 0 },
        areaStyle: { color: "rgba(0,200,150,0.07)" },
        symbol: "none",
        smooth: true,
      },
      {
        name: "95%",
        type: "line" as const,
        data: fc95Dn,
        lineStyle: { opacity: 0 },
        areaStyle: { color: "#0d1520" },
        symbol: "none",
        smooth: true,
      },
      {
        name: "68%",
        type: "line" as const,
        data: fc68Up,
        lineStyle: { opacity: 0 },
        areaStyle: { color: "rgba(0,200,150,0.16)" },
        symbol: "none",
        smooth: true,
      },
      {
        name: "68%",
        type: "line" as const,
        data: fc68Dn,
        lineStyle: { opacity: 0 },
        areaStyle: { color: "#0d1520" },
        symbol: "none",
        smooth: true,
      },
      {
        name: SERIES_LABELS.forecastPrice,
        type: "line" as const,
        data: fcPrices,
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#00c896", width: 2 },
      },
    ],
  };
}

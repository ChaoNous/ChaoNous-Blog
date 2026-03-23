---
title: "比特币五年行情回顾与未来半年价格预测"
description: "基于 2021–2026 五年日线数据，采用三模型集成（EMA 趋势外推 + 傅里叶周期分解 + 对数线性趋势）预测比特币未来 183 天每日价格，附带交互式图表与置信区间分析。"
published: 2026-03-22
author: "ChaoNous"
tags: ["投资", "比特币", "数据分析"]
category: "投资"
---

本文基于 **2021 年 3 月至 2026 年 3 月** 共 1,826 天的比特币日线收盘数据，采用三模型加权集成的方法，对未来半年（183 天）的 BTC/USD 日级价格进行了预测。所有数据来自 CryptoCompare 公开 API，模型构建与可视化均通过 Python 自动完成。

## 一、数据概况

| 指标 | 数值 |
|:---|:---|
| 数据范围 | 2021-03-23 ~ 2026-03-22 |
| 数据天数 | 1,826 天（5 年完整日线） |
| 最新收盘价 | **$68,483** |
| 五年最高 | $124,723（2025 年牛市周期） |
| 五年最低 | $15,760（2022 年熊市底部） |
| 年化波动率 | 57.5% |

五年来，比特币经历了从牛市顶部（2021 年 11 月）到极端熊市（2022 年 11 月 FTX 崩盘）再到新一轮牛市的完整周期。当前价格距历史高点仍有约 45% 的空间。

## 二、交互式行情图表

<div id="btc-chart-root" class="not-content my-8">
  <div class="rounded-2xl border border-black/10 bg-white/75 p-5 shadow-lg shadow-black/5 backdrop-blur dark:border-white/10 dark:bg-black/30 dark:shadow-black/20">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h3 class="text-lg font-bold text-black/90 dark:text-white/90">BTC/USD · 五年行情与预测</h3>
      <div class="flex gap-2">
        <button data-range="1y" class="range-btn rounded-lg border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-medium text-black/60 transition hover:bg-black/[0.06] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60 dark:hover:bg-white/[0.08]">1Y</button>
        <button data-range="3y" class="range-btn rounded-lg border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-medium text-black/60 transition hover:bg-black/[0.06] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60 dark:hover:bg-white/[0.08]">3Y</button>
        <button data-range="5y" class="range-btn active rounded-lg border border-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-medium text-[var(--primary)] transition dark:bg-[var(--primary)]/20">5Y</button>
        <button data-range="all" class="range-btn rounded-lg border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-medium text-black/60 transition hover:bg-black/[0.06] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60 dark:hover:bg-white/[0.08]">ALL</button>
      </div>
    </div>
    <div class="relative" style="height:400px">
      <canvas id="btc-canvas" class="w-full h-full"></canvas>
      <div id="btc-tooltip" class="pointer-events-none absolute hidden rounded-xl border border-black/10 bg-white/95 px-4 py-3 text-sm shadow-lg backdrop-blur dark:border-white/10 dark:bg-black/90" style="z-index:10">
        <div id="btc-tip-date" class="text-xs text-black/50 dark:text-white/50"></div>
        <div id="btc-tip-price" class="mt-1 font-bold text-black/90 dark:text-white/90"></div>
        <div id="btc-tip-type" class="mt-0.5 text-xs"></div>
      </div>
    </div>
    <div class="mt-4 flex flex-wrap gap-4 text-xs text-black/50 dark:text-white/50">
      <span class="flex items-center gap-1.5"><span class="inline-block h-2 w-4 rounded-full bg-[var(--primary)]"></span>历史价格</span>
      <span class="flex items-center gap-1.5"><span class="inline-block h-2 w-4 rounded-full bg-amber-500"></span>预测中值</span>
      <span class="flex items-center gap-1.5"><span class="inline-block h-0.5 w-4 rounded-full bg-amber-500/30"></span>68% 置信区间</span>
    </div>
  </div>
</div>

## 三、预测方法

本次预测采用 **三模型加权集成**，各模型捕捉比特币价格运动的不同维度：

### 1. EMA 趋势外推（权重 40%）

基于短期（30 日）和长期（120 日）指数移动平均线的斜率，结合衰减因子，捕捉当前趋势动量。该模型在趋势延续时表现较好，但在趋势转折点容易滞后。

### 2. 傅里叶周期分解（权重 35%）

对对数收益率序列进行离散傅里叶变换（DFT），提取比特币特有的周期性成分（包括约 4 年减半周期和短期季节性振荡），向前外推生成周期性预测。该模型的优势在于捕捉规律性波动，但对非周期性冲击（如黑天鹅事件）无能为力。

### 3. 对数线性趋势（权重 25%）

对整个 5 年的对数价格序列拟合线性趋势，代表比特币的长期指数增长预期。该模型最为稳健，但短期精度较低。

**集成公式：**

$$\hat{y}_t = 0.4 \cdot \hat{y}^{EMA}_t + 0.35 \cdot \hat{y}^{FFT}_t + 0.25 \cdot \hat{y}^{LIN}_t$$

**置信区间**基于近 90 日日对数收益率标准差，按 $\sigma\sqrt{t}$ 扩散计算。

## 四、预测结果

<div class="not-content my-8 overflow-hidden rounded-2xl border border-black/10 bg-white/75 shadow-lg shadow-black/5 backdrop-blur dark:border-white/10 dark:bg-black/30 dark:shadow-black/20">
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]">
          <th class="px-5 py-3 text-left font-semibold text-black/70 dark:text-white/70">时间节点</th>
          <th class="px-5 py-3 text-right font-semibold text-black/70 dark:text-white/70">预测中值</th>
          <th class="px-5 py-3 text-right font-semibold text-black/70 dark:text-white/70">68% 区间下限</th>
          <th class="px-5 py-3 text-right font-semibold text-black/70 dark:text-white/70">68% 区间上限</th>
        </tr>
      </thead>
      <tbody id="btc-forecast-table">
      </tbody>
    </table>
  </div>
</div>

## 五、统计指标

<div class="not-content my-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <div class="rounded-2xl border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
    <div class="text-xs uppercase tracking-[0.2em] text-black/45 dark:text-white/45">当前价格</div>
    <div id="btc-stat-current" class="mt-2 text-2xl font-bold text-black/90 dark:text-white/90">-</div>
    <div class="mt-1 text-sm text-black/55 dark:text-white/55">2026-03-22 收盘</div>
  </div>
  <div class="rounded-2xl border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
    <div class="text-xs uppercase tracking-[0.2em] text-black/45 dark:text-white/45">五年最高</div>
    <div id="btc-stat-max" class="mt-2 text-2xl font-bold text-red-500 dark:text-red-400">-</div>
    <div class="mt-1 text-sm text-black/55 dark:text-white/55">2025 年牛市峰值</div>
  </div>
  <div class="rounded-2xl border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
    <div class="text-xs uppercase tracking-[0.2em] text-black/45 dark:text-white/45">五年最低</div>
    <div id="btc-stat-min" class="mt-2 text-2xl font-bold text-green-500 dark:text-green-400">-</div>
    <div class="mt-1 text-sm text-black/55 dark:text-white/55">2022 年熊市底部</div>
  </div>
  <div class="rounded-2xl border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
    <div class="text-xs uppercase tracking-[0.2em] text-black/45 dark:text-white/45">年化波动率</div>
    <div id="btc-stat-vol" class="mt-2 text-2xl font-bold text-amber-500 dark:text-amber-400">-</div>
    <div class="mt-1 text-sm text-black/55 dark:text-white/55">基于近 90 日收益率</div>
  </div>
</div>

## 六、风险提示

:::caution
本文所有预测均为统计模型的数学输出，不构成任何投资建议。比特币的年化波动率高达 57.5%，意味着价格在任何方向上都可能出现剧烈偏离。历史数据无法预测黑天鹅事件（交易所暴雷、政策突变、技术故障等）。请仅在充分理解风险的前提下参与市场。
:::

## 七、方法论附录

### 数据源

- **CryptoCompare API** — 提供 OHLCV 日线数据，覆盖 2015 年至今
- 数据点：每日 UTC 0:00 收盘价（BTC/USD）

### 模型参数

| 参数 | EMA 趋势 | 傅里叶周期 | 对数线性 |
|:---|:---|:---|:---|
| 短期窗口 | 30 天 | — | — |
| 长期窗口 | 120 天 | — | — |
| 衰减系数 | 0.97 | — | — |
| 保留频率 | — | 前 15 个主频 | — |
| 拟合范围 | 最近 365 天 | 全部数据 | 全部数据 |
| 集成权重 | 40% | 35% | 25% |

### 置信区间计算

68% 置信区间基于正态分布假设：

$$CI_t = \hat{y}_t \cdot e^{\pm z_{0.16} \cdot \sigma_{90d} \cdot \sqrt{t}}$$

其中 $z_{0.16} \approx 1.0$，$\sigma_{90d}$ 为近 90 天日对数收益率的标准差。

---

<div class="not-content mt-8 rounded-xl border border-black/5 bg-black/[0.02] px-4 py-3 text-xs text-black/40 dark:border-white/5 dark:bg-white/[0.02] dark:text-white/40">
  <strong>数据更新时间：</strong>2026-03-22 · 数据来源：CryptoCompare · 分析脚本：Python 3 (pandas, numpy, scipy)
</div>

<script is:inline>
(() => {
  if (typeof document === "undefined") return;

  const DATA_URL = "/posts/btc-5y-forecast/data.json";
  const canvas = document.getElementById("btc-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const tooltip = document.getElementById("btc-tooltip");
  const root = document.getElementById("btc-chart-root");

  let allHistory = [];
  let allForecast = [];
  let meta = {};
  let currentRange = "5y";
  let dpr = window.devicePixelRatio || 1;
  let displayW, displayH;
  let hoverX = -1;

  function load() {
    fetch(DATA_URL)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => {
        meta = data.meta || {};
        allHistory = (data.history || []).map(d => ({
          date: d.date,
          price: +d.close,
          type: "history"
        }));
        allForecast = (data.forecast || []).map(d => ({
          date: d.date,
          price: d.forecast,
          lower: d.lower_68,
          upper: d.upper_68,
          type: "forecast"
        }));
        populateStats();
        populateTable();
        setupCanvas();
        draw();
        setupInteraction();
      })
      .catch(() => {
        const fallback = canvas.parentElement;
        canvas.style.display = "none";
        fallback.innerHTML += '<p class="text-center py-12 text-black/40 dark:text-white/40">图表数据加载失败，请刷新重试。</p>';
      });
  }

  function populateStats() {
    const fmt = v => "$" + Math.round(v).toLocaleString("en-US");
    const el = (id) => document.getElementById(id);
    if (el("btc-stat-current")) el("btc-stat-current").textContent = fmt(meta.latest_price || 0);
    if (el("btc-stat-max")) el("btc-stat-max").textContent = fmt(meta.max_price_5y || 0);
    if (el("btc-stat-min")) el("btc-stat-min").textContent = fmt(meta.min_price_5y || 0);
    if (el("btc-stat-vol")) el("btc-stat-vol").textContent = (meta.annualized_vol_pct || 0).toFixed(1) + "%";
  }

  function populateTable() {
    const tbody = document.getElementById("btc-forecast-table");
    if (!tbody || !allForecast.length) return;
    const milestones = [0, 29, 59, 89, 119, 149, 182];
    const fmt = v => "$" + Math.round(v).toLocaleString("en-US");
    const pctChange = () => {
      const cur = meta.latest_price || 1;
      return (p) => ((p - cur) / cur * 100).toFixed(1);
    };
    const pct = pctChange();
    tbody.innerHTML = milestones.map(i => {
      const f = allForecast[i];
      if (!f) return "";
      const change = pct(f.price);
      const color = change >= 0 ? "text-red-500 dark:text-red-400" : "text-green-500 dark:text-green-400";
      const arrow = change >= 0 ? "↑" : "↓";
      return `<tr class="border-b border-black/5 dark:border-white/5">
        <td class="px-5 py-3 text-black/70 dark:text-white/70">${f.date}</td>
        <td class="px-5 py-3 text-right font-bold text-black/90 dark:text-white/90">${fmt(f.price)}</td>
        <td class="px-5 py-3 text-right text-black/50 dark:text-white/50">${fmt(f.lower)}</td>
        <td class="px-5 py-3 text-right text-black/50 dark:text-white/50">${fmt(f.upper)}</td>
      </tr>`;
    }).join("");
  }

  function setupCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    displayW = rect.width;
    displayH = rect.height;
    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    canvas.style.width = displayW + "px";
    canvas.style.height = displayH + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function getVisibleData() {
    const now = allHistory.length > 0 ? allHistory[allHistory.length - 1].date : "2026-03-22";
    let cutoff;
    switch (currentRange) {
      case "1y": cutoff = subtractDays(now, 365); break;
      case "3y": cutoff = subtractDays(now, 365 * 3); break;
      case "5y": cutoff = subtractDays(now, 365 * 5); break;
      default: cutoff = "2009-01-01";
    }
    const hist = allHistory.filter(d => d.date >= cutoff);
    return { history: hist, forecast: allForecast };
  }

  function subtractDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  function draw() {
    const pad = { top: 20, right: 20, bottom: 50, left: 65 };
    const w = displayW - pad.left - pad.right;
    const h = displayH - pad.top - pad.bottom;

    ctx.clearRect(0, 0, displayW, displayH);

    const { history, forecast } = getVisibleData();
    const allPoints = [
      ...history.map(d => ({ ...d, y: d.price })),
      ...forecast.map(d => ({ ...d, y: d.price }))
    ];

    if (!allPoints.length) return;

    const allPrices = allPoints.map(d => d.y);
    const lowerPrices = forecast.map(d => d.lower).filter(Boolean);
    const upperPrices = forecast.map(d => d.upper).filter(Boolean);
    const yMin = Math.min(...allPrices, ...lowerPrices) * 0.92;
    const yMax = Math.max(...allPrices, ...upperPrices) * 1.05;

    const dates = allPoints.map(d => d.date);
    const xMin = dates[0];
    const xMax = dates[dates.length - 1];

    const xScale = d => pad.left + (parseDate(d) - parseDate(xMin)) / (parseDate(xMax) - parseDate(xMin)) * w;
    const yScale = v => pad.top + (1 - (v - yMin) / (yMax - yMin)) * h;

    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
    const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const lineColor = isDark ? "rgba(100,180,255,0.9)" : "rgba(50,120,220,0.9)";

    // Grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const yTicks = niceScale(yMin, yMax, 6);
    yTicks.forEach(v => {
      const y = yScale(v);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(displayW - pad.right, y);
      ctx.stroke();
      ctx.fillStyle = textColor;
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(formatK(v), pad.left - 8, y);
    });

    // X axis labels
    const xTicks = niceXScale(xMin, xMax, 8);
    xTicks.forEach(d => {
      const x = xScale(d);
      ctx.fillStyle = textColor;
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(formatDateLabel(d), x, pad.top + h + 8);
    });

    // Forecast confidence band
    if (forecast.length) {
      const lastHist = history.length ? history[history.length - 1] : null;
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      const startX = lastHist ? xScale(lastHist.date) : xScale(forecast[0].date);
      ctx.moveTo(startX, yScale(lastHist ? lastHist.price : forecast[0].upper));
      forecast.forEach(f => ctx.lineTo(xScale(f.date), yScale(f.upper)));
      for (let i = forecast.length - 1; i >= 0; i--) ctx.lineTo(xScale(forecast[i].date), yScale(forecast[i].lower));
      ctx.lineTo(startX, yScale(lastHist ? lastHist.price : forecast[0].lower));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Historical price line
    if (history.length > 1) {
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      history.forEach((d, i) => {
        const x = xScale(d.date), y = yScale(d.price);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Forecast line
    if (forecast.length > 1) {
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      forecast.forEach((d, i) => {
        const x = xScale(d.date), y = yScale(d.price);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Divider line between history and forecast
    if (history.length && forecast.length) {
      const lastH = history[history.length - 1];
      const firstF = forecast[0];
      const dx = xScale(lastH.date);
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(dx, pad.top);
      ctx.lineTo(dx, pad.top + h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = textColor;
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("← 历史 | 预测 →", dx, pad.top - 6);
    }

    // Hover crosshair
    if (hoverX >= pad.left && hoverX <= displayW - pad.right) {
      const hoverDate = xMin + (hoverX - pad.left) / w * (parseDate(xMax) - parseDate(xMin));
      const hoverDateStr = new Date(hoverDate).toISOString().slice(0, 10);

      let point = history.find(d => d.date === hoverDateStr);
      if (!point) point = forecast.find(d => d.date === hoverDateStr);
      if (!point) {
        const closest = allPoints.reduce((best, d) => {
          const diff = Math.abs(parseDate(d.date) - hoverDate);
          return diff < best.diff ? { d, diff } : best;
        }, { d: null, diff: Infinity });
        point = closest.d;
      }

      if (point) {
        const px = xScale(point.date);
        const py = yScale(point.y);

        ctx.strokeStyle = textColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(px, pad.top);
        ctx.lineTo(px, pad.top + h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pad.left, py);
        ctx.lineTo(displayW - pad.right, py);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = point.type === "history" ? lineColor : "#f59e0b";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();

        if (tooltip) {
          const fmt = v => "$" + Math.round(v).toLocaleString("en-US");
          document.getElementById("btc-tip-date").textContent = point.date;
          document.getElementById("btc-tip-price").textContent = fmt(point.y);
          const tipType = document.getElementById("btc-tip-type");
          if (point.type === "forecast") {
            tipType.textContent = `预测 · ${fmt(point.lower)} ~ ${fmt(point.upper)}`;
            tipType.style.color = "#f59e0b";
          } else {
            tipType.textContent = "实际收盘价";
            tipType.style.color = "";
          }
          let tx = px + 15;
          let ty = py - 45;
          if (tx + 200 > displayW) tx = px - 200;
          if (ty < 0) ty = py + 15;
          tooltip.style.left = tx + "px";
          tooltip.style.top = ty + "px";
          tooltip.classList.remove("hidden");
        }
      }
    } else if (tooltip) {
      tooltip.classList.add("hidden");
    }
  }

  function parseDate(s) { return new Date(s).getTime(); }

  function formatK(v) {
    if (v >= 1000) return "$" + (v / 1000).toFixed(0) + "k";
    return "$" + Math.round(v);
  }

  function formatDateLabel(s) {
    const d = new Date(s);
    return (d.getMonth() + 1) + "/" + d.getFullYear().toString().slice(2);
  }

  function niceScale(min, max, targetTicks) {
    const range = max - min;
    const rough = range / targetTicks;
    const pow = Math.pow(10, Math.floor(Math.log10(rough)));
    const frac = rough / pow;
    let nice;
    if (frac <= 1.5) nice = 1;
    else if (frac <= 3) nice = 2;
    else if (frac <= 7) nice = 5;
    else nice = 10;
    const step = nice * pow;
    const start = Math.ceil(min / step) * step;
    const ticks = [];
    for (let v = start; v <= max; v += step) ticks.push(v);
    return ticks;
  }

  function niceXScale(min, max, target) {
    const d1 = parseDate(min), d2 = parseDate(max);
    const range = d2 - d1;
    const step = range / target;
    const days = Math.round(step / 86400000);
    let nice = days <= 30 ? 30 : days <= 90 ? 90 : days <= 180 ? 180 : 365;
    const ticks = [];
    for (let d = d1; d <= d2; d += nice * 86400000) {
      ticks.push(new Date(d).toISOString().slice(0, 10));
    }
    return ticks;
  }

  function setupInteraction() {
    canvas.addEventListener("mousemove", e => {
      const rect = canvas.getBoundingClientRect();
      hoverX = e.clientX - rect.left;
      draw();
    });
    canvas.addEventListener("mouseleave", () => {
      hoverX = -1;
      draw();
    });

    // Range buttons
    root.querySelectorAll(".range-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        root.querySelectorAll(".range-btn").forEach(b => {
          b.classList.remove("active", "border-[var(--primary)]", "bg-[var(--primary)]/10", "text-[var(--primary)]", "dark:bg-[var(--primary)]/20");
          b.classList.add("border-black/10", "bg-black/[0.03]", "text-black/60", "dark:border-white/10", "dark:bg-white/[0.04]", "dark:text-white/60");
        });
        btn.classList.add("active", "border-[var(--primary)]", "bg-[var(--primary)]/10", "text-[var(--primary)]", "dark:bg-[var(--primary)]/20");
        btn.classList.remove("border-black/10", "bg-black/[0.03]", "text-black/60", "dark:border-white/10", "dark:bg-white/[0.04]", "dark:text-white/60");
        currentRange = btn.dataset.range;
        draw();
      });
    });

    // Resize
    const ro = new ResizeObserver(() => {
      dpr = window.devicePixelRatio || 1;
      setupCanvas();
      draw();
    });
    ro.observe(canvas.parentElement);
  }

  load();
})();
</script>

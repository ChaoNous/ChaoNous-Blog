import { registerPageScript } from "./page-lifecycle.js";

const BTC_MAIN_SELECTOR = "#btc-main-chart";
const BTC_MINI_SELECTOR = "#btc-mini-chart";
const BTC_TABLE_SELECTOR = "#btc-table-wrap";
const BTC_DATA_URL = "/assets/posts/btc-analysis/data.json";
const ECHARTS_CDN_URL =
	"https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js";

function getChartElements() {
	const mainEl = document.querySelector(BTC_MAIN_SELECTOR);
	const miniEl = document.querySelector(BTC_MINI_SELECTOR);
	const tableEl = document.querySelector(BTC_TABLE_SELECTOR);
	return { mainEl, miniEl, tableEl };
}

function getChartMountElement() {
	return document.querySelector(BTC_MAIN_SELECTOR);
}

function hasBtcChartElements() {
	const { mainEl, miniEl, tableEl } = getChartElements();
	return Boolean(mainEl && miniEl && tableEl);
}

function getBtcChartState() {
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

function cleanupBtcCharts() {
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

function loadEcharts() {
	if (window.echarts) {
		return Promise.resolve(window.echarts);
	}

	if (window.__btcAnalysisEchartsPromise) {
		return window.__btcAnalysisEchartsPromise;
	}

	window.__btcAnalysisEchartsPromise = new Promise((resolve, reject) => {
		const existingScript = document.querySelector(
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

function loadBtcData() {
	if (!window.__btcAnalysisDataPromise) {
		window.__btcAnalysisDataPromise = fetch(BTC_DATA_URL).then((response) => {
			if (!response.ok) {
				throw new Error(`BTC analysis data request failed: ${response.status}`);
			}
			return response.json();
		});
	}
	return window.__btcAnalysisDataPromise;
}

function calcMovingAverage(data, period) {
	return data.map((_, index) => {
		if (index < period - 1) return null;
		let sum = 0;
		for (let cursor = index - period + 1; cursor <= index; cursor += 1) {
			sum += data[cursor];
		}
		return Number((sum / period).toFixed(2));
	});
}

function renderForecastTable(forecast, tableEl) {
	const fmt = (value) => `$${Math.round(value).toLocaleString()}`;
	let html =
		'<table style="width:100%;border-collapse:collapse;font-size:0.82rem"><thead><tr style="border-bottom:1px solid rgba(128,128,128,0.15)"><th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#5a7a9a;text-transform:uppercase;letter-spacing:0.04em">日期</th><th style="padding:8px 12px;text-align:right;font-size:0.72rem;color:#5a7a9a">预测价格</th><th style="padding:8px 12px;text-align:right;font-size:0.72rem;color:#5a7a9a">68% 区间</th><th style="padding:8px 12px;text-align:right;font-size:0.72rem;color:#5a7a9a">95% 区间</th></tr></thead><tbody>';

	for (let index = 0; index < forecast.length; index += 1) {
		const row = forecast[index];
		const week = Math.ceil((index + 1) / 7);
		const weekMark =
			(index + 1) % 7 === 0
				? ` <span style="color:#2a4a6a;font-size:0.7rem">W${week}</span>`
				: "";
		const isBold = index === 29 || index === 59 || index === 89 || index === 182;
		const background = isBold ? "background:rgba(247,147,26,0.04)" : "";
		const fontWeight = isBold ? "font-weight:600" : "";

		html += `<tr style="border-bottom:1px solid rgba(128,128,128,0.05);${background}"><td style="padding:6px 12px;color:#7090b0">${row.date}${weekMark}</td><td style="padding:6px 12px;text-align:right;color:#f7931a;${fontWeight}">${fmt(row.forecast)}</td><td style="padding:6px 12px;text-align:right;color:#4a8a6a;font-size:0.78rem">${fmt(row.lower_68)} ~ ${fmt(row.upper_68)}</td><td style="padding:6px 12px;text-align:right;color:#2a4a6a;font-size:0.78rem">${fmt(row.lower_95)} ~ ${fmt(row.upper_95)}</td></tr>`;
	}

	html += "</tbody></table>";
	tableEl.innerHTML = html;
}

function buildMainChartOption(history, forecast) {
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
			trigger: "axis",
			backgroundColor: "#1a2744",
			borderColor: "#1e3a5f",
			textStyle: { color: "#c0d0e8", fontSize: 12 },
			formatter(points) {
				let html = `<div style="font-weight:600;margin-bottom:4px;color:#7090b0">${points[0].axisValue}</div>`;
				points.forEach((point) => {
					if (point.value == null) return;
					const value = Array.isArray(point.value) ? point.value[1] : point.value;
					if (value == null) return;
					html += `<div style="display:flex;justify-content:space-between;gap:16px;margin:1px 0"><span>${point.marker}${point.seriesName}</span><span style="font-weight:600">$${Math.round(value).toLocaleString()}</span></div>`;
				});
				return html;
			},
		},
		grid: { top: 20, right: 70, bottom: 80, left: 80 },
		xAxis: {
			type: "category",
			data: allDates,
			boundaryGap: false,
			axisLine: { lineStyle: { color: "#1e3a5f" } },
			axisLabel: { color: "#4a6a8a", fontSize: 11 },
			splitLine: { show: false },
		},
		yAxis: {
			type: "value",
			axisLabel: {
				color: "#4a6a8a",
				fontSize: 11,
				formatter(value) {
					return value >= 1000 ? `$${(value / 1000).toFixed(0)}K` : `$${value}`;
				},
			},
			splitLine: { lineStyle: { color: "#111e30", type: "dashed" } },
			axisLine: { lineStyle: { color: "#1e3a5f" } },
		},
		dataZoom: [
			{ type: "inside", start: 0, end: 100 },
			{
				type: "slider",
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
			{ name: "95% 上沿", type: "line", data: nullHist.concat(fc95Up), lineStyle: { opacity: 0 }, areaStyle: { color: "rgba(0,200,150,0.06)", origin: "auto" }, symbol: "none", showInLegend: false, smooth: true, z: 1 },
			{ name: "95% 下沿", type: "line", data: nullHist.concat(fc95Dn), lineStyle: { opacity: 0 }, areaStyle: { color: "#0d1520", origin: "auto" }, symbol: "none", showInLegend: false, smooth: true, z: 1 },
			{ name: "68% 上沿", type: "line", data: nullHist.concat(fc68Up), lineStyle: { opacity: 0 }, areaStyle: { color: "rgba(0,200,150,0.14)", origin: "auto" }, symbol: "none", showInLegend: false, smooth: true, z: 2 },
			{ name: "68% 下沿", type: "line", data: nullHist.concat(fc68Dn), lineStyle: { opacity: 0 }, areaStyle: { color: "#0d1520", origin: "auto" }, symbol: "none", showInLegend: false, smooth: true, z: 2 },
			{ name: "MA200", type: "line", data: ma200.concat(nullFc), smooth: true, symbol: "none", lineStyle: { color: "#4a7aff", width: 1.2, type: "dashed", opacity: 0.6 }, z: 3 },
			{ name: "历史价格", type: "line", data: histPrices.concat(nullFc), smooth: false, symbol: "none", lineStyle: { color: "#f7931a", width: 2 }, areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(247,147,26,0.22)" }, { offset: 1, color: "rgba(247,147,26,0.02)" }] } }, z: 5 },
			{ name: "预测中值", type: "line", data: nullHist.concat(fcPrices), smooth: true, symbol: "none", lineStyle: { color: "#00c896", width: 2.5, type: "dashed" }, z: 6 },
			{ name: "连接", type: "line", data: nullHist.slice(0, -1).concat([histPrices[histPrices.length - 1], fcPrices[0]]).concat(nullFc.slice(1)), smooth: false, symbol: "none", lineStyle: { color: "#00c896", width: 1.5, type: "dashed", opacity: 0.5 }, showInLegend: false, z: 6 },
		],
	};
}

function buildMiniChartOption(forecast) {
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
			trigger: "axis",
			backgroundColor: "#1a2744",
			borderColor: "#1e3a5f",
			textStyle: { color: "#c0d0e8", fontSize: 11 },
			formatter(points) {
				const row = forecast[points[0].dataIndex];
				return `<b>${row.date}</b><br/>预测: <b style="color:#00c896">$${Math.round(row.forecast).toLocaleString()}</b><br/>68%: $${Math.round(row.lower_68).toLocaleString()} ~ $${Math.round(row.upper_68).toLocaleString()}`;
			},
		},
		grid: { top: 10, right: 20, bottom: 30, left: 70 },
		xAxis: {
			type: "category",
			data: fcDates,
			boundaryGap: false,
			axisLabel: { color: "#3a5a7a", fontSize: 10, interval: 29 },
			axisLine: { lineStyle: { color: "#1a2e4a" } },
			splitLine: { show: false },
		},
		yAxis: {
			type: "value",
			axisLabel: {
				color: "#3a5a7a",
				fontSize: 10,
				formatter(value) {
					return `$${(value / 1000).toFixed(0)}K`;
				},
			},
			splitLine: { lineStyle: { color: "#0f1e2e", type: "dashed" } },
			axisLine: { lineStyle: { color: "#1a2e4a" } },
		},
		series: [
			{ name: "95%", type: "line", data: fc95Up, lineStyle: { opacity: 0 }, areaStyle: { color: "rgba(0,200,150,0.07)" }, symbol: "none", smooth: true },
			{ name: "95%", type: "line", data: fc95Dn, lineStyle: { opacity: 0 }, areaStyle: { color: "#0d1520" }, symbol: "none", smooth: true },
			{ name: "68%", type: "line", data: fc68Up, lineStyle: { opacity: 0 }, areaStyle: { color: "rgba(0,200,150,0.16)" }, symbol: "none", smooth: true },
			{ name: "68%", type: "line", data: fc68Dn, lineStyle: { opacity: 0 }, areaStyle: { color: "#0d1520" }, symbol: "none", smooth: true },
			{ name: "预测价格", type: "line", data: fcPrices, smooth: true, symbol: "none", lineStyle: { color: "#00c896", width: 2 } },
		],
	};
}

async function initBtcAnalysisCharts() {
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
		if (tableEl) {
			tableEl.innerHTML =
				'<p style="padding:1rem;color:#9a7a5a;text-align:center">数据加载失败，请稍后重试。</p>';
		}
	}
	return cleanupBtcCharts;
	})();

	return state.initPromise.finally(() => {
		state.initPromise = null;
	});
}

function scheduleChartInitialization() {
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
		if (state.idleTimer) {
			window.clearTimeout(state.idleTimer);
			state.idleTimer = null;
		}
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

	state.idleTimer = window.setTimeout(runInit, 300);
}

registerPageScript("btc-analysis-chart", {
	shouldRun: hasBtcChartElements,
	init() {
		scheduleChartInitialization();

		return cleanupBtcCharts;
	},
});

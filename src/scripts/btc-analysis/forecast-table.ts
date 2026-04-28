import type { BtcForecastEntry } from "./types";

const LABELS = {
  date: "\u65e5\u671f",
  forecastPrice: "\u9884\u6d4b\u4ef7\u683c",
  range68: "68% \u533a\u95f4",
  range95: "95% \u533a\u95f4",
};

function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

export function renderForecastTable(
  forecast: BtcForecastEntry[],
  tableEl: HTMLElement,
): void {
  let html =
    '<table style="width:100%;border-collapse:collapse;font-size:0.82rem"><thead><tr style="border-bottom:1px solid rgba(128,128,128,0.15)">' +
    `<th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#5a7a9a;text-transform:uppercase;letter-spacing:0.04em">${LABELS.date}</th>` +
    `<th style="padding:8px 12px;text-align:right;font-size:0.72rem;color:#5a7a9a">${LABELS.forecastPrice}</th>` +
    `<th style="padding:8px 12px;text-align:right;font-size:0.72rem;color:#5a7a9a">${LABELS.range68}</th>` +
    `<th style="padding:8px 12px;text-align:right;font-size:0.72rem;color:#5a7a9a">${LABELS.range95}</th>` +
    "</tr></thead><tbody>";

  for (let index = 0; index < forecast.length; index += 1) {
    const row = forecast[index];
    const week = Math.ceil((index + 1) / 7);
    const weekMark =
      (index + 1) % 7 === 0
        ? ` <span style="color:#2a4a6a;font-size:0.7rem">W${week}</span>`
        : "";
    const isBold =
      index === 29 || index === 59 || index === 89 || index === 182;
    const background = isBold ? "background:rgba(247,147,26,0.04)" : "";
    const fontWeight = isBold ? "font-weight:600" : "";

    html += `<tr style="border-bottom:1px solid rgba(128,128,128,0.05);${background}"><td style="padding:6px 12px;color:#7090b0">${row.date}${weekMark}</td><td style="padding:6px 12px;text-align:right;color:#f7931a;${fontWeight}">${formatCurrency(row.forecast)}</td><td style="padding:6px 12px;text-align:right;color:#4a8a6a;font-size:0.78rem">${formatCurrency(row.lower_68)} ~ ${formatCurrency(row.upper_68)}</td><td style="padding:6px 12px;text-align:right;color:#2a4a6a;font-size:0.78rem">${formatCurrency(row.lower_95)} ~ ${formatCurrency(row.upper_95)}</td></tr>`;
  }

  html += "</tbody></table>";
  tableEl.innerHTML = html;
}

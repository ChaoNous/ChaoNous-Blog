import {
  BTC_MAIN_SELECTOR,
  BTC_MINI_SELECTOR,
  BTC_TABLE_SELECTOR,
} from "./constants";

export function getChartElements() {
  const mainEl = document.querySelector<HTMLElement>(BTC_MAIN_SELECTOR);
  const miniEl = document.querySelector<HTMLElement>(BTC_MINI_SELECTOR);
  const tableEl = document.querySelector<HTMLElement>(BTC_TABLE_SELECTOR);
  return { mainEl, miniEl, tableEl };
}

export function getChartMountElement() {
  return document.querySelector<HTMLElement>(BTC_MAIN_SELECTOR);
}

export function hasBtcChartElements(): boolean {
  const { mainEl, miniEl, tableEl } = getChartElements();
  return Boolean(mainEl && miniEl && tableEl);
}

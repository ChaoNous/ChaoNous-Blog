export interface EChartsType {
  isDisposed(): boolean;
  dispose(): void;
  setOption(option: unknown): void;
  resize(): void;
}

export interface BtcHistoryEntry {
  date: string;
  price: number;
}

export interface BtcForecastEntry {
  date: string;
  forecast: number;
  upper_68: number;
  lower_68: number;
  upper_95: number;
  lower_95: number;
}

export interface BtcData {
  history: BtcHistoryEntry[];
  forecast: BtcForecastEntry[];
}

export interface BtcChartState {
  mainChart: EChartsType | null;
  miniChart: EChartsType | null;
  resizeHandler: (() => void) | null;
  intersectionObserver: IntersectionObserver | null;
  idleTimer: number | null;
  initPromise: Promise<void | (() => void)> | null;
}

declare global {
  interface Window {
    echarts?: {
      init: (el: HTMLElement, theme?: unknown, opts?: unknown) => EChartsType;
    };
    __btcAnalysisChartState?: BtcChartState;
    __btcAnalysisEchartsPromise?: Promise<typeof window.echarts>;
    __btcAnalysisDataPromise?: Promise<BtcData>;
  }
}

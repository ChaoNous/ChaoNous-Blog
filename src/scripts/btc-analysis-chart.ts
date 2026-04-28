import { registerPageScript } from "./page-lifecycle.ts";
import {
  cleanupBtcCharts,
  hasBtcChartElements,
  scheduleChartInitialization,
} from "./btc-analysis/runtime";

registerPageScript("btc-analysis-chart", {
  shouldRun: hasBtcChartElements,
  init() {
    scheduleChartInitialization();
    return cleanupBtcCharts;
  },
});

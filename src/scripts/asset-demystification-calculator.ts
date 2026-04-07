import { registerPageScript } from "./page-lifecycle.ts";

function initPropertyCalculator(): (() => void) | undefined {
  const calculators = Array.from(
    document.querySelectorAll<HTMLElement>(".property-calculator"),
  );

  if (calculators.length === 0) {
    return undefined;
  }

  const cleanups = calculators.map((root) => {
    const read = (id: string): number =>
      Number(root.querySelector<HTMLInputElement>(`#${id}`)?.value ?? 0);
    const write = (id: string, text: string): void => {
      const el = root.querySelector<HTMLElement>(`#${id}`);
      if (el) el.textContent = text;
    };

    const formatWan = (value: number): string =>
      `${value.toLocaleString("zh-CN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} 万元`;

    const formatYuan = (value: number): string =>
      `${value.toLocaleString("zh-CN", {
        maximumFractionDigits: 0,
      })} 元/年`;

    const update = (): void => {
      const monthlyRent = read("pc-rent");
      const annualCost = read("pc-cost");
      const vacancyRate = read("pc-vacancy") / 100;
      const rf = read("pc-rf") / 100;
      const rp = read("pc-rp") / 100;
      const growth = read("pc-growth") / 100;
      const utilityWan = read("pc-utility");
      const priceWan = read("pc-price");

      const annualRent = monthlyRent * 12;
      const noi = annualRent * (1 - vacancyRate) - annualCost;
      const spread = rf + rp - growth;

      write("pc-noi", formatYuan(noi));
      write("pc-spread", `${(spread * 100).toFixed(2)}%`);

      if (spread <= 0 || !Number.isFinite(spread)) {
        write("pc-value", "无法估值");
        write("pc-status", "参数失真");
        write("pc-gap", "请下调增长率或提高折现率");
        return;
      }

      const estimateWan = noi / spread / 10000 + utilityWan;
      const gapWan = priceWan - estimateWan;
      const gapPct = estimateWan === 0 ? 0 : (gapWan / estimateWan) * 100;

      write("pc-value", formatWan(estimateWan));

      if (Math.abs(gapPct) <= 5) {
        write("pc-status", "接近合理");
      } else if (gapWan > 0) {
        write("pc-status", "挂牌偏贵");
      } else {
        write("pc-status", "存在折价");
      }

      write(
        "pc-gap",
        `与挂牌价相差 ${gapWan >= 0 ? "+" : ""}${gapWan.toFixed(2)} 万元（${gapPct >= 0 ? "+" : ""}${gapPct.toFixed(1)}%）`,
      );
    };

    const inputs = Array.from(root.querySelectorAll<HTMLInputElement>("input"));
    inputs.forEach((input) => {
      input.addEventListener("input", update);
    });

    update();

    return () => {
      inputs.forEach((input) => {
        input.removeEventListener("input", update);
      });
    };
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}

registerPageScript("asset-demystification-calculator", {
  shouldRun() {
    return document.querySelector(".property-calculator") !== null;
  },
  init: initPropertyCalculator,
});

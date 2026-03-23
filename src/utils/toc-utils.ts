/**
 * TOC 工具函数
 * 提取自 FloatingTOC 和 TOC 组件的公共逻辑
 */

// 日语片假名字符集
export const JAPANESE_KATAKANA = [
	"ア",
	"イ",
	"ウ",
	"エ",
	"オ",
	"カ",
	"キ",
	"ク",
	"ケ",
	"コ",
	"サ",
	"シ",
	"ス",
	"セ",
	"ソ",
	"タ",
	"チ",
	"ツ",
	"テ",
	"ト",
	"ナ",
	"ニ",
	"ヌ",
	"ネ",
	"ノ",
	"ハ",
	"ヒ",
	"フ",
	"ヘ",
	"ホ",
	"マ",
	"ミ",
	"ム",
	"メ",
	"モ",
	"ヤ",
	"ユ",
	"ヨ",
	"ラ",
	"リ",
	"ル",
	"レ",
	"ロ",
	"ワ",
	"ヲ",
	"ン",
];

export interface TOCHeading {
	depth: number;
	slug: string;
	text: string;
	element?: HTMLElement;
}

/**
 * 从 DOM 中提取标题信息
 */
export function extractHeadings(
	container: Element | Document = document,
): TOCHeading[] {
	return Array.from(
		container.querySelectorAll(
			"h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]",
		),
	).map((h) => ({
		depth: parseInt(h.tagName.substring(1)),
		slug: h.id,
		text: (h.textContent || "").replace(/#+\s*$/, ""),
		element: h as HTMLElement,
	}));
}

/**
 * 获取标题的最小深度
 */
export function getMinDepth(headings: TOCHeading[]): number {
	if (headings.length === 0) return 1;
	return Math.min(...headings.map((h) => h.depth));
}

/**
 * 生成徽章内容
 */
export function generateBadge(
	depth: number,
	minDepth: number,
	index: number,
	useJapanese: boolean,
): string {
	if (depth === minDepth) {
		const badgeText =
			useJapanese && index < JAPANESE_KATAKANA.length
				? JAPANESE_KATAKANA[index]
				: (index + 1).toString();
		return badgeText;
	}
	return "";
}

/**
 * 根据滚动位置找到当前活动的标题索引
 */
export function findActiveHeadingIndex(
	headings: HTMLElement[],
	offsetTop: number = 150,
): number {
	let activeIndex = -1;
	for (let i = 0; i < headings.length; i++) {
		const heading = headings[i];
		if (heading.getBoundingClientRect().top <= offsetTop) {
			activeIndex = i;
		} else {
			break;
		}
	}
	return activeIndex;
}

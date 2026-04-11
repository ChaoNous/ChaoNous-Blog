export type HeadingElement = Element & {
  id: string;
  tagName: string;
  textContent: string | null;
  depth?: number;
  getBoundingClientRect(): DOMRect;
};

export type HeadingData = {
  depth: number;
  slug: string;
  text: string;
};

export type HeadingLike = HeadingElement | HeadingData;

export function getHeadingsFromContainer(containerId: string): HeadingElement[];
export function getMinLevel(headings: HeadingLike[]): number;
export function updateActiveHeading(
  headings: HeadingElement[],
  tocItems: HTMLElement[],
  scrollY: number,
  offsetTop?: number,
): number;
export function headingsToData(headings: HeadingElement[]): HeadingData[];

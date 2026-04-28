export function getTrimmedSearchParam(url: URL, name: string): string {
  return url.searchParams.get(name)?.trim() ?? "";
}

export function isPositiveIntegerString(value: string): boolean {
  return /^\d+$/.test(value) && !/^0+$/.test(value);
}

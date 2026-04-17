export function isCurrentPostPage(): boolean {
  return (
    document.querySelector('#main-content[data-is-post-page="true"]') !== null
  );
}

export function removePostPageActionButtons(): void {
  if (!isCurrentPostPage()) return;

  document.getElementById("floating-toc-btn")?.remove();
  document.getElementById("floating-toc-panel")?.remove();
  document.querySelector(".floating-toc-wrapper")?.remove();

  const floatingTocWindow = window as Window & {
    __floatingTocInstance?: { destroy?: () => void } | null;
  };
  floatingTocWindow.__floatingTocInstance?.destroy?.();
  floatingTocWindow.__floatingTocInstance = null;
}

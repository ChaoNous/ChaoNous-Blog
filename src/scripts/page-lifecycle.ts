// Type definitions for page lifecycle system
export interface PageLifecycleRecord {
  name: string;
  shouldRun?: () => boolean;
  init: () => Promise<void | (() => void)> | void | (() => void);
  cleanup: (() => void) | null;
}

export interface PageLifecycleState {
  records: Map<string, PageLifecycleRecord>;
  isSetup: boolean;
  hasSwupHooks: boolean;
}

declare global {
  interface Window {
    __pageLifecycleState?: PageLifecycleState;
  }
}

const lifecycleState: PageLifecycleState = window.__pageLifecycleState || {
  records: new Map<string, PageLifecycleRecord>(),
  isSetup: false,
  hasSwupHooks: false,
};

window.__pageLifecycleState = lifecycleState;

function safeCall<T>(fn: () => T, label: string): T | undefined {
  try {
    return fn();
  } catch (error) {
    console.warn(`[page-lifecycle] ${label} failed:`, error);
    return undefined;
  }
}

function runRecord(record: PageLifecycleRecord): void {
  const shouldRun = record.shouldRun
    ? safeCall(record.shouldRun, `${record.name}:shouldRun`)
    : true;

  if (!shouldRun) {
    if (record.cleanup) {
      safeCall(record.cleanup, `${record.name}:cleanup`);
      record.cleanup = null;
    }
    return;
  }

  if (record.cleanup) {
    safeCall(record.cleanup, `${record.name}:cleanup`);
    record.cleanup = null;
  }

  const cleanup = safeCall(record.init, `${record.name}:init`);
  record.cleanup = typeof cleanup === "function" ? cleanup : null;
}

function runAll(): void {
  lifecycleState.records.forEach((record) => {
    runRecord(record);
  });
}

function cleanupAll(): void {
  lifecycleState.records.forEach((record) => {
    if (record.cleanup) {
      safeCall(record.cleanup, `${record.name}:cleanup`);
      record.cleanup = null;
    }
  });
}

function attachSwupHooks(): boolean {
  if (!window.swup?.hooks || lifecycleState.hasSwupHooks) {
    return false;
  }

  window.swup.hooks.on("content:replace", cleanupAll);
  window.swup.hooks.on("page:view", runAll);
  lifecycleState.hasSwupHooks = true;
  return true;
}

function setupPageLifecycle(): void {
  if (lifecycleState.isSetup) {
    return;
  }

  lifecycleState.isSetup = true;

  document.addEventListener("DOMContentLoaded", runAll);
  document.addEventListener("astro:page-load", runAll);

  if (attachSwupHooks()) {
    return;
  }

  document.addEventListener(
    "swup:enable",
    () => {
      attachSwupHooks();
    },
    { once: true },
  );
}

export function registerPageScript(
  name: string,
  options: { shouldRun?: () => boolean; init: () => Promise<void | (() => void)> | void | (() => void) },
): () => void {
  setupPageLifecycle();

  const record: PageLifecycleRecord = {
    name,
    shouldRun: options?.shouldRun,
    init: options.init,
    cleanup: null,
  };

  lifecycleState.records.set(name, record);

  if (document.readyState === "loading") {
    return () => {
      if (record.cleanup) {
        safeCall(record.cleanup, `${record.name}:cleanup`);
      }
      lifecycleState.records.delete(name);
    };
  }

  runRecord(record);

  return () => {
    if (record.cleanup) {
      safeCall(record.cleanup, `${record.name}:cleanup`);
    }
    lifecycleState.records.delete(name);
  };
}

export function cleanupPageScripts(): void {
  cleanupAll();
}

window.registerPageScript = registerPageScript;
window.cleanupPageScripts = cleanupPageScripts;

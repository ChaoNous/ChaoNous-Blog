const lifecycleState = window.__pageLifecycleState || {
  records: new Map(),
  isSetup: false,
  hasSwupHooks: false,
};

window.__pageLifecycleState = lifecycleState;

function safeCall(fn, label) {
  try {
    return fn();
  } catch (error) {
    console.warn(`[page-lifecycle] ${label} failed:`, error);
    return undefined;
  }
}

function runRecord(record) {
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

function runAll() {
  lifecycleState.records.forEach((record) => {
    runRecord(record);
  });
}

function cleanupAll() {
  lifecycleState.records.forEach((record) => {
    if (record.cleanup) {
      safeCall(record.cleanup, `${record.name}:cleanup`);
      record.cleanup = null;
    }
  });
}

function attachSwupHooks() {
  if (!window.swup?.hooks || lifecycleState.hasSwupHooks) {
    return false;
  }

  window.swup.hooks.on("content:replace", cleanupAll);
  window.swup.hooks.on("page:view", runAll);
  lifecycleState.hasSwupHooks = true;
  return true;
}

function setupPageLifecycle() {
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

export function registerPageScript(name, options) {
  setupPageLifecycle();

  const record = {
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

export function cleanupPageScripts() {
  cleanupAll();
}

window.registerPageScript = registerPageScript;
window.cleanupPageScripts = cleanupPageScripts;

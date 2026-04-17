export interface PageLifecycleRecord {
    name: string;
    shouldRun?: () => boolean;
    init: () => Promise<void | (() => void)> | void | (() => void);
    cleanup: (() => void) | null;
    runVersion: number;
}
export interface PageLifecycleState {
    records: Map<string, PageLifecycleRecord>;
    isSetup: boolean;
}
declare global {
    interface Window {
        __pageLifecycleState?: PageLifecycleState;
        registerPageScript?: typeof registerPageScript;
        cleanupPageScripts?: typeof cleanupPageScripts;
    }
}
const lifecycleState: PageLifecycleState = window.__pageLifecycleState || {
    records: new Map<string, PageLifecycleRecord>(),
    isSetup: false,
};
window.__pageLifecycleState = lifecycleState;
function safeCall<T>(fn: () => T, label: string): T | undefined {
    try {
        return fn();
    }
    catch (error) {
        console.warn(`[page-lifecycle] ${label} failed:`, error);
        return undefined;
    }
}
function isPromiseLike<T>(value: unknown): value is Promise<T> {
    return (typeof value === "object" &&
        value !== null &&
        "then" in value &&
        typeof value.then === "function");
}
function clearCleanup(record: PageLifecycleRecord): void {
    if (!record.cleanup) {
        return;
    }
    safeCall(record.cleanup, `${record.name}:cleanup`);
    record.cleanup = null;
}
function applyCleanupResult(record: PageLifecycleRecord, runVersion: number, cleanup: void | (() => void)): void {
    if (record.runVersion !== runVersion) {
        if (typeof cleanup === "function") {
            safeCall(cleanup, `${record.name}:staleCleanup`);
        }
        return;
    }
    record.cleanup = typeof cleanup === "function" ? cleanup : null;
}
function invalidateRecord(record: PageLifecycleRecord): void {
    record.runVersion += 1;
    clearCleanup(record);
}
function runRecord(record: PageLifecycleRecord): void {
    const shouldRun = record.shouldRun
        ? safeCall(record.shouldRun, `${record.name}:shouldRun`)
        : true;
    const runVersion = record.runVersion + 1;
    record.runVersion = runVersion;
    if (!shouldRun) {
        clearCleanup(record);
        return;
    }
    clearCleanup(record);
    const cleanup = safeCall(record.init, `${record.name}:init`);
    if (isPromiseLike<void | (() => void)>(cleanup)) {
        void cleanup
            .then((resolvedCleanup) => {
            applyCleanupResult(record, runVersion, resolvedCleanup);
        })
            .catch((error) => {
            console.warn(`[page-lifecycle] ${record.name}:init failed:`, error);
        });
        return;
    }
    applyCleanupResult(record, runVersion, cleanup);
}
function runAll(): void {
    lifecycleState.records.forEach((record) => {
        runRecord(record);
    });
}
function cleanupAll(): void {
    lifecycleState.records.forEach((record) => {
        invalidateRecord(record);
    });
}
function setupPageLifecycle(): void {
    if (lifecycleState.isSetup) {
        return;
    }
    lifecycleState.isSetup = true;
    document.addEventListener("DOMContentLoaded", runAll, { once: true });
}
export function registerPageScript(name: string, options: {
    shouldRun?: () => boolean;
    init: () => Promise<void | (() => void)> | void | (() => void);
}): () => void {
    setupPageLifecycle();
    const record: PageLifecycleRecord = {
        name,
        shouldRun: options?.shouldRun,
        init: options.init,
        cleanup: null,
        runVersion: 0,
    };
    lifecycleState.records.set(name, record);
    if (document.readyState === "loading") {
        return () => {
            invalidateRecord(record);
            lifecycleState.records.delete(name);
        };
    }
    runRecord(record);
    return () => {
        invalidateRecord(record);
        lifecycleState.records.delete(name);
    };
}
export function cleanupPageScripts(): void {
    cleanupAll();
}
window.registerPageScript = registerPageScript;
window.cleanupPageScripts = cleanupPageScripts;
window.dispatchEvent(new CustomEvent("page-lifecycle:ready"));

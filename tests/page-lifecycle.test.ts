import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

class FakeEventTarget {
  private listeners = new Map<string, Set<(event: Event) => void>>();

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const nextListener =
      typeof listener === "function"
        ? listener
        : listener.handleEvent.bind(listener);
    const listeners = this.listeners.get(type) || new Set();
    listeners.add(nextListener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ) {
    const listeners = this.listeners.get(type);
    if (!listeners) {
      return;
    }

    const nextListener =
      typeof listener === "function"
        ? listener
        : listener.handleEvent.bind(listener);
    listeners.delete(nextListener);
  }

  dispatchEvent(event: Event) {
    const listeners = this.listeners.get(event.type);
    if (!listeners) {
      return true;
    }

    listeners.forEach((listener) => {
      listener(event);
    });
    return true;
  }
}

class FakeWindow extends FakeEventTarget {
  __pageLifecycleState?: unknown;
  registerPageScript?: unknown;
  cleanupPageScripts?: unknown;
}

class FakeDocument extends FakeEventTarget {
  readyState: DocumentReadyState = "complete";
}

async function loadPageLifecycleModule(label: string) {
  const moduleUrl = pathToFileURL(
    path.resolve("src/scripts/page-lifecycle.ts"),
  ).href;
  return import(`${moduleUrl}?test=${label}-${Date.now()}-${Math.random()}`);
}

function setupFakeDom() {
  const fakeWindow = new FakeWindow();
  const fakeDocument = new FakeDocument();

  Object.assign(globalThis, {
    window: fakeWindow,
    document: fakeDocument,
  });

  return { fakeWindow, fakeDocument };
}

async function flushAsyncWork() {
  await Promise.resolve();
  await Promise.resolve();
}

test("page lifecycle runs registered scripts immediately when document is ready", async () => {
  setupFakeDom();
  const { registerPageScript } = await loadPageLifecycleModule("ready");

  let initCalls = 0;
  registerPageScript("test-script", {
    init() {
      initCalls += 1;
    },
  });

  assert.equal(initCalls, 1);
});

test("page lifecycle disposes stale async initializers when they resolve late", async () => {
  setupFakeDom();
  const { registerPageScript, cleanupPageScripts } =
    await loadPageLifecycleModule("async-cleanup");

  let resolveInit: ((cleanup: () => void) => void) | null = null;
  let cleanupCalls = 0;

  registerPageScript("async-script", {
    init() {
      return new Promise<() => void>((resolve) => {
        resolveInit = resolve;
      });
    },
  });

  cleanupPageScripts();
  resolveInit?.(() => {
    cleanupCalls += 1;
  });
  await flushAsyncWork();

  assert.equal(cleanupCalls, 1);
});

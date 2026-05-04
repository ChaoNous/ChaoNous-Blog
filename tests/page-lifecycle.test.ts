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
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => number;
  setTimeout = globalThis.setTimeout;
  clearTimeout = globalThis.clearTimeout;
}

class FakeDocument extends FakeEventTarget {
  readyState: DocumentReadyState = "complete";
  private querySelectors = new Map<string, unknown>();
  private querySelectorLists = new Map<string, unknown[]>();

  setQuerySelector(selector: string, element: unknown) {
    this.querySelectors.set(selector, element);
  }

  setQuerySelectorAll(selector: string, elements: unknown[]) {
    this.querySelectorLists.set(selector, elements);
  }

  querySelector(selector: string) {
    return this.querySelectors.get(selector) ?? null;
  }

  querySelectorAll(selector: string) {
    return this.querySelectorLists.get(selector) ?? [];
  }
}

class FakeHTMLElement extends FakeEventTarget {
  dataset: Record<string, string> = {};
  textContent = "";
  innerHTML = "";
}

async function loadPageLifecycleModule(label: string) {
  const moduleUrl = pathToFileURL(
    path.resolve("src/scripts/page-lifecycle.ts"),
  ).href;
  return import(`${moduleUrl}?test=${label}-${Date.now()}-${Math.random()}`);
}

function setupFakeDom(readyState: DocumentReadyState = "complete") {
  const fakeWindow = new FakeWindow();
  const fakeDocument = new FakeDocument();
  fakeDocument.readyState = readyState;

  Object.assign(globalThis, {
    window: fakeWindow,
    document: fakeDocument,
    HTMLElement: FakeHTMLElement,
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

test("page lifecycle runs loading-state scripts once on dom ready", async () => {
  const { fakeDocument } = setupFakeDom("loading");
  const { registerPageScript } = await loadPageLifecycleModule("dom-ready");

  let initCalls = 0;
  registerPageScript("test-script", {
    init() {
      initCalls += 1;
    },
  });

  assert.equal(initCalls, 0);

  fakeDocument.readyState = "interactive";
  fakeDocument.dispatchEvent(new Event("DOMContentLoaded"));
  fakeDocument.dispatchEvent(new Event("DOMContentLoaded"));

  assert.equal(initCalls, 1);
});

test("page lifecycle ignores duplicate script registration on the same page", async () => {
  setupFakeDom();
  const { registerPageScript, cleanupPageScripts } =
    await loadPageLifecycleModule("duplicate-registration");

  let initCalls = 0;
  let cleanupCalls = 0;
  registerPageScript("category-widget", {
    init() {
      initCalls += 1;
      return () => {
        cleanupCalls += 1;
      };
    },
  });
  const disposeDuplicate = registerPageScript("category-widget", {
    init() {
      initCalls += 1;
      return () => {
        cleanupCalls += 1;
      };
    },
  });

  disposeDuplicate();
  assert.equal(cleanupCalls, 0);

  cleanupPageScripts();

  assert.equal(initCalls, 1);
  assert.equal(cleanupCalls, 1);
});

test("page lifecycle keeps duplicate loading-state registrations to one run", async () => {
  const { fakeDocument } = setupFakeDom("loading");
  const { registerPageScript } = await loadPageLifecycleModule(
    "duplicate-loading-registration",
  );

  let initCalls = 0;
  registerPageScript("category-widget", {
    init() {
      initCalls += 1;
    },
  });
  registerPageScript("category-widget", {
    init() {
      initCalls += 1;
    },
  });

  fakeDocument.readyState = "interactive";
  fakeDocument.dispatchEvent(new Event("DOMContentLoaded"));

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

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAmbientMotion } from "../useAmbientMotion";

const system = { reduced: false };
const listeners = new Set<() => void>();

describe("ambient motion preference", () => {
  beforeEach(() => {
    system.reduced = false;
    listeners.clear();
    vi.spyOn(window, "matchMedia").mockImplementation(
      () =>
        ({
          get matches() {
            return system.reduced;
          },
          addEventListener: (_type: string, listener: () => void) =>
            listeners.add(listener),
          removeEventListener: (_type: string, listener: () => void) =>
            listeners.delete(listener),
        }) as unknown as MediaQueryList,
    );
    localStorage.clear();
    delete document.documentElement.dataset.tboAmbientMotion;
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    delete document.documentElement.dataset.tboAmbientMotion;
  });

  it("persists a pause and restores it when the dashboard is reopened", () => {
    const first = renderHook(() => useAmbientMotion());
    expect(first.result.current.enabled).toBe(true);
    act(() => first.result.current.toggle());
    expect(document.documentElement.dataset.tboAmbientMotion).toBe("off");
    expect(localStorage.getItem("twobeone-ambient-motion")).toBe("off");
    first.unmount();

    const reopened = renderHook(() => useAmbientMotion());
    expect(reopened.result.current.enabled).toBe(false);
    act(() => reopened.result.current.toggle());
    expect(document.documentElement.dataset.tboAmbientMotion).toBe("on");
  });

  it("honors reduced motion without discarding the saved preference", () => {
    localStorage.setItem("twobeone-ambient-motion", "on");
    system.reduced = true;
    const { result } = renderHook(() => useAmbientMotion());
    expect(result.current.enabled).toBe(false);
    expect(document.documentElement.dataset.tboAmbientMotion).toBe("off");
    expect(localStorage.getItem("twobeone-ambient-motion")).toBe("on");
    act(() => {
      system.reduced = false;
      listeners.forEach((notify) => notify());
    });
    expect(result.current.enabled).toBe(true);
    expect(document.documentElement.dataset.tboAmbientMotion).toBe("on");
    act(() => {
      system.reduced = true;
      listeners.forEach((notify) => notify());
    });
    expect(result.current.enabled).toBe(false);
    expect(document.documentElement.dataset.tboAmbientMotion).toBe("off");
  });

  it("can still pause animations when browser storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    const { result } = renderHook(() => useAmbientMotion());
    act(() => result.current.toggle());
    expect(result.current.enabled).toBe(false);
    expect(document.documentElement.dataset.tboAmbientMotion).toBe("off");
  });
});

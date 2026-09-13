import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAmbientMotion } from "../useAmbientMotion";

const system = vi.hoisted(() => ({ reduced: false }));
vi.mock("motion/react", () => ({ useReducedMotion: () => system.reduced }));

describe("ambient motion preference", () => {
  beforeEach(() => {
    system.reduced = false;
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
    const { result, rerender } = renderHook(() => useAmbientMotion());
    expect(result.current.enabled).toBe(false);
    expect(document.documentElement.dataset.tboAmbientMotion).toBe("off");
    expect(localStorage.getItem("twobeone-ambient-motion")).toBe("on");
    system.reduced = false;
    rerender();
    expect(result.current.enabled).toBe(true);
    expect(document.documentElement.dataset.tboAmbientMotion).toBe("on");
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

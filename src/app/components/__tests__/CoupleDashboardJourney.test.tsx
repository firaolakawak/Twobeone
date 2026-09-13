import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../contexts/LanguageContext";
import {
  getElapsedRelationshipTime,
  JourneyCounter,
  parseRelationshipStart,
} from "../CoupleDashboard";

describe("Our Journey counter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-13T12:00:00Z"));
    localStorage.setItem("twobeone_language", "en");
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("treats a date from Settings as local midnight without shifting the calendar date", () => {
    const start = parseRelationshipStart("2026-09-13");
    expect(start?.getFullYear()).toBe(2026);
    expect(start?.getMonth()).toBe(8);
    expect(start?.getDate()).toBe(13);
    expect(start?.getHours()).toBe(0);
    expect(
      getElapsedRelationshipTime(
        "2026-09-13",
        new Date(2026, 8, 13, 9, 15, 30).getTime(),
      ),
    ).toEqual({ days: 0, hours: 9, minutes: 15, seconds: 30 });
    expect(parseRelationshipStart("2026-02-31")).toBeNull();
    expect(parseRelationshipStart("invalid")).toBeNull();
    expect(
      parseRelationshipStart("2026-09-13T09:00:00+04:00")?.toISOString(),
    ).toBe("2026-09-13T05:00:00.000Z");
  });

  it("shows the first day and rolls all four units over at a full day", () => {
    render(
      <LanguageProvider>
        <JourneyCounter start="2026-09-12T12:00:01Z" />
      </LanguageProvider>,
    );
    const timer = screen.getByRole("timer");
    expect(timer).toHaveAttribute("aria-live", "off");
    expect(timer.querySelector('[data-unit="days"]')).toHaveTextContent("0");
    expect(timer.querySelector('[data-unit="hours"]')).toHaveTextContent("23");
    expect(timer.querySelector('[data-unit="minutes"]')).toHaveTextContent(
      "59",
    );
    expect(timer.querySelector('[data-unit="seconds"]')).toHaveTextContent(
      "59",
    );
    expect(within(timer).getByText("days together")).toBeVisible();
    expect(timer.querySelector(".love-journey__clock-digits")).toHaveTextContent("23:59:59");
    expect(timer).toHaveTextContent("23 hours, 59 minutes, 59 seconds");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(timer.querySelector('[data-unit="days"]')).toHaveTextContent("1");
    expect(timer.querySelector(".love-journey__clock-digits")).toHaveTextContent("00:00:00");
    for (const unit of ["hours", "minutes", "seconds"])
      expect(timer.querySelector(`[data-unit="${unit}"]`)).toHaveTextContent(
        "00",
      );
  });

  it("recalculates from the saved date when the tab becomes visible", () => {
    render(
      <LanguageProvider>
        <JourneyCounter start="2026-09-13T10:00:00Z" />
      </LanguageProvider>,
    );
    vi.setSystemTime(new Date("2026-09-14T15:24:36Z"));
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const timer = screen.getByRole("timer");
    expect(timer.querySelector('[data-unit="days"]')).toHaveTextContent("1");
    expect(timer.querySelector('[data-unit="hours"]')).toHaveTextContent("05");
    expect(timer.querySelector('[data-unit="minutes"]')).toHaveTextContent(
      "24",
    );
    expect(timer.querySelector('[data-unit="seconds"]')).toHaveTextContent(
      "36",
    );
  });

  it("uses an edited date immediately and cleans up its interval", () => {
    const { rerender, unmount } = render(
      <LanguageProvider>
        <JourneyCounter start="2026-09-10T12:00:00Z" />
      </LanguageProvider>,
    );
    expect(
      screen.getByRole("timer").querySelector('[data-unit="days"]'),
    ).toHaveTextContent("3");
    rerender(
      <LanguageProvider>
        <JourneyCounter start="2026-09-13T11:30:00Z" />
      </LanguageProvider>,
    );
    const timer = screen.getByRole("timer");
    expect(timer.querySelector('[data-unit="days"]')).toHaveTextContent("0");
    expect(timer.querySelector('[data-unit="minutes"]')).toHaveTextContent(
      "30",
    );
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

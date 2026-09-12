import { describe, expect, it } from "vitest";
import {
  getElapsedRelationshipTime,
  getNextRelationshipAnniversary,
  parseRelationshipStart,
} from "../relationshipJourney";

describe("relationship journey dates", () => {
  it("parses a Settings calendar date at local midnight", () => {
    const parsed = parseRelationshipStart("2024-02-29");
    expect(parsed).toEqual(new Date(2024, 1, 29));
    expect(parsed?.getHours()).toBe(0);
  });

  it.each([
    undefined,
    null,
    "",
    "invalid",
    "2025-02-29",
    "2026-04-31",
    "2026-13-01",
  ])("rejects an absent or invalid calendar date: %s", (start) =>
    expect(parseRelationshipStart(start)).toBeNull(),
  );

  it("preserves explicit timestamp offsets and copies Date inputs", () => {
    const timestamp = "2024-02-29T19:30:00-05:00";
    expect(parseRelationshipStart(timestamp)?.getTime()).toBe(
      Date.parse(timestamp),
    );
    const original = new Date(timestamp);
    const parsed = parseRelationshipStart(original);
    expect(parsed).toEqual(original);
    expect(parsed).not.toBe(original);
  });

  it("preserves the existing elapsed counter units and future-date clamp", () => {
    const start = new Date(2026, 0, 1);
    const now =
      start.getTime() + 2 * 86_400_000 + 3 * 3_600_000 + 4 * 60_000 + 5_000;
    expect(getElapsedRelationshipTime(start, now)).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
    });
    expect(getElapsedRelationshipTime(start, start.getTime() - 1)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
    expect(getElapsedRelationshipTime("invalid", now)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });
});

describe("getNextRelationshipAnniversary", () => {
  it.each([new Date(2026, 8, 13, 0, 1), new Date(2026, 8, 13, 23, 59, 59)])(
    "keeps an anniversary visible throughout its local calendar day: %s",
    (now) => {
      expect(
        getNextRelationshipAnniversary("2020-09-13", now.getTime()),
      ).toEqual({
        date: new Date(2026, 8, 13),
        daysUntil: 0,
        isToday: true,
      });
    },
  );

  it("rolls a passed anniversary over to the following year", () => {
    expect(
      getNextRelationshipAnniversary(
        "2020-09-13",
        new Date(2026, 8, 14, 8).getTime(),
      ),
    ).toEqual({
      date: new Date(2027, 8, 13),
      daysUntil: 364,
      isToday: false,
    });
  });

  it("starts at the first annual anniversary, not the initial relationship day", () => {
    expect(
      getNextRelationshipAnniversary(
        "2026-09-13",
        new Date(2026, 8, 13, 12).getTime(),
      ),
    ).toEqual({
      date: new Date(2027, 8, 13),
      daysUntil: 365,
      isToday: false,
    });
  });

  it("uses February 28 for a leap-day anniversary in a non-leap year", () => {
    expect(
      getNextRelationshipAnniversary(
        "2024-02-29",
        new Date(2025, 1, 27, 23).getTime(),
      ),
    ).toEqual({
      date: new Date(2025, 1, 28),
      daysUntil: 1,
      isToday: false,
    });
    expect(
      getNextRelationshipAnniversary(
        "2024-02-29",
        new Date(2025, 1, 28, 23).getTime(),
      )?.isToday,
    ).toBe(true);
  });

  it("returns to February 29 in the next leap year", () => {
    expect(
      getNextRelationshipAnniversary(
        "2024-02-29",
        new Date(2028, 1, 28).getTime(),
      ),
    ).toEqual({
      date: new Date(2028, 1, 29),
      daysUntil: 1,
      isToday: false,
    });
  });

  // Run this suite with TZ=America/New_York as well as a non-DST timezone.
  it.each([
    ["2020-03-09", new Date(2026, 2, 8), new Date(2026, 2, 9)],
    ["2020-11-02", new Date(2026, 10, 1), new Date(2026, 10, 2)],
  ])(
    "counts calendar days across spring and fall DST changes: %s",
    (start, now, expectedDate) => {
      expect(getNextRelationshipAnniversary(start, now.getTime())).toEqual({
        date: expectedDate,
        daysUntil: 1,
        isToday: false,
      });
    },
  );

  it("uses the local anniversary date from timestamp and Date inputs", () => {
    const start = new Date(2020, 8, 13, 17, 45);
    const now = new Date(2026, 8, 12, 23, 50).getTime();
    for (const value of [start, start.toISOString()]) {
      expect(getNextRelationshipAnniversary(value, now)).toEqual({
        date: new Date(2026, 8, 13),
        daysUntil: 1,
        isToday: false,
      });
    }
  });

  it.each([
    undefined,
    "invalid",
    "2025-02-29",
    new Date(Number.NaN),
    "2027-01-01",
  ])("returns null for an invalid or future start: %s", (start) =>
    expect(
      getNextRelationshipAnniversary(start, new Date(2026, 8, 13).getTime()),
    ).toBeNull(),
  );

  it("rejects a start later today and an invalid current timestamp", () => {
    expect(
      getNextRelationshipAnniversary(
        new Date(2026, 8, 13, 18),
        new Date(2026, 8, 13, 12).getTime(),
      ),
    ).toBeNull();
    expect(getNextRelationshipAnniversary("2020-09-13", Number.NaN)).toBeNull();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { getLocationClock } from "../locationClock";

const abuDhabi = { latitude: 24.4539, longitude: 54.3773 };
const addisAbaba = { latitude: 9.03, longitude: 38.74 };

afterEach(() => vi.restoreAllMocks());

describe("offline location clocks", () => {
  it("uses each saved city's timezone instead of the viewer's timezone", () => {
    const now = new Date("2026-09-13T12:15:00Z");
    expect(getLocationClock(abuDhabi, now)).toMatchObject({
      timeZone: "Asia/Dubai",
      time: "16:15",
    });
    expect(getLocationClock(addisAbaba, now)).toMatchObject({
      timeZone: "Africa/Addis_Ababa",
      time: "15:15",
    });
  });

  it("applies date-specific daylight saving and non-hour offsets", () => {
    const newYork = { latitude: 40.7128, longitude: -74.006 };
    expect(
      getLocationClock(newYork, new Date("2026-01-15T12:00:00Z"))?.time,
    ).toBe("07:00");
    expect(
      getLocationClock(newYork, new Date("2026-07-15T12:00:00Z"))?.time,
    ).toBe("08:00");
    expect(
      getLocationClock(
        { latitude: 27.7172, longitude: 85.324 },
        new Date("2026-09-13T12:00:00Z"),
      )?.time,
    ).toBe("17:45");
  });

  it("calculates local daylight from the sun's position", () => {
    expect(
      getLocationClock(abuDhabi, new Date("2026-09-13T08:00:00Z")),
    ).toMatchObject({ time: "12:00", isDaylight: true });
    expect(
      getLocationClock(abuDhabi, new Date("2026-09-13T20:00:00Z")),
    ).toMatchObject({ time: "00:00", isDaylight: false });
  });

  it("handles polar summer daylight and winter darkness without sunrise times", () => {
    const tromso = { latitude: 69.6492, longitude: 18.9553 };
    expect(
      getLocationClock(tromso, new Date("2026-06-21T22:00:00Z")),
    ).toMatchObject({ time: "00:00", isDaylight: true });
    expect(
      getLocationClock(tromso, new Date("2026-12-21T10:00:00Z")),
    ).toMatchObject({ time: "11:00", isDaylight: false });
  });

  it.each([
    null,
    undefined,
    { latitude: NaN, longitude: 54 },
    { latitude: 24, longitude: Infinity },
    { latitude: 91, longitude: 54 },
    { latitude: -91, longitude: 54 },
    { latitude: 24, longitude: 181 },
    { latitude: 24, longitude: -181 },
  ])("suppresses the clock for invalid or missing coordinates: %j", (value) => {
    expect(
      getLocationClock(value, new Date("2026-09-13T12:00:00Z")),
    ).toBeNull();
  });

  it("suppresses the clock for an invalid timestamp", () => {
    expect(getLocationClock(abuDhabi, new Date(NaN))).toBeNull();
  });

  it("fails closed when a timezone cannot be formatted", () => {
    vi.spyOn(Intl, "DateTimeFormat").mockImplementationOnce(() => {
      throw new RangeError("Unsupported time zone");
    });
    expect(
      getLocationClock(abuDhabi, new Date("2026-09-13T12:00:00Z")),
    ).toBeNull();
  });
});

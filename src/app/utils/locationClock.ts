import tzLookup from "@photostructure/tz-lookup";
import { getPosition } from "suncalc";

interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationClock {
  timeZone: string;
  time: string;
  isDaylight: boolean;
}

/** Uses the saved coordinates entirely offline; never the viewer's timezone. */
export function getLocationClock(
  coordinates: Coordinates | null | undefined,
  now: Date,
): LocationClock | null {
  if (
    !coordinates ||
    !Number.isFinite(coordinates.latitude) ||
    !Number.isFinite(coordinates.longitude) ||
    Math.abs(coordinates.latitude) > 90 ||
    Math.abs(coordinates.longitude) > 180 ||
    !Number.isFinite(now.getTime())
  ) {
    return null;
  }

  try {
    // The compact boundary database may approximate remote timezone borders.
    // Intl applies that IANA zone's actual date-specific offset, including DST.
    const timeZone = tzLookup(coordinates.latitude, coordinates.longitude);
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(now);
    // SunCalc v2 returns apparent solar altitude in degrees. Solar position
    // also works during polar day/night, where sunrise/set times may be absent.
    const { altitude } = getPosition(
      now,
      coordinates.latitude,
      coordinates.longitude,
    );
    if (!Number.isFinite(altitude)) return null;
    return { timeZone, time, isDaylight: altitude >= 0 };
  } catch {
    // Unsupported zones or a failed lookup must not borrow the browser zone.
    return null;
  }
}

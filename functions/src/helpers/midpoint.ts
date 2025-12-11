import type { Location } from "../../../src/types";
import { membersCol, usersCol } from "../firebase";

export function calculateMidpoint(locations: Location[]): Location {
  // Validate that input is an array
  if (!Array.isArray(locations) || locations.length === 0) {
    throw new Error("Input must be a non-empty array of coordinate objects.");
  }

  let totalLat = 0;
  let totalLng = 0;

  // Loop through all coordinate objects
  for (const point of locations) {
    // Make sure each point has usable lat/lng values
    if (
      typeof point.lat !== "number" ||
      typeof point.lng !== "number" ||
      !Number.isFinite(point.lat) ||
      !Number.isFinite(point.lng)
    ) {
      throw new Error(
        "Each location must contain valid numeric 'lat' and 'lng' fields.",
      );
    }

    totalLat += point.lat;
    totalLng += point.lng;
  }

  // Average latitude and longitude
  return {
    lat: totalLat / locations.length,
    lng: totalLng / locations.length,
  };
}

function isValidLocation(loc: unknown): loc is Location {
  if (!loc || typeof loc !== "object") return false;

  const candidate = loc as { lat?: unknown; lng?: unknown };

  return (
    typeof candidate.lat === "number" &&
    typeof candidate.lng === "number" &&
    Number.isFinite(candidate.lat) &&
    Number.isFinite(candidate.lng)
  );
}

// Distance Matrix types

interface DistanceMatrixValue {
  text: string;
  value: number; // seconds or meters
}

interface DistanceMatrixElement {
  status: string;
  duration?: DistanceMatrixValue;
  distance?: DistanceMatrixValue;
}

interface DistanceMatrixRow {
  elements: DistanceMatrixElement[];
}

interface DistanceMatrixResponse {
  status: string;
  rows: DistanceMatrixRow[];
}

// Travel-time midpoint helpers

function kmToLatDelta(km: number): number {
  const KM_PER_DEG_LAT = 111;
  return km / KM_PER_DEG_LAT;
}

function kmToLngDelta(km: number, latDeg: number): number {
  const KM_PER_DEG_LAT = 111;
  const latRad = (latDeg * Math.PI) / 180;
  const cosLat = Math.cos(latRad) || 1;
  return km / (KM_PER_DEG_LAT * cosLat);
}

function generateCandidatePoints(center: Location, radiusKm = 3): Location[] {
  const latDelta = kmToLatDelta(radiusKm);
  const lngDelta = kmToLngDelta(radiusKm, center.lat);

  const candidates: Location[] = [];

  for (let i = -1; i <= 1; i += 1) {
    for (let j = -1; j <= 1; j += 1) {
      candidates.push({
        lat: center.lat + i * latDelta,
        lng: center.lng + j * lngDelta,
      });
    }
  }

  return candidates;
}

async function getDurationsSeconds(
  origins: Location[],
  destination: Location,
): Promise<number[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not set");
  }

  const originsParam = origins.map((o) => `${o.lat},${o.lng}`).join("|");
  const destinationParam = `${destination.lat},${destination.lng}`;

  const url =
    `https://maps.googleapis.com/maps/api/distancematrix/json` +
    `?origins=${encodeURIComponent(originsParam)}` +
    `&destinations=${encodeURIComponent(destinationParam)}` +
    `&units=metric&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Distance Matrix request failed with status ${response.status}`,
    );
  }

  const data = (await response.json()) as DistanceMatrixResponse;

  if (data.status !== "OK") {
    throw new Error(`Distance Matrix API error: ${data.status}`);
  }

  const durations: number[] = [];

  for (const row of data.rows) {
    const element = row.elements[0];
    if (element && element.status === "OK" && element.duration) {
      durations.push(element.duration.value);
    } else {
      durations.push(Number.POSITIVE_INFINITY);
    }
  }

  return durations;
}

export interface TravelTimeMidpointResult {
  midpoint: Location;
  perUserDurationsSeconds: number[];
  totalDurationSeconds: number;
  averageDurationSeconds: number;
}

// Full travel-time-based midpoint for a session:
// - Loads members -> user docs -> coordinates
// - Builds candidates around the geometric center
// - Uses Distance Matrix to pick candidate that minimizes total travel time.
export async function computeTravelTimeMidpointForSession(
  sessionId: string,
): Promise<TravelTimeMidpointResult | null> {
  const memberSnap = await membersCol(sessionId).get();
  console.log(
    "[Midpoint] Member docs count:",
    memberSnap.size,
    "empty?",
    memberSnap.empty,
  );

  if (memberSnap.empty) {
    console.warn("[Midpoint] No members in session", sessionId);
    return null;
  }

  const uids: string[] = [];

  memberSnap.forEach((doc) => {
    const data = doc.data();
    const uid = data.uid as string | undefined;
    console.log("[Midpoint] Member doc:", doc.id, JSON.stringify(data));

    if (uid) {
      uids.push(uid);
    } else {
      console.warn("[Midpoint] Member doc", doc.id, "has no uid field");
    }
  });

  console.log("[Midpoint] Collected UIDs:", uids);

  if (uids.length === 0) {
    console.warn("[Midpoint] Members have no uids for session", sessionId);
    return null;
  }

  const locations: Location[] = [];

  for (const uid of uids) {
    console.log("[Midpoint] Looking up user with uid field =", uid);

    const userQuery = await usersCol.where("uid", "==", uid).limit(1).get();
    console.log(
      "[Midpoint] User query for uid",
      uid,
      "empty?",
      userQuery.empty,
      "size:",
      userQuery.size,
    );

    if (userQuery.empty) {
      console.warn("[Midpoint] No user doc found with uid =", uid);
      continue;
    }

    const userSnap = userQuery.docs[0];
    const userData = userSnap.data();
    const locCandidate = (userData as { place?: { location?: Location } }).place
      ?.location;

    console.log(
      "[Midpoint] User doc ID:",
      userSnap.id,
      "location:",
      JSON.stringify(locCandidate),
    );

    if (isValidLocation(locCandidate)) {
      locations.push({ lat: locCandidate.lat, lng: locCandidate.lng });
    } else {
      console.warn(
        "[Midpoint] Invalid or missing location for uid",
        uid,
        "place:",
        JSON.stringify((userData as { place?: unknown }).place),
      );
    }
  }

  console.log("[Midpoint] Final locations array:", JSON.stringify(locations));

  if (locations.length === 0) {
    console.warn("[Midpoint] No valid user locations for session", sessionId);
    return null;
  }

  if (locations.length === 1) {
    const only = locations[0];
    return {
      midpoint: only,
      perUserDurationsSeconds: [0],
      totalDurationSeconds: 0,
      averageDurationSeconds: 0,
    };
  }

  const geometricCenter = calculateMidpoint(locations);
  console.log("[Midpoint] Geometric center:", JSON.stringify(geometricCenter));

  const candidates = generateCandidatePoints(geometricCenter, 3);
  console.log("[Midpoint] Candidate points:", JSON.stringify(candidates));

  let bestPoint: Location = geometricCenter;
  let bestTotal = Number.POSITIVE_INFINITY;
  let bestPerUser: number[] = [];

  for (const candidate of candidates) {
    try {
      const durations = await getDurationsSeconds(locations, candidate);
      const finiteDurations = durations.filter((d) => Number.isFinite(d));

      if (finiteDurations.length === 0) {
        continue;
      }

      const total = finiteDurations.reduce((sum, d) => sum + d, 0);

      console.log(
        "[Midpoint] Candidate",
        candidate,
        "total travel seconds =",
        total,
      );

      if (total < bestTotal) {
        bestTotal = total;
        bestPoint = candidate;
        bestPerUser = durations;
      }
    } catch (err) {
      console.error(
        "[Midpoint] Error getting durations for candidate",
        candidate,
        err,
      );
    }
  }

  if (!Number.isFinite(bestTotal)) {
    console.warn(
      "[Midpoint] Could not find a finite travel-time midpoint, using geometric center.",
    );
    bestPoint = geometricCenter;
    bestPerUser = locations.map(() => Number.NaN);
    bestTotal = Number.NaN;
  }

  const avg =
    Number.isFinite(bestTotal) && locations.length > 0
      ? bestTotal / locations.length
      : Number.NaN;

  const result: TravelTimeMidpointResult = {
    midpoint: bestPoint,
    perUserDurationsSeconds: bestPerUser,
    totalDurationSeconds: bestTotal,
    averageDurationSeconds: avg,
  };

  console.log(
    "[Midpoint] Travel-time midpoint result:",
    JSON.stringify(result),
  );

  return result;
}

export async function computeMidpointWithCoords(
  sessionId: string,
): Promise<Location | null> {
  const result = await computeTravelTimeMidpointForSession(sessionId);
  return result ? result.midpoint : null;
}

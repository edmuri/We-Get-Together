import type { Location, Place } from "../../../src/types";

interface PlacesNearbyGeometry {
  location?: {
    lat: number;
    lng: number;
  };
}

interface PlacesNearbyResultItem {
  name: string;
  vicinity?: string;
  rating?: number;
  user_ratings_total?: number;
  place_id: string;
  geometry?: PlacesNearbyGeometry;
}

interface PlacesNearbyResponse {
  status: string;
  results: PlacesNearbyResultItem[];
}

export interface MeetupPlace extends Place {
  rating?: number;
  userRatingsTotal?: number;
  placeId: string;
}

// Find a “best” meet-up place (restaurant/cafe) near the given midpoint.
export async function findBestMeetupPlace(
  center: Location,
): Promise<MeetupPlace | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not set");
  }

  const locationParam = `${center.lat},${center.lng}`;
  const radius = 2000; // meters

  // Simple nearby search for restaurants - change as needed
  const url =
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json" +
    `?location=${encodeURIComponent(locationParam)}` +
    `&radius=${radius}` +
    `&type=restaurant` +
    `&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Places Nearby request failed with status ${response.status}`,
    );
  }

  const data = (await response.json()) as PlacesNearbyResponse;

  if (data.status !== "OK") {
    console.warn("Places Nearby API status:", data.status);
    return null;
  }

  if (!data.results || data.results.length === 0) {
    console.log("Places Nearby: no results");
    return null;
  }

  const sorted = [...data.results].sort((a, b) => {
    const ratingA = a.rating ?? 0;
    const ratingB = b.rating ?? 0;

    if (ratingB !== ratingA) {
      return ratingB - ratingA;
    }

    const countA = a.user_ratings_total ?? 0;
    const countB = b.user_ratings_total ?? 0;

    return countB - countA;
  });

  const top = sorted[0];
  const geom = top.geometry?.location;

  if (!geom) {
    console.warn("Places Nearby: top result missing geometry");
    return null;
  }

  return {
    name: top.name,
    address: top.vicinity ?? "",
    location: { lat: geom.lat, lng: geom.lng },
    rating: top.rating,
    userRatingsTotal: top.user_ratings_total,
    placeId: top.place_id,
  } as MeetupPlace;
}

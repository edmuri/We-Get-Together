import type { Location } from "../../../src/types";

/*
  Purpose: This file contains the api call that will allow us to generate
            the user's route from their location to the calculated midpoint

  Input: Input is two Location types that are the origin and destination

  Example:
          origin = {lat: 48.42893, lng: 61.483427}
          destination = {lat: 48.42893, lng: 61.483427}

  Output:
          polyline - for rendering the route in a map
*/
export async function getRoute(origin: Location, destination: Location) {
  try {
    const endpoint = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Failed to fetch route");

    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      return data.routes[0].overview_polyline.points;
    } else {
      console.log("No routes found");
      return null;
    }
  } catch (err) {
    console.error("Error fetching Google Routes data:", err);
    return null;
  }
}

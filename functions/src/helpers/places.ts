/*
  Purpose: This file contains the api call that will allow us to verify user input for latitude and longitude

  Input: A string that is the user input for the search

  Output: A single coordinate pair in the form:
      { lat: number, lng: number }
*/
export async function getAddressLatnLon(userInput: string) {
  try {
    const endpoint = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      userInput,
    )}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Failed to fetch place");

    const data = await response.json();

    return data.results[0].geometry.location;
  } catch (err) {
    console.error("Error fetching Google Maps data:", err);
    return null;
  }
}

/*
  Purpose: Get autocomplete suggestions for a partial address string.

  Input: userInput: string

  Output: Array of:
    { description: string; placeId: string }
*/
export async function getPlaceSuggestions(userInput: string) {
  try {
    if (!userInput) return [];

    // Call Google Places Autocomplete API
    const endpoint = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      userInput,
    )}&key=${process.env.GOOGLE_MAPS_API_KEY}&types=geocode`;

    // Fetch suggestions
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Failed to fetch place suggestions");

    const data = await response.json();

    if (!data.predictions?.length) {
      return [];
    }

    // Map to desired format
    return data.predictions.map(
      (p: { description: string; place_id: string }) => ({
        description: p.description as string,
        placeId: p.place_id as string,
      }),
    );
  } catch (err) {
    console.error("Error fetching Google Autocomplete suggestions:", err);
    return [];
  }
}

/*
  Purpose: Convert a latitude/longitude pair into a human-readable address string.

  Input: lat: number, lon: number

  Output: A formatted address string, or null on failure
*/
export async function getAddressString(lat: number, lon: number) {
  try {
    const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Failed to fetch place");

    const data = await response.json();

    return data.results[0].formatted_address;
  } catch (err) {
    console.error(
      "Error fetching Google API Conversion: ",
      err,
      `data: ${lat},,,${lon}`,
    );
    return null;
  }
}

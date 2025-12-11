import type { Location } from "../../../src/types";

export async function get_map(
  polyline: string | undefined,
  midpoint: Location,
  coords: ([string, number, number] | null)[],
) {
  try {
    const markers = coords
      .filter((m): m is [string, number, number] => m !== null)
      .map(([name, lat, lng]) => {
        const label = name?.[0]?.toUpperCase() ?? "X";
        // console.log(`[GETTINGMAP]: ${name} at ${lat},${lng}`);
        return `markers=label:${label}|${lat},${lng}`;
      })
      .join("&");

    // Build Static Maps URL
    const mapUrl =
      "https://maps.googleapis.com/maps/api/staticmap" +
      "?size=250x200" +
      "&zoom=11" +
      `&center=${midpoint.lat},${midpoint.lng}` +
      `&${markers}` +
      `&markers=label:M|${midpoint.lat},${midpoint.lng}` +
      (polyline ? `&path=enc:${encodeURIComponent(polyline)}` : "") +
      `&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    // Fetch image from Google
    // console.log(`[GETTING MAP]: FETCHING FROM ${mapUrl}`);
    const mapRes = await fetch(mapUrl);
    const buffer = await mapRes.arrayBuffer();

    // Return image
    return Buffer.from(buffer);
  } catch (err) {
    console.error(err);
    console.error("Failed to generate map");
    return null;
  }
}

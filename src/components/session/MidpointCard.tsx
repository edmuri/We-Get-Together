import { useEffect, useState } from "react";

import { getPlaceFromCoords } from "../../firebase/functions";
import type { Location, Place } from "../../types";
import Loading from "../Loading";

// Displays the midpoint address (or raw coords as fallback)
export default function MidpointCard({
  midpoint,
  place,
}: {
  midpoint: Location | null;
  place: Place | null;
}) {
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    // If backend already picked a place, just use its address
    if (place?.address) {
      setAddress(place.address);
      return;
    }

    // Otherwise, reverse-geocode the midpoint to an address
    if (!midpoint) {
      setAddress("");
      return;
    }

    (async () => {
      try {
        const res = await getPlaceFromCoords({ loc: midpoint });
        setAddress((res?.data as string) || "");
      } catch (e) {
        console.error("Error reverse-geocoding midpoint:", e);
        setAddress("");
      }
    })();
  }, [midpoint, place]);

  if (!midpoint) {
    return (
      <div className="loading-screen">
        <Loading />
      </div>
    );
  }

  const hasPlace = !!place;
  const heading = hasPlace ? "Meet-up place" : "Midpoint address";

  return (
    <div className="shadow-2xs bg-white rounded-md p-3">
      <h3 className="font-bold mb-1">{heading}</h3>

      {hasPlace ? (
        <div className="text-sm">
          <div className="font-semibold">{place.name}</div>
          <div>{place.address}</div>
        </div>
      ) : (
        <p className="text-sm">
          {address || "Address unavailable. Try recalculating midpoint."}
        </p>
      )}
      <div className="mt-3 bg-blue-900 hover:bg-blue-800 transition rounded-full px-6 py-3 text-center">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${place?.location.lat},${place?.location.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-white! no-underline! font-semibold"
        >
          Go to meetup
        </a>
      </div>
    </div>
  );
}

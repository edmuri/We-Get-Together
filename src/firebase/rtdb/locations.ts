import { onValue, ref, set } from "firebase/database";
import { database } from "..";
import type { LiveLocation } from "../schema/LiveLocation";

export function liveLocationRef(sessionId: string, uid: string) {
  return ref(database, `locations/${sessionId}/${uid}`);
}

export async function updateLiveLocation(
  sessionId: string,
  uid: string,
  data: { lat: number; lng: number; speed?: number },
) {
  return set(liveLocationRef(sessionId, uid), {
    lat: data.lat,
    lng: data.lng,
    speed: data.speed ?? 0,
    updatedAt: Date.now(),
  });
}

export function listenToLiveLocations(
  sessionId: string,
  callback: (locations: Record<string, LiveLocation>) => void,
) {
  return onValue(ref(database, `locations/${sessionId}`), (snap) => {
    callback(snap.val() || {});
  });
}

import { collection } from "firebase/firestore";
import { firestore } from "..";

// Returns the collection reference for members of a given session.
export const membersCol = (sessionId: string) =>
  collection(firestore, `sessions/${sessionId}/members`);

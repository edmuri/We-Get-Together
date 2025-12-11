import { collection } from "firebase/firestore";
import { firestore } from "..";

export const sessionsCol = collection(firestore, "sessions");

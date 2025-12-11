import { collection, doc } from "firebase/firestore";
import { firestore } from "..";

export const usersCol = collection(firestore, "users");
export const userDoc = (uid: string) => doc(firestore, "users", uid);

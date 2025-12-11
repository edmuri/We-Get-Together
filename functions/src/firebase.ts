import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import type {
  Location,
  Member,
  Place,
  SessionPhase,
  User,
} from "../../src/types";
import { findBestMeetupPlace } from "./helpers/meetup";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const app = admin.app();

export const firestore = getFirestore();

export const sessionsCol = firestore.collection("sessions");
export const sessionDoc = (sid: string) => sessionsCol.doc(sid);

export const usersCol = firestore.collection("users");
export const userDoc = (uid: string) => usersCol.doc(uid);

export const membersCol = (sessionId: string) =>
  sessionDoc(sessionId).collection("members");
export const memberDoc = (sessionId: string, uid: string) =>
  membersCol(sessionId).doc(uid);

//Good
export async function get_User(uid: string): Promise<User | null> {
  const snap = await userDoc(uid).get();

  if (!snap.exists) {
    return null;
  }

  return snap.data() as User;
}

//Good
export async function create_User(
  uid: string,
  nickname: string,
): Promise<string> {
  const now = Date.now();

  const user: User = {
    uid: uid,
    nickname: nickname,
    joinedAt: now,
    updatedAt: now,
    location: "",
  };

  await userDoc(uid).set(user);
  return user.uid;
}

//Good
export async function update_User(
  uid: string,
  data: Partial<User>,
): Promise<void> {
  const updates = {
    ...data,
    updatedAt: Date.now(),
  };

  await userDoc(uid).update(updates);
}

export async function get_Member(
  sessionId: string,
  uid: string,
): Promise<Member | null> {
  const snap = await memberDoc(sessionId, uid).get();
  if (!snap.exists) {
    return null;
  }

  return snap.data() as Member;
}

export async function create_Member(
  sessionId: string,
  user: User,
  options?: { isHost?: boolean; inSession?: boolean },
): Promise<Member> {
  const isHost = options?.isHost ?? false;
  // const inSession = options?.inSession ?? true;

  const member: Member = {
    ...user,
    isHost: isHost,
    // inSession: inSession, Member does not have attribute 'in session'
  };

  await memberDoc(sessionId, user.uid).set(member);

  return member;
}

export async function update_Member(
  sessionId: string,
  uid: string,
  data: Partial<Pick<Member, "nickname" | "isHost">>,
): Promise<void> {
  const updates = {
    ...data,
    updatedAt: Date.now(),
  };

  await memberDoc(sessionId, uid).update(updates);
}

// ------------- SESSION FUNCTIONS --------------

export const check_joinId = async (joinId: string) => {
  const snap = await sessionsCol.where("id", "==", joinId).limit(1).get();

  if (snap.empty) {
    return null;
  }

  const doc = snap.docs[0];
  const data = doc.data();

  if (data.active === false) {
    return null;
  }

  const status = (data.status as string | undefined) ?? "WAITING_FOR_HOST";

  if (
    status === "CALCULATING" ||
    status === "SHOWING_RESULT" ||
    status === "SESSION_CLOSED"
  ) {
    return "SESSION_IN_PROGRESS";
  }

  return joinId;
};

// not export because its not called from outside here
const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateId(length = 6): string {
  let finalId = "";
  for (let i = 0; i < length; i++) {
    finalId += chars[Math.floor(Math.random() * chars.length)];
  }
  return finalId;
}

export async function generate_UniqueId(): Promise<string> {
  while (true) {
    const code = generateId();
    const snap = await sessionDoc(code).get();

    // if there is NO existing session with this ID, use it
    if (!snap.exists) {
      return code;
    }
    // otherwise loop again and try another code
  }
}

export const create_session = async (hostUid: string) => {
  try {
    const id = await generate_UniqueId(); // join code == Firestore doc id
    const createdAt = Date.now();
    const updatedAt = Date.now();
    const midpointComputed = false;
    const active = true;

    await sessionDoc(id).set({
      id, // join code
      hostId: hostUid, // host user id
      createdAt,
      updatedAt,
      midpointComputed,
      active,
    });

    return id;
  } catch (e) {
    console.error("Unable to create new session", e);
    return null;
  }
};

export const get_session_members = async (
  sessionId: string,
): Promise<Member[]> => {
  //grabs the whole members column
  const membersSnapshot = await membersCol(sessionId).get();
  return membersSnapshot.docs.map((doc) => doc.data() as Member);
};

export const set_session_active = async (id: string, active: boolean) => {
  //grabs a sessionCol
  const q = sessionsCol.where("id", "==", id).limit(1);
  const snap = await q.get();

  if (snap.empty) {
    throw new Error(`Session not found: ${id}`);
  }

  const docRef = snap.docs[0].ref;

  await docRef.update({ active, updatedAt: Date.now() });
};

export const set_session_midpoint = async (
  id: string,
  midpoint: Location,
): Promise<void> => {
  const q = sessionsCol.where("id", "==", id).limit(1);
  const snap = await q.get();

  if (snap.empty) {
    throw new Error(`Session ID not found: ${id}`);
  }

  const docRef = snap.docs[0].ref;

  try {
    const place = await findBestMeetupPlace(midpoint);

    const updateData: {
      midpoint: Location;
      place?: Place;
    } = {
      midpoint,
    };

    if (place) {
      updateData.place = {
        name: place.name,
        address: place.address,
        location: place.location,
      };
    }

    await docRef.set(updateData, { merge: true });
  } catch (e) {
    console.log("Unable to update midpoint / place", e);
  }
};

export const get_session_member_count = async (
  sessionId: string,
): Promise<number> => {
  const q = membersCol(sessionId);
  const snap = await q.get();
  return snap.size;
};

export const remove_member_from_session = async (
  sessionId: string,
  userId: string,
): Promise<void> => {
  await memberDoc(sessionId, userId).delete();
};

export const close_out_session = async (sessionId: string): Promise<void> => {
  const SessDoc = await sessionDoc(sessionId);
  firestore.recursiveDelete(SessDoc);
};

export const get_user_address = async (userId: string): Promise<string> => {
  const user = await userDoc(userId).get();

  if (!user) {
    return "NO USER UNDER THAT";
  }

  const q = user.data() as User;
  return q.location;
};

export const set_session_phase = async (
  sessionId: string,
  status: SessionPhase,
): Promise<void> => {
  const q = sessionsCol.where("id", "==", sessionId).limit(1);
  const snap = await q.get();

  if (snap.empty) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const docRef = snap.docs[0].ref;

  await docRef.update({ phase: status, updatedAt: Date.now() });
};

export const get_user_coords = async (userId: string): Promise<Location> => {
  const snap = await userDoc(userId).get();
  if (!snap.exists) {
    throw new Error("NO USER");
  }

  const data = snap.data();
  if (!data || !data.location) {
    throw new Error("User has no location field");
  }

  return data.place.location as Location;
};

export const get_session_midpoint = async (
  sessionId: string,
): Promise<Location> => {
  const snap = await sessionDoc(sessionId).get();

  if (!snap.exists) throw new Error("NO SESSION UNDER THAT");

  const data = snap.data(); // TS: data is possibly undefined
  if (!data || !data.midpoint) {
    // protect against undefined fields
    throw new Error("User has no location field");
  }

  return data.midpoint as Location;
};

export const get_session_coords = async (sessionId: string, userId: string) => {
  const snap = await membersCol(sessionId).get();

  if (snap.empty) {
    throw new Error("NO SESSION UNDER THAT");
  }
  // console.log("[GET SESSION COORDS] ---- Accessed the user doc");
  const members = snap.docs.map((doc) => {
    const data = doc.data();

    if (
      typeof data.place.location.lat !== "number" ||
      typeof data.place.location.lng !== "number"
    ) {
      return null;
    }

    return [
      data.nickname ?? "Unknown",
      data.place.location.lat,
      data.place.location.lng,
    ].filter(Boolean);
  });

  const secondSnap = await sessionDoc(sessionId).get();
  if (!secondSnap.exists) throw new Error("NO SESSION UNDER THAT");

  const snapData = secondSnap.data(); // TS: data is possibly undefined
  if (!snapData || !snapData.midpoint) {
    // protect against undefined fields
    throw new Error("User has no location field");
  }

  const snap3 = await userDoc(userId).get();
  if (!snap3.exists) {
    throw new Error("NO USER");
  }

  const data3 = snap3.data();
  if (!data3 || !data3.location) {
    throw new Error("User has no location field");
  }

  const userCoords = data3.place.location as Location;

  const midpointLoc = snapData.place.location as Location;
  return [midpointLoc, userCoords, members];
};

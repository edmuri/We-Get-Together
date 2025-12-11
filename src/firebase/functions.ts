import { httpsCallable } from "firebase/functions";

import type { Location, User } from "../types";
import { functions } from ".";

export const getCoords = httpsCallable<{ input: string }, Location>(
  functions,
  "getCoordsFromInput",
);
export const getPlaceFromCoords = httpsCallable(
  functions,
  "getPlaceFromCoords",
);
export const getPlaceSuggestionsFn = httpsCallable<
  { input: string },
  { suggestions: { description: string; placeId: string }[] }
>(functions, "getPlaceSuggestionsFn");

export const getUserFn = httpsCallable<{ uid: string }, User>(
  functions,
  "getUser",
);
export const createUserFn = httpsCallable(functions, "createUser");
export const updateUserFn = httpsCallable(functions, "updateUser");

export const genereateJoinCodeFn = httpsCallable<void, { code: string }>(
  functions,
  "generateCode",
);
export const checkJoinCodeFn = httpsCallable<
  { requestBody: string },
  string | null
>(functions, "checkJoinId");

export const createMemberFn = httpsCallable(functions, "createMember");
export const removeMemberFromSessionFn = httpsCallable(
  functions,
  "removeMemberFromSession",
);

export const closeOutSessionFn = httpsCallable(functions, "closeOutSession");
export const createSessionFn = httpsCallable(functions, "createSession");
export const computeSessionMidpoint = httpsCallable<
  { sessionId: string },
  Location
>(functions, "computeSessionMidpointWithCoords");
export const setSessionActiveFn = httpsCallable(functions, "setSessionActive");
export const setSessionMidpointFn = httpsCallable(
  functions,
  "setSessionMidpoint",
);
export const setSessionPhaseFn = httpsCallable(functions, "setSessionPhase");

export const placeFromCoordsFn = httpsCallable(functions, "getPlaceFromCoords");
export const close_out_session = httpsCallable(functions, "closeOutSession");

export const computeRoute = httpsCallable(functions, "getRoute");

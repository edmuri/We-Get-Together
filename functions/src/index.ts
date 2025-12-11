import { setGlobalOptions } from "firebase-functions";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import type { Location } from "../../src/types";
import {
  check_joinId,
  close_out_session,
  create_Member,
  create_session,
  create_User,
  generate_UniqueId,
  get_Member,
  get_session_coords,
  get_session_member_count,
  get_session_members,
  get_session_midpoint,
  get_User,
  get_user_address,
  get_user_coords,
  remove_member_from_session,
  set_session_active,
  set_session_midpoint,
  set_session_phase,
  update_Member,
  update_User,
} from "./firebase";
import { get_map } from "./helpers/map";
import {
  calculateMidpoint,
  computeTravelTimeMidpointForSession,
  type TravelTimeMidpointResult,
} from "./helpers/midpoint";
import {
  getAddressLatnLon,
  getAddressString,
  getPlaceSuggestions,
} from "./helpers/places";
import { getRoute } from "./helpers/route";

setGlobalOptions({ maxInstances: 10 });

// Generates a random 6-character alphanumeric code for session IDs
exports.generateCode = onCall(async () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return { code: result };
});

// Calculate midpoint for a session based on participant locations stored in Firestore
exports.calculateSessionMidpoint = onCall(async (request) => {
  const { sessionId } = request.data || {};
  if (!sessionId)
    throw new HttpsError("invalid-argument", "sessionId is required");

  // DO NOT USE FIREBASE METHODS FROM /src, define them here fully
  // const members = await getSessionMembers(sessionId);

  // Extract only members with valid locations
  const locations = [] as Location[];

  if (locations.length === 0) {
    throw new HttpsError(
      "failed-precondition",
      "No participants with valid locations for this session.",
    );
  }

  // Compute midpoint
  const midpoint = calculateMidpoint(locations);

  // DO NOT USE FIREBASE METHODS FROM /src, define them here fully
  // Save midpoint into session doc
  // await updateSessionMidpoint(sessionId, midpoint, {name: "Fake name", address: "Fake St.", location: {lat: 0, lng: 0}});

  return { midpoint };
});

exports.computeSessionMidpointWithCoords = onCall(async (request) => {
  const { sessionId } = request.data || {};

  if (!sessionId) {
    console.error("[Callable] Missing sessionId");
    throw new HttpsError("invalid-argument", "sessionId is required");
  }

  const result: TravelTimeMidpointResult | null =
    await computeTravelTimeMidpointForSession(sessionId);

  if (!result) {
    console.error("[Callable] No midpoint found for session", sessionId);
    throw new HttpsError(
      "failed-precondition",
      "No participants with valid locations for this session.",
    );
  }

  const payload = {
    lat: result.midpoint.lat,
    lng: result.midpoint.lng,

    totalDurationSeconds: result.totalDurationSeconds,
    averageDurationSeconds: result.averageDurationSeconds,
    perUserDurationsSeconds: result.perUserDurationsSeconds,
  };

  return payload;
});

exports.getCoordsFromInput = onCall(async (request) => {
  const { input } = request.data || {};
  if (!input) throw new HttpsError("invalid-argument", "userInput is required");
  const coords = await getAddressLatnLon(input);

  if (coords != null) return coords;
  throw new HttpsError(
    "invalid-argument",
    `userInput not mapping to place ${input} -- Getting ${coords}`,
  );
});

exports.getPlaceFromCoords = onCall(async (request) => {
  const { loc } = request.data || {};
  if (!loc)
    throw new HttpsError("invalid-argument", `userInput is required ${loc}`);
  const address = await getAddressString(loc.lat, loc.lng);
  if (address != null) return address;
  throw new HttpsError(
    "invalid-argument",
    `userInput not mapping to place ${loc.lat} # ${loc.lon} -- Getting ${address}`,
  );
});

// Get autocomplete suggestions for a partial address string
exports.getPlaceSuggestionsFn = onCall(async (request) => {
  const { input } = request.data || {};
  if (!input) {
    throw new HttpsError("invalid-argument", "input is required");
  }

  const suggestions = await getPlaceSuggestions(input);
  return { suggestions };
});

exports.getRoute = onCall(async (request) => {
  const { requestBody } = request.data || {};
  if (!requestBody)
    throw new HttpsError("invalid-argument", "request was recieved blank");

  const origin = await get_user_coords(requestBody.userId);
  console.log(
    `[GETROUTE]: building route from origin ${origin.lat}, ${origin.lng}`,
  );

  const midpoint = await get_session_midpoint(requestBody.sessionId);
  console.log(
    `[GETROUTE]: building route to destination ${midpoint.lat}, ${midpoint.lng}`,
  );

  const route = getRoute(origin, midpoint);

  console.log(`[GETROUTE]: recieved route: ${route}`);

  return route;
});

//User functions
exports.getUser = onCall(async (request) => {
  const { uid } = request.data || {};
  if (!uid)
    throw new HttpsError(
      "invalid-argument",
      `userID is required RECIEVED: ${uid}`,
    );

  const userData = await get_User(uid);
  if (!userData) {
    return null;
  }

  return userData;
});

exports.createUser = onCall(async (request) => {
  const { uid, nickname } = request.data || {};
  if (!uid)
    throw new HttpsError(
      "invalid-argument",
      `user info is required ${uid} here`,
    );
  const result = await create_User(uid, nickname);

  return result;
});

exports.updateUser = onCall(async (request) => {
  const { updates } = request.data || {};
  if (!updates)
    throw new HttpsError(
      "invalid-argument",
      `error processing update ${updates}`,
    );

  await update_User(updates.uid, updates.data);
});

//Member functions
exports.getMember = onCall(async (request) => {
  const { memberInfo } = request.data || {};
  if (!memberInfo)
    throw new HttpsError("invalid-argument", "member info not recieved");

  const member = await get_Member(memberInfo.sessionId, memberInfo.uid);

  return member;
});

exports.createMember = onCall(async (request) => {
  const { requestBody } = request.data || {};
  if (!requestBody)
    throw new HttpsError(
      "invalid-argument",
      "call did not contain proper info",
    );

  const member = await create_Member(
    requestBody.sessionId, // plain string
    requestBody.user, // plain User object
    requestBody.optional,
  );

  return member;
});

exports.updateMember = onCall(async (request) => {
  const { requestBody } = request.data || {};
  if (!requestBody)
    throw new HttpsError("invalid-argument", "body not recieved");

  await update_Member(requestBody.sessionId, requestBody.uid, requestBody.data);
});

exports.checkJoinId = onCall(async (request) => {
  const { requestBody } = request.data || {};
  if (!requestBody)
    throw new HttpsError("invalid-argument", "did not recieve request");

  const joinId = await check_joinId(requestBody);

  return joinId;
});

exports.generateUniqueId = onCall(async (request) => {
  const { requestBody } = request.data || {};
  if (!requestBody)
    throw new HttpsError("invalid-argument", "did not recieve request");

  const uniqueId = await generate_UniqueId();

  return uniqueId;
});

exports.createSession = onCall(async (request) => {
  const { requestBody } = request.data || {};
  if (!requestBody)
    throw new HttpsError(
      "invalid-argument",
      `did not recieve request ${requestBody}`,
    );

  const id = await create_session(requestBody);

  return id;
});

exports.getSessionMembers = onCall(async (request) => {
  const { requestBody } = request.data || {};
  if (!requestBody)
    throw new HttpsError("invalid-argument", "did not recieve request");

  const memberMap = get_session_members(requestBody.sessionId);
  return memberMap;
});

exports.setSessionActive = onCall(async (request) => {
  const { requestBody } = request.data || {};
  if (!requestBody)
    throw new HttpsError("invalid-argument", "did not recieve request");

  await set_session_active(requestBody.id, requestBody.active);
});

exports.setSessionMidpoint = onCall(async (request) => {
  const { requestBody } = request.data || {};
  if (!requestBody)
    throw new HttpsError("invalid-argument", "did not recieve request");

  await set_session_midpoint(requestBody.id, requestBody.midpoint);
});

exports.getSessionMemberCount = onCall(async (request) => {
  const { requestBody } = request.data || {};
  if (!requestBody)
    throw new HttpsError("invalid-argument", "did not recieve request");

  const memberCount = await get_session_member_count(requestBody.sessionId);
  return memberCount;
});

exports.getUserAddress = onCall(async (request) => {
  const { requestBody } = request.data || {};
  if (!requestBody)
    throw new HttpsError("invalid-argument", "did not recieve request");
  // if(!requestBody)
  const address = await get_user_address(requestBody.uid);
  return address;
});

exports.setSessionPhase = onCall(async (request) => {
  const { requestBody } = request.data || {};
  if (!requestBody)
    throw new HttpsError("invalid-argument", "did not recieve request");

  await set_session_phase(requestBody.sessionId, requestBody.status);
});

// exports.getMemberCoords = onCall(async(request)=>{
//   const {requestBody} = request.data || {};
//   if(!requestBody)
//       throw new HttpsError("invalid-argument","did not recieve request");

//   const coords = await get_member_coords(requestBody.sessionId);

//   return coords;
// });

exports.removeMemberFromSession = onCall(async (request) => {
  const { requestBody } = request.data || {};
  if (!requestBody)
    throw new HttpsError("invalid-argument", "did not recieve request");
  await remove_member_from_session(requestBody.sessionId, requestBody.userId);
});

exports.closeOutSession = onCall(async (request) => {
  const { requestBody } = request.data || {};
  if (!requestBody)
    throw new HttpsError("invalid-argument", `did not recieve request`);

  console.log(`[CLOSE OUT SESSION]: Closing session ${requestBody.sessionId}`);
  await close_out_session(requestBody.sessionId);
});

exports.getMap = onRequest(async (request, res) => {
  const { sessionId, userId } = request.query || {};
  if (!sessionId)
    throw new HttpsError("invalid-argument", `did not recieve request`);

  console.log(
    `[GETMAP]: ${sessionId} has requested the route and map for ${userId}`,
  );

  const coords = await get_session_coords(
    sessionId as string,
    userId as string,
  );

  let polyline = await getRoute(coords[1] as Location, coords[0] as Location);
  if (!polyline) {
    polyline = "";
  }

  // console.log(`[GETMAP]: ${polyline} with ${coords[2]}`);
  // console.log(`[GETMAP]: ${coords[1] as Location} with ${coords[0] as Location}`);

  const map = await get_map(
    polyline,
    coords[0] as Location,
    coords[2] as ([string, number, number] | null)[],
  );

  if (!map) {
    res.status(500).send("Failed to generate map");
    return;
  }

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).send(map);
});

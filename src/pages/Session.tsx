import { getDoc, limit, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import HostCalculate from "../components/session/Host/HostCalculate";
import HostLoadingMidpoint from "../components/session/Host/HostLoadingMidpoint";
import HostMidpoint from "../components/session/Host/HostMidpoint";
import MemberCalculate from "../components/session/Member/MemberCalculate";
import MemberLoadingPoint from "../components/session/Member/MemberLoadingMidpoint";
import MemberMidpoint from "../components/session/Member/MemberMidpoint";
import SessionLayout from "../components/session/SessionLayout";
import { sessionsCol } from "../firebase/collections/sessions";
import { userDoc } from "../firebase/collections/users";
import type { Session as SessionType } from "../firebase/schema/Session";
import { useAuth, useSession } from "../providers";
import type { Location, Place, SessionPhase } from "../types";

import "../styles/session.css";

export default function Session() {
  const [hostName, setHostName] = useState<string>("Host_Name");
  const [userLocation, setUserLocation] = useState<string>("");
  const [midpoint, setMidpoint] = useState<Location | null>(null);
  const [place, setPlace] = useState<Place | null>(null);

  const { uid } = useAuth();
  const { sid, role, phase, setPhase } = useSession();

  // Listen to session doc: phase/status + hostId + midpoint + place
  useEffect(() => {
    const q = query(sessionsCol, where("id", "==", sid), limit(1));

    const unsub = onSnapshot(q, async (snap) => {
      if (snap.empty) return;

      const sessionDoc = snap.docs[0];
      const data = sessionDoc.data() as SessionType & {
        hostId?: string;
        status?: string;
      };

      const phaseFromDoc = data.status ?? data.phase;
      if (phaseFromDoc) {
        setPhase(phaseFromDoc as SessionPhase);
      }

      if (data.midpoint) {
        setMidpoint(data.midpoint as Location);
      }

      if (data.place) {
        setPlace(data.place as Place);
      }

      if (data.hostId) {
        try {
          const hostSnap = await getDoc(userDoc(data.hostId));
          if (hostSnap.exists())
            setHostName(hostSnap.data().nickname || "Host");
        } catch (e) {
          console.error("Error loading host user:", e);
        }
      }
    });

    return () => unsub();
  }, [sid, setPhase]);

  // Load current user's address for "Your Location"
  useEffect(() => {
    if (!uid) return;

    (async () => {
      try {
        const userSnap = await getDoc(userDoc(uid));
        if (userSnap.exists()) {
          setUserLocation(userSnap.data().location || "");
        }
      } catch (e) {
        console.error("Error loading user location:", e);
      }
    })();
  }, [uid]);

  return (
    <SessionLayout
      hostName={hostName}
      location={userLocation || "Unknown location"}
    >
      {phase === "SESSION_CLOSED" ? (
        <div className="text-center">
          <h3 className="font-bold">Session ended</h3>
          <p>The host has ended this session.</p>
        </div>
      ) : role === "host" ? (
        phase === "WAITING_FOR_HOST" ? (
          <HostCalculate />
        ) : phase === "CALCULATING" ? (
          <HostLoadingMidpoint />
        ) : (
          <HostMidpoint midpoint={midpoint} place={place} />
        )
      ) : phase === "WAITING_FOR_HOST" ? (
        <MemberCalculate />
      ) : phase === "CALCULATING" ? (
        <MemberLoadingPoint />
      ) : (
        <MemberMidpoint midpoint={midpoint} place={place} />
      )}
    </SessionLayout>
  );
}

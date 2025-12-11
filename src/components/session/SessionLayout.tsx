import { onSnapshot, query } from "firebase/firestore";
import { motion } from "framer-motion";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import Logo2 from "../../assets/logo-2.svg";
import { membersCol } from "../../firebase/collections/members";
import {
  closeOutSessionFn,
  removeMemberFromSessionFn,
  setSessionActiveFn,
  setSessionPhaseFn,
} from "../../firebase/functions";
import { useAuth, useSession } from "../../providers";
import type { Member } from "../../types";
import Alert from "../Alert";
import MembersList from "./MembersList";

type AlertType = "regular" | "error";

import "../../styles/session.css";

export default function SessionLayout({
  children,
  hostName,
  location,
}: {
  children: ReactNode;
  hostName?: string;
  location?: string;
}) {
  const [members, setMembers] = useState(0);
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const [alertInfo, setAlertInfo] = useState<{
    id: number;
    message: string;
    type: AlertType;
  } | null>(null);

  const alertIdRef = useRef(0);
  const isInitialSnapshot = useRef(true);

  const { uid } = useAuth();
  const navigate = useNavigate();
  const { sid, role, setSid, setPhase } = useSession();

  // Live member count
  useEffect(() => {
    if (!sid) return;

    const q = query(membersCol(sid));
    const unsub = onSnapshot(q, (snap) => {
      setMembers(snap.size);
      setMembersList(snap.docs.map((doc) => doc.data() as Member));

      if (isInitialSnapshot.current) {
        isInitialSnapshot.current = false;
        return;
      }

      snap.docChanges().forEach((change) => {
        const member = change.doc.data() as Member;
        const nickname = member.nickname || "Someone";

        const memberUid = member.uid;
        if (memberUid === uid) return;

        alertIdRef.current += 1;

        if (change.type === "added") {
          setAlertInfo({
            id: alertIdRef.current,
            message: `${nickname} joined the session.`,
            type: "regular",
          });
        } else if (change.type === "removed") {
          setAlertInfo({
            id: alertIdRef.current,
            message: `${nickname} left the session.`,
            type: "error",
          });
        }
      });
    });

    return () => unsub();
  }, [sid, uid]);

  async function handleExit() {
    try {
      await removeMemberFromSessionFn({
        requestBody: { sessionId: sid, userId: uid },
      });
      if (role === "host") {
        await setSessionPhaseFn({
          requestBody: { sessionId: sid, status: "SESSION_CLOSED" },
        });

        await setSessionActiveFn({
          requestBody: { id: sid, active: false },
        });

        await closeOutSessionFn({ requestBody: { sessionId: sid } });
      }
    } catch (e) {
      console.error("Error ending/leaving session:", e);
    } finally {
      setSid(null);
      setPhase("WAITING_FOR_HOST");
      localStorage.removeItem("sid");
      navigate("/");
    }
  }

  function handleMemberClick() {
    setIsMembersOpen(true);
  }

  async function handleRemoveMember(member: Member) {
    if (!sid) return;
    if (member.uid === uid) {
      // optional: prevent host from kicking themselves this way
      return;
    }

    try {
      await removeMemberFromSessionFn({
        requestBody: { sessionId: sid, userId: member.uid },
      });
      // Firestore onSnapshot will auto-update the list and member count
    } catch (e) {
      console.error("Error removing member:", e);
      // optional: show an error Alert
    }
  }

  return (
    <motion.div
      initial={{ y: 30, scale: 0.95, opacity: 0 }}
      animate={{ y: 0, scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      className="flex flex-col h-screen w-screen items-center justify-center p-10"
    >
      {/* // <div className="flex flex-col h-screen w-screen items-center justify-center p-10"> */}
      {alertInfo && (
        <Alert
          key={alertInfo.id}
          message={alertInfo.message}
          type={alertInfo.type}
          durationMs={3000}
        />
      )}

      <div className="flex flex-row justify-between">
        <img
          src={Logo2}
          alt="logo"
          className="w-[100px] justify-left items-start flex"
        />

        <div
          id="session-id"
          className="font-bold p-2.5 border rounded-3xl border-white m-auto"
        >
          {sid}
        </div>
      </div>

      <div
        id="login-container"
        className="flex flex-col gap-5 rounded-md shadow-2xl
         text-black
        bg-white p-[15px] min-h-[550px] min-w-[300px] z-999"
      >
        <div className="flex flex-col gap-4 w-full justify-start">
          {role === "host" ? (
            <h3 className="font-bold">Your Session</h3>
          ) : (
            <h3 className="font-bold">{hostName}'s Session</h3>
          )}
          <div className="flex w-full justify-start">
            <button
              id="number-members"
              className="num-members"
              type="button"
              onClick={handleMemberClick}
            >
              {members} {members !== 1 ? "members" : "member"}
            </button>
          </div>
        </div>

        {children}

        <div
          id="location-popup"
          className="fixed bottom-12 left-1/2 -translate-x-1/2 z-99"
        >
          <button
            type="button"
            aria-label="Toggle your location details"
            aria-expanded={isLocationOpen}
            onClick={() => setIsLocationOpen((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsLocationOpen((prev) => !prev);
              }
            }}
            className={`
              bg-white shadow-lg border border-gray-200
              overflow-hidden cursor-pointer
              transition-all duration-200
              ${isLocationOpen ? " py-2 px-2" : " py-2 px-2"}
             min-w-[300px]
              text-left
            `}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Your Location
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {isLocationOpen ? "▼" : "▲"}
              </span>
            </div>

            {/* Collapsed / Expanded content */}
            {isLocationOpen ? (
              <div className="mt-2 text-sm text-gray-800">
                <div className="font-medium wrap-break-word">{location}</div>
              </div>
            ) : (
              ""
            )}
          </button>
        </div>
      </div>

      <button className="end-session" type="button" onClick={handleExit}>
        {role === "host" ? "End" : "Exit"} session
      </button>

      <MembersList
        isOpen={isMembersOpen}
        members={membersList}
        canRemove={role === "host"}
        onClose={() => setIsMembersOpen(false)}
        onRemoveMember={handleRemoveMember}
      />
    </motion.div>
  );
}

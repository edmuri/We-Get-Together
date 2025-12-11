import { createContext, useContext, useEffect, useState } from "react";

import type { MemberRole, SessionPhase } from "../types";

interface SessionState {
  sid: string | null;
  role: MemberRole;
  nickname: string | null;
  phase: SessionPhase;
  location: string | null;
  setSid: (sid: string | null) => void;
  setRole: (role: MemberRole) => void;
  setNickname: (nickname: string) => void;
  setPhase: (phase: SessionPhase) => void;
  setLocation: (location: string) => void;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sid, setSid] = useState<string | null>(null);
  const [role, setRole] = useState<MemberRole>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [phase, setPhase] = useState<SessionPhase>("WAITING_FOR_HOST");
  const [location, setLocation] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("session");
    if (!stored) return;

    const data = JSON.parse(stored);

    if (data.sid) setSid(data.sid);
    if (data.role) setRole(data.role);
    if (data.nickname) setNickname(data.nickname);
    if (data.phase) setPhase(data.phase);
    if (data.location) setLocation(data.location);
  }, []);

  useEffect(() => {
    const session = {
      sid,
      role,
      nickname,
      phase,
      location,
    };
    localStorage.setItem("session", JSON.stringify(session));
    if (sid) localStorage.setItem("sid", sid);
  }, [sid, role, nickname, phase, location]);

  return (
    <SessionContext.Provider
      value={{
        sid,
        role,
        nickname,
        phase,
        location,
        setSid,
        setRole,
        setNickname,
        setPhase,
        setLocation,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}

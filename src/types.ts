export interface Location {
  lat: number;
  lng: number;
}

export interface Place {
  name: string;
  address: string;
  location: Location;
}

export interface User {
  uid: string;
  nickname: string;
  joinedAt: number;
  updatedAt: number;
  location: string;
  place?: Place | null;
}

export type SessionPhase =
  | "WAITING_FOR_HOST"
  | "CALCULATING"
  | "SHOWING_RESULT"
  | "SESSION_CLOSED";

export interface Member {
  uid: string;
  nickname: string;
  isHost: boolean;
  joinedAt: number;
}

export type MemberRole = "host" | "member" | null;

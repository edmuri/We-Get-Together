import type { Place } from "../../types";

export interface User {
  uid: string;
  nickname: string;
  joinedAt: number;
  updatedAt: number;
  location: string;
  place?: Place | null;
}

import type { Location, Place, SessionPhase } from "../../types.ts";

export interface Session {
  id: string;
  hostId: string;
  createdAt: number;
  updatedAt: number;
  midpointComputed: boolean;
  midpoint?: Location;
  place?: Place;
  options?: Record<string, string>;
  active: boolean;
  phase: SessionPhase;
}

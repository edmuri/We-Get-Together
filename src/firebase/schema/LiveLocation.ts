import type { Location } from "../../types";

export interface LiveLocation extends Location {
  updatedAt: number;
  speed?: number;
}

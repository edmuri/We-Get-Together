import { useState } from "react";

import {
  computeSessionMidpoint,
  setSessionMidpointFn,
  setSessionPhaseFn,
} from "../../../firebase/functions";
import { useSession } from "../../../providers";
import Loading from "../../Loading";

export default function HostCalculate() {
  const [isLoading, setIsLoading] = useState(false);
  const { sid } = useSession();

  async function handleSubmit() {
    setIsLoading(false);
    if (!sid) return;

    try {
      // 1) Set phase -> CALCULATING
      await setSessionPhaseFn({
        requestBody: { sessionId: sid, status: "CALCULATING" },
      });

      // 2) Compute midpoint from users' coordinates
      const result = await computeSessionMidpoint({ sessionId: sid });
      const midpoint = result.data;

      // 3) Persist midpoint to the session document
      await setSessionMidpointFn({
        requestBody: { id: sid, midpoint },
      });

      // 4) Set phase -> SHOWING_RESULT
      await setSessionPhaseFn({
        requestBody: { sessionId: sid, status: "SHOWING_RESULT" },
      });
    } catch (e) {
      console.error("could not calculate", e);
    } finally {
      setIsLoading(true);
    }
  }

  if (isLoading) {
    return (
      <div className="loading-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full items-center justify-center min-h-[225px]">
      <button
        type="button"
        className="default-button-yellow"
        onClick={handleSubmit}
      >
        Calculate Midpoint
      </button>
    </div>
  );
}

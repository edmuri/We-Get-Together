import type { Location, Place } from "../../../types";
import MidpointCard from "../MidpointCard";
import RouteCard from "../RouteCard";

export default function MemberMidpoint({
  midpoint,
  place,
}: {
  midpoint: Location | null;
  place: Place | null;
}) {
  return (
    <div className="flex flex-col w-full items-center justify-center">
      <div className="scroll-auto max-h-[400px]">
        <MidpointCard midpoint={midpoint} place={place} />
        <RouteCard />
      </div>
    </div>
  );
}

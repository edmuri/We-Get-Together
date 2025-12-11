import { computeRoute } from "../../firebase/functions";
import { useAuth, useSession } from "../../providers";

export default function MemberCalRoute() {
  const { uid } = useAuth();
  const { sid } = useSession();

  async function handleSubmit() {
    if (!sid || !uid) return;

    await computeRoute({
      requestBody: { sessionId: sid, userId: uid },
    });
  }

  return (
    <div className="flex flex-col gap-4 w-full items-center justify-center min-h-[225px]">
      <button
        type="button"
        className="default-button-yellow"
        onClick={handleSubmit}
      >
        Get Route
      </button>
    </div>
  );
}

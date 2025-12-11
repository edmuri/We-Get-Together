import { useAuth, useSession } from "../../providers";

export default function RouteCard() {
  const { uid } = useAuth();
  const { sid } = useSession();

  return (
    <div className="shadow-2xs bg-white rounded-md">
      <div>
        <img
          src={
            import.meta.env.DEV
              ? `http://127.0.0.1:5001/cs484-efkn/us-central1/getMap?sessionId=${sid}&userId=${uid}`
              : `https://us-central1-cs484-efkn.cloudfunctions.net/getMap?sessionId=${sid}&userId=${uid}`
          }
          alt="Session Map"
        />
      </div>
    </div>
  );
}

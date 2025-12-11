import { useCallback, useRef, useState } from "react";
import { FiCopy } from "react-icons/fi";
import { useNavigate } from "react-router";
import { useSession } from "../../providers";
import Alert from "../Alert";

type AlertType = "regular" | "error";

export default function HostCode() {
  const navigate = useNavigate();
  const { sid } = useSession();

  const [alertInfo, setAlertInfo] = useState<{
    id: number;
    message: string;
    type: AlertType;
  } | null>(null);

  const alertIdRef = useRef(0);

  const url = `${window.location.origin}/join/${sid}`;

  const showAlert = useCallback(
    (message: string, type: AlertType = "regular") => {
      alertIdRef.current += 1;
      setAlertInfo({
        id: alertIdRef.current,
        message,
        type,
      });
    },
    [],
  );

  const copySid = useCallback(() => {
    if (sid) {
      navigator.clipboard.writeText(sid);
      showAlert("Session code copied!", "regular");
    }
  }, [sid, showAlert]);

  const copyUrl = useCallback(() => {
    if (sid) {
      navigator.clipboard.writeText(url);
      showAlert("Session URL copied!", "regular");
    }
  }, [sid, url, showAlert]);

  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      {alertInfo && (
        <Alert
          key={alertInfo.id}
          message={alertInfo.message}
          type={alertInfo.type}
          durationMs={3000}
        />
      )}

      <div className="flex flex-col items-center gap-4">
        <h3 className="font-bold text-lg text-center">
          This is your session code
        </h3>

        <div className="flex items-center gap-2 justify-center">
          <h3 className="font-bold text-[#062F8F] text-xl">{sid}</h3>
          <button
            type="button"
            onClick={copySid}
            className="button-light p-1 rounded flex items-center"
            title="Copy session code"
          >
            <FiCopy size={16} />
          </button>
        </div>

        <button type="button" onClick={copyUrl} className="button-light">
          Copy Link
        </button>

        <h3 className="font-bold text-center">
          Share this code or link
          <br />
          with your friends!
        </h3>

        <button
          className="button-dark mt-4"
          type="button"
          onClick={() => sid && navigate(`/session/${sid}`)}
        >
          Go to Session
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { createUserFn } from "../../firebase/functions";
import { useAuth, useSession } from "../../providers";
import Alert from "../Alert";
import Loading from "../Loading";

type AlertType = "regular" | "error";

export default function Nickname({ onNext }: { onNext: () => void }) {
  const [nicknameInput, setNicknameInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { uid } = useAuth();
  const { setNickname } = useSession();
  const [alertInfo, setAlertInfo] = useState<{
    id: number;
    message: string;
    type: AlertType;
  } | null>(null);

  async function validateNickname() {
    const raw = nicknameInput.trim();

    const showError = (message: string) => {
      setAlertInfo({
        id: Date.now(),
        message,
        type: "error",
      });
    };

    if (raw === "") {
      showError("Please enter a nickname.");
      return;
    }

    if (raw.length < 2) {
      showError("Nickname must be at least 2 characters long.");
      return;
    }

    const isValid = /^[a-zA-Z0-9]+$/.test(raw);
    if (!isValid) {
      showError(
        "Nickname can only contain letters and numbers (no spaces or symbols).",
      );
      return;
    }

    setNickname(raw);
    setIsLoading(true);

    try {
      await createUserFn({ uid, nickname: raw });
    } catch (e) {
      console.log("Could not create user", e);
      showError("Something went wrong. Please try again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    onNext();
  }

  if (isLoading) {
    return (
      <div className="loading-screen">
        <Loading />
      </div>
    );
  }

  return (
    <>
      {alertInfo && (
        <Alert
          key={alertInfo.id}
          message={alertInfo.message}
          type={alertInfo.type}
          durationMs={4000}
        />
      )}

      <div className="flex flex-col gap-6">
        <h3 className="font-bold">
          What do your friends
          <br />
          know you by?
        </h3>
        <input
          className="login-input"
          type="text"
          placeholder="Enter nickname"
          onKeyDown={(e) => e.key === "Enter" && validateNickname()}
          onChange={(e) => setNicknameInput(e.target.value.toString())}
        />
        <button
          className="button-dark"
          type="button"
          onClick={validateNickname}
        >
          Next
        </button>
      </div>
    </>
  );
}

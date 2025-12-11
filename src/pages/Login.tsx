import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import Alert from "../components/Alert";
import LoginLayout from "../components/entry/LoginLayout";
import { checkJoinCodeFn } from "../firebase/functions";
import { useSession } from "../providers";

type AlertType = "regular" | "error";

export default function Login() {
  const [joinCode, setJoinCode] = useState("");

  const navigate = useNavigate();
  const { setSid, setRole } = useSession();

  const [alertInfo, setAlertInfo] = useState<{
    id: number;
    message: string;
    type: AlertType;
  } | null>(null);

  const alertIdRef = useRef(0);

  const isJoinCodeValid = /^[A-Z0-9]{6}$/.test(joinCode);

  async function validateJoinCode() {
    if (!isJoinCodeValid) {
      return;
    }

    const result = await checkJoinCodeFn({ requestBody: joinCode }).then(
      (res) => res.data,
    );

    if (!result) {
      alertIdRef.current += 1;
      setAlertInfo({
        id: alertIdRef.current,
        message: "Invalid join code. Please try again.",
        type: "error",
      });
    } else if (result === "SESSION_IN_PROGRESS") {
      alertIdRef.current += 1;
      setAlertInfo({
        id: alertIdRef.current,
        message:
          "You can't join this session because the host already started calculating the midpoint.",
        type: "error",
      });
    } else {
      setRole("member");
      setSid(joinCode);
      navigate("/setup");
    }
  }

  return (
    <motion.div
      initial={{ y: 30, scale: 0.95, opacity: 0 }}
      animate={{ y: 0, scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      className="flex flex-col gap-4 items-stretch"
    >
      <LoginLayout>
        {/* Bouncy card container */}

        {alertInfo && (
          <Alert
            key={alertInfo.id}
            message={alertInfo.message}
            type={alertInfo.type}
            durationMs={3000}
          />
        )}

        <h3 className="text-black font-bold">
          Gather your friends
          <br />
          and we'll find a place
        </h3>

        <input
          name="myInput"
          placeholder="Session Code"
          onChange={(e) => setJoinCode(e.target.value.toString().toUpperCase())}
          className="login-input"
          style={{ textTransform: "uppercase" }}
        />

        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={validateJoinCode}
            disabled={!isJoinCodeValid}
            className={`button-dark ${
              !isJoinCodeValid ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Join Session
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("host");
              navigate("/setup");
            }}
            className="button-light"
          >
            Create Session
          </button>
        </div>
      </LoginLayout>
    </motion.div>
  );
}

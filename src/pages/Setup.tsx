import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import LoginLayout from "../components/entry/LoginLayout";
import HostCode from "../components/setup/HostCode";
import Loading from "../components/setup/Loading";
import Location from "../components/setup/Location";
import Nickname from "../components/setup/Nickname";
import { checkJoinCodeFn } from "../firebase/functions";
import { useSession } from "../providers";

import "../index.css";
import "../styles/setup.css";

export default function Setup() {
  const [stage, setStage] = useState<"nickname" | "location" | "hostCode">(
    "nickname",
  );

  const navigate = useNavigate();
  const { code: joinCode } = useParams<{ code: string }>();
  const { sid, role, setSid, setRole } = useSession();

  useEffect(() => {
    if (!joinCode) return;

    const verifyJoinCode = async () => {
      try {
        const result = (await checkJoinCodeFn({ requestBody: joinCode })).data;

        if (!result) {
          alert("Invalid join code. Please try again.");
          navigate("/", { replace: true });
        } else if (result === "SESSION_IN_PROGRESS") {
          alert(
            "You can't join this session because the host already started calculating the midpoint.",
          );
          navigate("/", { replace: true });
        } else {
          setRole("member");
          setSid(joinCode);
        }
      } catch (error) {
        console.error(error);
        alert("Failed to verify join code:");
        navigate("/", { replace: true });
      }
    };

    verifyJoinCode();
  }, [joinCode, navigate, setRole, setSid]);

  return (
    <>
      {stage === "nickname" ? (
        <LoginLayout>
          <Nickname onNext={() => setStage("location")} />
        </LoginLayout>
      ) : stage === "location" ? (
        <LoginLayout>
          <Location
            onNext={() => {
              if (role === "host") {
                setStage("hostCode");
              } else if (role === "member" && sid) {
                navigate(`/session/${sid}`);
              }
            }}
          />
        </LoginLayout>
      ) : stage === "hostCode" ? (
        <LoginLayout>
          <HostCode />
        </LoginLayout>
      ) : (
        <Loading />
      )}
    </>
  );
}

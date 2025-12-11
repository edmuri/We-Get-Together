import { Map as GoogleMap } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import { genereateJoinCodeFn } from "../firebase/functions";

export default function Home() {
  const [code, setCode] = useState("");

  useEffect(() => {
    async function fetchCode() {
      try {
        const result = await genereateJoinCodeFn();
        setCode(result.data.code);
      } catch (err) {
        console.error("Error getting code:", err);
        setCode("Error");
      }
    }

    fetchCode();
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen items-center justify-center gap-6 p-10">
      <h1>Home {code}</h1>

      <div className="w-full max-w-3xl h-96 rounded-lg overflow-hidden shadow-lg border">
        <GoogleMap
          defaultZoom={12}
          defaultCenter={{ lat: 41.8781, lng: -87.6298 }}
          gestureHandling="greedy"
          disableDefaultUI={false}
        />
      </div>
    </div>
  );
}

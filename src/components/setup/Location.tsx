import { useState } from "react";

import {
  createMemberFn,
  createSessionFn,
  createUserFn,
  getCoords,
  getPlaceSuggestionsFn,
  getUserFn,
  placeFromCoordsFn,
  updateUserFn,
} from "../../firebase/functions";
import { useAuth, useSession } from "../../providers";
import type { Location as GeoLocation, User } from "../../types";
import Loading from "../Loading";

export default function GetLocation({ onNext }: { onNext: () => void }) {
  const [showError, setShowError] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<
    { description: string; placeId: string }[]
  >([]);

  const { uid } = useAuth();
  const { role, nickname, sid, setSid } = useSession();

  function handleSubmit() {
    navigator.geolocation.getCurrentPosition(success, error);
  }

  async function updateInput(event: React.ChangeEvent<HTMLInputElement>) {
    const cleanInput = event.target.value.toString();
    setAddressInput(cleanInput);

    if (!cleanInput) {
      setSuggestions([]);
      return;
    }

    try {
      const result = await getPlaceSuggestionsFn({ input: cleanInput });
      setSuggestions(result.data.suggestions ?? []);
    } catch (e) {
      console.error("Autocomplete error:", e);
      setSuggestions([]);
    }
  }

  const handleInput = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (!addressInput) {
        alert("Please enter an address.");
      } else {
        const locResult = await getCoords({ input: addressInput });

        if (locResult?.data) {
          const loc: GeoLocation = {
            lat: locResult.data.lat,
            lng: locResult.data.lng,
          };
          await handleLocationChosen(loc);
        }
      }
    }
  };

  const handleLocationChosen = async (loc: GeoLocation) => {
    setIsLoading(true);
    try {
      if (!uid) {
        console.error("No userId in session context");
        alert("Something went wrong. Please go back and try again.");
        return;
      }

      const username = nickname || "Friend";

      // 1) Get or create user
      const userResult = await getUserFn({ uid: uid });
      let user = userResult.data;

      if (!user) {
        const createRes = await createUserFn({ username });
        const newUid = createRes.data as string;

        user = {
          uid: newUid,
          nickname: username,
          joinedAt: Date.now(),
          updatedAt: Date.now(),
          location: "",
        };
      } else if (user.nickname !== username) {
        await updateUserFn({
          updates: { uid: uid, data: { nickname: username } },
        });
        user = { ...user, nickname: username, updatedAt: Date.now() };
      }

      // 2) Update user location: store address STRING and structured PLACE { lat, lng }
      const placeRes = await placeFromCoordsFn({ loc });
      const address = placeRes?.data as string;

      await updateUserFn({
        updates: {
          uid: user.uid,
          data: {
            // human-readable address
            location: address,
            // structured data used by computeMidpointWithCoords
            place: {
              name: address,
              address,
              location: {
                lat: loc.lat,
                lng: loc.lng,
              },
            },
          },
        },
      });

      // keep local user object in sync as well
      user = {
        ...user,
        location: address,
        place: {
          name: address,
          address,
          location: { lat: loc.lat, lng: loc.lng },
        },
        updatedAt: Date.now(),
      } as User;

      // 3) Role-specific logic
      if (role === "host") {
        // Host: create a new session and become host member
        const result = await createSessionFn({ requestBody: user.uid });
        const joinId = result.data as string;

        if (!joinId) {
          throw new Error("Failed to create session");
        }

        setSid(joinId);

        const toSend = {
          sessionId: joinId,
          user,
          optional: { isHost: true, inSession: true },
        };

        await createMemberFn({ requestBody: toSend });
        onNext();
      } else if (role === "member") {
        // Member: join existing session
        if (!sid) {
          alert("Missing session code. Please go back and enter it again.");
          return;
        }

        const toSend = {
          sessionId: sid,
          user,
          optional: { isHost: false, inSession: true },
        };

        await createMemberFn({ requestBody: toSend });
        onNext();
      } else {
        console.warn("No role set in session context");
        alert("Please choose to create or join a session first.");
      }
    } catch (e) {
      console.error("Error during location setup:", e);
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  function success(position: GeolocationPosition) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    const loc: GeoLocation = { lat: latitude, lng: longitude };
    void handleLocationChosen(loc);
  }

  async function error(_err: GeolocationPositionError) {
    console.log("Tracking error. They have to manually type the address");
    setShowError(true);
  }

  async function handleSuggestionClick(suggestion: {
    description: string;
    placeId: string;
  }) {
    setAddressInput(suggestion.description);
    setSuggestions([]);

    // Convert final address to coords
    const locResult = await getCoords({ input: suggestion.description });

    if (locResult?.data) {
      const loc: GeoLocation = {
        lat: locResult.data.lat,
        lng: locResult.data.lng,
      };
      await handleLocationChosen(loc);
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
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <h3 className="font-bold">
          Please allow location access
          <br />
          so we can calculate your midpoint
        </h3>

        <button className="button-dark" type="button" onClick={handleSubmit}>
          Allow Location Access
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <h4>Or manually enter location</h4>
        <input
          className="login-input"
          placeholder="Enter address"
          value={addressInput}
          onChange={updateInput}
          onKeyDown={handleInput}
        />

        {suggestions.length > 0 && (
          <ul className="bg-white absolute mt-[100px] border rounded-md shadow-sm max-h-30 overflow-y-auto text-left">
            {suggestions.map((s) => (
              <li
                key={s.placeId}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                onClick={() => handleSuggestionClick(s)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleSuggestionClick(s);
                  }
                }}
              >
                {s.description}
              </li>
            ))}
          </ul>
        )}

        {showError && (
          <p className="text-red-500 text-sm">
            There was a problem with your location. Please try typing an
            address.
          </p>
        )}
      </div>
    </div>
  );
}

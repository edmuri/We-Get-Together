import { APIProvider } from "@vis.gl/react-google-maps";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";

import Login from "./pages/Login";
import Session from "./pages/Session";
import Setup from "./pages/Setup";
import { AuthProvider, SessionProvider } from "./providers";

import "./index.css";

export function RedirectIfInSession() {
  const sid = localStorage.getItem("sid");

  if (sid && sid !== "0") return <Navigate to={`/session/${sid}`} replace />;
  else return <Outlet />;
}

export function SessionGuard() {
  const sid = localStorage.getItem("sid");

  if (!sid || sid === "0") return <Navigate to="/" replace />;
  else return <Outlet />;
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <AuthProvider>
        <SessionProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<RedirectIfInSession />}>
                <Route path="/" element={<Login />} />
                <Route path="/setup" element={<Setup />} />
                <Route path="/join/:code" element={<Setup />} />
              </Route>

              <Route element={<SessionGuard />}>
                <Route path="/session/:sid" element={<Session />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SessionProvider>
      </AuthProvider>
    </APIProvider>
  </StrictMode>,
);

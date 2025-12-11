import {
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { auth } from "../firebase";

interface AuthState {
  user: User | null;
  uid: string | null;
}

const AuthContext = createContext<AuthState>({
  user: null,
  uid: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setUid(firebaseUser.uid);
        return;
      }

      try {
        setUser((await signInAnonymously(auth)).user);
      } catch (err) {
        setUid(uuidv4());
        console.error("Anonymous sign-in failed:", err);
      }
    });

    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, uid }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

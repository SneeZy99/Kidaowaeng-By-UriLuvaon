"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AppUser } from "@/lib/types";

interface AuthContextValue {
  firebaseUser: User | null;
  profile: AppUser | null;
  loading: boolean;
  updateProfile: (changes: Pick<AppUser, "username" | "avatarUrl">) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  profile: null,
  loading: true,
  updateProfile: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const ref = doc(db, "users", firebaseUser.uid);
    const fallbackProfile = async () => {
      const token = await firebaseUser.getIdTokenResult();
      setProfile({
        uid: firebaseUser.uid,
        discordId: typeof token.claims.discordId === "string"
          ? token.claims.discordId
          : firebaseUser.uid.replace(/^discord:/, ""),
        username: typeof token.claims.username === "string"
          ? token.claims.username
          : firebaseUser.displayName ?? "สมาชิกแก๊ง",
        avatarUrl: typeof token.claims.avatarUrl === "string"
          ? token.claims.avatarUrl
          : firebaseUser.photoURL ?? "",
        role: token.claims.role === "admin" ? "admin" : "member",
        createdAt: 0,
      });
    };
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as AppUser);
        } else {
          void fallbackProfile();
        }
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load user profile", error);
        void fallbackProfile();
        setLoading(false);
      }
    );
    return () => unsub();
  }, [firebaseUser]);

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = (changes: Pick<AppUser, "username" | "avatarUrl">) => {
    setProfile((current) => (current ? { ...current, ...changes } : current));
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, profile, loading, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

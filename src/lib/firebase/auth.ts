"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./config";
import { AuthUserSession, UserRole, UserProfile } from "@/types";

const LOCAL_AUTH_KEY = "billsync_local_auth_session_v1";

const defaultAdminSession: AuthUserSession = {
  uid: "admin-default-local",
  email: "admin@billsync.local",
  displayName: "Warehouse Admin",
  role: "admin",
};

let cachedSession: AuthUserSession | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function getStoredSession(): AuthUserSession {
  if (typeof window === "undefined") return defaultAdminSession;
  if (cachedSession) return cachedSession;

  try {
    const raw = window.localStorage.getItem(LOCAL_AUTH_KEY);
    if (raw) {
      cachedSession = JSON.parse(raw);
      return cachedSession!;
    }
  } catch (err) {
    console.warn("Failed reading local auth session:", err);
  }

  cachedSession = defaultAdminSession;
  return defaultAdminSession;
}

function setStoredSession(session: AuthUserSession | null): void {
  if (typeof window === "undefined") return;
  cachedSession = session;
  try {
    if (session) {
      window.localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(LOCAL_AUTH_KEY);
    }
  } catch (err) {
    console.warn("Failed saving local auth session:", err);
  }
  notifyListeners();
}

export function subscribeToAuthSession(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Sign in with email and password.
 * Uses Firebase Auth if configured; otherwise authenticates against local demo accounts.
 */
export async function signIn(
  email: string,
  pass: string
): Promise<{ success: boolean; user?: AuthUserSession; error?: string }> {
  if (!email || !pass) {
    return { success: false, error: "Please enter both email and password." };
  }

  if (isFirebaseConfigured() && auth && db) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));
      let role: UserRole = "sales_staff";

      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        role = data.role || "sales_staff";
      }

      const session: AuthUserSession = {
        uid: cred.user.uid,
        email: cred.user.email || email.trim(),
        displayName: cred.user.displayName || email.split("@")[0],
        role,
      };

      setStoredSession(session);
      return { success: true, user: session };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      return { success: false, error: msg };
    }
  }

  // Local Offline / Demo Authentication
  const role: UserRole = email.toLowerCase().includes("staff") ? "sales_staff" : "admin";
  const session: AuthUserSession = {
    uid: `local-${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
    email: email.trim(),
    displayName: email.split("@")[0],
    role,
  };

  setStoredSession(session);
  return { success: true, user: session };
}

/**
 * Sign up a new user account with role selection.
 */
export async function signUp(
  email: string,
  pass: string,
  displayName: string,
  role: UserRole
): Promise<{ success: boolean; user?: AuthUserSession; error?: string }> {
  if (!email || !pass || pass.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  if (isFirebaseConfigured() && auth && db) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const now = new Date().toISOString();
      const profile: UserProfile = {
        uid: cred.user.uid,
        email: email.trim(),
        displayName: displayName.trim() || email.split("@")[0],
        role,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, "users", cred.user.uid), profile);

      const session: AuthUserSession = {
        uid: cred.user.uid,
        email: email.trim(),
        displayName: profile.displayName,
        role,
      };

      setStoredSession(session);
      return { success: true, user: session };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      return { success: false, error: msg };
    }
  }

  // Local Offline / Demo Registration
  const session: AuthUserSession = {
    uid: `local-${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
    email: email.trim(),
    displayName: displayName.trim() || email.split("@")[0],
    role,
  };

  setStoredSession(session);
  return { success: true, user: session };
}

/**
 * Sign out current user.
 */
export async function signOut(): Promise<void> {
  if (isFirebaseConfigured() && auth) {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn("Firebase sign out error:", err);
    }
  }
  setStoredSession(null);
}

/**
 * Switch local user role for instant testing (Admin vs Sales Staff).
 */
export function switchLocalRole(newRole: UserRole): void {
  const current = getStoredSession();
  const updated: AuthUserSession = {
    ...current,
    role: newRole,
    displayName: newRole === "admin" ? "Warehouse Admin" : "Sales Representative",
  };
  setStoredSession(updated);
}

export const switchDemoRole = switchLocalRole;

/**
 * Reactive hook for auth state across all components.
 */
export function useAuth() {
  const session = useSyncExternalStore(
    subscribeToAuthSession,
    getStoredSession,
    () => defaultAdminSession
  );

  const isCloud = isFirebaseConfigured();

  useEffect(() => {
    if (!isCloud || !auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) return;

      try {
        const userDoc = await getDoc(doc(db!, "users", fbUser.uid));
        let role: UserRole = "sales_staff";
        if (userDoc.exists()) {
          role = (userDoc.data() as UserProfile).role || "sales_staff";
        }

        const newSession: AuthUserSession = {
          uid: fbUser.uid,
          email: fbUser.email || "",
          displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "Staff",
          role,
        };
        setStoredSession(newSession);
      } catch (err) {
        console.warn("Error fetching user profile in auth listener:", err);
      }
    });

    return () => unsubscribe();
  }, [isCloud]);

  return {
    user: session,
    role: session ? session.role : "sales_staff",
    isAdmin: session ? session.role === "admin" : false,
    isSalesStaff: session ? session.role === "sales_staff" : true,
    loading: false,
    isCloudAuth: isCloud,
    signIn,
    signUp,
    signOut,
    switchLocalRole,
  };
}

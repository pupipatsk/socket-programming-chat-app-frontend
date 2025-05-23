"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  signIn as firebaseSignIn,
  signUp as firebaseSignUp,
  signOut as firebaseSignOut,
  getIdToken,
  getCurrentUser,
} from "@/lib/firebase";
import { api } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Check authentication state on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const firebaseUser = await getCurrentUser();

        if (firebaseUser) {
          const idToken = await getIdToken();
          setToken(idToken);

          if (idToken) {
            try {
              // Get user profile from backend
              const userProfile = await api.getCurrentUser(idToken);
              setUser(userProfile);
            } catch (error) {
              console.error("Error fetching user profile:", error);
              // If we can't get the profile, sign out
              await firebaseSignOut();
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error("Auth state check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Sign in with Firebase
      const firebaseUser = await firebaseSignIn(email, password);
      const idToken = await firebaseUser.getIdToken();
      // console.log("Firebase user:", firebaseUser)
      // console.log("ID Token:", idToken)
      setToken(idToken);

      await api.updateUserStatus(idToken, "Online");

      // Get user profile from backend
      const userProfile = await api.getCurrentUser(idToken);
      setUser(userProfile);

      router.push("/chat");

      toast({
        title: "Login successful",
        description: `Welcome back, ${userProfile.username}!`,
      });
    } catch (error: unknown) {
      console.error("Login failed:", error);
      const message =
        error instanceof Error ? error.message : "Invalid email or password";
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      setIsLoading(true);

      // Create user in Firebase
      const firebaseUser = await firebaseSignUp(email, password);

      if (!firebaseUser) {
        throw new Error("Firebase signup returned no user");
      }

      const idToken = await firebaseUser.getIdToken();
      setToken(idToken);

      // Register user in backend
      await api.register(idToken, username);

      // Get user profile
      const userProfile = await api.getCurrentUser(idToken);
      setUser(userProfile);

      router.push("/chat");

      toast({
        title: "Registration successful",
        description: `Welcome, ${username}!`,
      });
    } catch (error: unknown) {
      console.error("Registration failed:", error);
      const message =
        error instanceof Error ? error.message : "Could not create account";
      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const guestLogin = async () => {
    try {
      setIsLoading(true);
      const guestEmail = `guest-${Math.floor(
        1000 + Math.random() * 9000
      )}@example.com`;
      const guestPassword = `guest${Math.floor(
        100000 + Math.random() * 900000
      )}`;
      const guestName = `Guest-${Math.floor(1000 + Math.random() * 9000)}`;

      // Create guest account in Firebase
      const firebaseUser = await firebaseSignUp(guestEmail, guestPassword);
      const idToken = await firebaseUser.getIdToken();
      setToken(idToken);

      // Register in backend
      await api.register(idToken, guestName);

      // Get user profile
      const userProfile = await api.getCurrentUser(idToken);
      setUser(userProfile);

      router.push("/chat");

      toast({
        title: "Guest login successful",
        description: `Welcome, ${guestName}!`,
      });
    } catch (error: unknown) {
      console.error("Guest login failed:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Could not create guest account";
      toast({
        title: "Guest login failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.updateUserStatus(token, "Offline"); // Force offline
      }

      await firebaseSignOut();
      setUser(null);
      setToken(null);
      router.push("/");

      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout failed",
        description: "Could not log out",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, guestLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

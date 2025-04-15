import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthContextType } from "../types";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signOut, onAuthStateChanged } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNkjBJJH7xlAg-4W8sJzrqahmf2HDglxM",
  authDomain: "proctored-exam-8b53b.firebaseapp.com",
  databaseURL: "https://proctored-exam-8b53b-default-rtdb.firebaseio.com",
  projectId: "proctored-exam-8b53b",
  storageBucket: "proctored-exam-8b53b.firebasestorage.app",
  messagingSenderId: "656556538635",
  appId: "1:656556538635:web:8633f2666996aeb53a400e",
  measurementId: "G-2HG3PZ4S37"
};

console.log(firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async (email: string, password: string) => {
    throw new Error("AuthContext not initialized");
  },
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get the ID token
        const token = await firebaseUser.getIdToken();
        
        // Get user data from localStorage or create new user data
        const savedUser = localStorage.getItem("user");
        let userData: User;
        
        if (savedUser) {
          userData = JSON.parse(savedUser);
        } else {
          // Get user profile from backend
          const response = await fetch(`http://localhost:5000/api/auth/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const profile = await response.json();
            userData = {
              id: firebaseUser.uid,
              name: profile.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              role: profile.role || 'teacher',
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User')}`,
            };
          } else {
            userData = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              role: 'teacher', // Default role, will be updated by the backend
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User')}`,
            };
          }
          localStorage.setItem("user", JSON.stringify(userData));
        }
        
        setUser(userData);
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Call backend login endpoint with POST method
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }

      const data = await response.json();
      
      // Sign in with Firebase using the custom token
      const userCredential = await signInWithCustomToken(auth, data.customToken);
      const firebaseUser = userCredential.user;
      
      // Save user to state and localStorage
      const userData = {
        id: firebaseUser.uid,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.name)}`,
      };
      
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear user from state and localStorage
      setUser(null);
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

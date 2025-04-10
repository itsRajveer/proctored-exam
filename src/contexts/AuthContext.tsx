
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthContextType } from "../types";

// Mock users for demo
const mockUsers = [
  {
    id: "t1",
    name: "Dr. Smith",
    email: "teacher@example.com",
    role: "teacher" as const,
    avatar: "https://i.pravatar.cc/150?u=teacher",
    classIds: ["c1", "c2"],
  },
  {
    id: "s1",
    name: "John Doe",
    email: "student@example.com",
    role: "student" as const,
    avatar: "https://i.pravatar.cc/150?u=student1",
    classIds: ["c1"],
  },
];

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Find user by email (mock authentication)
      const foundUser = mockUsers.find((u) => u.email === email);
      if (!foundUser) {
        throw new Error("Invalid email or password");
      }
      
      // In a real application, you would validate the password here
      
      // Save user to state and localStorage
      setUser(foundUser);
      localStorage.setItem("user", JSON.stringify(foundUser));
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Clear user from state and localStorage
      setUser(null);
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Logout failed:", error);
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

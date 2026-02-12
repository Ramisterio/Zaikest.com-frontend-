"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { sanitizeEmail, sanitizePassword } from "../utils/sanitize";
import { apiPath } from "../config/env";

type LoginFormProps = {
  onRegisterClick?: () => void;
  onLoginSuccess?: (data: { redirectTo?: string; user?: any }) => void;
};

export default function LoginForm({
  onRegisterClick,
  onLoginSuccess,
}: LoginFormProps) {
  const { refreshUser } = useAuth(); // refresh user context after login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] =
    useState<{ type: "success" | "error"; text: string } | null>(null);

  const getSafeErrorMessage = (data?: { message?: string }) => {
    // Never expose backend route details or internal errors to the client.
    if (!data?.message) return "Login failed. Please try again.";

    const lowered = data.message.toLowerCase();
    if (lowered.includes("invalid") || lowered.includes("credentials")) {
      return "Invalid email or password.";
    }

    return "Login failed. Please try again.";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(
        apiPath("/v1/auth/login"),
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        setMessage({
          type: "error",
          text: getSafeErrorMessage(data),
        });
        return;
      }

      // ✅ Login successful
      setMessage({ type: "success", text: "Login successful! Redirecting..." });
      setEmail("");
      setPassword("");

      // Refresh user context so navbar updates
      await refreshUser();

      const redirectTo = "/";

      // Notify parent (modal + redirect) after a short delay
      setTimeout(() => {
        onLoginSuccess?.({
          redirectTo,
          user: data.user,
        });
      }, 600);
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: "Something went wrong. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className="flex flex-col gap-4 p-6 bg-white rounded-2xl shadow-lg w-full max-w-sm"
    >
      <h2 className="text-2xl font-bold text-center text-gray-900">Login</h2>

      {/* Success / Error Message */}
      {message && (
        <p
          className={`text-center text-lg font-semibold ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
        className="border border-gray-300 bg-white p-3 rounded-xl text-[#1a1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
        required
      />

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(sanitizePassword(e.target.value))}
          className="border border-gray-300 bg-white p-3 pr-12 rounded-xl text-[#1a1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 w-full"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-700 hover:text-black"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white py-3 rounded-xl font-semibold disabled:opacity-60"
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      {onRegisterClick && (
        <button
          type="button"
          onClick={onRegisterClick}
          className="bg-gray-200 py-3 rounded-xl mt-2"
        >
          Register
        </button>
      )}
    </form>
  );
}

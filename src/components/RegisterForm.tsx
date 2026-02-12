"use client";

import { useState } from "react";
import { sanitizeEmail, sanitizePassword, sanitizePhone, sanitizeText } from "../utils/sanitize";
import { apiPath } from "../config/env";

type RegisterFormProps = {
  onLoginClick?: () => void;
  onRegisterSuccess?: () => void;
};

export default function RegisterForm({
  onLoginClick,
  onRegisterSuccess,
}: RegisterFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] =
    useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(
        apiPath("/v1/auth/register"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: fullName,
            email,
            password,
            phone,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        setMessage({
          type: "error",
          text: data.message || "Registration failed",
        });
        return;
      }

      setMessage({
        type: "success",
        text: data.message || "Account created successfully!",
      });

      setTimeout(() => {
        onRegisterSuccess?.();
      }, 2000);

      setFullName("");
      setEmail("");
      setPassword("");
      setPhone("");
    } catch {
      setMessage({
        type: "error",
        text: "Server error. Try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleRegister}
      className="flex flex-col gap-4 p-6 bg-white rounded-2xl shadow-lg w-full max-w-sm"
    >
      <h2 className="text-2xl font-bold text-center text-gray-900">
        Register
      </h2>

      {message && (
        <p
          className={`text-center text-lg font-semibold ${
            message.type === "success"
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <input
        value={fullName}
        onChange={(e) => setFullName(sanitizeText(e.target.value))}
        placeholder="Full Name"
        className="border border-gray-300 bg-white p-3 rounded-xl text-[#1a1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
        required
      />

      <input
        value={email}
        onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
        placeholder="Email"
        type="email"
        className="border border-gray-300 bg-white p-3 rounded-xl text-[#1a1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
        required
      />

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(sanitizePassword(e.target.value))}
          placeholder="Password"
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

      <input
        value={phone}
        onChange={(e) => setPhone(sanitizePhone(e.target.value))}
        placeholder="Phone"
        className="border border-gray-300 bg-white p-3 rounded-xl text-[#1a1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
      />

      <button
        disabled={loading}
        className="bg-black text-white py-3 rounded-xl font-semibold disabled:opacity-60"
      >
        {loading ? "Registering..." : "Register"}
      </button>

      {onLoginClick && (
        <button
          type="button"
          onClick={onLoginClick}
          className="bg-gray-200 text-gray-900 py-3 rounded-xl font-semibold mt-2"
        >
          Login
        </button>
      )}
    </form>
  );
}


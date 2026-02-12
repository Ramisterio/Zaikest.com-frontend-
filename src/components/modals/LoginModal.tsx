// src/components/modals/LoginModal.tsx
"use client";

import { useState, useEffect } from "react";
import Modal from "../Modal";
import LoginForm from "../LoginForm";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

interface LoginModalProps {
  defaultOpen?: boolean;
}

export default function LoginModal({ defaultOpen = false }: LoginModalProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { refreshUser } = useAuth(); // ✅ correct API
  const router = useRouter();

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  const handleLoginSuccess = async (response: {
    redirectTo?: string;
  }) => {
    const { redirectTo } = response;

    // 🔥 1️⃣ Hydrate auth state from cookie
    await refreshUser();

    // 🔥 2️⃣ Close modal
    setOpen(false);

    // 🔥 3️⃣ Backend-driven redirect
    if (redirectTo) {
      router.replace(redirectTo);
    }
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <LoginForm onLoginSuccess={handleLoginSuccess} />
    </Modal>
  );
}

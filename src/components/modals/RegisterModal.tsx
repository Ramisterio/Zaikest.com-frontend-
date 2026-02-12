// src/components/modals/RegisterModal.tsx
"use client";

import { useState, useEffect } from "react";
import Modal from "../Modal";
import RegisterForm from "../RegisterForm";

interface RegisterModalProps {
  defaultOpen?: boolean;
}

export default function RegisterModal({ defaultOpen = false }: RegisterModalProps) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <RegisterForm /> {/* form inside modal */}
    </Modal>
  );
}

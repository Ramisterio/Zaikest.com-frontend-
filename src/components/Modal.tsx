// src/components/Modal.tsx
"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ModalProps = {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  contentClassName?: string;
  closeOnBackdrop?: boolean;
};

export default function Modal({
  children,
  open,
  onClose,
  contentClassName,
  closeOnBackdrop = true,
}: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Blurred background */}
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-45 backdrop-blur-sm"
            onClick={closeOnBackdrop ? onClose : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal content */}
          <motion.div
            className={`relative z-10 w-full max-w-md p-6 bg-white rounded-2xl shadow-lg ${
              contentClassName || ""
            }`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

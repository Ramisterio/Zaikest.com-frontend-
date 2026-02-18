"use client";

import { X } from "lucide-react";
import Modal from "./Modal";
import CheckoutContent from "./CheckoutContent";

export default function CheckoutModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeOnBackdrop={false}
      contentClassName="w-full h-full max-w-none max-h-none p-0 rounded-none bg-transparent"
    >
      <div className="relative h-full w-full overflow-y-auto px-4 py-10 sm:py-12">
        <div className="relative mx-auto w-full max-w-5xl bg-gray-50 rounded-3xl shadow-2xl border border-gray-200">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition"
            aria-label="Close checkout"
          >
            <X size={18} />
          </button>
          <CheckoutContent variant="modal" onRequestClose={onClose} />
        </div>
      </div>
    </Modal>
  );
}

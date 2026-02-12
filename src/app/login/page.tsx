// app/login/page.tsx
"use client";

import LoginModal from "../../components/modals/LoginModal";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <LoginModal defaultOpen /> {/* modal opens automatically */}
    </div>
  );
}

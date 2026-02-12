"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

interface AdminGuardProps {
  children: ReactNode;
}

const AdminGuard = ({ children }: AdminGuardProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/"); // ✅ IMPORTANT
    }
  }, [user, loading, router]);

  // While checking auth
  if (loading) {
    return <p>Checking admin access...</p>;
  }

  // If user is not admin, render nothing (redirect is happening)
  if (!user || user.role !== "admin") {
    return null;
  }

  // ✅ Authorized admin
  return <>{children}</>;
};

export default AdminGuard;

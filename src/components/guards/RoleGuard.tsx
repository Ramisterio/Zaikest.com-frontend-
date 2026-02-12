"use client";

import { ReactNode, ReactElement } from "react";
import { useAuth } from "../../context/AuthContext";

interface RoleGuardProps {
  allow: ("user" | "admin")[]; // allowed roles
  children: ReactNode;
}

export default function RoleGuard({ allow, children }: RoleGuardProps): ReactElement {
  const { user, loading } = useAuth();

  // Show loading while auth state is being fetched
  if (loading) return <p>Checking permissions...</p>;

  // If user is not logged in or role is not allowed
  if (!user || (user.role && !allow.includes(user.role))) {
    return <p className="text-green-600 font-semibold">Access denied</p>;
  }

  return <>{children}</>;
}

"use client";

import { ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";

type PermissionGuardProps = {
  permission: string;
  children: ReactNode;
};

export default function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const { user } = useAuth();

  // ⛔ If user is not logged in or permissions not loaded
  if (!user || !user.permissions) return null;

  // ⛔ If user does not have the required permission
  if (!user.permissions.includes(permission)) return null;

  // ✅ User has permission
  return <>{children}</>;
}

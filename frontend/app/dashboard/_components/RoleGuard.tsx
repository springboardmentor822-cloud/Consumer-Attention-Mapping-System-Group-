"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

type RoleGuardProps = {
  allowedRoles: string[];
  children: React.ReactNode;
};

export default function RoleGuard({
  allowedRoles,
  children,
}: RoleGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "allowed">("checking");

  useEffect(() => {
    let cancelled = false;

    const token = localStorage.getItem("access_token");

    console.log("[RoleGuard] token exists:", !!token);
    console.log("[RoleGuard] allowed roles:", allowedRoles);

    if (!token) {
      console.error("[RoleGuard] NO TOKEN -> redirecting to login");
      router.replace("/login");
      return;
    }

    api
      .getMe()
      .then((me) => {
        if (cancelled) return;

        console.log("[RoleGuard] /api/auth/me response:", me);
        console.log("[RoleGuard] received role:", me.role_name);

        if (!me.role_name || !allowedRoles.includes(me.role_name)) {
          console.error(
            "[RoleGuard] ROLE MISMATCH:",
            me.role_name,
            "allowed:",
            allowedRoles
          );

          localStorage.removeItem("access_token");
          router.replace("/login");
          return;
        }

        console.log("[RoleGuard] ACCESS GRANTED");
        setStatus("allowed");
      })
      .catch((err) => {
        if (cancelled) return;

        console.error("[RoleGuard] getMe FAILED:", err);

        if (err instanceof ApiError) {
          console.error("[RoleGuard] HTTP status:", err.status);
          console.error("[RoleGuard] error:", err.message);
        }

        localStorage.removeItem("access_token");
        router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [allowedRoles.join(",")]);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <p className="text-sm text-muted-foreground">
          Checking access...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
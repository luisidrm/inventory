"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/store/store";
import { useGetRoleByIdQuery } from "@/app/dashboard/roles/_service/rolesApi";
import { PERMISSIONS } from "@/lib/utils";

/**
 * Returns the set of permission codes (e.g. "product.read", "admin") for the
 * currently logged-in user based on their role. Uses GET /role?id= so we only
 * request the user's role (avoids 403 from GET /role list which requires role.read).
 * If the backend returns 403 for role?id= too, ask backend to allow it for the
 * current user's role or to expose GET /account/permissions.
 */
export function useUserPermissionCodes(): {
  permissionCodes: Set<string>;
  isLoading: boolean;
  has: (code: string) => boolean;
} {
  const user = useAppSelector((state) => state.auth);
  const { data: role, isLoading } = useGetRoleByIdQuery(user?.roleId ?? 0, {
    skip: !user?.roleId,
  });

  const permissionCodes = useMemo(() => {
    if (!user?.roleId || !role) return new Set<string>();
    const ids = role.result.permissionIds ?? [];
    const codes = ids
      .map((id) => PERMISSIONS.find((p) => p.id === id)?.code)
      .filter((c): c is string => !!c);
    return new Set(codes);
  }, [user?.roleId, role]);

  const has = useMemo(
    () => (code: string) =>
      permissionCodes.has("admin") || permissionCodes.has(code),
    [permissionCodes]
  );

  return { permissionCodes, isLoading, has };
}

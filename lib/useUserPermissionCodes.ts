"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/store/store";
import { useGetRolesQuery } from "@/app/dashboard/roles/_service/rolesApi";
import { PERMISSIONS } from "@/lib/utils";

/**
 * Returns the set of permission codes (e.g. "product.read", "admin") for the
 * currently logged-in user based on their role. Uses roles API and PERMISSIONS
 * id->code mapping. Admin users effectively have all permissions for UI purposes.
 */
export function useUserPermissionCodes(): {
  permissionCodes: Set<string>;
  isLoading: boolean;
  has: (code: string) => boolean;
} {
  const user = useAppSelector((state) => state.auth);
  const { data: rolesData, isLoading } = useGetRolesQuery(
    { page: 1, perPage: 100 },
    { skip: !user?.roleId }
  );

  const permissionCodes = useMemo(() => {
    if (!user?.roleId) return new Set<string>();
    const role = rolesData?.data?.find((r) => r.id === user.roleId);
    const ids = role?.permissionIds ?? [];
    const codes = ids
      .map((id) => PERMISSIONS.find((p) => p.id === id)?.code)
      .filter((c): c is string => !!c);
    return new Set(codes);
  }, [user?.roleId, rolesData?.data]);

  const has = useMemo(
    () => (code: string) =>
      permissionCodes.has("admin") || permissionCodes.has(code),
    [permissionCodes]
  );

  return { permissionCodes, isLoading, has };
}

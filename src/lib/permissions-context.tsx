"use client";

import { createContext, useContext } from "react";

const PermissionsContext = createContext<string[]>([]);

export function PermissionsProvider({ children, allowedPerms }: { children: React.ReactNode; allowedPerms: string[] }) {
  return (
    <PermissionsContext.Provider value={allowedPerms}>
      {children}
    </PermissionsContext.Provider>
  );
}

/** Gibt true zurück wenn der aktuelle User die genannte Permission hat. */
export function useCan(permission: string): boolean {
  const perms = useContext(PermissionsContext);
  return perms.includes("*") || perms.includes(permission);
}

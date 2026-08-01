"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { AppTabBar } from "./AppTabBar";

interface TabCounts {
  environments?: number;
  costs?: number;
  dependencies?: number;
  openIncidents?: number;
  releases?: number;
  changelog?: number;
  activities?: number;
  docs?: number;
  screenshots?: number;
  notifications?: number;
}

export function ControlledTabsWrapper({
  children,
  counts,
}: {
  children: React.ReactNode;
  counts: TabCounts;
}) {
  const [value, setValue] = useState("overview");

  return (
    <Tabs value={value} onValueChange={setValue}>
      <AppTabBar counts={counts} activeTab={value} onTabChange={setValue} />
      {children}
    </Tabs>
  );
}

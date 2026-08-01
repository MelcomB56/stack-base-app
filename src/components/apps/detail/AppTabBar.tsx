"use client";

import { useState, useRef, useEffect } from "react";
import { Activity, ChevronDown } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface AppTabBarProps {
  counts: TabCounts;
  activeTab: string;
  onTabChange: (value: string) => void;
}

const SECONDARY_TABS = [
  { value: "costs",         label: "Kosten",            countKey: "costs"         },
  { value: "activities",    label: "Aktivitäten",       countKey: "activities"    },
  { value: "docs",          label: "Dokumentation",     countKey: "docs"          },
  { value: "screenshots",   label: "Screenshots",       countKey: "screenshots"   },
  { value: "notifications", label: "Benachrichtigungen",countKey: "notifications" },
] as const;

const SECONDARY_VALUES = new Set(SECONDARY_TABS.map((t) => t.value));

function Badge({ count, danger }: { count?: number; danger?: boolean }) {
  if (!count) return null;
  return (
    <span style={{
      marginLeft: 5, padding: "1px 6px", borderRadius: 99, fontSize: 10,
      background: danger ? "rgba(239,68,68,0.2)" : "#1A2640",
      color: danger ? "#F87171" : "#7A8BA6",
      fontWeight: danger ? 700 : 400,
    }}>
      {count}
    </span>
  );
}

export function AppTabBar({ counts, activeTab, onTabChange }: AppTabBarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const isSecondaryActive = SECONDARY_VALUES.has(activeTab as typeof SECONDARY_TABS[number]["value"]);
  const activeSecondary = SECONDARY_TABS.find((t) => t.value === activeTab);

  useEffect(() => {
    if (!moreOpen) return;
    function handleClick(e: MouseEvent) {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  return (
    <>
      <style>{`.tab-bar-scroll::-webkit-scrollbar{display:none}`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Scrollbarer primärer Tab-Bar */}
        <div className="tab-bar-scroll" style={{ overflowX: "auto", scrollbarWidth: "none", flex: 1, minWidth: 0 }}>
          <TabsList>
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="environments">
              Environments<Badge count={counts.environments} />
            </TabsTrigger>
            <TabsTrigger value="cert">Zertifikat</TabsTrigger>
            <TabsTrigger value="resources">Ressourcen</TabsTrigger>
            <TabsTrigger value="dependencies">
              Abhängigkeiten<Badge count={counts.dependencies} />
            </TabsTrigger>
            <TabsTrigger value="incidents">
              Incidents<Badge count={counts.openIncidents} danger />
            </TabsTrigger>
            <TabsTrigger value="releases">
              Releases<Badge count={counts.releases} />
            </TabsTrigger>
            <TabsTrigger value="changelog">
              Changelog<Badge count={counts.changelog} />
            </TabsTrigger>
            <TabsTrigger value="monitoring">
              <Activity size={11} style={{ marginRight: 4 }} />Monitoring
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Mehr ▾ Dropdown */}
        <div ref={moreRef} style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => setMoreOpen((p) => !p)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 500,
              background: isSecondaryActive ? "rgba(37,99,232,0.15)" : (moreOpen ? "rgba(37,99,232,0.08)" : "transparent"),
              border: `1px solid ${isSecondaryActive ? "rgba(37,99,232,0.4)" : "#1E3050"}`,
              color: isSecondaryActive ? "#2563E8" : "#7A8BA6",
              cursor: "pointer", whiteSpace: "nowrap", transition: "all 150ms",
              height: 32,
            }}
          >
            {isSecondaryActive ? (activeSecondary?.label ?? "Mehr") : "Mehr"}
            <ChevronDown
              size={10}
              style={{ transition: "transform 150ms", transform: moreOpen ? "rotate(180deg)" : "none" }}
            />
          </button>

          {moreOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
              background: "#111C2D", border: "1px solid #1E3050", borderRadius: 10,
              padding: 4, minWidth: 195, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}>
              {SECONDARY_TABS.map((tab) => {
                const count = counts[tab.countKey as keyof TabCounts];
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => { onTabChange(tab.value); setMoreOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", padding: "7px 10px", borderRadius: 7,
                      background: isActive ? "rgba(37,99,232,0.15)" : "none",
                      border: "none",
                      color: isActive ? "#2563E8" : "#EDF2F7",
                      fontSize: 12, cursor: "pointer", textAlign: "left",
                      transition: "background 100ms",
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = isActive ? "rgba(37,99,232,0.15)" : "none"; }}
                  >
                    {tab.label}
                    {count ? (
                      <span style={{ padding: "1px 6px", borderRadius: 99, fontSize: 10, background: "#1A2640", color: "#7A8BA6" }}>
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

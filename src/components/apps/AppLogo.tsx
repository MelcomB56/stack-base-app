"use client";

import { useState } from "react";
import { Globe } from "lucide-react";

interface AppLogoProps {
  logoUrl?: string | null;
  urlProd?: string | null;
  name: string;
  accentColor?: string;
  size?: number;
  borderRadius?: number;
}

export function AppLogo({ logoUrl, urlProd, name, accentColor = "#2563E8", size = 44, borderRadius = 10 }: AppLogoProps) {
  const [imgError, setImgError] = useState(false);

  const src = !imgError
    ? (logoUrl ?? (urlProd ? `/api/favicon?url=${encodeURIComponent(urlProd)}` : null))
    : null;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius, objectFit: "contain", flexShrink: 0 }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, background: `${accentColor}22`,
    }}>
      <Globe size={Math.round(size * 0.45)} style={{ color: accentColor }} />
    </div>
  );
}

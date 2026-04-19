"use client";

/**
 * PathsContinue
 *
 * Appears after the user has had time to absorb the paths.
 * Fades in after 8 seconds — further into the scroll than before.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function PathsContinue({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        pointerEvents: "none",
        position: "fixed",
        bottom: "2.5rem",
        right: "2.5rem",
        zIndex: 50,
        opacity: visible ? 1 : 0,
        transition: "opacity 1.4s ease",
      }}
    >
      <button
        style={{
          pointerEvents: "auto",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#4a4846",
          fontSize: "0.72rem",
          letterSpacing: "0.1em",
          fontFamily: "Georgia, serif",
          textTransform: "uppercase",
          padding: 0,
          transition: "color 0.2s ease",
        }}
        onClick={() => router.push(redirectTo as Parameters<typeof router.push>[0])}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#8a8480")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#4a4846")}
      >
        continue →
      </button>
    </div>
  );
}

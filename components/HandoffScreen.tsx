"use client";

interface HandoffScreenProps {
  toPlayerName: string;
  reason: string;
  onReady: () => void;
}

export function HandoffScreen({ toPlayerName, reason, onReady }: HandoffScreenProps) {
  return (
    <div
      onClick={onReady}
      style={{
        position: "fixed",
        inset: 0,
        background: "#0f1f0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        cursor: "pointer",
        padding: 32,
      }}
    >
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: "#16a34a",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, fontWeight: 700, color: "white",
        marginBottom: 24,
      }}>
        {toPlayerName[0].toUpperCase()}
      </div>
      <div style={{ color: "white", fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
        Pass to {toPlayerName}
      </div>
      <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 48, textAlign: "center" }}>
        {reason}
      </div>
      <div style={{
        background: "#16a34a", borderRadius: 12,
        padding: "14px 40px", color: "white",
        fontSize: 16, fontWeight: 600,
      }}>
        I'm {toPlayerName} — Tap to Continue
      </div>
    </div>
  );
}
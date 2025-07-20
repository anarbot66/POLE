// NavButton.jsx
import React from "react";

export function NavButton({ children, label, onClick }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      <div
        onClick={onClick}
        style={{
          width: 77.5,
          height: 60,
          borderRadius: 15,
          display: "flex",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          transition: "background 0.3s ease, transform 0.2s ease",
        }}
      >
        {children}
      </div>
      <div style={{ marginTop: 8, color: "white", fontSize: 10 }}>{label}</div>
    </div>
  );
}

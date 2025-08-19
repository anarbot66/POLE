// NavButton.jsx
import React from "react";

export function NavButton({ children, label, onClick, tip }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", width: "100%", gap: '10px' }}>
      <div
        style={{
          width: 40,
          borderRadius: 15,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          transition: "background 0.3s ease, transform 0.2s ease",
          padding: "5px 0px"
        }}
      >
        {children}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <span style={{ color: "white", fontSize: 15 }}>
          {label}
        </span>
        {tip && (
          <span style={{ color: "gray", fontSize: 11}}>
            {tip}
          </span>
        )}
      </div>
    </div>
  );
}

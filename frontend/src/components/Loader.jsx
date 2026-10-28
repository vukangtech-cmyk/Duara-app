import React from "react";

export default function Loader({ message = "Inapakia... Tafadhali subiri", minHeight = "280px" }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight,
      width: "100%",
      gap: "14px",
      padding: "24px"
    }}>
      <div style={{
        width: "38px",
        height: "38px",
        border: "3px solid rgba(16, 185, 129, 0.2)",
        borderTopColor: "var(--primary, #10b981)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <span style={{
        fontSize: "14px",
        color: "var(--muted, #64748b)",
        fontWeight: "500"
      }}>
        {message}
      </span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

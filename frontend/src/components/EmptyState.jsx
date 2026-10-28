import React from "react";
import { Link } from "react-router-dom";

export default function EmptyState({
  title = "Hakuna kilichopatikana",
  description = "Hakuna taarifa zilizopatikana kwa sasa. Jaribu kubadilisha vigezo au ongeza kitu kipya.",
  actionText,
  actionLink,
  icon = "🛍️"
}) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "48px 20px",
      margin: "24px 0",
      backgroundColor: "var(--card-bg, #ffffff)",
      borderRadius: "16px",
      border: "1px dashed var(--line, #e2e8f0)",
      boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))"
    }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>{icon}</div>
      <h3 style={{
        fontSize: "20px",
        fontWeight: "700",
        color: "var(--ink-heading, #0f172a)",
        margin: "0 0 8px 0"
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: "14px",
        color: "var(--muted, #64748b)",
        maxWidth: "420px",
        lineHeight: "1.6",
        margin: "0 0 24px 0"
      }}>
        {description}
      </p>
      {actionText && actionLink && (
        <Link
          to={actionLink}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            backgroundColor: "var(--primary, #10b981)",
            color: "#ffffff",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: "600",
            fontSize: "14px",
            transition: "background-color 0.2s"
          }}
        >
          {actionText}
        </Link>
      )}
    </div>
  );
}

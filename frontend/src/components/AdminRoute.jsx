import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import Loader from "./Loader.jsx";

export default function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader message="Inathibitisha madaraka ya usimamizi..." />;
  }

  if (!user) {
    return <Navigate to={`/ingia?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (profile?.role !== "admin") {
    return (
      <div style={{
        maxWidth: "500px",
        margin: "60px auto",
        padding: "32px 24px",
        backgroundColor: "#fef3c7",
        border: "1px solid #fde68a",
        borderRadius: "16px",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔒</div>
        <h2 style={{ color: "#92400e", margin: "0 0 12px 0" }}>Huna Ruhusa ya Admin</h2>
        <p style={{ color: "#78350f", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px 0" }}>
          Ukurasa huu ni maalum kwa ajili ya wasimamizi (Admins) pekee wa Duara Marketplace.
        </p>
      </div>
    );
  }

  return children;
}

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import Loader from "./Loader.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader message="Inathibitisha akaunti yako..." />;
  }

  if (!user) {
    return <Navigate to={`/ingia?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (profile?.is_blocked) {
    return (
      <div style={{
        maxWidth: "500px",
        margin: "60px auto",
        padding: "32px 24px",
        backgroundColor: "#fff1f2",
        border: "1px solid #fecdd3",
        borderRadius: "16px",
        textAlign: "center"
      }}>
        <h2 style={{ color: "#e11d48", margin: "0 0 12px 0" }}>Akaunti Imesimamishwa</h2>
        <p style={{ color: "#475569", fontSize: "14px", lineHeight: "1.6" }}>
          Akaunti yako imesitishwa kutokana na kukiuka miongozo ya usalama ya Duara Sokoni. Tafadhali wasiliana na usimamizi kwa ufafanuzi zaidi.
        </p>
      </div>
    );
  }

  return children;
}

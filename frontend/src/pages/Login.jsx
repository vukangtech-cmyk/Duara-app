import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg("Tafadhali ingiza barua pepe na nenosiri.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      await signIn(email, password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error("Hitilafu ya kuingia:", err);
      let message = "Barua pepe au nenosiri sio sahihi.";
      if (err.message && err.message.toLowerCase().includes("email not confirmed")) {
        message = "Tafadhali thibitisha barua pepe yako kabla ya kuingia.";
      } else if (err.message) {
        message = err.message;
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: "440px",
      margin: "40px auto",
      padding: "32px 24px",
      backgroundColor: "var(--card-bg, #ffffff)",
      borderRadius: "16px",
      border: "1px solid var(--line, #e2e8f0)",
      boxShadow: "var(--shadow-md, 0 4px 20px rgba(0,0,0,0.06))"
    }}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontSize: "24px",
          fontWeight: "900",
          marginBottom: "12px"
        }}>
          D
        </div>
        <h1 style={{
          fontSize: "22px",
          fontWeight: "800",
          color: "var(--ink-heading, #0f172a)",
          margin: "0 0 6px 0"
        }}>
          Karibu Duara Sokoni
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted, #64748b)", margin: 0 }}>
          Ingia kwenye akaunti yako ili kuweka matangazo na kuwasiliana na wateja.
        </p>
      </div>

      {errorMsg && (
        <div style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fee2e2",
          color: "#b91c1c",
          padding: "10px 14px",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: "18px"
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", display: "block", marginBottom: "6px" }}>
            Barua Pepe (Email)
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="jina@mfano.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: "10px",
              border: "1px solid var(--line, #cbd5e1)",
              backgroundColor: "var(--input-bg, #ffffff)",
              fontSize: "14px",
              outline: "none"
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", display: "block", marginBottom: "6px" }}>
            Nenosiri (Password)
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: "10px",
              border: "1px solid var(--line, #cbd5e1)",
              backgroundColor: "var(--input-bg, #ffffff)",
              fontSize: "14px",
              outline: "none"
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "var(--primary, #10b981)",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "6px",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)"
          }}
        >
          {loading ? "Inathibitisha..." : "Ingia Sokoni →"}
        </button>
      </form>

      <div style={{
        marginTop: "24px",
        paddingTop: "16px",
        borderTop: "1px solid var(--line, #f1f5f9)",
        textAlign: "center",
        fontSize: "13px",
        color: "var(--muted, #64748b)"
      }}>
        Huna akaunti bado?{" "}
        <Link
          to={`/jisajili?redirect=${encodeURIComponent(redirectPath)}`}
          style={{ color: "var(--primary, #10b981)", fontWeight: "700", textDecoration: "none" }}
        >
          Jisajili Bure Hapa
        </Link>
      </div>
    </div>
  );
}

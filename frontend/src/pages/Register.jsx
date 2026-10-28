import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { TANZANIA_REGIONS, POPULAR_INSTITUTIONS } from "../utils/format.js";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("Dar es Salaam");
  const [institution, setInstitution] = useState("Mtu Binafsi / Nje ya Chuo");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg("Tafadhali ingiza jina lako kamili au jina la duka.");
      return;
    }
    if (!email.trim() || !password) {
      setErrorMsg("Tafadhali jaza barua pepe na nenosiri.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Nenosiri lazima liwe na angalau herufi 6.");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("Tafadhali weka namba yako ya WhatsApp kwa mawasiliano na wanunuzi.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      await signUp({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        phone: phone.trim(),
        region,
        institution
      });
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error("Hitilafu ya usajili:", err);
      setErrorMsg(err.message || "Hitilafu imetokea wakati wa kujisajili.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: "500px",
      margin: "30px auto",
      padding: "32px 24px",
      backgroundColor: "var(--card-bg, #ffffff)",
      borderRadius: "16px",
      border: "1px solid var(--line, #e2e8f0)",
      boxShadow: "var(--shadow-md, 0 4px 20px rgba(0,0,0,0.06))"
    }}>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h1 style={{
          fontSize: "22px",
          fontWeight: "800",
          color: "var(--ink-heading, #0f172a)",
          margin: "0 0 6px 0"
        }}>
          Jisajili Duara Sokoni
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted, #64748b)", margin: 0 }}>
          Anza kuuza na kununua bure moja kwa moja bila madalali.
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

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", display: "block", marginBottom: "4px" }}>
            Jina Kamili au Jina la Biashara *
          </label>
          <input
            type="text"
            required
            placeholder="Mfano: Juma Rashid au Juma Tech Solutions"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--line, #cbd5e1)",
              backgroundColor: "var(--input-bg, #ffffff)",
              fontSize: "14px",
              outline: "none"
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", display: "block", marginBottom: "4px" }}>
            Namba ya WhatsApp / Simu *
          </label>
          <input
            type="tel"
            required
            placeholder="Mfano: 0755123456 au 255755123456"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--line, #cbd5e1)",
              backgroundColor: "var(--input-bg, #ffffff)",
              fontSize: "14px",
              outline: "none"
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", display: "block", marginBottom: "4px" }}>
            Barua Pepe (Email) *
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="juma@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--line, #cbd5e1)",
              backgroundColor: "var(--input-bg, #ffffff)",
              fontSize: "14px",
              outline: "none"
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", display: "block", marginBottom: "4px" }}>
            Nenosiri (Password - angalau herufi 6) *
          </label>
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--line, #cbd5e1)",
              backgroundColor: "var(--input-bg, #ffffff)",
              fontSize: "14px",
              outline: "none"
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted, #64748b)", display: "block", marginBottom: "4px" }}>
              Mkoa / Eneo *
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 10px",
                borderRadius: "8px",
                border: "1px solid var(--line, #cbd5e1)",
                backgroundColor: "var(--input-bg, #ffffff)",
                fontSize: "13px"
              }}
            >
              {TANZANIA_REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted, #64748b)", display: "block", marginBottom: "4px" }}>
              Chuo / Jamii
            </label>
            <select
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 10px",
                borderRadius: "8px",
                border: "1px solid var(--line, #cbd5e1)",
                backgroundColor: "var(--input-bg, #ffffff)",
                fontSize: "13px"
              }}
            >
              {POPULAR_INSTITUTIONS.map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>
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
          {loading ? "Inasajili akaunti..." : "Kamilisha Usajili →"}
        </button>
      </form>

      <div style={{
        marginTop: "20px",
        paddingTop: "14px",
        borderTop: "1px solid var(--line, #f1f5f9)",
        textAlign: "center",
        fontSize: "13px",
        color: "var(--muted, #64748b)"
      }}>
        Tayari una akaunti?{" "}
        <Link
          to={`/ingia?redirect=${encodeURIComponent(redirectPath)}`}
          style={{ color: "var(--primary, #10b981)", fontWeight: "700", textDecoration: "none" }}
        >
          Ingia Hapa
        </Link>
      </div>
    </div>
  );
}

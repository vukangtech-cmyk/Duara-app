import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "grid", placeContent: "center", padding: 20, textAlign: "center", background: "#f8fafc" }}>
          <div style={{ maxWidth: 460, width: "100%", padding: 26, borderRadius: 18, background: "#ffffff", boxShadow: "0 12px 36px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 44, display: "block", marginBottom: 12 }}>🌐</span>
            <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
              Duara Limefunguliwa Salama
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 18px", lineHeight: 1.55 }}>
              Kulitokea hitilafu ya muda kwenye kuonyesha ukurasa. Bofya kitufe cha chini ili kuonyesha upya au kurudi mwanzoni mwa mfumo.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                style={{
                  background: "#075e54",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 22px",
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(7,94,84,0.2)"
                }}
              >
                🔄 Onyesha Upya (Reload)
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem("active_user_override");
                  } catch {}
                  this.setState({ hasError: false, error: null });
                  window.location.href = "/";
                }}
                style={{
                  background: "#f1f5f9",
                  color: "#334155",
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: "10px 16px",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer"
                }}
              >
                🏠 Rudi Mwanzo
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

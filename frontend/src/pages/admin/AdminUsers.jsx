import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import Loader from "../../components/Loader.jsx";
import { formatRelativeDate } from "../../utils/format.js";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const loadUsers = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.warn("Hitilafu ya watumiaji:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleBlock = async (userId, currentBlocked) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_blocked: !currentBlocked, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) throw error;
      await loadUsers();
    } catch (err) {
      alert("Haikuweza kubadilisha hali ya mtumiaji: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`Je, una uhakika unataka kubadilisha wadhifa kuwa "${newRole}"?`)) return;

    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) throw error;
      await loadUsers();
    } catch (err) {
      alert("Haikuweza kubadilisha wadhifa: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.display_name && u.display_name.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.institution && u.institution.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--ink-heading, #0f172a)", margin: "0 0 4px 0" }}>
            👥 Usimamizi wa Watumiaji ({users.length})
          </h1>
          <p style={{ fontSize: "13px", color: "var(--muted, #64748b)", margin: 0 }}>
            Tazama wanachama, dhibiti akaunti zilizokiuka maadili, na weka wasimamizi.
          </p>
        </div>

        <Link
          to="/admin"
          style={{
            fontSize: "13px",
            color: "var(--primary, #10b981)",
            textDecoration: "none",
            fontWeight: "600"
          }}
        >
          ← Rudi Dashibodi
        </Link>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Tafuta mtumiaji kwa jina, simu, au chuo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "9px 14px",
            borderRadius: "10px",
            border: "1px solid var(--line, #cbd5e1)",
            backgroundColor: "var(--card-bg, #ffffff)",
            fontSize: "13px"
          }}
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <Loader message="Inapakia orodha ya watumiaji..." />
      ) : (
        <div style={{
          backgroundColor: "var(--card-bg, #ffffff)",
          border: "1px solid var(--line, #e2e8f0)",
          borderRadius: "14px",
          overflowX: "auto",
          boxShadow: "var(--shadow-sm)"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--line, #e2e8f0)" }}>
                <th style={{ padding: "12px 16px", fontWeight: "700" }}>Jina & Wasifu</th>
                <th style={{ padding: "12px 16px", fontWeight: "700" }}>Simu / WhatsApp</th>
                <th style={{ padding: "12px 16px", fontWeight: "700" }}>Chuo & Eneo</th>
                <th style={{ padding: "12px 16px", fontWeight: "700" }}>Wadhifa</th>
                <th style={{ padding: "12px 16px", fontWeight: "700" }}>Hali</th>
                <th style={{ padding: "12px 16px", fontWeight: "700", textAlign: "right" }}>Vitendo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: "24px", textAlign: "center", color: "var(--muted, #64748b)" }}>
                    Hakuna mtumiaji aliyepatikana.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--line, #f1f5f9)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <strong style={{ color: "var(--ink-heading, #0f172a)" }}>
                        {u.display_name || "Bila Jina"}
                      </strong>
                      <div style={{ fontSize: "11px", color: "var(--muted, #94a3b8)" }}>
                        Alijiunga: {formatRelativeDate(u.created_at)}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--ink, #334155)" }}>
                      {u.phone || "-"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--muted, #64748b)" }}>
                      <div>{u.region || "-"}</div>
                      <small style={{ color: "#10b981" }}>{u.institution || ""}</small>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        backgroundColor: u.role === "admin" ? "#fef3c7" : "#f1f5f9",
                        color: u.role === "admin" ? "#92400e" : "#475569"
                      }}>
                        {u.role ? u.role.toUpperCase() : "USER"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        backgroundColor: u.is_blocked ? "#fee2e2" : "#dcfce7",
                        color: u.is_blocked ? "#b91c1c" : "#15803d"
                      }}>
                        {u.is_blocked ? "Imesimamishwa" : "Hai (Active)"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          disabled={actionLoading === u.id}
                          onClick={() => handleToggleBlock(u.id, u.is_blocked)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            backgroundColor: u.is_blocked ? "#f0fdf4" : "#fff1f2",
                            color: u.is_blocked ? "#166534" : "#e11d48",
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          {u.is_blocked ? "Fungulia" : "Simamisha"}
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === u.id}
                          onClick={() => handleToggleRole(u.id, u.role)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          {u.role === "admin" ? "Fanya User" : "Fanya Admin"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

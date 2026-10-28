import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import Loader from "../../components/Loader.jsx";
import { formatPrice, formatRelativeDate } from "../../utils/format.js";

export default function AdminListings() {
  const [listings, setListings] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadListings = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      let query = supabase
        .from("listings")
        .select(`
          id,
          title,
          price,
          type,
          region,
          status,
          is_featured,
          views_count,
          created_at,
          profiles (id, display_name, phone)
        `)
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setListings(data || []);
    } catch (err) {
      console.warn("Hitilafu ya listings:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [filterStatus]);

  const handleToggleFeatured = async (listingId, currentFeatured) => {
    try {
      const { error } = await supabase
        .from("listings")
        .update({ is_featured: !currentFeatured, updated_at: new Date().toISOString() })
        .eq("id", listingId);

      if (error) throw error;
      loadListings();
    } catch (err) {
      alert("Haikuweza kubadilisha hali ya featured: " + err.message);
    }
  };

  const handleUpdateStatus = async (listingId, newStatus) => {
    try {
      const { error } = await supabase
        .from("listings")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", listingId);

      if (error) throw error;
      loadListings();
    } catch (err) {
      alert("Haikuweza kubadilisha status: " + err.message);
    }
  };

  const handleDelete = async (listingId) => {
    if (!window.confirm("Je, una uhakika unataka kufuta kabisa tangazo hili?")) return;
    try {
      const { error } = await supabase.from("listings").delete().eq("id", listingId);
      if (error) throw error;
      loadListings();
    } catch (err) {
      alert("Haikuweza kufuta: " + err.message);
    }
  };

  const filtered = listings.filter((l) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      l.title.toLowerCase().includes(q) ||
      (l.profiles?.display_name && l.profiles.display_name.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--ink-heading, #0f172a)", margin: "0 0 4px 0" }}>
            🛍️ Usimamizi wa Matangazo ({listings.length})
          </h1>
          <p style={{ fontSize: "13px", color: "var(--muted, #64748b)", margin: 0 }}>
            Weka matangazo yawe Featured, badilisha hadhi, au ondoa yaliyokiuka vigezo.
          </p>
        </div>

        <Link
          to="/admin"
          style={{ fontSize: "13px", color: "var(--primary, #10b981)", textDecoration: "none", fontWeight: "600" }}
        >
          ← Rudi Dashibodi
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "16px"
      }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "all", label: "Yote" },
            { id: "active", label: "Yanayoendelea" },
            { id: "sold", label: "Yaliyouzwa" },
            { id: "hidden", label: "Yaliyofichwa" }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: filterStatus === tab.id ? "700" : "500",
                backgroundColor: filterStatus === tab.id ? "var(--ink-heading, #0f172a)" : "var(--card-bg, #ffffff)",
                color: filterStatus === tab.id ? "#ffffff" : "var(--muted, #64748b)",
                cursor: "pointer"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Tafuta tangazo au muuzaji..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid var(--line, #cbd5e1)",
            fontSize: "13px",
            width: "240px"
          }}
        />
      </div>

      {/* Listings Table */}
      {loading ? (
        <Loader message="Inapakia matangazo ya sokoni..." />
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
                <th style={{ padding: "12px 16px", fontWeight: "700" }}>Tangazo</th>
                <th style={{ padding: "12px 16px", fontWeight: "700" }}>Muuzaji & Eneo</th>
                <th style={{ padding: "12px 16px", fontWeight: "700" }}>Bei</th>
                <th style={{ padding: "12px 16px", fontWeight: "700" }}>Featured</th>
                <th style={{ padding: "12px 16px", fontWeight: "700" }}>Hali (Status)</th>
                <th style={{ padding: "12px 16px", fontWeight: "700", textAlign: "right" }}>Vitendo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: "24px", textAlign: "center", color: "var(--muted, #64748b)" }}>
                    Hakuna matangazo yaliyopatikana.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--line, #f1f5f9)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <Link to={`/bidhaa/${item.id}`} style={{ fontWeight: "700", color: "var(--ink-heading, #0f172a)", textDecoration: "none" }}>
                        {item.title}
                      </Link>
                      <div style={{ fontSize: "11px", color: "var(--muted, #94a3b8)" }}>
                        {formatRelativeDate(item.created_at)} • 👁️ {item.views_count || 0}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ color: "var(--ink, #334155)" }}>{item.profiles?.display_name || "-"}</div>
                      <small style={{ color: "var(--muted, #64748b)" }}>{item.region}</small>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: "700", color: "var(--primary, #10b981)" }}>
                      {formatPrice(item.price)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(item.id, item.is_featured)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          border: "none",
                          fontSize: "11px",
                          fontWeight: "700",
                          backgroundColor: item.is_featured ? "#fef3c7" : "#f1f5f9",
                          color: item.is_featured ? "#92400e" : "#64748b",
                          cursor: "pointer"
                        }}
                      >
                        {item.is_featured ? "⭐ Featured" : "Kawaida"}
                      </button>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          fontSize: "12px"
                        }}
                      >
                        <option value="active">Active (Sokoni)</option>
                        <option value="sold">Sold (Imeshauzwa)</option>
                        <option value="hidden">Hidden (Imefichwa)</option>
                      </select>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <Link
                          to={`/bidhaa/${item.id}`}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            color: "inherit",
                            textDecoration: "none",
                            fontSize: "11px",
                            fontWeight: "600"
                          }}
                        >
                          Tazama
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "1px solid #fecdd3",
                            backgroundColor: "#fff1f2",
                            color: "#e11d48",
                            fontSize: "11px",
                            cursor: "pointer"
                          }}
                        >
                          Futa
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

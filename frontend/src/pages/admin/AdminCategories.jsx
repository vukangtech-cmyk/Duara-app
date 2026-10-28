import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import Loader from "../../components/Loader.jsx";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("🏷️");
  const [sortOrder, setSortOrder] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadCategories = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
      if (data && data.length > 0) {
        setSortOrder(data.length + 1);
      }
    } catch (err) {
      console.warn("Hitilafu:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setErrorMsg("Tafadhali jaza jina na slug ya kategoria.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "-");
      const { error } = await supabase.from("categories").insert({
        name: name.trim(),
        slug: cleanSlug,
        icon: icon.trim() || "🏷️",
        sort_order: Number(sortOrder) || 0
      });

      if (error) throw error;
      setName("");
      setSlug("");
      setIcon("🏷️");
      loadCategories();
    } catch (err) {
      setErrorMsg("Hitilafu: " + (err.message || "Haikuweza kuongeza kategoria."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Je, una uhakika unataka kufuta kategoria ya "${catName}"?`)) return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", catId);
      if (error) throw error;
      loadCategories();
    } catch (err) {
      alert("Haikuweza kufuta: " + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--ink-heading, #0f172a)", margin: "0 0 4px 0" }}>
            🏷️ Kategoria za Sokoni ({categories.length})
          </h1>
          <p style={{ fontSize: "13px", color: "var(--muted, #64748b)", margin: 0 }}>
            Ongeza au badilisha makundi ya bidhaa na huduma zinazopatikana kwenye Duara Sokoni.
          </p>
        </div>

        <Link
          to="/admin"
          style={{ fontSize: "13px", color: "var(--primary, #10b981)", textDecoration: "none", fontWeight: "600" }}
        >
          ← Rudi Dashibodi
        </Link>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "24px"
      }}>
        {/* Form to Add New Category */}
        <div style={{
          backgroundColor: "var(--card-bg, #ffffff)",
          border: "1px solid var(--line, #e2e8f0)",
          borderRadius: "14px",
          padding: "20px",
          height: "fit-content"
        }}>
          <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", fontWeight: "700" }}>
            ➕ Ongeza Kategoria Mpya
          </h3>

          {errorMsg && (
            <div style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fee2e2",
              color: "#b91c1c",
              padding: "8px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              marginBottom: "14px"
            }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleCreateCategory} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                Jina la Kategoria (Kiswahili) *
              </label>
              <input
                type="text"
                required
                placeholder="Mfano: Vifaa vya Michezo"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) {
                    setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                  }
                }}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                  Emoji / Icon *
                </label>
                <input
                  type="text"
                  placeholder="⚽"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                  Mpangilio (Sort) *
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px"
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                Slug (URL identifier) *
              </label>
              <input
                type="text"
                required
                placeholder="michezo"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "var(--primary, #10b981)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: "700",
                cursor: submitting ? "not-allowed" : "pointer",
                marginTop: "4px"
              }}
            >
              {submitting ? "Inahifadhi..." : "+ Hifadhi Kategoria"}
            </button>
          </form>
        </div>

        {/* Existing Categories Table */}
        <div style={{
          backgroundColor: "var(--card-bg, #ffffff)",
          border: "1px solid var(--line, #e2e8f0)",
          borderRadius: "14px",
          overflow: "hidden"
        }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line, #e2e8f0)", fontWeight: "700", fontSize: "14px" }}>
            Kategoria Zilizopo Sokoni
          </div>

          {loading ? (
            <Loader message="Inapakia kategoria..." />
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--line, #e2e8f0)" }}>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Kategoria</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Slug</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Pangilia</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700", textAlign: "right" }}>Kitendo</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--line, #f1f5f9)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: "600", color: "var(--ink-heading, #0f172a)" }}>
                      <span style={{ marginRight: "6px" }}>{c.icon}</span>
                      <span>{c.name}</span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--muted, #64748b)" }}>
                      {c.slug}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {c.sort_order}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(c.id, c.name)}
                        style={{
                          border: "none",
                          backgroundColor: "transparent",
                          color: "#e11d48",
                          cursor: "pointer",
                          fontSize: "13px"
                        }}
                        title="Futa kategoria hii"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

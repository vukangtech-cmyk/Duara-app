import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import Loader from "../../components/Loader.jsx";
import { formatRelativeDate } from "../../utils/format.js";

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      let query = supabase
        .from("reports")
        .select(`
          id,
          reason,
          details,
          status,
          created_at,
          listing_id,
          reporter_id,
          listings (
            id,
            title,
            price,
            status,
            seller_id
          ),
          profiles:reporter_id (
            id,
            display_name,
            phone
          )
        `)
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.warn("Hitilafu ya ripoti:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [filterStatus]);

  const handleUpdateReportStatus = async (reportId, newStatus) => {
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status: newStatus })
        .eq("id", reportId);

      if (error) throw error;
      loadReports();
    } catch (err) {
      alert("Haikuweza kubadilisha hali: " + err.message);
    }
  };

  const handleTakeDownListing = async (listingId, reportId) => {
    if (!window.confirm("Je, unataka kuficha tangazo hili sokoni mara moja?")) return;
    try {
      await supabase.from("listings").update({ status: "hidden" }).eq("id", listingId);
      await supabase.from("reports").update({ status: "resolved" }).eq("id", reportId);
      loadReports();
    } catch (err) {
      alert("Haikuweza kuondoa tangazo: " + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--ink-heading, #0f172a)", margin: "0 0 4px 0" }}>
            ⚠️ Ripoti za Usalama Sokoni ({reports.length})
          </h1>
          <p style={{ fontSize: "13px", color: "var(--muted, #64748b)", margin: 0 }}>
            Kagua malalamiko na viashiria vya utapeli vilivyotumwa na wanunuzi na wauzaji.
          </p>
        </div>

        <Link
          to="/admin"
          style={{ fontSize: "13px", color: "var(--primary, #10b981)", textDecoration: "none", fontWeight: "600" }}
        >
          ← Rudi Dashibodi
        </Link>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        {[
          { id: "all", label: "Zote" },
          { id: "pending", label: "Zinazosubiri (Pending)" },
          { id: "resolved", label: "Zilizotatuliwa (Resolved)" },
          { id: "dismissed", label: "Zilizopuuzwa (Dismissed)" }
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

      {loading ? (
        <Loader message="Inapakia ripoti za usalama..." />
      ) : reports.length === 0 ? (
        <div style={{
          backgroundColor: "var(--card-bg, #ffffff)",
          borderRadius: "14px",
          border: "1px solid var(--line, #e2e8f0)",
          padding: "48px 20px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>🛡️</div>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "700" }}>Hakuna ripoti za usalama zilizopatikana</h3>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted, #64748b)" }}>
            Hakuna malalamiko au taarifa za mashaka katika sehemu hii.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {reports.map((rep) => (
            <div
              key={rep.id}
              style={{
                backgroundColor: "var(--card-bg, #ffffff)",
                border: "1px solid var(--line, #e2e8f0)",
                borderRadius: "12px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    backgroundColor: "#fee2e2",
                    color: "#b91c1c",
                    marginRight: "8px"
                  }}>
                    {rep.reason}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--muted, #94a3b8)" }}>
                    Iliwasilishwa: {formatRelativeDate(rep.created_at)}
                  </span>
                </div>

                <span style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  backgroundColor: rep.status === "pending" ? "#fef3c7" : rep.status === "resolved" ? "#dcfce7" : "#f1f5f9",
                  color: rep.status === "pending" ? "#92400e" : rep.status === "resolved" ? "#15803d" : "#64748b"
                }}>
                  {rep.status.toUpperCase()}
                </span>
              </div>

              {rep.details && (
                <div style={{ fontSize: "13px", color: "var(--ink, #334155)", backgroundColor: "#f8fafc", padding: "10px", borderRadius: "8px" }}>
                  "{rep.details}"
                </div>
              )}

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
                paddingTop: "10px",
                borderTop: "1px solid var(--line, #f1f5f9)",
                fontSize: "12px"
              }}>
                <div>
                  <strong>Tangazo Lililoripotiwa:</strong>{" "}
                  {rep.listings ? (
                    <Link to={`/bidhaa/${rep.listings.id}`} style={{ color: "var(--primary, #10b981)", fontWeight: "600" }}>
                      {rep.listings.title} ({rep.listings.status})
                    </Link>
                  ) : (
                    <span style={{ color: "#94a3b8" }}>Limeshafutwa</span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  {rep.listings && rep.listings.status !== "hidden" && (
                    <button
                      type="button"
                      onClick={() => handleTakeDownListing(rep.listings.id, rep.id)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        border: "1px solid #fecdd3",
                        backgroundColor: "#fff1f2",
                        color: "#e11d48",
                        fontSize: "11px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      🚫 Ondoa Tangazo Sokoni
                    </button>
                  )}

                  {rep.status !== "resolved" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateReportStatus(rep.id, "resolved")}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        border: "1px solid #bbf7d0",
                        backgroundColor: "#f0fdf4",
                        color: "#166534",
                        fontSize: "11px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      ✅ Tatua (Resolve)
                    </button>
                  )}

                  {rep.status !== "dismissed" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateReportStatus(rep.id, "dismissed")}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#ffffff",
                        fontSize: "11px",
                        cursor: "pointer"
                      }}
                    >
                      Puuza (Dismiss)
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

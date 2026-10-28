import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import Loader from "../../components/Loader.jsx";
import { formatPrice, formatRelativeDate } from "../../utils/format.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalUsers: 0,
    pendingReports: 0
  });
  const [recentListings, setRecentListings] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminOverview() {
      if (!supabase) return;
      try {
        // Counts
        const { count: totalListings } = await supabase.from("listings").select("*", { count: "exact", head: true });
        const { count: activeListings } = await supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active");
        const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
        const { count: pendingReports } = await supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending");

        setStats({
          totalListings: totalListings || 0,
          activeListings: activeListings || 0,
          totalUsers: totalUsers || 0,
          pendingReports: pendingReports || 0
        });

        // Recent 5 listings
        const { data: recListings } = await supabase
          .from("listings")
          .select("id, title, price, status, is_featured, created_at, profiles(display_name)")
          .order("created_at", { ascending: false })
          .limit(5);

        setRecentListings(recListings || []);

        // Recent 5 reports
        const { data: recReports } = await supabase
          .from("reports")
          .select("id, reason, status, created_at, listings(id, title)")
          .order("created_at", { ascending: false })
          .limit(5);

        setRecentReports(recReports || []);
      } catch (err) {
        console.warn("Hitilafu ya admin dashboard:", err.message);
      } finally {
        setLoading(false);
      }
    }

    loadAdminOverview();
  }, []);

  if (loading) {
    return <Loader message="Inapakia takwimu za usimamizi wa Duara..." />;
  }

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{
          fontSize: "24px",
          fontWeight: "800",
          color: "var(--ink-heading, #0f172a)",
          margin: "0 0 6px 0"
        }}>
          ⚙️ Dashibodi ya Usimamizi (Admin)
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted, #64748b)", margin: 0 }}>
          Tathmini ya soko, watumiaji, mapato ya matangazo maalum, na usalama.
        </p>
      </div>

      {/* Admin Nav Tabs */}
      <div style={{
        display: "flex",
        gap: "10px",
        overflowX: "auto",
        paddingBottom: "12px",
        marginBottom: "24px",
        borderBottom: "1px solid var(--line, #e2e8f0)"
      }}>
        <Link
          to="/admin"
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            backgroundColor: "var(--ink-heading, #0f172a)",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: "700",
            textDecoration: "none"
          }}
        >
          📊 Muhtasari
        </Link>
        <Link
          to="/admin/watumiaji"
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            backgroundColor: "var(--card-bg, #ffffff)",
            border: "1px solid var(--line, #cbd5e1)",
            color: "var(--ink, #1e293b)",
            fontSize: "13px",
            fontWeight: "600",
            textDecoration: "none"
          }}
        >
          👥 Watumiaji ({stats.totalUsers})
        </Link>
        <Link
          to="/admin/listings"
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            backgroundColor: "var(--card-bg, #ffffff)",
            border: "1px solid var(--line, #cbd5e1)",
            color: "var(--ink, #1e293b)",
            fontSize: "13px",
            fontWeight: "600",
            textDecoration: "none"
          }}
        >
          🛍️ Matangazo Yote ({stats.totalListings})
        </Link>
        <Link
          to="/admin/ripoti"
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            backgroundColor: stats.pendingReports > 0 ? "#fff1f2" : "var(--card-bg, #ffffff)",
            border: stats.pendingReports > 0 ? "1px solid #fecdd3" : "1px solid var(--line, #cbd5e1)",
            color: stats.pendingReports > 0 ? "#e11d48" : "var(--ink, #1e293b)",
            fontSize: "13px",
            fontWeight: "600",
            textDecoration: "none"
          }}
        >
          ⚠️ Ripoti za Usalama ({stats.pendingReports})
        </Link>
        <Link
          to="/admin/kategoria"
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            backgroundColor: "var(--card-bg, #ffffff)",
            border: "1px solid var(--line, #cbd5e1)",
            color: "var(--ink, #1e293b)",
            fontSize: "13px",
            fontWeight: "600",
            textDecoration: "none"
          }}
        >
          🏷️ Kategoria
        </Link>
      </div>

      {/* Metrics Cards Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "32px"
      }}>
        <div style={{
          backgroundColor: "var(--card-bg, #ffffff)",
          border: "1px solid var(--line, #e2e8f0)",
          borderRadius: "14px",
          padding: "20px",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--muted, #64748b)" }}>
            Jumla ya Matangazo
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--ink-heading, #0f172a)", marginTop: "6px" }}>
            {stats.totalListings}
          </div>
        </div>

        <div style={{
          backgroundColor: "var(--card-bg, #ffffff)",
          border: "1px solid var(--line, #e2e8f0)",
          borderRadius: "14px",
          padding: "20px",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--muted, #64748b)" }}>
            Matangazo Yanayoendelea
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#10b981", marginTop: "6px" }}>
            {stats.activeListings}
          </div>
        </div>

        <div style={{
          backgroundColor: "var(--card-bg, #ffffff)",
          border: "1px solid var(--line, #e2e8f0)",
          borderRadius: "14px",
          padding: "20px",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--muted, #64748b)" }}>
            Watumiaji Waliosajiliwa
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#3b82f6", marginTop: "6px" }}>
            {stats.totalUsers}
          </div>
        </div>

        <div style={{
          backgroundColor: "var(--card-bg, #ffffff)",
          border: "1px solid var(--line, #e2e8f0)",
          borderRadius: "14px",
          padding: "20px",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--muted, #64748b)" }}>
            Ripoti za Usalama Zinazosubiri
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: stats.pendingReports > 0 ? "#e11d48" : "var(--ink-heading, #0f172a)", marginTop: "6px" }}>
            {stats.pendingReports}
          </div>
        </div>
      </div>

      {/* Two columns: Recent Listings & Recent Reports */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "24px"
      }}>
        {/* Recent Listings */}
        <div style={{
          backgroundColor: "var(--card-bg, #ffffff)",
          border: "1px solid var(--line, #e2e8f0)",
          borderRadius: "16px",
          padding: "20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Matangazo ya Hivi Karibuni</h3>
            <Link to="/admin/listings" style={{ fontSize: "12px", color: "var(--primary, #10b981)", textDecoration: "none", fontWeight: "600" }}>
              Yote →
            </Link>
          </div>

          {recentListings.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--muted, #64748b)" }}>Hakuna matangazo bado.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentListings.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px"
                  }}
                >
                  <div>
                    <Link to={`/bidhaa/${item.id}`} style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink-heading, #0f172a)", textDecoration: "none" }}>
                      {item.title}
                    </Link>
                    <div style={{ fontSize: "11px", color: "var(--muted, #64748b)" }}>
                      {item.profiles?.display_name || "Muuuzaji"} • {formatPrice(item.price)}
                    </div>
                  </div>
                  <span style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    backgroundColor: item.status === "active" ? "#dcfce7" : "#f1f5f9",
                    color: item.status === "active" ? "#15803d" : "#64748b"
                  }}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reports */}
        <div style={{
          backgroundColor: "var(--card-bg, #ffffff)",
          border: "1px solid var(--line, #e2e8f0)",
          borderRadius: "16px",
          padding: "20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Ripoti za Hivi Karibuni</h3>
            <Link to="/admin/ripoti" style={{ fontSize: "12px", color: "var(--primary, #10b981)", textDecoration: "none", fontWeight: "600" }}>
              Yote →
            </Link>
          </div>

          {recentReports.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--muted, #64748b)" }}>Hakuna ripoti za usalama kwa sasa.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentReports.map((rep) => (
                <div
                  key={rep.id}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    backgroundColor: "#fff1f2",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#9f1239" }}>
                      {rep.reason}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      Tangazo: {rep.listings?.title || "Tangazo limefutwa"}
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", color: "#9f1239", fontWeight: "700" }}>
                    {rep.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

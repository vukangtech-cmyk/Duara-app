import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

export default function Layout() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tafuta?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "var(--bg-base, #f8fafc)",
      color: "var(--ink, #1e293b)"
    }}>
      {/* Top Header */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "var(--card-bg, #ffffff)",
        borderBottom: "1px solid var(--line, #e2e8f0)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px"
        }}>
          {/* Logo */}
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              color: "inherit"
            }}
          >
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: "900",
              boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)"
            }}>
              D
            </div>
            <div>
              <div style={{
                fontSize: "18px",
                fontWeight: "800",
                letterSpacing: "-0.5px",
                color: "var(--ink-heading, #0f172a)",
                lineHeight: "1.1"
              }}>
                Duara
              </div>
              <div style={{
                fontSize: "10px",
                fontWeight: "600",
                color: "var(--primary, #10b981)",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Sokoni Tanzania
              </div>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              flex: 1,
              maxWidth: "480px",
              display: "none"
            }}
            className="header-search-desktop"
          >
            <div style={{
              position: "relative",
              width: "100%",
              display: "flex",
              alignItems: "center"
            }}>
              <span style={{
                position: "absolute",
                left: "14px",
                color: "#94a3b8",
                fontSize: "14px"
              }}>
                🔍
              </span>
              <input
                type="text"
                placeholder="Tafuta bidhaa, vifaa, huduma, vyumba..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 14px 9px 40px",
                  borderRadius: "22px",
                  border: "1px solid var(--line, #cbd5e1)",
                  backgroundColor: "var(--input-bg, #f8fafc)",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s"
                }}
              />
            </div>
          </form>

          {/* Header Actions */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            {/* Admin Badge/Link */}
            {isAdmin && (
              <Link
                to="/admin"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  backgroundColor: "#fef3c7",
                  color: "#92400e",
                  fontSize: "12px",
                  fontWeight: "700",
                  textDecoration: "none",
                  border: "1px solid #fde68a"
                }}
              >
                ⚙️ Admin
              </Link>
            )}

            {/* Post Listing CTA Button */}
            <Link
              to="/ongeza"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "20px",
                backgroundColor: "var(--primary, #10b981)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: "700",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
                transition: "opacity 0.2s"
              }}
            >
              <span style={{ fontSize: "16px", lineHeight: "1" }}>+</span>
              <span>Weka Tangazo</span>
            </Link>

            {/* User Profile / Auth Button */}
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Link
                  to="/mimi"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    textDecoration: "none",
                    padding: "4px 8px",
                    borderRadius: "20px",
                    backgroundColor: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid var(--primary-border, rgba(16, 185, 129, 0.2))"
                  }}
                  title="Akaunti Yangu"
                >
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: "var(--primary, #10b981)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "700"
                  }}>
                    {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "var(--ink-heading, #0f172a)",
                    maxWidth: "100px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }} className="header-username-desktop">
                    {profile?.display_name || "Mimi"}
                  </span>
                </Link>
              </div>
            ) : (
              <Link
                to="/ingia"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--line, #cbd5e1)",
                  backgroundColor: "transparent",
                  color: "var(--ink, #1e293b)",
                  fontSize: "13px",
                  fontWeight: "600",
                  textDecoration: "none"
                }}
              >
                Ingia
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main style={{
        flex: 1,
        maxWidth: "1200px",
        width: "100%",
        margin: "0 auto",
        padding: "16px 16px 80px 16px"
      }}>
        <Outlet />
      </main>

      {/* Desktop Footer */}
      <footer style={{
        backgroundColor: "var(--card-bg, #ffffff)",
        borderTop: "1px solid var(--line, #e2e8f0)",
        padding: "36px 16px 90px 16px",
        marginTop: "auto"
      }} className="desktop-footer">
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "28px"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                backgroundColor: "var(--primary, #10b981)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "bold"
              }}>D</div>
              <strong style={{ fontSize: "16px", color: "var(--ink-heading, #0f172a)" }}>Duara Sokoni</strong>
            </div>
            <p style={{ fontSize: "13px", color: "var(--muted, #64748b)", lineHeight: "1.6", margin: 0 }}>
              Soko huria la kidijitali Tanzania linalounganisha wanafunzi wa vyuo vikuu na jamii yote kununua, kuuza, na kupata huduma moja kwa moja kupitia WhatsApp.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px", color: "var(--ink-heading, #0f172a)" }}>
              🛡️ Usalama Sokoni
            </h4>
            <ul style={{ fontSize: "12px", color: "var(--muted, #64748b)", lineHeight: "1.8", paddingLeft: "16px", margin: 0 }}>
              <li>Kutana na muuzaji sehemu ya umma iliyo wazi na salama.</li>
              <li>Kagua na uhakikishe ubora wa bidhaa kabla ya kulipa.</li>
              <li>Usitume pesa mapema (kabla ya kuona bidhaa).</li>
              <li>Toa ripoti mara moja ukiona tangazo lenye mashaka.</li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px", color: "var(--ink-heading, #0f172a)" }}>
              Viungo vya Haraka
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
              <Link to="/tafuta" style={{ color: "var(--muted, #64748b)", textDecoration: "none" }}>Tafuta Bidhaa na Huduma</Link>
              <Link to="/ongeza" style={{ color: "var(--muted, #64748b)", textDecoration: "none" }}>Weka Tangazo Lako Bure</Link>
              <Link to="/ujumbe" style={{ color: "var(--muted, #64748b)", textDecoration: "none" }}>Ujumbe na Mazungumzo</Link>
              {isAdmin && <Link to="/admin" style={{ color: "#d97706", fontWeight: "600", textDecoration: "none" }}>⚙️ Dashibodi ya Admin</Link>}
            </div>
          </div>
        </div>

        <div style={{
          maxWidth: "1200px",
          margin: "24px auto 0 auto",
          paddingTop: "16px",
          borderTop: "1px solid var(--line, #f1f5f9)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          color: "var(--muted, #94a3b8)",
          flexWrap: "wrap",
          gap: "8px"
        }}>
          <div>&copy; {new Date().getFullYear()} Duara Sokoni. Haki zote zimehifadhiwa.</div>
          <div>Imetengenezwa kwa ajili ya wananchi na wanafunzi wa vyuo Tanzania 🇹🇿</div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <nav style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "var(--card-bg, #ffffff)",
        borderTop: "1px solid var(--line, #e2e8f0)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "8px 4px calc(8px + env(safe-area-inset-bottom, 0px)) 4px",
        zIndex: 100,
        boxShadow: "0 -2px 10px rgba(0,0,0,0.05)"
      }} className="mobile-bottom-nav">
        <NavLink
          to="/"
          end
          style={({ isActive }) => ({
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            textDecoration: "none",
            color: isActive ? "var(--primary, #10b981)" : "#64748b",
            fontSize: "11px",
            fontWeight: isActive ? "700" : "500",
            flex: 1
          })}
        >
          <span style={{ fontSize: "18px" }}>🏠</span>
          <span>Nyumbani</span>
        </NavLink>

        <NavLink
          to="/tafuta"
          style={({ isActive }) => ({
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            textDecoration: "none",
            color: isActive ? "var(--primary, #10b981)" : "#64748b",
            fontSize: "11px",
            fontWeight: isActive ? "700" : "500",
            flex: 1
          })}
        >
          <span style={{ fontSize: "18px" }}>🔍</span>
          <span>Tafuta</span>
        </NavLink>

        <NavLink
          to="/ongeza"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
            textDecoration: "none",
            color: "#ffffff",
            fontSize: "10px",
            fontWeight: "700",
            position: "relative",
            top: "-12px",
            flex: 1
          }}
        >
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            backgroundColor: "var(--primary, #10b981)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
            fontSize: "22px",
            fontWeight: "bold",
            color: "#ffffff"
          }}>
            +
          </div>
          <span style={{ color: "var(--primary, #10b981)", marginTop: "2px" }}>Ongeza</span>
        </NavLink>

        <NavLink
          to="/ujumbe"
          style={({ isActive }) => ({
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            textDecoration: "none",
            color: isActive ? "var(--primary, #10b981)" : "#64748b",
            fontSize: "11px",
            fontWeight: isActive ? "700" : "500",
            flex: 1
          })}
        >
          <span style={{ fontSize: "18px" }}>💬</span>
          <span>Ujumbe</span>
        </NavLink>

        <NavLink
          to={user ? "/mimi" : "/ingia"}
          style={({ isActive }) => ({
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            textDecoration: "none",
            color: isActive ? "var(--primary, #10b981)" : "#64748b",
            fontSize: "11px",
            fontWeight: isActive ? "700" : "500",
            flex: 1
          })}
        >
          <span style={{ fontSize: "18px" }}>👤</span>
          <span>{user ? "Mimi" : "Ingia"}</span>
        </NavLink>
      </nav>

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 640px) {
          .header-search-desktop {
            display: block !important;
          }
        }
        @media (min-width: 768px) {
          .mobile-bottom-nav {
            display: none !important;
          }
          main {
            padding-bottom: 32px !important;
          }
          footer.desktop-footer {
            padding-bottom: 36px !important;
          }
        }
      `}</style>
    </div>
  );
}

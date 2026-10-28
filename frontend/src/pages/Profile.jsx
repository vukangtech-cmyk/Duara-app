import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../hooks/useAuth.jsx";
import ListingCard from "../components/ListingCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";
import { TANZANIA_REGIONS, POPULAR_INSTITUTIONS } from "../utils/format.js";

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, signOut, isAdmin } = useAuth();

  const [myListings, setMyListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'active', 'sold'

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [institution, setInstitution] = useState(profile?.institution || "Mtu Binafsi / Nje ya Chuo");
  const [region, setRegion] = useState(profile?.region || "Dar es Salaam");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setPhone(profile.phone || "");
      setInstitution(profile.institution || "Mtu Binafsi / Nje ya Chuo");
      setRegion(profile.region || "Dar es Salaam");
    }
  }, [profile]);

  const loadMyListings = async () => {
    if (!supabase || !user) {
      setLoadingListings(false);
      return;
    }
    setLoadingListings(true);
    try {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          id,
          title,
          price,
          type,
          images,
          region,
          institution,
          status,
          is_featured,
          views_count,
          created_at,
          category_id,
          profiles (id, display_name, phone)
        `)
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyListings(data || []);
    } catch (err) {
      console.warn("Hitilafu ya matangazo yangu:", err.message);
    } finally {
      setLoadingListings(false);
    }
  };

  useEffect(() => {
    loadMyListings();
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");

    try {
      await updateProfile({
        display_name: displayName.trim(),
        phone: phone.trim(),
        institution,
        region
      });
      setProfileMsg("Taarifa zako zimehifadhiwa kikamilifu!");
      setIsEditing(false);
    } catch (err) {
      setProfileMsg("Hitilafu: " + (err.message || "Haikuweza kuhifadhi."));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleMarkSold = async (listingId, newStatus) => {
    try {
      const { error } = await supabase
        .from("listings")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", listingId);

      if (error) throw error;
      loadMyListings();
    } catch (err) {
      alert("Haikuweza kubadilisha hali: " + err.message);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Je, una uhakika unataka kufuta tangazo hili?")) return;
    try {
      const { error } = await supabase.from("listings").delete().eq("id", listingId);
      if (error) throw error;
      loadMyListings();
    } catch (err) {
      alert("Haikuweza kufuta: " + err.message);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const filteredListings = myListings.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return item.status === "active";
    if (activeTab === "sold") return item.status === "sold";
    return true;
  });

  return (
    <div>
      {/* Profile Header Card */}
      <div style={{
        backgroundColor: "var(--card-bg, #ffffff)",
        border: "1px solid var(--line, #e2e8f0)",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "28px",
        boxShadow: "var(--shadow-sm)"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "var(--primary, #10b981)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: "800",
              boxShadow: "0 4px 10px rgba(16, 185, 129, 0.25)"
            }}>
              {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h1 style={{
                  fontSize: "22px",
                  fontWeight: "800",
                  color: "var(--ink-heading, #0f172a)",
                  margin: 0
                }}>
                  {profile?.display_name || "Mtumiaji wa Duara"}
                </h1>
                {isAdmin && (
                  <span style={{
                    backgroundColor: "#fef3c7",
                    color: "#92400e",
                    fontSize: "11px",
                    fontWeight: "800",
                    padding: "2px 8px",
                    borderRadius: "6px"
                  }}>
                    ADMIN
                  </span>
                )}
              </div>
              <div style={{ fontSize: "13px", color: "var(--muted, #64748b)", marginTop: "4px" }}>
                📧 {user?.email}
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "6px", fontSize: "13px", color: "var(--muted, #64748b)" }}>
                <span>📱 {profile?.phone || "Hakuna namba ya simu"}</span>
                <span>•</span>
                <span>📍 {profile?.region || "Dar es Salaam"}</span>
              </div>
              {profile?.institution && (
                <div style={{ fontSize: "12px", color: "var(--primary, #10b981)", marginTop: "4px", fontWeight: "600" }}>
                  🏛️ {profile.institution}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid var(--line, #cbd5e1)",
                backgroundColor: "var(--card-bg, #ffffff)",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              {isEditing ? "Funga Uhariri" : "✏️ Hariri Wasifu"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #fecdd3",
                backgroundColor: "#fff1f2",
                color: "#e11d48",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              🚪 Toka
            </button>
          </div>
        </div>

        {profileMsg && (
          <div style={{
            marginTop: "16px",
            padding: "10px 14px",
            borderRadius: "8px",
            backgroundColor: profileMsg.includes("Hitilafu") ? "#fef2f2" : "#f0fdf4",
            color: profileMsg.includes("Hitilafu") ? "#b91c1c" : "#166534",
            fontSize: "13px"
          }}>
            {profileMsg}
          </div>
        )}

        {/* Edit Profile Form */}
        {isEditing && (
          <form
            onSubmit={handleSaveProfile}
            style={{
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: "1px solid var(--line, #f1f5f9)",
              display: "flex",
              flexDirection: "column",
              gap: "14px"
            }}
          >
            <h3 style={{ fontSize: "15px", fontWeight: "700", margin: 0, color: "var(--ink-heading, #0f172a)" }}>
              Badilisha Taarifa Zako
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                  Jina Kamili au Jina la Biashara
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
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
                  Namba ya Simu / WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0755123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                  Mkoa
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px"
                  }}
                >
                  {TANZANIA_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                  Chuo / Jamii
                </label>
                <select
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px"
                  }}
                >
                  {POPULAR_INSTITUTIONS.map((inst) => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  fontSize: "13px"
                }}
              >
                Ghairi
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                style={{
                  padding: "8px 20px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "var(--primary, #10b981)",
                  color: "#ffffff",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: savingProfile ? "not-allowed" : "pointer"
                }}
              >
                {savingProfile ? "Inahifadhi..." : "Hifadhi Wasifu"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* My Listings Section */}
      <div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--ink-heading, #0f172a)", margin: "0 0 4px 0" }}>
              Matangazo Yangu ({myListings.length})
            </h2>
            <p style={{ fontSize: "13px", color: "var(--muted, #64748b)", margin: 0 }}>
              Simamia matangazo uliyoweka sokoni.
            </p>
          </div>

          <Link
            to="/ongeza"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 18px",
              borderRadius: "10px",
              backgroundColor: "var(--primary, #10b981)",
              color: "#ffffff",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "700"
            }}
          >
            + Ongeza Tangazo Jipya
          </Link>
        </div>

        {/* Tabs: All / Active / Sold */}
        <div style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--line, #e2e8f0)",
          paddingBottom: "10px",
          marginBottom: "20px"
        }}>
          {[
            { id: "all", label: `Yote (${myListings.length})` },
            { id: "active", label: `Zinazoendelea (${myListings.filter((i) => i.status === "active").length})` },
            { id: "sold", label: `Zilizouzwa (${myListings.filter((i) => i.status === "sold").length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: activeTab === tab.id ? "700" : "500",
                backgroundColor: activeTab === tab.id ? "var(--ink-heading, #0f172a)" : "transparent",
                color: activeTab === tab.id ? "#ffffff" : "var(--muted, #64748b)",
                cursor: "pointer"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Listings Content */}
        {loadingListings ? (
          <Loader message="Inapakia matangazo yako..." />
        ) : filteredListings.length === 0 ? (
          <EmptyState
            title="Hujaweka tangazo lolote bado"
            description="Je, una simu, kifaa, kitabu, au huduma unayotaka kuuza? Tangaza sasa bure uunganishe na wanunuzi!"
            actionText="+ Weka Tangazo Lako la Kwanza"
            actionLink="/ongeza"
            icon="📦"
          />
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px"
          }}>
            {filteredListings.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "var(--card-bg, #ffffff)",
                  borderRadius: "14px",
                  border: "1px solid var(--line, #e2e8f0)",
                  overflow: "hidden"
                }}
              >
                <ListingCard listing={item} />
                {/* Seller Quick Control Bar */}
                <div style={{
                  padding: "10px 14px",
                  backgroundColor: "#f8fafc",
                  borderTop: "1px solid var(--line, #f1f5f9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  fontSize: "12px"
                }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {item.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => handleMarkSold(item.id, "sold")}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          backgroundColor: "#ffffff",
                          cursor: "pointer",
                          fontWeight: "600"
                        }}
                        title="Weka alama kuwa imeshauzwa"
                      >
                        🤝 Weka Imeshauzwa
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMarkSold(item.id, "active")}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "1px solid #bbf7d0",
                          backgroundColor: "#f0fdf4",
                          color: "#166534",
                          cursor: "pointer",
                          fontWeight: "600"
                        }}
                      >
                        🟢 Rejesha Sokoni
                      </button>
                    )}

                    <Link
                      to={`/hariri/${item.id}`}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#ffffff",
                        color: "inherit",
                        textDecoration: "none",
                        fontWeight: "600"
                      }}
                    >
                      ✏️ Hariri
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteListing(item.id)}
                    style={{
                      border: "none",
                      backgroundColor: "transparent",
                      color: "#e11d48",
                      cursor: "pointer",
                      fontSize: "14px"
                    }}
                    title="Futa tangazo"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

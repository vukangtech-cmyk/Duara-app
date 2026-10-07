import React, { useState, useEffect } from "react";
import { getCustomerAds, createCustomerAd, updateAdStatus, uploadImage } from "./api/api";
import { PaymentModal } from "./PaymentModal";

export function CustomerAdsDashboard({ profile, onShowToast, onOpenDirectMessage, onViewUserProfile, lang = "sw" }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // 'all' | 'my_ads' | 'create'
  const [selectedAdForPayment, setSelectedAdForPayment] = useState(null);
  const [previewAdImage, setPreviewAdImage] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Ad Form State
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Vifaa vya Kielektroniki");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(profile?.location || "Dar es Salaam");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || "");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [plan, setPlan] = useState("standard"); // 'standard' (5000) or 'boosted' (15000)

  const categories = [
    "Vifaa vya Kielektroniki",
    "Mavazi & Mitindo",
    "Magari & Vipuri",
    "Nyumba & Viwanja",
    "Huduma & Ufundi",
    "Kilimo & Mifugo",
    "Afya & Urembo",
    "Vyakula & Mikahawa"
  ];

  const fetchAds = async () => {
    try {
      setLoading(true);
      const data = await getCustomerAds();
      setAds(data);
    } catch (err) {
      console.warn("Fetch ads error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateAd = async (e) => {
    e.preventDefault();
    if (!title.trim() || !price || !description.trim()) {
      if (onShowToast) onShowToast("Tafadhali jaza taarifa zote muhimu!");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80";
      if (imageFile) {
        imageUrl = await uploadImage(profile.id, imageFile, "ads-media");
      }

      const isBoosted = plan === "boosted";
      const fee = isBoosted ? 15000 : 5000;

      const newAd = await createCustomerAd(profile.id, {
        title: title.trim(),
        price: Number(price),
        currency: "TZS",
        category,
        description: description.trim(),
        image_url: imageUrl,
        location: location.trim(),
        phone: phone.trim(),
        whatsapp: (whatsapp.trim() || phone.trim()).replace(/[^0-9]/g, ""),
        status: "pending_payment",
        paid_amount: 0,
        payment_status: "pending_verification"
      });

      // Prompt payment modal
      setSelectedAdForPayment({
        ...newAd,
        amountToPay: fee,
        isBoost: isBoosted,
        purposeName: isBoosted ? "Kipengele cha Boosted Ad (TZS 15,000)" : "Tangazo la Kawaida (TZS 5,000)"
      });

      setTitle("");
      setPrice("");
      setDescription("");
      setImageFile(null);
      setImagePreview("");
      setTab("my_ads");
      fetchAds();
    } catch (err) {
      if (onShowToast) onShowToast("Hitilafu wakati wa kupost: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const myAds = ads.filter((a) => a.user_id === profile?.id);
  const filteredAds = ads.filter((a) => {
    const matchCat = filterCategory === "all" || a.category === filterCategory;
    const matchQuery =
      !searchQuery ||
      a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div style={{ maxWidth: 1080, width: "100%", margin: "0 auto" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f766e, #18a66a)",
          color: "#fff",
          borderRadius: 16,
          padding: "14px 18px",
          marginBottom: 14,
          boxShadow: "0 4px 20px rgba(15, 118, 110, 0.15)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>📢</span>
            <h2 style={{ margin: 0, fontSize: "clamp(18px, 3vw, 22px)", fontWeight: 800, color: "#fff" }}>
              Matangazo
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setTab("create")}
            style={{
              background: "#fff",
              color: "#0f766e",
              border: "none",
              borderRadius: 10,
              padding: "9px 14px",
              fontWeight: 800,
              fontSize: 12.5,
              cursor: "pointer"
            }}
          >
            ➕ Weka Tangazo
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", borderBottom: "1px solid var(--line, #e2e8f0)", marginBottom: 16, paddingBottom: 4 }}>
        <button
          type="button"
          onClick={() => setTab("all")}
          style={{
            padding: "8px 14px",
            border: "none",
            borderBottom: tab === "all" ? "3px solid #18a66a" : "3px solid transparent",
            background: tab === "all" ? "rgba(24, 166, 106, 0.08)" : "transparent",
            borderRadius: "8px 8px 0 0",
            fontWeight: tab === "all" ? 800 : 600,
            color: tab === "all" ? "#18a66a" : "var(--muted)",
            cursor: "pointer",
            fontSize: 12.5,
            whiteSpace: "nowrap"
          }}
        >
          Matangazo ({ads.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("my_ads")}
          style={{
            padding: "8px 14px",
            border: "none",
            borderBottom: tab === "my_ads" ? "3px solid #18a66a" : "3px solid transparent",
            background: tab === "my_ads" ? "rgba(24, 166, 106, 0.08)" : "transparent",
            borderRadius: "8px 8px 0 0",
            fontWeight: tab === "my_ads" ? 800 : 600,
            color: tab === "my_ads" ? "#18a66a" : "var(--muted)",
            cursor: "pointer",
            fontSize: 12.5,
            whiteSpace: "nowrap"
          }}
        >
          Yangu ({myAds.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("create")}
          style={{
            padding: "8px 14px",
            border: "none",
            borderBottom: tab === "create" ? "3px solid #18a66a" : "3px solid transparent",
            background: tab === "create" ? "rgba(24, 166, 106, 0.08)" : "transparent",
            borderRadius: "8px 8px 0 0",
            fontWeight: tab === "create" ? 800 : 600,
            color: tab === "create" ? "#18a66a" : "var(--muted)",
            cursor: "pointer",
            fontSize: 12.5,
            whiteSpace: "nowrap"
          }}
        >
          ➕ Weka Tangazo
        </button>
      </div>

      {/* TAB 1: ALL ADS */}
      {tab === "all" && (
        <div>
          {/* Filters */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Tafuta tangazo lolote, jina la bidhaa au eneo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: "1 1 240px",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid var(--line, #cbd5e1)",
                fontSize: 14,
                background: "var(--input-bg, #fff)"
              }}
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid var(--line, #cbd5e1)",
                fontSize: 14,
                background: "var(--input-bg, #fff)"
              }}
            >
              <option value="all">Kategoria Zote</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>Inapakia matangazo...</div>
          ) : filteredAds.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "var(--bg-hover, #f8fafc)",
                borderRadius: 12,
                border: "1px dashed var(--line, #cbd5e1)"
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏷️</div>
              <h3 style={{ margin: 0, fontSize: 16 }}>Hakuna matangazo yaliyopatikana kwa sasa.</h3>
              <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
                Kuwa wa kwanza kuweka tangazo lako na uanze kupokea simu na oda!
              </p>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setTab("create")}
                style={{ marginTop: 12 }}
              >
                Post Tangazo Lako Sasa
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 265px), 1fr))", gap: 18 }}>
              {filteredAds.map((ad) => (
                <div
                  key={ad.id}
                  style={{
                    background: "var(--card-bg, #fff)",
                    border: ad.status === "boosted" ? "2px solid #18a66a" : "1px solid var(--line, #e2e8f0)",
                    borderRadius: 16,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    boxShadow: ad.status === "boosted" ? "0 4px 16px rgba(24, 166, 106, 0.15)" : "var(--shadow-sm)"
                  }}
                >
                  {ad.status === "boosted" && (
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        background: "#18a66a",
                        color: "#fff",
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.05em",
                        zIndex: 2
                      }}
                    >
                      ⚡ BOOSTED AD
                    </div>
                  )}

                  <div
                    onClick={() => setPreviewAdImage(ad)}
                    title="Bonyeza kuona picha kamili"
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "4 / 3",
                      background: "linear-gradient(135deg, #0f172a, #1e293b)",
                      cursor: "zoom-in",
                      overflow: "hidden"
                    }}
                  >
                    <img
                      src={ad.image_url}
                      alt={ad.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      loading="lazy"
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        background: "rgba(0,0,0,0.8)",
                        color: "#fff",
                        padding: "4px 10px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 800
                      }}
                    >
                      TZS {Number(ad.price).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                      {ad.category}
                    </span>
                    <h3 style={{ margin: "4px 0 8px", fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>
                      {ad.title}
                    </h3>
                    <p
                      style={{
                        margin: "0 0 12px",
                        fontSize: 13,
                        color: "var(--muted)",
                        lineHeight: 1.4,
                        flex: 1
                      }}
                    >
                      {ad.description}
                    </p>

                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                      <span>📍 <strong>{ad.location}</strong></span>
                      {ad.profiles?.display_name && onViewUserProfile && (
                        <button
                          type="button"
                          onClick={() =>
                            onViewUserProfile({
                              id: ad.user_id,
                              display_name: ad.profiles.display_name,
                              username: ad.profiles.username || "member",
                              avatar_url: ad.profiles.avatar_url
                            })
                          }
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "var(--primary)",
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: 0
                          }}
                        >
                          👤 {ad.profiles.display_name}
                        </button>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {ad.whatsapp && (
                        <a
                          href={`https://wa.me/${ad.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                            `Habari, nimeona tangazo lako la "${ad.title}" lenye bei TZS ${Number(ad.price).toLocaleString()} kwenye THE CIRCLE DUARA.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            flex: 1,
                            minWidth: 100,
                            background: "#25D366",
                            color: "#fff",
                            padding: "8px",
                            borderRadius: 8,
                            textAlign: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            textDecoration: "none"
                          }}
                        >
                          💬 WhatsApp
                        </a>
                      )}
                      {ad.phone && (
                        <a
                          href={`tel:${ad.phone}`}
                          style={{
                            flex: 1,
                            minWidth: 95,
                            background: "var(--bg-hover, #f1f5f9)",
                            color: "var(--text, #1e293b)",
                            border: "1px solid var(--line, #cbd5e1)",
                            padding: "8px",
                            borderRadius: 8,
                            textAlign: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            textDecoration: "none"
                          }}
                        >
                          📞 Piga Simu
                        </a>
                      )}
                      {onOpenDirectMessage && ad.user_id && ad.user_id !== profile?.id && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenDirectMessage(
                              ad.user_id,
                              ad.profiles?.display_name || "Muuzaji",
                              `Habari! Nimevutiwa na tangazo lako la "${ad.title}" (TZS ${Number(ad.price || 0).toLocaleString()}).`
                            )
                          }
                          style={{
                            flex: 1,
                            minWidth: 105,
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            border: "1px solid #bfdbfe",
                            padding: "8px",
                            borderRadius: 8,
                            textAlign: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          ✉️ Tuma Message
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY ADS */}
      {tab === "my_ads" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Matangazo Yako Uliyoweka ({myAds.length})</h3>
            <button
              type="button"
              className="button button-primary"
              onClick={() => setTab("create")}
              style={{ padding: "8px 14px", fontSize: 13 }}
            >
              ➕ Weka Tangazo Jipya
            </button>
          </div>

          {myAds.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", background: "var(--bg-hover)", borderRadius: 12 }}>
              <p style={{ color: "var(--muted)" }}>Bado hujaweka tangazo lolote.</p>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setTab("create")}
                style={{ marginTop: 8 }}
              >
                Anza Kupost Sasa
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {myAds.map((ad) => (
                <div
                  key={ad.id}
                  style={{
                    background: "var(--card-bg, #fff)",
                    border: "1px solid var(--line, #e2e8f0)",
                    borderRadius: 12,
                    padding: "16px",
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    flexWrap: "wrap"
                  }}
                >
                  <img
                    src={ad.image_url}
                    alt={ad.title}
                    style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }}
                  />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h4 style={{ margin: 0, fontSize: 16 }}>{ad.title}</h4>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 700,
                          background: ad.status === "boosted" ? "#18a66a20" : "#0284c720",
                          color: ad.status === "boosted" ? "#18a66a" : "#0284c7"
                        }}
                      >
                        {ad.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#18a66a", marginTop: 4 }}>
                      TZS {Number(ad.price).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                      👁️ Views: {ad.views_count || 12} | 🖱️ Clicks: {ad.clicks_count || 3} | Malipo:{" "}
                      <strong>{ad.payment_status || "Yamelipwa"}</strong>
                    </div>
                  </div>
                  <div>
                    {ad.status !== "boosted" && (
                      <button
                        type="button"
                        className="button button-soft"
                        onClick={() =>
                          setSelectedAdForPayment({
                            ...ad,
                            amountToPay: 15000,
                            purposeName: `Boost Tangazo: ${ad.title}`,
                            isBoost: true
                          })
                        }
                        style={{ fontSize: 12, padding: "8px 12px" }}
                      >
                        ⚡ Boost Tangazo (TZS 15k)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CREATE AD FORM */}
      {tab === "create" && (
        <div
          style={{
            background: "var(--card-bg, #fff)",
            border: "1px solid var(--line, #e2e8f0)",
            borderRadius: 16,
            padding: "24px"
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>
            Weka Tangazo Jipya la Bidhaa au Huduma Yako
          </h3>

          <form onSubmit={handleCreateAd} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Jina la Bidhaa au Kichwa cha Tangazo: *
              </label>
              <input
                type="text"
                placeholder="Mfano: Simu ya Samsung Galaxy A54 MPYA, GB 128"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--line, #cbd5e1)",
                  fontSize: 14,
                  background: "var(--input-bg, #fff)"
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Bei ya Bidhaa (TZS): *
                </label>
                <input
                  type="number"
                  placeholder="Mfano: 450000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min="500"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--line, #cbd5e1)",
                    fontSize: 14,
                    background: "var(--input-bg, #fff)"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Kategoria: *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--line, #cbd5e1)",
                    fontSize: 14,
                    background: "var(--input-bg, #fff)"
                  }}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Picha ya Bidhaa / Tangazo: *
              </label>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <div style={{ marginTop: 10 }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 8 }}
                  />
                </div>
              )}
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Maelezo ya Kina ya Bidhaa/Huduma: *
              </label>
              <textarea
                rows={4}
                placeholder="Eleza sifa zake, hali ya bidhaa (mpya au used), masharti ya usafirishaji, n.k."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--line, #cbd5e1)",
                  fontSize: 14,
                  background: "var(--input-bg, #fff)"
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Eneo / Mji:
                </label>
                <input
                  type="text"
                  placeholder="Mfano: Kariakoo, Dar es Salaam"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--line, #cbd5e1)",
                    fontSize: 13
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Namba ya Simu:
                </label>
                <input
                  type="text"
                  placeholder="+255 754 123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--line, #cbd5e1)",
                    fontSize: 13
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  WhatsApp:
                </label>
                <input
                  type="text"
                  placeholder="255754123456"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--line, #cbd5e1)",
                    fontSize: 13
                  }}
                />
              </div>
            </div>

            {/* Plan selection */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                Chagua Kifurushi cha Tangazo:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
                <div
                  onClick={() => setPlan("standard")}
                  style={{
                    border: plan === "standard" ? "2px solid #18a66a" : "1px solid var(--line, #cbd5e1)",
                    background: plan === "standard" ? "#18a66a10" : "transparent",
                    borderRadius: 12,
                    padding: "16px",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#18a66a" }}>Standard Ad</div>
                  <div style={{ fontSize: 18, fontWeight: 800, margin: "4px 0" }}>TZS 5,000</div>
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                    Inaonekana kwenye feed ya matangazo kwa siku 30.
                  </p>
                </div>

                <div
                  onClick={() => setPlan("boosted")}
                  style={{
                    border: plan === "boosted" ? "2px solid #18a66a" : "1px solid var(--line, #cbd5e1)",
                    background: plan === "boosted" ? "#18a66a10" : "transparent",
                    borderRadius: 12,
                    padding: "16px",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#18a66a" }}>⚡ Boosted Ad (Top Placement)</div>
                  <div style={{ fontSize: 18, fontWeight: 800, margin: "4px 0" }}>TZS 15,000</div>
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                    Inawekwa juu kabisa (Top Priority) na kupewa nembo ya Verified.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                background: "#18a66a",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "14px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                marginTop: 8
              }}
            >
              {submitting ? "Inapakia..." : "Weka Tangazo & Endelea na Malipo"}
            </button>
          </form>
        </div>
      )}

      {/* Full Image Preview Modal */}
      {previewAdImage && (
        <div
          className="modal-backdrop"
          onClick={() => setPreviewAdImage(null)}
          style={{ zIndex: 10000, padding: 16 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 680,
              width: "100%",
              background: "var(--card-bg, #fff)",
              borderRadius: 20,
              padding: 18,
              border: "1px solid var(--line)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{previewAdImage.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewAdImage(null)}
                style={{ border: "none", background: "var(--bg-base)", width: 32, height: 32, borderRadius: "50%", fontSize: 16, cursor: "pointer", color: "var(--ink)" }}
              >
                ✕
              </button>
            </div>
            <div style={{ background: "#0f172a", borderRadius: 14, overflow: "hidden", maxHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src={previewAdImage.image_url}
                alt={previewAdImage.title}
                style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", display: "block" }}
              />
            </div>
            <p style={{ marginTop: 12, fontSize: 13.5, color: "var(--ink)", lineHeight: 1.5 }}>
              {previewAdImage.description}
            </p>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedAdForPayment && (
        <PaymentModal
          isOpen={Boolean(selectedAdForPayment)}
          onClose={() => setSelectedAdForPayment(null)}
          title={selectedAdForPayment.purposeName || "Malipo ya Tangazo"}
          amount={selectedAdForPayment.amountToPay || 5000}
          purpose={`Tangazo: ${selectedAdForPayment.title}`}
          adId={selectedAdForPayment.id}
          isBoost={Boolean(selectedAdForPayment.isBoost)}
          onPaymentSuccess={async (paymentDetails) => {
            try {
              if (onShowToast) {
                onShowToast(paymentDetails.pending
                  ? "Ombi la malipo limepokelewa. Baada ya kuthibitishwa, lipia tangazo kupitia Wallet."
                  : "Malipo yamethibitishwa! Tangazo lako lipo hewani.");
              }
              fetchAds();
            } catch (err) {
              console.warn(err);
            }
          }}
          lang={lang}
        />
      )}
    </div>
  );
}

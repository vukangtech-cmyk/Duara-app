import React, { useState, useEffect } from "react";
import {
  getCustomerAds,
  getManagerCatalogues,
  getAffiliateOrders,
  getPayoutRequests,
  updatePayoutStatus,
  getPlatformSettings,
  updatePlatformSettings
} from "./api/api";

export function CeoDashboard({ profile, onShowToast, onOpenShop, lang = "sw" }) {
  const [ads, setAds] = useState([]);
  const [catalogues, setCatalogues] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("settings"); // 'settings' | 'overview' | 'payouts' | 'all_ads'

  // Manual CEO Settings State (No fake defaults)
  const [commissionRate, setCommissionRate] = useState("10");
  const [adPostingFee, setAdPostingFee] = useState("5000");
  const [adBoostFee, setAdBoostFee] = useState("15000");

  // Manual Lipa Namba
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [mpesaName, setMpesaName] = useState("");
  const [tigoNumber, setTigoNumber] = useState("");
  const [tigoName, setTigoName] = useState("");
  const [airtelNumber, setAirtelNumber] = useState("");
  const [airtelName, setAirtelName] = useState("");
  const [haloNumber, setHaloNumber] = useState("");
  const [haloName, setHaloName] = useState("");
  const [bankNumber, setBankNumber] = useState("");
  const [bankName, setBankName] = useState("");

  // Manual Social Media Accounts for CEO
  const [socialWhatsapp, setSocialWhatsapp] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialTiktok, setSocialTiktok] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialTelegram, setSocialTelegram] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");

  const [savingSettings, setSavingSettings] = useState(false);

  const loadCeoData = async () => {
    try {
      setLoading(true);
      const [adsData, catData, ordData, payData, settData] = await Promise.all([
        getCustomerAds(),
        getManagerCatalogues(),
        getAffiliateOrders(),
        getPayoutRequests(),
        getPlatformSettings()
      ]);
      setAds(adsData || []);
      setCatalogues(catData || []);
      setOrders(ordData || []);
      setPayouts(payData || []);
      setSettings(settData);

      if (settData) {
        setCommissionRate(String(settData.default_commission_rate ?? "10"));
        setAdPostingFee(String(settData.ad_posting_fee ?? "5000"));
        setAdBoostFee(String(settData.ad_boost_fee ?? "15000"));

        const pn = settData.payment_numbers || {};
        const sl = settData.social_links || pn.social_links || {};

        setMpesaNumber(pn.mpesa || "");
        setMpesaName(pn.mpesa_name || "");
        setTigoNumber(pn.tigopesa || "");
        setTigoName(pn.tigopesa_name || "");
        setAirtelNumber(pn.airtel || "");
        setAirtelName(pn.airtel_name || "");
        setHaloNumber(pn.halopesa || "");
        setHaloName(pn.halopesa_name || "");
        setBankNumber(pn.bank || "");
        setBankName(pn.bank_name || "");

        setSocialWhatsapp(sl.whatsapp || profile?.whatsapp || "");
        setSocialInstagram(sl.instagram || "");
        setSocialTiktok(sl.tiktok || "");
        setSocialFacebook(sl.facebook || "");
        setSocialTelegram(sl.telegram || "");
        setSocialYoutube(sl.youtube || "");
      }
    } catch (err) {
      console.warn("CEO data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCeoData();
  }, []);

  const handleApprovePayout = async (payoutId) => {
    try {
      await updatePayoutStatus(payoutId, "paid");
      if (onShowToast) onShowToast("✓ Ombi la Payout limeidhinishwa!");
      loadCeoData();
    } catch (err) {
      if (onShowToast) onShowToast("Hitilafu: " + err.message);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await updatePlatformSettings({
        default_commission_rate: Number(commissionRate) || 10,
        ad_posting_fee: Number(adPostingFee) || 5000,
        ad_boost_fee: Number(adBoostFee) || 15000,
        payment_numbers: {
          mpesa: mpesaNumber.trim(),
          mpesa_name: mpesaName.trim(),
          tigopesa: tigoNumber.trim(),
          tigopesa_name: tigoName.trim(),
          airtel: airtelNumber.trim(),
          airtel_name: airtelName.trim(),
          halopesa: haloNumber.trim(),
          halopesa_name: haloName.trim(),
          bank: bankNumber.trim(),
          bank_name: bankName.trim()
        },
        social_links: {
          whatsapp: socialWhatsapp.trim(),
          instagram: socialInstagram.trim(),
          tiktok: socialTiktok.trim(),
          facebook: socialFacebook.trim(),
          telegram: socialTelegram.trim(),
          youtube: socialYoutube.trim()
        }
      });
      if (onShowToast) {
        onShowToast("✓ Lipa Namba, Mitandao ya Kijamii na Mipangilio ya CEO imehifadhiwa!");
      }
      loadCeoData();
    } catch (err) {
      if (onShowToast) onShowToast("Hitilafu: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const totalTurnover = orders.reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const totalAdsRevenue = ads.reduce((s, a) => s + (Number(a.paid_amount) || 0), 0);
  const pendingPayouts = payouts.filter((p) => p.status === "pending");

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
      {/* CEO Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          color: "#fff",
          borderRadius: 18,
          padding: "20px",
          marginBottom: 18,
          border: "1px solid rgba(255,255,255,0.1)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <span
              style={{
                background: "#eab308",
                color: "#000",
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 900,
                display: "inline-block",
                marginBottom: 6
              }}
            >
              👑 OFISI YA CEO • HAMZA VUKANG
            </span>
            <h2 style={{ margin: "2px 0 4px", fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 800, color: "#fff" }}>
              Usimamizi Mkuu wa Shop, Lipa Namba & Mitandao ya Kijamii
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "#cbd5e1" }}>
              Weka Lipa Namba zako manual, unganisha akaunti zako za mitandao ya kijamii, na simamia Shop na matangazo.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {onOpenShop && (
              <button
                type="button"
                onClick={onOpenShop}
                style={{
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                🛍️ Nenda Kwenye Shop (Hariri Bidhaa)
              </button>
            )}
            <button
              type="button"
              onClick={loadCeoData}
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid rgba(255,255,255,0.1)"
          }}
        >
          <div style={{ background: "rgba(255,255,255,0.06)", padding: "12px", borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Mauzo ya Oda</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#38bdf8", marginTop: 2 }}>
              TZS {totalTurnover.toLocaleString()}
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.06)", padding: "12px", borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Bidhaa za Shop (DB)</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#4ade80", marginTop: 2 }}>
              {catalogues.length} Bidhaa
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.06)", padding: "12px", borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Matangazo ya Wateja</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#facc15", marginTop: 2 }}>
              {ads.length} Ads
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.06)", padding: "12px", borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Payout Zinazosubiri</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f87171", marginTop: 2 }}>
              {pendingPayouts.length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 16, borderBottom: "1px solid var(--line)" }}>
        {[
          { id: "settings", label: "⚙️ Lipa Namba & Mitandao ya Kijamii (Manual)" },
          { id: "overview", label: `📦 Oda & Bidhaa (${orders.length})` },
          { id: "all_ads", label: `📢 Matangazo (${ads.length})` },
          { id: "payouts", label: `💸 Payouts (${pendingPayouts.length})` }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`button ${activeTab === t.id ? "button-primary" : "button-soft"}`}
            style={{ padding: "8px 14px", fontSize: 12.5 }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: MANUAL SETTINGS (LIPA NAMBA & SOCIAL MEDIA LINKS) */}
      {activeTab === "settings" && (
        <div className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800 }}>
            ⚙️ Weka Manual: Lipa Namba & Akaunti za Mitandao ya Kijamii za CEO
          </h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 18 }}>
            Hakuna namba za kubuni. Weka Lipa Namba zako halisi na viungo vya akaunti zako za mitandao ya kijamii ili wateja wakupate moja kwa moja kwenye kila bidhaa.
          </p>

          <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* 1. Lipa Namba Section */}
            <div style={{ padding: 16, borderRadius: 12, background: "var(--bg-base)", border: "1px solid var(--line)" }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "var(--primary)" }}>
                💳 1. Lipa Namba & Akaunti za Malipo (Weka Manual)
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Vodacom M-Pesa (Lipa Namba / Simu):</label>
                  <input
                    type="text"
                    placeholder="Weka namba ya M-Pesa..."
                    value={mpesaNumber}
                    onChange={(e) => setMpesaNumber(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Jina la M-Pesa (Mpokeaji):</label>
                  <input
                    type="text"
                    placeholder="Jina la mpokeaji..."
                    value={mpesaName}
                    onChange={(e) => setMpesaName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Mixx by Yas / Tigo Pesa (Lipa Namba / Simu):</label>
                  <input
                    type="text"
                    placeholder="Weka namba ya Tigo Pesa..."
                    value={tigoNumber}
                    onChange={(e) => setTigoNumber(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Jina la Tigo Pesa (Mpokeaji):</label>
                  <input
                    type="text"
                    placeholder="Jina la mpokeaji..."
                    value={tigoName}
                    onChange={(e) => setTigoName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Airtel Money (Lipa Namba / Simu):</label>
                  <input
                    type="text"
                    placeholder="Weka namba ya Airtel Money..."
                    value={airtelNumber}
                    onChange={(e) => setAirtelNumber(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Jina la Airtel Money:</label>
                  <input
                    type="text"
                    placeholder="Jina la mpokeaji..."
                    value={airtelName}
                    onChange={(e) => setAirtelName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>HaloPesa (Lipa Namba / Simu):</label>
                  <input
                    type="text"
                    placeholder="Weka namba ya HaloPesa..."
                    value={haloNumber}
                    onChange={(e) => setHaloNumber(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Jina la HaloPesa:</label>
                  <input
                    type="text"
                    placeholder="Jina la mpokeaji..."
                    value={haloName}
                    onChange={(e) => setHaloName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Benki (CRDB / NMB - Namba ya Akaunti):</label>
                  <input
                    type="text"
                    placeholder="Weka namba ya akaunti ya benki..."
                    value={bankNumber}
                    onChange={(e) => setBankNumber(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Jina la Akaunti ya Benki:</label>
                  <input
                    type="text"
                    placeholder="Jina la akaunti..."
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 2. CEO Social Media Accounts Section */}
            <div style={{ padding: 16, borderRadius: 12, background: "var(--bg-base)", border: "1px solid var(--line)" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: 15, color: "var(--primary)" }}>
                🔗 2. Akaunti za Mitandao ya Kijamii za CEO (Zitaonekana Kwenye Bidhaa Zote)
              </h4>
              <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
                Wateja wakibonyeza link kwenye bidhaa yoyote au ukurasa wowote watafikia akaunti hizi moja kwa moja.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>💬 Namba ya WhatsApp (mf. 2557...):</label>
                  <input
                    type="text"
                    placeholder="Mfano: 2557..."
                    value={socialWhatsapp}
                    onChange={(e) => setSocialWhatsapp(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>📸 Instagram (@username au Link):</label>
                  <input
                    type="text"
                    placeholder="Mfano: @username au link"
                    value={socialInstagram}
                    onChange={(e) => setSocialInstagram(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>🎵 TikTok (@username au Link):</label>
                  <input
                    type="text"
                    placeholder="Mfano: @username au link"
                    value={socialTiktok}
                    onChange={(e) => setSocialTiktok(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>📘 Facebook (Page au Profile Link):</label>
                  <input
                    type="text"
                    placeholder="Mfano: https://facebook.com/..."
                    value={socialFacebook}
                    onChange={(e) => setSocialFacebook(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>✈️ Telegram (@username au Link):</label>
                  <input
                    type="text"
                    placeholder="Mfano: @username au https://t.me/..."
                    value={socialTelegram}
                    onChange={(e) => setSocialTelegram(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>▶️ YouTube / X (Twitter):</label>
                  <input
                    type="text"
                    placeholder="Link ya YouTube au X..."
                    value={socialYoutube}
                    onChange={(e) => setSocialYoutube(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 3. Ad Fees */}
            <div style={{ padding: 16, borderRadius: 12, background: "var(--bg-base)", border: "1px solid var(--line)" }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "var(--primary)" }}>
                📢 3. Gharama za Matangazo ya Wateja (TZS)
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Tangazo la Kawaida (TZS):</label>
                  <input
                    type="number"
                    value={adPostingFee}
                    onChange={(e) => setAdPostingFee(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Boosted Ad (TZS):</label>
                  <input
                    type="number"
                    value={adBoostFee}
                    onChange={(e) => setAdBoostFee(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Kamisheni (%):</label>
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="button button-primary" disabled={savingSettings} style={{ padding: 14 }}>
              {savingSettings ? "Inahifadhi..." : "💾 Hifadhi Mipangilio Yote ya CEO"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: OVERVIEW (ORDERS & SHOP PRODUCTS) */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          <div className="glass-card" style={{ padding: 18 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>📦 Oda za Wateja ({orders.length})</h3>
            {orders.length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>Hakuna oda zilizowekwa bado.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {orders.map((o) => (
                  <div
                    key={o.id}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      background: "var(--bg-base)",
                      border: "1px solid var(--line)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{o.customer_name}</div>
                      <div className="muted" style={{ fontSize: 11 }}>{o.customer_phone} • {o.delivery_address}</div>
                    </div>
                    <div style={{ fontWeight: 800, color: "var(--primary)", fontSize: 13 }}>
                      {Number(o.amount) > 0 ? `TZS ${Number(o.amount).toLocaleString()}` : "Oda"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: 18 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>🛍️ Bidhaa Ulizohifadhi Kwenye Database ({catalogues.length})</h3>
            {catalogues.length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>
                Bonyeza "Nenda Kwenye Shop" kuweka bei na maelezo manual kwenye simu na vifaa vya simu.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {catalogues.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      background: "var(--bg-base)",
                      border: "1px solid var(--line)",
                      display: "flex",
                      alignItems: "center",
                      gap: 10
                    }}
                  >
                    <img src={c.image_url} alt={c.name} style={{ width: 42, height: 42, borderRadius: 8, objectFit: "cover" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700 }}>
                        {Number(c.price) > 0 ? `TZS ${Number(c.price).toLocaleString()}` : "Bei haijawekwa"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ALL ADS */}
      {activeTab === "all_ads" && (
        <div className="glass-card" style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 16 }}>📢 Matangazo ya Wateja ({ads.length})</h3>
          {ads.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>Hakuna matangazo yaliyowekwa bado.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  style={{
                    padding: 12,
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap"
                  }}
                >
                  <img src={ad.image_url} alt={ad.title} style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover" }} />
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{ad.title}</div>
                    <div style={{ color: "var(--primary)", fontWeight: 700, fontSize: 13 }}>
                      TZS {Number(ad.price).toLocaleString()} ({ad.category})
                    </div>
                    <div className="muted" style={{ fontSize: 11 }}>Simu: {ad.phone}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PAYOUTS */}
      {activeTab === "payouts" && (
        <div className="glass-card" style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 16 }}>💸 Maombi ya Payout ({payouts.length})</h3>
          {payouts.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>Hakuna maombi ya kutoa fedha kwa sasa.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {payouts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: 14,
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>TZS {Number(p.amount).toLocaleString()}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {p.method} • {p.account_number}
                    </div>
                  </div>
                  {p.status === "pending" ? (
                    <button type="button" className="button button-primary" onClick={() => handleApprovePayout(p.id)}>
                      ✓ Idhinisha Malipo
                    </button>
                  ) : (
                    <span style={{ color: "#16a34a", fontWeight: 800, fontSize: 12 }}>IMELIPWA</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

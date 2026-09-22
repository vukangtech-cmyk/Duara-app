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

export function CeoDashboard({ profile, onShowToast, lang = "sw" }) {
  const [ads, setAds] = useState([]);
  const [catalogues, setCatalogues] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'payouts' | 'settings' | 'all_ads'

  // Settings edit state
  const [commissionRate, setCommissionRate] = useState("10");
  const [adPostingFee, setAdPostingFee] = useState("5000");
  const [adBoostFee, setAdBoostFee] = useState("15000");
  const [mpesaTill, setMpesaTill] = useState("554433");
  const [tigoLipa, setTigoLipa] = useState("778899");
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
      setAds(adsData);
      setCatalogues(catData);
      setOrders(ordData);
      setPayouts(payData);
      setSettings(settData);

      if (settData) {
        setCommissionRate(String(settData.default_commission_rate || "10"));
        setAdPostingFee(String(settData.ad_posting_fee || "5000"));
        setAdBoostFee(String(settData.ad_boost_fee || "15000"));
        setMpesaTill(settData.payment_numbers?.mpesa || "554433");
        setTigoLipa(settData.payment_numbers?.tigopesa || "778899");
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
      if (onShowToast) onShowToast("Ombi la Payout limelipwa na kuidhinishwa!");
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
        default_commission_rate: Number(commissionRate),
        ad_posting_fee: Number(adPostingFee),
        ad_boost_fee: Number(adBoostFee),
        payment_numbers: {
          ...settings?.payment_numbers,
          mpesa: mpesaTill,
          tigopesa: tigoLipa
        }
      });
      if (onShowToast) onShowToast("Mipangilio ya mtandao imesasishwa kikamilifu!");
      loadCeoData();
    } catch (err) {
      if (onShowToast) onShowToast("Hitilafu: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // Calculations
  const totalTurnover = orders.reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const totalAdsRevenue = ads.reduce((s, a) => s + (Number(a.paid_amount) || 5000), 0);
  const pendingPayouts = payouts.filter((p) => p.status === "pending");

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px" }}>
      {/* CEO Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b, #0f172a)",
          color: "#fff",
          borderRadius: 16,
          padding: "24px",
          marginBottom: 24,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.3)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  background: "#eab308",
                  color: "#000",
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.08em"
                }}
              >
                👑 OFISI YA CEO & MTANDAO
              </span>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>Usimamizi Mkuu wa Duara Affiliate Network</span>
            </div>
            <h2 style={{ margin: "4px 0", fontSize: 26, fontWeight: 800 }}>
              Karibu, CEO HAMZA VUKANG
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: "#cbd5e1" }}>
              Hapa ndipo kitovu cha kuendesha mtandao mzima, kuthibitisha malipo, na kufuatilia utendaji wa mameneja.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={loadCeoData}
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              🔄 Refresh Takwimu
            </button>
          </div>
        </div>

        {/* Global Financial KPI Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
            marginTop: 24,
            paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,0.1)"
          }}
        >
          <div style={{ background: "rgba(255,255,255,0.05)", padding: "14px", borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }}>Jumla ya Mauzo ya Mtandao</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#38bdf8", marginTop: 4 }}>
              TZS {totalTurnover.toLocaleString()}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.05)", padding: "14px", borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }}>Mapato ya Matangazo (Ads)</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#4ade80", marginTop: 4 }}>
              TZS {totalAdsRevenue.toLocaleString()}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.05)", padding: "14px", borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }}>Matangazo Yaliyopo</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#facc15", marginTop: 4 }}>
              {ads.length} Ads
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.05)", padding: "14px", borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }}>Maombi ya Payout Yanayosubiri</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: pendingPayouts.length > 0 ? "#f87171" : "#94a3b8", marginTop: 4 }}>
              {pendingPayouts.length} Maombi
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, borderBottom: "1px solid var(--line, #e2e8f0)", marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          style={{
            padding: "10px 18px",
            border: "none",
            borderBottom: activeTab === "overview" ? "3px solid #eab308" : "3px solid transparent",
            background: "transparent",
            fontWeight: activeTab === "overview" ? 700 : 500,
            color: activeTab === "overview" ? "#ca8a04" : "var(--muted)",
            cursor: "pointer",
            fontSize: 14
          }}
        >
          📊 Mtazamo wa Jumla (Overview)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payouts")}
          style={{
            padding: "10px 18px",
            border: "none",
            borderBottom: activeTab === "payouts" ? "3px solid #eab308" : "3px solid transparent",
            background: "transparent",
            fontWeight: activeTab === "payouts" ? 700 : 500,
            color: activeTab === "payouts" ? "#ca8a04" : "var(--muted)",
            cursor: "pointer",
            fontSize: 14
          }}
        >
          💸 Uthibitisho wa Payout ({pendingPayouts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("all_ads")}
          style={{
            padding: "10px 18px",
            border: "none",
            borderBottom: activeTab === "all_ads" ? "3px solid #eab308" : "3px solid transparent",
            background: "transparent",
            fontWeight: activeTab === "all_ads" ? 700 : 500,
            color: activeTab === "all_ads" ? "#ca8a04" : "var(--muted)",
            cursor: "pointer",
            fontSize: 14
          }}
        >
          📢 Matangazo Yote ya Wateja ({ads.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          style={{
            padding: "10px 18px",
            border: "none",
            borderBottom: activeTab === "settings" ? "3px solid #eab308" : "3px solid transparent",
            background: "transparent",
            fontWeight: activeTab === "settings" ? 700 : 500,
            color: activeTab === "settings" ? "#ca8a04" : "var(--muted)",
            cursor: "pointer",
            fontSize: 14
          }}
        >
          ⚙️ Mipangilio ya Mtandao & Malipo
        </button>
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          {/* Recent Orders Card */}
          <div
            style={{
              background: "var(--card-bg, #fff)",
              border: "1px solid var(--line, #e2e8f0)",
              borderRadius: 14,
              padding: "20px"
            }}
          >
            <h3 style={{ margin: "0 0 14px", fontSize: 17, fontWeight: 700 }}>📦 Oda za Hivi Karibuni za Mtandao</h3>
            {orders.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>Hakuna oda za mtandao zilizowekwa bado.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {orders.slice(0, 5).map((o) => (
                  <div
                    key={o.id}
                    style={{
                      padding: "10px",
                      background: "var(--bg-hover, #f8fafc)",
                      borderRadius: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{o.customer_name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>Simu: {o.customer_phone}</div>
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 700, color: "#16a34a" }}>
                      TZS {Number(o.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catalogues Snapshot */}
          <div
            style={{
              background: "var(--card-bg, #fff)",
              border: "1px solid var(--line, #e2e8f0)",
              borderRadius: 14,
              padding: "20px"
            }}
          >
            <h3 style={{ margin: "0 0 14px", fontSize: 17, fontWeight: 700 }}>🛍️ Bidhaa Zilizopo kwenye Catalogues</h3>
            {catalogues.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>Hakuna bidhaa kwenye catalogue bado.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {catalogues.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "10px",
                      background: "var(--bg-hover, #f8fafc)",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 12
                    }}
                  >
                    <img
                      src={c.image_url}
                      alt={c.name}
                      style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "#0f766e", fontWeight: 700 }}>
                        TZS {Number(c.price).toLocaleString()}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{c.orders_count || 0} mauzo</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: PAYOUTS */}
      {activeTab === "payouts" && (
        <div
          style={{
            background: "var(--card-bg, #fff)",
            border: "1px solid var(--line, #e2e8f0)",
            borderRadius: 16,
            padding: "24px"
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>
            Uthibitishaji wa Maombi ya Kutoa Kamisheni (Payout Approvals)
          </h3>

          {payouts.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 14 }}>Hakuna maombi ya kutoa fedha kwa sasa.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {payouts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: "16px",
                    border: "1px solid var(--line, #cbd5e1)",
                    borderRadius: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    background: p.status === "pending" ? "#fffbeb" : "transparent"
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>TZS {Number(p.amount).toLocaleString()}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                      Njia: <strong>{p.method}</strong> | Namba ya Mpokeaji: <strong>{p.account_number}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                      Tarehe: {new Date(p.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {p.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => handleApprovePayout(p.id)}
                        style={{
                          background: "#16a34a",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          padding: "10px 16px",
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer"
                        }}
                      >
                        ✓ Thibitisha & Lipa M-Pesa
                      </button>
                    ) : (
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          background: "#16a34a20",
                          color: "#16a34a"
                        }}
                      >
                        IMELIPWA KIKAMILIFU
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: ALL ADS */}
      {activeTab === "all_ads" && (
        <div
          style={{
            background: "var(--card-bg, #fff)",
            border: "1px solid var(--line, #e2e8f0)",
            borderRadius: 16,
            padding: "24px"
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>
            Matangazo Yote Yanayorushwa na Wateja ({ads.length})
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ads.map((ad) => (
              <div
                key={ad.id}
                style={{
                  padding: "14px",
                  border: "1px solid var(--line, #cbd5e1)",
                  borderRadius: 10,
                  display: "flex",
                  gap: 16,
                  alignItems: "center"
                }}
              >
                <img
                  src={ad.image_url}
                  alt={ad.title}
                  style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{ad.title}</div>
                  <div style={{ color: "#0f766e", fontWeight: 700, fontSize: 13 }}>
                    TZS {Number(ad.price).toLocaleString()} ({ad.category})
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    Mawasiliano: {ad.phone} | Malipo: {ad.payment_status || "Tayari"}
                  </div>
                </div>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    background: ad.status === "boosted" ? "#18a66a20" : "#f1f5f9",
                    color: ad.status === "boosted" ? "#18a66a" : "var(--muted)"
                  }}
                >
                  {ad.status?.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: SETTINGS */}
      {activeTab === "settings" && (
        <div
          style={{
            background: "var(--card-bg, #fff)",
            border: "1px solid var(--line, #e2e8f0)",
            borderRadius: 16,
            padding: "24px",
            maxWidth: 680,
            margin: "0 auto"
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>
            Mipangilio ya Fedha na Namba za Malipo za Mtandao
          </h3>

          <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Gharama ya Tangazo la Kawaida (TZS):
                </label>
                <input
                  type="number"
                  value={adPostingFee}
                  onChange={(e) => setAdPostingFee(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid var(--line)" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Gharama ya Boosted Ad (TZS):
                </label>
                <input
                  type="number"
                  value={adBoostFee}
                  onChange={(e) => setAdBoostFee(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid var(--line)" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Asilimia ya Kamisheni ya Mtandao (%):
              </label>
              <input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid var(--line)" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Namba ya M-Pesa Till (Vodacom):
              </label>
              <input
                type="text"
                value={mpesaTill}
                onChange={(e) => setMpesaTill(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid var(--line)" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Namba ya Tigo Pesa Lipa:
              </label>
              <input
                type="text"
                value={tigoLipa}
                onChange={(e) => setTigoLipa(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid var(--line)" }}
              />
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              style={{
                background: "#0f172a",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "12px",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer"
              }}
            >
              {savingSettings ? "Inahifadhi..." : "Hifadhi Mipangilio"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

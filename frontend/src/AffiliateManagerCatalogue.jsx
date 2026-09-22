import React, { useState, useEffect } from "react";
import {
  getManagerCatalogues,
  createCatalogueProduct,
  updateCatalogueProduct,
  deleteCatalogueProduct,
  createAffiliateOrder,
  getAffiliateOrders,
  requestPayout,
  getPayoutRequests,
  uploadImage
} from "./api/api";
import { PaymentModal } from "./PaymentModal";

export function AffiliateManagerCatalogue({ profile, onShowToast, lang = "sw" }) {
  const [catalogues, setCatalogues] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("catalogue"); // 'catalogue' | 'manage' | 'orders' | 'payouts'

  // Add Product Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");
  const [category, setCategory] = useState("Vifaa vya Kielektroniki");
  const [description, setDescription] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState(profile?.whatsapp || profile?.phone || "255754000111");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // In-App Order & Payment State
  const [orderingProduct, setOrderingProduct] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Payout Request State
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("Vodacom M-Pesa");
  const [payoutAccount, setPayoutAccount] = useState(profile?.phone || "");
  const [requestingPayout, setRequestingPayout] = useState(false);

  const isManagerOrCeo = profile?.role === "manager" || profile?.role === "ceo";

  const loadData = async () => {
    try {
      setLoading(true);
      const [catData, ordData, payData] = await Promise.all([
        getManagerCatalogues(),
        getAffiliateOrders(profile?.id),
        getPayoutRequests(profile?.id)
      ]);
      setCatalogues(catData);
      setOrders(ordData);
      setPayouts(payData);
    } catch (err) {
      console.warn("Load manager catalogue error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price || !description.trim()) {
      if (onShowToast) onShowToast("Tafadhali jaza jina, bei na maelezo ya bidhaa!");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80";
      if (imageFile) {
        imageUrl = await uploadImage(profile.id, imageFile, "catalogue-media");
      }

      await createCatalogueProduct(profile.id, {
        name: name.trim(),
        price: Number(price),
        currency: "TZS",
        commission_rate: Number(commissionRate) || 10,
        category,
        description: description.trim(),
        image_url: imageUrl,
        whatsapp_number: whatsappNumber.replace("+", "").trim()
      });

      if (onShowToast) onShowToast("Bidhaa imeongezwa kwenye Catalogue ya WhatsApp!");
      setName("");
      setPrice("");
      setDescription("");
      setImageFile(null);
      setImagePreview("");
      setViewMode("catalogue");
      loadData();
    } catch (err) {
      if (onShowToast) onShowToast("Hitilafu: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyAffiliateLink = (prod) => {
    const affiliateUrl = `${window.location.origin}/?ref=${profile?.username || "affiliate"}&prod=${prod.id}`;
    navigator.clipboard.writeText(affiliateUrl);
    if (onShowToast) onShowToast(`Kiungo cha Affiliate kimenakiliwa: ${prod.name}`);
  };

  const handleDirectWhatsAppOrder = (prod) => {
    const phone = prod.whatsapp_number || "255754000111";
    const msg = `Habari ${prod.profiles?.display_name || "Manager"}, ninahitaji kuagiza "${prod.name}" (Bei: TZS ${Number(
      prod.price
    ).toLocaleString()}) kutoka THE CIRCLE DUARA WhatsApp Catalogue. Namba ya kumbukumbu: ${prod.affiliate_code || prod.id}.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const handleRequestPayoutSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(payoutAmount);
    if (!amountNum || amountNum < 5000) {
      if (onShowToast) onShowToast("Kiwango cha chini cha kutoa ni TZS 5,000");
      return;
    }
    setRequestingPayout(true);
    try {
      await requestPayout(profile.id, amountNum, payoutMethod, payoutAccount);
      if (onShowToast) onShowToast("Ombi la kutoa pesa limetumwa kwa CEO kwa uhakiki!");
      setPayoutAmount("");
      loadData();
    } catch (err) {
      if (onShowToast) onShowToast("Hitilafu: " + err.message);
    } finally {
      setRequestingPayout(false);
    }
  };

  // Calculate manager metrics
  const totalCommissionEarned = orders.reduce((sum, o) => sum + (Number(o.commission_earned) || 0), 0);
  const myProducts = catalogues.filter((c) => c.manager_id === profile?.id);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px" }}>
      {/* WhatsApp Catalogue Style Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #075e54, #128c7e)",
          color: "#fff",
          borderRadius: 16,
          padding: "24px",
          marginBottom: 20,
          boxShadow: "0 4px 20px rgba(7, 94, 84, 0.2)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  background: "#25D366",
                  color: "#fff",
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.05em"
                }}
              >
                WHATSAPP BUSINESS CATALOGUE & AFFILIATE
              </span>
              <span style={{ fontSize: 13, opacity: 0.9 }}>📍 Tanzania & East Africa</span>
            </div>
            <h2 style={{ margin: "4px 0", fontSize: 24, fontWeight: 800 }}>
              {profile?.display_name || "Manager"} - Duka & Catalogue
            </h2>
            <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>
              Uza bidhaa kwa viungo vya WhatsApp, pata wateja halisi na pokea kamisheni za mauzo moja kwa moja.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {isManagerOrCeo && (
              <button
                type="button"
                onClick={() => setViewMode("manage")}
                style={{
                  background: "#25D366",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 18px",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                ➕ Ongeza Bidhaa Mpya
              </button>
            )}
            <a
              href={`https://wa.me/${profile?.whatsapp || profile?.phone || "255754000111"}`}
              target="_blank"
              rel="noreferrer"
              style={{
                background: "#fff",
                color: "#075e54",
                border: "none",
                borderRadius: 10,
                padding: "10px 18px",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              💬 WhatsApp Chat
            </a>
          </div>
        </div>

        {/* Manager KPI Ribbon */}
        {isManagerOrCeo && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid rgba(255,255,255,0.2)"
            }}
          >
            <div>
              <div style={{ fontSize: 11, opacity: 0.8, textTransform: "uppercase" }}>Bidhaa Zangu</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{myProducts.length}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.8, textTransform: "uppercase" }}>Jumla ya Oda</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{orders.length}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.8, textTransform: "uppercase" }}>Kamisheni Yangu</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#a7f3d0" }}>
                TZS {totalCommissionEarned.toLocaleString()}
              </div>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setViewMode("payouts")}
                style={{
                  background: "rgba(255,255,255,0.25)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.4)",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginTop: 2
                }}
              >
                💵 Toa Pesa (Withdraw)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, borderBottom: "1px solid var(--line, #e2e8f0)", marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setViewMode("catalogue")}
          style={{
            padding: "10px 16px",
            border: "none",
            borderBottom: viewMode === "catalogue" ? "3px solid #128c7e" : "3px solid transparent",
            background: "transparent",
            fontWeight: viewMode === "catalogue" ? 700 : 500,
            color: viewMode === "catalogue" ? "#128c7e" : "var(--muted)",
            cursor: "pointer",
            fontSize: 14
          }}
        >
          📱 WhatsApp Catalogue ({catalogues.length})
        </button>

        {isManagerOrCeo && (
          <>
            <button
              type="button"
              onClick={() => setViewMode("manage")}
              style={{
                padding: "10px 16px",
                border: "none",
                borderBottom: viewMode === "manage" ? "3px solid #128c7e" : "3px solid transparent",
                background: "transparent",
                fontWeight: viewMode === "manage" ? 700 : 500,
                color: viewMode === "manage" ? "#128c7e" : "var(--muted)",
                cursor: "pointer",
                fontSize: 14
              }}
            >
              ➕ Ongeza Bidhaa
            </button>
            <button
              type="button"
              onClick={() => setViewMode("orders")}
              style={{
                padding: "10px 16px",
                border: "none",
                borderBottom: viewMode === "orders" ? "3px solid #128c7e" : "3px solid transparent",
                background: "transparent",
                fontWeight: viewMode === "orders" ? 700 : 500,
                color: viewMode === "orders" ? "#128c7e" : "var(--muted)",
                cursor: "pointer",
                fontSize: 14
              }}
            >
              📦 Oda za Wateja ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode("payouts")}
              style={{
                padding: "10px 16px",
                border: "none",
                borderBottom: viewMode === "payouts" ? "3px solid #128c7e" : "3px solid transparent",
                background: "transparent",
                fontWeight: viewMode === "payouts" ? 700 : 500,
                color: viewMode === "payouts" ? "#128c7e" : "var(--muted)",
                cursor: "pointer",
                fontSize: 14
              }}
            >
              💸 Maombi ya Payout ({payouts.length})
            </button>
          </>
        )}
      </div>

      {/* VIEW: CATALOGUE (WhatsApp Grid) */}
      {viewMode === "catalogue" && (
        <div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>Inapakia Catalogue...</div>
          ) : catalogues.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px", background: "var(--bg-hover)", borderRadius: 12 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🛍️</div>
              <h3>Catalogue iko tupu kwa sasa.</h3>
              {isManagerOrCeo && (
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setViewMode("manage")}
                  style={{ marginTop: 10 }}
                >
                  Ongeza Bidhaa Yako ya Kwanza
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 20 }}>
              {catalogues.map((prod) => (
                <div
                  key={prod.id}
                  style={{
                    background: "var(--card-bg, #fff)",
                    border: "1px solid var(--line, #e2e8f0)",
                    borderRadius: 14,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    transition: "transform 0.15s ease"
                  }}
                >
                  {/* Image Container with WhatsApp tag */}
                  <div style={{ position: "relative", width: "100%", height: 210, background: "#f8fafc" }}>
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        background: "#25D366",
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                      }}
                    >
                      WhatsApp Catalog
                    </div>
                    {prod.commission_rate > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: 10,
                          left: 10,
                          background: "rgba(15, 118, 110, 0.9)",
                          color: "#fff",
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700
                        }}
                      >
                        Kamisheni: {prod.commission_rate}%
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>
                      {prod.category}
                    </div>
                    <h3 style={{ margin: "4px 0 8px", fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>
                      {prod.name}
                    </h3>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#075e54", marginBottom: 8 }}>
                      TZS {Number(prod.price).toLocaleString()}
                    </div>
                    <p
                      style={{
                        margin: "0 0 16px",
                        fontSize: 13,
                        color: "var(--muted)",
                        lineHeight: 1.4,
                        flex: 1
                      }}
                    >
                      {prod.description}
                    </p>

                    <div
                      style={{
                        padding: "8px 12px",
                        background: "var(--bg-hover, #f8fafc)",
                        borderRadius: 8,
                        fontSize: 11,
                        color: "var(--muted)",
                        marginBottom: 12,
                        display: "flex",
                        justifyContent: "space-between"
                      }}
                    >
                      <span>SKU: {prod.affiliate_code}</span>
                      <span style={{ color: "#16a34a", fontWeight: 700 }}>● Ipo Dukani</span>
                    </div>

                    {/* Actions: Direct WhatsApp, In-App Order, Affiliate Share */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleDirectWhatsAppOrder(prod)}
                        style={{
                          background: "#25D366",
                          color: "#fff",
                          border: "none",
                          padding: "10px",
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        💬 Agiza kupitia WhatsApp
                      </button>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setOrderingProduct(prod)}
                          style={{
                            background: "var(--bg-hover, #f1f5f9)",
                            color: "var(--text, #0f172a)",
                            border: "1px solid var(--line, #cbd5e1)",
                            padding: "8px",
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer"
                          }}
                        >
                          💳 Agiza & Lipia Mtandaoni
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyAffiliateLink(prod)}
                          style={{
                            background: "var(--bg-hover, #f1f5f9)",
                            color: "var(--text, #0f172a)",
                            border: "1px solid var(--line, #cbd5e1)",
                            padding: "8px",
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer"
                          }}
                        >
                          🔗 Copy Affiliate Link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: ADD / MANAGE PRODUCT */}
      {viewMode === "manage" && isManagerOrCeo && (
        <div
          style={{
            background: "var(--card-bg, #fff)",
            border: "1px solid var(--line, #e2e8f0)",
            borderRadius: 16,
            padding: "24px",
            maxWidth: 700,
            margin: "0 auto"
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>
            Ongeza Bidhaa Kwenye Catalogue Yako ya WhatsApp
          </h3>

          <form onSubmit={handleAddProduct} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Jina la Bidhaa: *
              </label>
              <input
                type="text"
                placeholder="Mfano: Saa ya Kijanja ya Smartwatch Pro Series 9"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--line, #cbd5e1)",
                  fontSize: 14
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Bei ya Mauzo (TZS): *
                </label>
                <input
                  type="number"
                  placeholder="Mfano: 85000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--line, #cbd5e1)",
                    fontSize: 14
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Asilimia ya Kamisheni ya Affiliate (%):
                </label>
                <input
                  type="number"
                  placeholder="10"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--line, #cbd5e1)",
                    fontSize: 14
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Kategoria:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--line, #cbd5e1)",
                    fontSize: 14
                  }}
                >
                  <option value="Vifaa vya Kielektroniki">Vifaa vya Kielektroniki</option>
                  <option value="Mavazi & Mitindo">Mavazi & Mitindo</option>
                  <option value="Urembo & Afya">Urembo & Afya</option>
                  <option value="Vyakula & Vinywaji">Vyakula & Vinywaji</option>
                  <option value="Nyumba & Mapambo">Nyumba & Mapambo</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Namba ya WhatsApp ya Kuagizia: *
                </label>
                <input
                  type="text"
                  placeholder="255754XXXXXX"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--line, #cbd5e1)",
                    fontSize: 14
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Picha ya Bidhaa: *
              </label>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <div style={{ marginTop: 10 }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }}
                  />
                </div>
              )}
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Maelezo ya Bidhaa: *
              </label>
              <textarea
                rows={3}
                placeholder="Eleza sifa na faida za bidhaa kwa wanunuzi..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--line, #cbd5e1)",
                  fontSize: 14
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                background: "#075e54",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "12px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {submitting ? "Inapakia..." : "Weka Bidhaa Kwenye Catalogue"}
            </button>
          </form>
        </div>
      )}

      {/* VIEW: ORDERS */}
      {viewMode === "orders" && isManagerOrCeo && (
        <div>
          <h3 style={{ margin: "0 0 16px", fontSize: 18 }}>Oda Zilizowekwa Kupitia Viungo Vyako ({orders.length})</h3>
          {orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", background: "var(--bg-hover)", borderRadius: 12 }}>
              <p style={{ color: "var(--muted)" }}>Bado hujaingiza oda yoyote. Share affiliate links zako kupata mauzo!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {orders.map((o) => (
                <div
                  key={o.id}
                  style={{
                    background: "var(--card-bg, #fff)",
                    border: "1px solid var(--line, #e2e8f0)",
                    borderRadius: 12,
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15 }}>Oda #{o.id.slice(-6)}</h4>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                      Mteja: <strong>{o.customer_name}</strong> ({o.customer_phone}) | Eneo: {o.delivery_address}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#075e54" }}>
                      TZS {Number(o.amount).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>
                      Kamisheni: +TZS {Number(o.commission_earned || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: PAYOUTS (Withdrawal) */}
      {viewMode === "payouts" && isManagerOrCeo && (
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div
            style={{
              background: "var(--card-bg, #fff)",
              border: "1px solid var(--line, #e2e8f0)",
              borderRadius: 16,
              padding: "24px",
              marginBottom: 20
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>💵 Ombi la Kutoa Kamisheni (Payout)</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--muted)" }}>
              Salio Linalopatikana:{" "}
              <strong style={{ color: "#075e54", fontSize: 16 }}>
                TZS {totalCommissionEarned.toLocaleString()}
              </strong>
            </p>

            <form onSubmit={handleRequestPayoutSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Kiasi cha Kutoa (TZS): *
                </label>
                <input
                  type="number"
                  placeholder="Kima cha chini TZS 5,000"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  required
                  min="5000"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--line, #cbd5e1)",
                    fontSize: 14
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Njia ya Kupokea Fedha:
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--line, #cbd5e1)",
                    fontSize: 14
                  }}
                >
                  <option value="Vodacom M-Pesa">Vodacom M-Pesa</option>
                  <option value="Tigo Pesa">Tigo Pesa</option>
                  <option value="Airtel Money">Airtel Money</option>
                  <option value="HaloPesa">HaloPesa</option>
                  <option value="CRDB Bank">CRDB Bank</option>
                  <option value="NMB Bank">NMB Bank</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Namba ya Simu au Namba ya Akaunti ya Benki: *
                </label>
                <input
                  type="text"
                  placeholder="0754XXXXXX au Namba ya Akaunti"
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--line, #cbd5e1)",
                    fontSize: 14
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={requestingPayout}
                style={{
                  background: "#128c7e",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {requestingPayout ? "Inatuma ombi..." : "Tuma Ombi la Kutoa Pesa"}
              </button>
            </form>
          </div>

          {/* Historic Payouts */}
          <h4 style={{ margin: "0 0 12px", fontSize: 16 }}>Historia ya Maombi ya Kutoa Pesa</h4>
          {payouts.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Hakuna maombi yaliyopita.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {payouts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: "12px 16px",
                    background: "var(--card-bg, #fff)",
                    border: "1px solid var(--line, #e2e8f0)",
                    borderRadius: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>TZS {Number(p.amount).toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      {p.method} - {p.account_number}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      background: p.status === "paid" ? "#16a34a20" : "#eab30820",
                      color: p.status === "paid" ? "#16a34a" : "#ca8a04"
                    }}
                  >
                    {p.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* In-App Direct Order Modal */}
      {orderingProduct && (
        <div className="modal-backdrop" onClick={() => setOrderingProduct(null)} style={{ zIndex: 9999 }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460, width: "95%", borderRadius: 16, padding: "24px", background: "var(--card-bg, #fff)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Weka Oda ya Haraka</h3>
              <button
                type="button"
                onClick={() => setOrderingProduct(null)}
                style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
              <img
                src={orderingProduct.image_url}
                alt={orderingProduct.name}
                style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{orderingProduct.name}</div>
                <div style={{ color: "#075e54", fontWeight: 800 }}>
                  TZS {Number(orderingProduct.price).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Jina Lako Kamili: *
                </label>
                <input
                  type="text"
                  placeholder="Mfano: David Mwita"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--line)" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Namba ya Simu: *
                </label>
                <input
                  type="text"
                  placeholder="0754XXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--line)" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Anwani ya Kuletewa (Delivery Location): *
                </label>
                <input
                  type="text"
                  placeholder="Mfano: Kinondoni, Dar es Salaam"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--line)" }}
                />
              </div>
            </div>

            <button
              type="button"
              className="button button-primary"
              onClick={async () => {
                if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
                  if (onShowToast) onShowToast("Tafadhali jaza taarifa zako zote za oda!");
                  return;
                }
                const comm = Math.round((orderingProduct.price * (orderingProduct.commission_rate || 10)) / 100);
                await createAffiliateOrder({
                  product_id: orderingProduct.id,
                  manager_id: orderingProduct.manager_id,
                  customer_name: customerName.trim(),
                  customer_phone: customerPhone.trim(),
                  delivery_address: deliveryAddress.trim(),
                  amount: orderingProduct.price,
                  commission_earned: comm
                });
                if (onShowToast) onShowToast("Oda imepokelewa kikamilifu! Manager atawasiliana nawe.");
                setOrderingProduct(null);
                setCustomerName("");
                setCustomerPhone("");
                setDeliveryAddress("");
                loadData();
              }}
              style={{ width: "100%", padding: "12px", background: "#075e54" }}
            >
              Thibitisha Oda (TZS {Number(orderingProduct.price).toLocaleString()})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

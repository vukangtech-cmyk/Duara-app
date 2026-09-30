import React, { useState, useEffect } from "react";
import { getPlatformSettings } from "./api/api";

export function PaymentModal({
  isOpen,
  onClose,
  title = "Fanya Malipo",
  amount = 5000,
  purpose = "Malipo ya Huduma / Bidhaa",
  onPaymentSuccess,
  customPaymentInfo = null
}) {
  const [method, setMethod] = useState("mpesa");
  const [phone, setPhone] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (isOpen) {
      getPlatformSettings()
        .then((data) => setSettings(data))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const nums = {
    ...(settings?.payment_numbers || {}),
    ...(customPaymentInfo || {})
  };

  const paymentChannels = {
    mpesa: {
      name: "Vodacom M-Pesa",
      type: "Lipa Namba / Namba ya Malipo",
      number: nums.mpesa || "",
      merchant: nums.mpesa_name || settings?.ceo_name || "CEO HAMZA VUKANG",
      ussd: nums.mpesa ? `*150*00# > Lipa kwa M-Pesa > Namba: ${nums.mpesa}` : "*150*00#",
      color: "#e60000"
    },
    tigopesa: {
      name: "Mixx by Yas (Tigo Pesa)",
      type: "Lipa Namba / Namba ya Malipo",
      number: nums.tigopesa || "",
      merchant: nums.tigopesa_name || settings?.ceo_name || "CEO HAMZA VUKANG",
      ussd: nums.tigopesa ? `*150*01# > Lipa kwa Simu > Namba: ${nums.tigopesa}` : "*150*01#",
      color: "#00377b"
    },
    airtel: {
      name: "Airtel Money",
      type: "Lipa Namba / Namba ya Malipo",
      number: nums.airtel || "",
      merchant: nums.airtel_name || settings?.ceo_name || "CEO HAMZA VUKANG",
      ussd: nums.airtel ? `*150*60# > Lipa kwa Simu > Namba: ${nums.airtel}` : "*150*60#",
      color: "#dc2626"
    },
    halopesa: {
      name: "HaloPesa",
      type: "Lipa Namba / Namba ya Malipo",
      number: nums.halopesa || "",
      merchant: nums.halopesa_name || settings?.ceo_name || "CEO HAMZA VUKANG",
      ussd: nums.halopesa ? `*150*88# > Lipa kwa HaloPesa > Namba: ${nums.halopesa}` : "*150*88#",
      color: "#ea580c"
    },
    bank: {
      name: "Benki (CRDB / NMB)",
      type: "Akaunti ya Benki",
      number: nums.bank || "",
      merchant: nums.bank_name || settings?.ceo_name || "CEO HAMZA VUKANG",
      ussd: "Tuma kupitia SimBanking / NMB Mkononi au Tawi la Benki",
      color: "#059669"
    }
  };

  const currentChannel = paymentChannels[method];

  const handleConfirm = (e) => {
    if (e) e.preventDefault();
    if (!transactionRef.trim()) {
      setErrorMsg("Tafadhali weka Kumbukumbu ya Muamala (Transaction ID / Jina la Meseji ya Malipo).");
      return;
    }
    setBusy(true);
    setErrorMsg("");

    setTimeout(() => {
      setBusy(false);
      setSuccess(true);
      if (onPaymentSuccess) {
        onPaymentSuccess({
          method: currentChannel.name,
          amount,
          reference: transactionRef.trim().toUpperCase(),
          phone: phone.trim()
        });
      }
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    }, 600);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999, padding: 12 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 480,
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          borderRadius: 18,
          padding: "20px",
          background: "var(--card-bg, #ffffff)",
          border: "1px solid var(--line)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>💳 {title}</h3>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--muted)" }}>
              Huduma/Bidhaa: <strong>{purpose}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "1px solid var(--line)",
              background: "var(--input-bg)",
              color: "var(--ink)",
              fontSize: 16,
              cursor: "pointer"
            }}
          >
            ✕
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "28px 12px" }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
            <h4 style={{ margin: 0, fontSize: 18, color: "#16a34a" }}>Taarifa za Malipo Zimepokelewa!</h4>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
              Kumbukumbu: <strong>{transactionRef.toUpperCase()}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleConfirm}>
            {/* Amount Banner */}
            <div
              style={{
                background: "var(--primary-soft)",
                border: "1px solid var(--primary-border)",
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--primary)" }}>
                  Kiasi cha Kulipia
                </div>
                <div style={{ fontSize: 21, fontWeight: 800, color: "var(--ink-heading)" }}>
                  {Number(amount) > 0 ? `TZS ${Number(amount).toLocaleString()}` : "Weka Kiasi Kulingana na Makubaliano"}
                </div>
              </div>
              <span style={{ fontSize: 22 }}>🇹🇿</span>
            </div>

            {/* Payment Method Selector */}
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              Chagua Mtandao wa Malipo:
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 8,
                marginBottom: 14
              }}
            >
              {Object.entries(paymentChannels).map(([k, ch]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setMethod(k)}
                  style={{
                    padding: "10px 8px",
                    borderRadius: 10,
                    border: method === k ? `2px solid ${ch.color}` : "1px solid var(--line)",
                    background: method === k ? `${ch.color}12` : "var(--input-bg)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    color: method === k ? ch.color : "var(--ink)",
                    textAlign: "center"
                  }}
                >
                  <div>{ch.name}</div>
                  {ch.number && (
                    <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>{ch.number}</div>
                  )}
                </button>
              ))}
            </div>

            {/* Channel Instructions (Manual CEO Numbers Only) */}
            <div
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: "14px",
                marginBottom: 14,
                fontSize: 13
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, gap: 8, flexWrap: "wrap" }}>
                <span style={{ color: "var(--muted)" }}>Mtandao:</span>
                <strong>{currentChannel.name}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, gap: 8, flexWrap: "wrap" }}>
                <span style={{ color: "var(--muted)" }}>Lipa Namba / Akaunti:</span>
                {currentChannel.number ? (
                  <strong style={{ fontSize: 16, color: currentChannel.color, letterSpacing: 0.5 }}>
                    {currentChannel.number}
                  </strong>
                ) : (
                  <span style={{ color: "#d97706", fontWeight: 700, fontSize: 12 }}>
                    Bado haijawekwa (CEO ataweka kwenye Mipangilio)
                  </span>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <span style={{ color: "var(--muted)" }}>Jina la Mpokeaji:</span>
                <strong>{currentChannel.merchant}</strong>
              </div>
              {currentChannel.number && (
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: "1px dashed var(--line)",
                    fontSize: 12,
                    color: "var(--muted)"
                  }}
                >
                  💡 <em>{currentChannel.ussd}</em>
                </div>
              )}
            </div>

            {/* Verification Inputs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Namba Yako Uliyotumia Kulipia:
                </label>
                <input
                  type="tel"
                  placeholder="Andika namba yako ya simu..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--line)",
                    fontSize: 14,
                    background: "var(--input-bg)",
                    color: "var(--ink)"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Kumbukumbu ya Muamala (Transaction ID / Jina la Mlipaji): *
                </label>
                <input
                  type="text"
                  placeholder="Weka kumbukumbu ya malipo au jina lako..."
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--line)",
                    fontSize: 14,
                    background: "var(--input-bg)",
                    color: "var(--ink)",
                    fontWeight: 600
                  }}
                />
              </div>
            </div>

            {errorMsg && (
              <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 12, fontWeight: 600 }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="button button-soft"
                onClick={onClose}
                disabled={busy}
              >
                Funga
              </button>
              <button
                type="submit"
                className="button button-primary"
                disabled={busy}
              >
                {busy ? "Inatuma..." : "Thibitisha Malipo"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

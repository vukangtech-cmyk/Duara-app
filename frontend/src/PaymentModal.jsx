import React, { useState } from "react";

export function PaymentModal({
  isOpen,
  onClose,
  title = "Fanya Malipo",
  amount = 5000,
  purpose = "Tangazo la Biashara (Ad)",
  onPaymentSuccess,
  lang = "sw"
}) {
  const [method, setMethod] = useState("mpesa");
  const [phone, setPhone] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const paymentChannels = {
    mpesa: {
      name: "Vodacom M-Pesa",
      type: "Lipa Namba (Till)",
      number: "554433",
      merchant: "THE CIRCLE DUARA",
      ussd: "*150*00# > Lipa kwa Simu > Weka Namba 554433",
      color: "#e60000"
    },
    tigopesa: {
      name: "Tigo Pesa",
      type: "Lipa Namba",
      number: "778899",
      merchant: "DUARA AFFILIATE",
      ussd: "*150*01# > Lipa kwa Simu > Weka Namba 778899",
      color: "#00377b"
    },
    airtel: {
      name: "Airtel Money",
      type: "Merchant Number",
      number: "992211",
      merchant: "HAMZA VUKANG BIZ",
      ussd: "*150*60# > Lipa kwa Simu > Namba 992211",
      color: "#ff0000"
    },
    halopesa: {
      name: "HaloPesa",
      type: "Lipa Namba",
      number: "332211",
      merchant: "DUARA COMMERCE",
      ussd: "*150*88# > Lipa kwa HaloPesa > Namba 332211",
      color: "#f37021"
    },
    bank: {
      name: "Benki (CRDB / NMB)",
      type: "Akaunti ya Benki",
      number: "015299887700 (CRDB) / 201100998877 (NMB)",
      merchant: "DUARA NETWORK LTD",
      ussd: "Tumia SimBanking au NMB Mkononi kutuma fedha moja kwa moja",
      color: "#059669"
    }
  };

  const currentChannel = paymentChannels[method];

  const handleConfirm = () => {
    if (!transactionRef.trim()) {
      setErrorMsg("Tafadhali weka namba ya kumbukumbu ya muamala (Transaction Ref/ID)");
      return;
    }
    setBusy(true);
    setErrorMsg("");

    // Simulate real transaction verification against network ledger
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
      }, 1500);
    }, 1200);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480, width: "95%", borderRadius: 16, padding: "24px", background: "var(--card-bg, #ffffff)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>💳 {title}</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted, #64748b)" }}>
              Kusudi: <strong>{purpose}</strong>
            </p>
          </div>
          <button
            type="button"
            className="button-icon"
            onClick={onClose}
            style={{ fontSize: 18, border: "none", background: "transparent", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "30px 10px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h4 style={{ margin: 0, fontSize: 18, color: "#16a34a" }}>Malipo Yamethibitishwa!</h4>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
              Kumbukumbu: <strong>{transactionRef.toUpperCase()}</strong>. Huduma imeamilishwa mara moja.
            </p>
          </div>
        ) : (
          <div>
            {/* Amount Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #18a66a15, #0f766e20)",
                border: "1px solid #18a66a40",
                borderRadius: 12,
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#0f766e" }}>
                  Kiasi cha Kulipia
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0f766e" }}>
                  TZS {Number(amount).toLocaleString()}
                </div>
              </div>
              <span style={{ fontSize: 24 }}>🇹🇿</span>
            </div>

            {/* Payment Method Selector */}
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>
              Chagua Njia ya Malipo:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
              {Object.entries(paymentChannels).map(([k, ch]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setMethod(k)}
                  style={{
                    padding: "10px 8px",
                    borderRadius: 8,
                    border: method === k ? `2px solid ${ch.color}` : "1px solid var(--line, #e2e8f0)",
                    background: method === k ? `${ch.color}15` : "transparent",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: "center"
                  }}
                >
                  <div style={{ fontWeight: 700, color: method === k ? ch.color : "inherit" }}>{ch.name}</div>
                </button>
              ))}
            </div>

            {/* Channel Instructions */}
            <div
              style={{
                background: "var(--bg-hover, #f8fafc)",
                border: "1px solid var(--line, #e2e8f0)",
                borderRadius: 10,
                padding: "12px 16px",
                marginBottom: 16,
                fontSize: 13
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "var(--muted)" }}>Aina ya Malipo:</span>
                <strong>{currentChannel.type}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "var(--muted)" }}>Namba ya Kampuni / Till:</span>
                <strong style={{ fontSize: 15, color: currentChannel.color }}>{currentChannel.number}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "var(--muted)" }}>Jina la Akaunti:</span>
                <strong>{currentChannel.merchant}</strong>
              </div>
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed var(--line)", fontSize: 11, color: "var(--muted)" }}>
                💡 <em>{currentChannel.ussd}</em>
              </div>
            </div>

            {/* Verification Inputs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Namba ya Simu Iliyofanya Malipo:
                </label>
                <input
                  type="text"
                  placeholder="0754XXXXXX au 0713XXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--line, #cbd5e1)",
                    fontSize: 14,
                    background: "var(--input-bg, #fff)"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Namba ya Kumbukumbu ya Muamala (Transaction ID / Reference): *
                </label>
                <input
                  type="text"
                  placeholder="Mfano: 8NK99120Z au MP2609..."
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--line, #cbd5e1)",
                    fontSize: 14,
                    background: "var(--input-bg, #fff)",
                    fontFamily: "monospace",
                    fontWeight: 700
                  }}
                />
              </div>
            </div>

            {errorMsg && (
              <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 12, fontWeight: 500 }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="button button-soft"
                onClick={onClose}
                disabled={busy}
                style={{ padding: "10px 16px", borderRadius: 8, fontSize: 13 }}
              >
                Ghairi
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={handleConfirm}
                disabled={busy}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  background: "#18a66a",
                  color: "#fff"
                }}
              >
                {busy ? "Inathibitisha..." : "Thibitisha Malipo"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

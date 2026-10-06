import React, { useState, useEffect } from "react";
import {
  getPlatformSettings,
  getWallet,
  getActiveAccountOverride,
  recordPaymentTransaction,
  payWithWalletBalance,
  initiateLiveMobileMoneyPush,
  extractTransactionRefFromSms,
  validateTanzaniaPhone,
  processMockPayment,
  getUserBalance
} from "./api/api";

export function PaymentModal({
  isOpen,
  onClose,
  title = "Fanya Malipo",
  amount = 5000,
  purpose = "Malipo ya Huduma / Bidhaa",
  onPaymentSuccess,
  customPaymentInfo = null
}) {
  const [paymentMode, setPaymentMode] = useState("lipa_namba"); // 'lipa_namba' | 'ussd_push' | 'wallet' | 'mock_payment'
  const [method, setMethod] = useState("mpesa");
  const [phone, setPhone] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [customAmount, setCustomAmount] = useState(String(amount || ""));
  const [busy, setBusy] = useState(false);
  const [pushStep, setPushStep] = useState("idle"); // 'idle' | 'sent'
  const [success, setSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [settings, setSettings] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [mockAction, setMockAction] = useState("debit"); // 'debit' | 'credit'
  const [mockReceipt, setMockReceipt] = useState(null);

  const activeUser = getActiveAccountOverride();

  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setSuccess(false);
      setPushStep("idle");
      setMockReceipt(null);
      setCustomAmount(String(amount || ""));
      if (activeUser?.phone && !phone) {
        setPhone(activeUser.phone);
      }
      getPlatformSettings()
        .then((data) => setSettings(data))
        .catch(() => {});
      if (activeUser?.id) {
        getUserBalance(activeUser.id)
          .then((bal) => setWalletBalance(bal))
          .catch(() => {});
      }
    }
  }, [isOpen, amount]);

  if (!isOpen) return null;

  const nums = {
    ...(settings?.payment_numbers || {}),
    ...(customPaymentInfo || {})
  };

  const gatewayProvider = nums?.gateway_config?.provider || "Direct Mobile Money Gateway";

  const paymentChannels = {
    mpesa: {
      name: "Vodacom M-Pesa",
      short: "M-Pesa",
      type: "Lipa Namba / Simu",
      number: nums.mpesa || "",
      merchant: nums.mpesa_name || settings?.ceo_name || "CEO HAMZA VUKANG",
      ussd: nums.mpesa ? `*150*00# > Lipa kwa M-Pesa > Namba: ${nums.mpesa}` : "*150*00#",
      dial: "*150*00#",
      color: "#e60000"
    },
    tigopesa: {
      name: "Mixx by Yas (Tigo Pesa)",
      short: "Mixx / Tigo",
      type: "Lipa Namba / Simu",
      number: nums.tigopesa || "",
      merchant: nums.tigopesa_name || settings?.ceo_name || "CEO HAMZA VUKANG",
      ussd: nums.tigopesa ? `*150*01# > Lipa kwa Simu > Namba: ${nums.tigopesa}` : "*150*01#",
      dial: "*150*01#",
      color: "#00377b"
    },
    airtel: {
      name: "Airtel Money",
      short: "Airtel Money",
      type: "Lipa Namba / Simu",
      number: nums.airtel || "",
      merchant: nums.airtel_name || settings?.ceo_name || "CEO HAMZA VUKANG",
      ussd: nums.airtel ? `*150*60# > Lipa kwa Simu > Namba: ${nums.airtel}` : "*150*60#",
      dial: "*150*60#",
      color: "#dc2626"
    },
    halopesa: {
      name: "HaloPesa",
      short: "HaloPesa",
      type: "Lipa Namba / Simu",
      number: nums.halopesa || "",
      merchant: nums.halopesa_name || settings?.ceo_name || "CEO HAMZA VUKANG",
      ussd: nums.halopesa ? `*150*88# > Lipa kwa HaloPesa > Namba: ${nums.halopesa}` : "*150*88#",
      dial: "*150*88#",
      color: "#ea580c"
    },
    bank: {
      name: "Benki (CRDB / NMB)",
      short: "CRDB / NMB",
      type: "Akaunti ya Benki",
      number: nums.bank || "",
      merchant: nums.bank_name || settings?.ceo_name || "CEO HAMZA VUKANG",
      ussd: "Tuma kupitia SimBanking / NMB Mkononi au Wakala wa Benki",
      dial: "",
      color: "#059669"
    }
  };

  const currentChannel = paymentChannels[method] || paymentChannels.mpesa;
  const effectiveAmount = Number(amount) > 0 ? Number(amount) : Number(customAmount) || 0;

  const handleCopyNumber = (numText) => {
    if (!numText) return;
    try {
      navigator.clipboard.writeText(String(numText).trim());
      setCopiedKey(numText);
      setTimeout(() => setCopiedKey(""), 2000);
    } catch {}
  };

  const handleSendUssdPush = async () => {
    setErrorMsg("");
    if (effectiveAmount <= 0) {
      setErrorMsg("Tafadhali weka kiasi sahihi cha kulipia (TZS).");
      return;
    }
    const validPhone = validateTanzaniaPhone(phone);
    if (!validPhone) {
      setErrorMsg("Weka namba sahihi ya simu ya Tanzania (mfano: 0754123456 au 0655123456).");
      return;
    }
    setBusy(true);
    try {
      const res = await initiateLiveMobileMoneyPush({
        userId: activeUser?.id,
        phone: validPhone,
        amount: effectiveAmount,
        method: currentChannel.name,
        purpose
      });
      setTransactionRef(res.reference);
      setPushStep("sent");
    } catch (err) {
      setErrorMsg(err.message || "Imeshindikana kutuma USSD Push.");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    if (effectiveAmount <= 0) {
      setErrorMsg("Tafadhali weka kiasi cha malipo (TZS).");
      return;
    }

    // Mode 3: Direct Duara Wallet Payment
    if (paymentMode === "wallet") {
      if (!activeUser?.id) {
        setErrorMsg("Tafadhali ingia kwenye akaunti yako kutumia Duara Wallet.");
        return;
      }
      setBusy(true);
      try {
        const res = await payWithWalletBalance(activeUser.id, effectiveAmount, purpose);
        setTransactionRef(res.reference);
        setWalletBalance(res.balance);
        setSuccess(true);
        if (onPaymentSuccess) {
          onPaymentSuccess({
            method: "Duara Wallet",
            amount: effectiveAmount,
            reference: res.reference,
            phone: activeUser.phone || phone.trim(),
            payment_mode: "wallet_balance"
          });
        }
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1400);
      } catch (err) {
        setErrorMsg(err.message || "Malipo ya Wallet yameshindikana.");
      } finally {
        setBusy(false);
      }
      return;
    }

    // Mode 4: Mock Payment Processing (Validates transaction & updates Supabase users.user_balance)
    if (paymentMode === "mock_payment") {
      if (!activeUser?.id) {
        setErrorMsg("Tafadhali ingia kwenye akaunti yako ili kufanya Mock Payment.");
        return;
      }
      setBusy(true);
      try {
        const receipt = await processMockPayment({
          userId: activeUser.id,
          amount: effectiveAmount,
          type: mockAction,
          currency: "TZS",
          paymentMethod: "Mock Payment Gateway (Supabase users table)",
          description: purpose,
          metadata: {
            payerName: activeUser.display_name || activeUser.username,
            phone: phone || activeUser.phone
          }
        });
        setMockReceipt(receipt);
        setTransactionRef(receipt.reference);
        setWalletBalance(receipt.user_balance);
        setSuccess(true);
        if (onPaymentSuccess) {
          onPaymentSuccess({
            method: "Mock Payment Gateway",
            amount: effectiveAmount,
            reference: receipt.reference,
            payment_mode: "mock_payment",
            user_balance: receipt.user_balance,
            receipt
          });
        }
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1800);
      } catch (err) {
        setErrorMsg(err.message || "Hitilafu kwenye malipo ya mock.");
      } finally {
        setBusy(false);
      }
      return;
    }

    // Mode 1 & 2: Lipa Namba or USSD Push verification
    const formattedPhone = validateTanzaniaPhone(phone);
    if (!formattedPhone) {
      setErrorMsg("Tafadhali weka namba sahihi ya simu uliyotumia kulipia (mfano: 0754123456).");
      return;
    }

    const extractedRef = extractTransactionRefFromSms(transactionRef);
    if (!extractedRef || extractedRef.length < 4) {
      setErrorMsg("Tafadhali weka Kumbukumbu Namba ya Muamala (Transaction ID) au bandika (paste) SMS ya uthibitisho wa malipo.");
      return;
    }

    setBusy(true);
    try {
      const savedTx = await recordPaymentTransaction({
        user_id: activeUser?.id,
        payer_name: activeUser?.display_name || "Mteja",
        phone: formattedPhone,
        method: currentChannel.name,
        payment_mode: paymentMode,
        amount: effectiveAmount,
        reference: extractedRef,
        raw_sms: transactionRef.trim(),
        purpose
      });

      setTransactionRef(savedTx.reference);
      setSuccess(true);
      if (onPaymentSuccess) {
        onPaymentSuccess({
          method: currentChannel.name,
          amount: effectiveAmount,
          reference: savedTx.reference,
          phone: formattedPhone,
          payment_mode: paymentMode
        });
      }
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1400);
    } catch (err) {
      setErrorMsg(err.message || "Imeshindikana kuthibitisha malipo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999, padding: 12 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 500,
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          borderRadius: 18,
          padding: "20px",
          background: "var(--card-bg, #ffffff)",
          border: "1px solid var(--line)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>💳 {title}</h3>
            <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--muted)" }}>
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
            <div style={{ fontSize: 46, marginBottom: 10 }}>✅</div>
            <h4 style={{ margin: 0, fontSize: 18, color: "#16a34a" }}>Malipo Yamethibitishwa na Kusajiliwa!</h4>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
              Kiasi: <strong>TZS {effectiveAmount.toLocaleString()}</strong> • Kumbukumbu: <strong>{transactionRef}</strong>
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
                marginBottom: 14,
                gap: 10
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--primary)" }}>
                  Kiasi cha Kulipia (TZS)
                </div>
                {Number(amount) > 0 ? (
                  <div style={{ fontSize: 21, fontWeight: 800, color: "var(--ink-heading)" }}>
                    TZS {Number(amount).toLocaleString()}
                  </div>
                ) : (
                  <input
                    type="number"
                    min="100"
                    placeholder="Andika kiasi kwa TZS (mf. 15000)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    required
                    style={{
                      marginTop: 4,
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--primary)",
                      background: "var(--card-bg)",
                      color: "var(--ink)",
                      fontSize: 15,
                      fontWeight: 800
                    }}
                  />
                )}
              </div>
              <span style={{ fontSize: 22 }}>🇹🇿</span>
            </div>

            {/* Payment Mode Tabs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 5,
                marginBottom: 14,
                background: "var(--bg-base)",
                padding: 5,
                borderRadius: 12,
                border: "1px solid var(--line)"
              }}
            >
              {[
                { id: "lipa_namba", label: "📲 Lipa Namba" },
                { id: "ussd_push", label: "⚡ USSD Push" },
                { id: "wallet", label: `💳 Wallet (${walletBalance.toLocaleString()})` },
                { id: "mock_payment", label: "🧪 Mock Pay" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setPaymentMode(tab.id);
                    setErrorMsg("");
                  }}
                  style={{
                    padding: "8px 4px",
                    borderRadius: 8,
                    border: "none",
                    background: paymentMode === tab.id ? "var(--primary)" : "transparent",
                    color: paymentMode === tab.id ? "#fff" : "var(--ink)",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {paymentMode === "mock_payment" ? (
              <div
                style={{
                  background: "var(--input-bg)",
                  border: "1.5px dashed var(--primary)",
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 16
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 18 }}>🧪</span>
                    <strong style={{ fontSize: 13.5, color: "var(--primary)" }}>Mock Payment Processing Engine</strong>
                  </div>
                  <span
                    style={{
                      fontSize: 10.5,
                      padding: "2px 8px",
                      borderRadius: 10,
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#10b981",
                      fontWeight: 800
                    }}
                  >
                    Supabase users.user_balance
                  </span>
                </div>

                <div
                  style={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12
                  }}
                >
                  <span style={{ fontSize: 12.5, color: "var(--muted)" }}>Salio la Sasa (users.user_balance):</span>
                  <strong style={{ fontSize: 16, color: "var(--ink-heading)" }}>
                    TZS {walletBalance.toLocaleString()}
                  </strong>
                </div>

                {/* Direction Selector: Debit vs Credit */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <button
                    type="button"
                    onClick={() => setMockAction("debit")}
                    style={{
                      padding: "9px 8px",
                      borderRadius: 8,
                      border: mockAction === "debit" ? "2px solid #ef4444" : "1px solid var(--line)",
                      background: mockAction === "debit" ? "rgba(239, 68, 68, 0.1)" : "var(--card-bg)",
                      color: mockAction === "debit" ? "#ef4444" : "var(--ink)",
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    🔴 Lipa (Debit -TZS {effectiveAmount.toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMockAction("credit")}
                    style={{
                      padding: "9px 8px",
                      borderRadius: 8,
                      border: mockAction === "credit" ? "2px solid #10b981" : "1px solid var(--line)",
                      background: mockAction === "credit" ? "rgba(16, 185, 129, 0.1)" : "var(--card-bg)",
                      color: mockAction === "credit" ? "#10b981" : "var(--ink)",
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    🟢 Weka (+TZS {effectiveAmount.toLocaleString()} Credit)
                  </button>
                </div>

                {/* Quick Test Top-up buttons */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11.5, color: "var(--muted)" }}>Ongeza salio la majaribio:</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!activeUser?.id) return;
                        setBusy(true);
                        try {
                          const res = await processMockPayment({
                            userId: activeUser.id,
                            amount: 20000,
                            type: "credit",
                            description: "Mock Sandbox Top-up (+20k)"
                          });
                          setWalletBalance(res.user_balance);
                        } catch (e) {
                          setErrorMsg(e.message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                      disabled={busy}
                      style={{
                        padding: "4px 8px",
                        fontSize: 11,
                        borderRadius: 6,
                        border: "1px solid var(--line)",
                        background: "var(--card-bg)",
                        cursor: "pointer",
                        fontWeight: 700
                      }}
                    >
                      +20,000
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!activeUser?.id) return;
                        setBusy(true);
                        try {
                          const res = await processMockPayment({
                            userId: activeUser.id,
                            amount: 50000,
                            type: "credit",
                            description: "Mock Sandbox Top-up (+50k)"
                          });
                          setWalletBalance(res.user_balance);
                        } catch (e) {
                          setErrorMsg(e.message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                      disabled={busy}
                      style={{
                        padding: "4px 8px",
                        fontSize: 11,
                        borderRadius: 6,
                        border: "1px solid var(--line)",
                        background: "var(--card-bg)",
                        cursor: "pointer",
                        fontWeight: 700
                      }}
                    >
                      +50,000
                    </button>
                  </div>
                </div>

                <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "var(--muted)", lineHeight: 1.45 }}>
                  {mockAction === "debit"
                    ? `Kazi hii itathibitisha muamala (validates transaction) kisha itapunguza na kusasisha safu wima ya 'user_balance' kwenye jedwali la Supabase 'users'.`
                    : `Kazi hii itathibitisha muamala na kuongeza TZS ${effectiveAmount.toLocaleString()} kwenye safu wima ya 'user_balance' kwenye jedwali la Supabase 'users'.`}
                </p>
              </div>
            ) : paymentMode === "wallet" ? (
              <div
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>Salio Lako la Duara Wallet:</span>
                  <strong style={{ fontSize: 17, color: walletBalance >= effectiveAmount ? "#16a34a" : "#dc2626" }}>
                    TZS {walletBalance.toLocaleString()}
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>
                  {walletBalance >= effectiveAmount
                    ? "Salio lako linatosha! Bofya 'Thibitisha Malipo' kukamilisha muamala huu moja kwa moja."
                    : "Salio la Wallet halitoshi kwa sasa. Chagua 'Lipa Namba' au 'USSD Push' hapo juu kulipa kwa M-Pesa, Tigo Pesa, Airtel Money au Benki."}
                </p>
              </div>
            ) : (
              <>
                {/* Payment Method Selector */}
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                  Chagua Mtandao wa Malipo:
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                    gap: 7,
                    marginBottom: 14
                  }}
                >
                  {Object.entries(paymentChannels).map(([k, ch]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setMethod(k)}
                      style={{
                        padding: "9px 8px",
                        borderRadius: 10,
                        border: method === k ? `2px solid ${ch.color}` : "1px solid var(--line)",
                        background: method === k ? `${ch.color}12` : "var(--input-bg)",
                        cursor: "pointer",
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: method === k ? ch.color : "var(--ink)",
                        textAlign: "center"
                      }}
                    >
                      <div>{ch.short}</div>
                      {ch.number && (
                        <div style={{ fontSize: 10, opacity: 0.88, marginTop: 2 }}>{ch.number}</div>
                      )}
                    </button>
                  ))}
                </div>

                {paymentMode === "lipa_namba" && (
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8, flexWrap: "wrap" }}>
                      <span style={{ color: "var(--muted)" }}>Lipa Namba / Akaunti:</span>
                      {currentChannel.number ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <strong style={{ fontSize: 16, color: currentChannel.color, letterSpacing: 0.5 }}>
                            {currentChannel.number}
                          </strong>
                          <button
                            type="button"
                            onClick={() => handleCopyNumber(currentChannel.number)}
                            style={{
                              padding: "3px 8px",
                              fontSize: 11,
                              fontWeight: 700,
                              borderRadius: 6,
                              border: "1px solid var(--line)",
                              background: "var(--card-bg)",
                              color: "var(--ink)",
                              cursor: "pointer"
                            }}
                          >
                            {copiedKey === currentChannel.number ? "✓ Imenakiliwa" : "📋 Nakili"}
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "#d97706", fontWeight: 700, fontSize: 12 }}>
                          Wasiliana na CEO au tumia USSD Push
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ color: "var(--muted)" }}>Jina la Mpokeaji:</span>
                      <strong>{currentChannel.merchant}</strong>
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: "1px dashed var(--line)",
                        fontSize: 12,
                        color: "var(--muted)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 6
                      }}
                    >
                      <span>💡 <em>{currentChannel.ussd}</em></span>
                      {currentChannel.dial && (
                        <a
                          href={`tel:${encodeURIComponent(currentChannel.dial)}`}
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: "var(--primary)",
                            textDecoration: "none",
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: "var(--primary-soft)"
                          }}
                        >
                          📞 Piga {currentChannel.dial}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {paymentMode === "ussd_push" && (
                  <div
                    style={{
                      background: "var(--input-bg)",
                      border: "1px solid var(--line)",
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 14
                    }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: "var(--primary)" }}>
                      ⚡ Malipo ya Moja kwa Moja ({gatewayProvider})
                    </div>
                    <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--muted)", lineHeight: 1.45 }}>
                      Weka namba yako ya {currentChannel.short} hapa chini kisha bonyeza <strong>Tuma Ombi Kwenye Simu</strong> ili kuweka PIN na kukamilisha malipo.
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="tel"
                        placeholder="Namba ya simu (mf. 0754123456)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: "1px solid var(--line)",
                          fontSize: 13.5,
                          background: "var(--card-bg)",
                          color: "var(--ink)"
                        }}
                      />
                      <button
                        type="button"
                        className="button button-primary"
                        disabled={busy}
                        onClick={handleSendUssdPush}
                        style={{ padding: "10px 14px", fontSize: 12, flexShrink: 0 }}
                      >
                        {busy ? "Inatuma..." : "📲 Tuma Push"}
                      </button>
                    </div>
                    {pushStep === "sent" && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: "10px 12px",
                          borderRadius: 10,
                          background: "rgba(16, 185, 129, 0.12)",
                          border: "1px solid rgba(16, 185, 129, 0.35)",
                          color: "#10b981",
                          fontSize: 12,
                          fontWeight: 700
                        }}
                      >
                        ✓ Ombi limetumwa kwenye {phone}! Kumbukumbu Namba: <strong>{transactionRef}</strong>. Thibitisha kwenye simu kisha bonyeza "Thibitisha Malipo".
                      </div>
                    )}
                  </div>
                )}

                {/* Verification Inputs */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
                  {paymentMode === "lipa_namba" && (
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                        Namba Yako ya Simu Uliyotumia Kulipia: *
                      </label>
                      <input
                        type="tel"
                        placeholder="Mfano: 0754123456 au 0655123456"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
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
                  )}

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      Kumbukumbu Namba ya Muamala (Transaction ID) au Bandika SMS ya Malipo: *
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Mfano: 9C82K19L2P au bandika (paste) SMS yote ya uthibitisho wa M-Pesa/TigoPesa/Airtel..."
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid var(--line)",
                        fontSize: 13.5,
                        background: "var(--input-bg)",
                        color: "var(--ink)",
                        fontWeight: 600,
                        resize: "vertical"
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {errorMsg && (
              <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 12, fontWeight: 700 }}>
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
                disabled={
                  busy ||
                  (paymentMode === "wallet" && walletBalance < effectiveAmount) ||
                  (paymentMode === "mock_payment" && mockAction === "debit" && walletBalance < effectiveAmount)
                }
              >
                {busy
                  ? "Inathibitisha..."
                  : paymentMode === "mock_payment"
                  ? mockAction === "debit"
                    ? "🧪 Thibitisha & Lipa (Mock)"
                    : "🧪 Thibitisha & Weka (Mock)"
                  : "✓ Thibitisha Malipo"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

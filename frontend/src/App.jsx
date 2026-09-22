import { useEffect, useMemo, useState, useRef } from "react";
import { supabase, supabaseConfigured } from "./lib/supabase";
import {
  addComment,
  addStatusComment,
  createPost,
  createReel,
  createStatus,
  findOrCreateDirectConversation,
  followUser,
  getActiveStatuses,
  getCurrentProfile,
  getFeed,
  getMarketplaceListings,
  getMessages,
  getNotifications,
  getReels,
  getWallet,
  depositToWallet,
  withdrawFromWallet,
  kickPost,
  loginUser,
  logoutUser,
  markNotificationsRead,
  markStatusViewed,
  reactToStatus,
  registerUser,
  searchProfiles,
  sendCallSignal,
  sendFriendRequest,
  sendMessage,
  subscribeToConversation,
  subscribeToInteractions,
  subscribeToRealtime,
  toggleLike,
  updateProfile,
  uploadImage
} from "./api/api";
import { UserProfile } from "./UserProfile";
import { MainFeed } from "./MainFeed";
import { CallModal } from "./CallModal";
import { CustomerAdsDashboard } from "./CustomerAdsDashboard";
import { AffiliateManagerCatalogue } from "./AffiliateManagerCatalogue";
import { CeoDashboard } from "./CeoDashboard";
import { translations, useTranslation } from "./lib/translations";
import "./App.css";

const blankAuth = {
  email: "",
  password: "",
  displayName: "",
  username: "",
  location: "Dar es Salaam",
  phone: "",
  whatsapp: "",
  businessName: "",
  category: "Vifaa vya Kielektroniki & Simu"
};

const initials = (name = "Guest") =>
  name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "G";

export function Avatar({ name = "Guest", size = "md", avatarUrl }) {
  return (
    <div className={`avatar avatar-${size}`} id={`avatar-${name.toLowerCase().replace(/\s+/g, "-")}`}>
      {avatarUrl ? <img src={avatarUrl} alt={`${name} profile`} /> : initials(name)}
    </div>
  );
}

function Brand() {
  return (
    <div className="brand" id="brand-logo">
      <div className="brand-ring">
        <div className="brand-inner" />
      </div>
      <div className="brand-text">
        <span className="brand-title">THE CIRCLE</span>
        <span className="brand-sub">AFFILIATE NETWORK</span>
      </div>
    </div>
  );
}


function ErrorBox({ message }) {
  return message ? <div className="form-message" style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, border: "1px solid rgba(239,68,68,0.2)" }}>{message}</div> : null;
}

function EmojiPicker({ onPick }) {
  const emojis = ["😀", "😂", "😍", "🔥", "❤️", "👏", "🙏", "✨", "🌍", "💚", "🎉", "😎", "🤝", "💡", "🚀", "🙌"];
  return (
    <div className="emoji-popover" id="emoji-popover">
      {emojis.map((emoji) => (
        <button type="button" onClick={() => onPick(emoji)} key={emoji}>
          {emoji}
        </button>
      ))}
    </div>
  );
}

function LanguageToggle({ lang, setLang }) {
  return (
    <div className="lang-toggle-pill" id="language-switcher">
      <button
        type="button"
        id="btn-lang-sw"
        className={`lang-btn ${lang === "sw" ? "active" : ""}`}
        onClick={() => setLang("sw")}
        title="Kiswahili"
      >
        <span>🇹🇿</span> SW
      </button>
      <button
        type="button"
        id="btn-lang-en"
        className={`lang-btn ${lang === "en" ? "active" : ""}`}
        onClick={() => setLang("en")}
        title="English"
      >
        <span>🇬🇧</span> EN
      </button>
    </div>
  );
}

function ThemeToggle({ dark, setDark }) {
  return (
    <button
      type="button"
      id="theme-toggle-btn"
      className="theme-pill-btn"
      onClick={() => setDark(!dark)}
      title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}

/* Facebook Reactions Definition */
const FB_REACTIONS = [
  { id: "like", emoji: "👍", labelSw: "Napenda", labelEn: "Like", color: "#1877f2" },
  { id: "love", emoji: "❤️", labelSw: "Upendo", labelEn: "Love", color: "#f43f5e" },
  { id: "haha", emoji: "😂", labelSw: "Kicheko", labelEn: "Haha", color: "#f59e0b" },
  { id: "wow", emoji: "😮", labelSw: "Kushangaa", labelEn: "Wow", color: "#f59e0b" },
  { id: "sad", emoji: "😢", labelSw: "Huzuni", labelEn: "Sad", color: "#eab308" },
  { id: "angry", emoji: "😡", labelSw: "Hasira", labelEn: "Angry", color: "#ef4444" },
  { id: "kick", emoji: "👊", labelSw: "Kigongo", labelEn: "Kick", color: "#10b981" }
];

/* Media Download Helper */
async function downloadMedia(url, filename = "circle_media.mp4") {
  if (!url) return false;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("Fetch failed");
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    return true;
  } catch {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }
}

/* Local Saved Media / Bookmarks Store */
function getSavedMedia() {
  try {
    const saved = localStorage.getItem("circle_saved_media_v1");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveMediaItem(item) {
  try {
    const current = getSavedMedia();
    const exists = current.some((x) => x.id === item.id);
    let updated;
    if (exists) {
      updated = current.filter((x) => x.id !== item.id);
    } else {
      updated = [{ ...item, savedAt: new Date().toISOString() }, ...current];
    }
    localStorage.setItem("circle_saved_media_v1", JSON.stringify(updated));
    return !exists;
  } catch {
    return false;
  }
}

/* Toast Feedback Notification */
function ToastNotification({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3200);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="circle-toast" id="circle-global-toast">
      <span>✨</span>
      <span>{message}</span>
    </div>
  );
}

/* Telegram Passcode Lock Full-Screen Modal */
function PasscodeLockModal({ lang, correctPin, onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) {
        if (next === correctPin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setPin("");
            setError(false);
          }, 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="passcode-lock-modal" id="passcode-lock-screen">
      <div className="passcode-card" style={{ transform: error ? "translateX(-6px)" : "none", transition: "transform 0.1s ease" }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg, #0284c7, #0ea5e9)", color: "#fff", display: "grid", placeItems: "center", fontSize: 32, margin: "0 auto 16px" }}>
          🔒
        </div>
        <h3 style={{ fontSize: 22, color: "var(--ink-heading)", margin: "0 0 6px" }}>
          {lang === "sw" ? "Msimbo wa Siri wa Telegram" : "Telegram Passcode Lock"}
        </h3>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          {lang === "sw" ? "Weka nambari 4 za siri kufungua THE CIRCLE" : "Enter your 4-digit PIN to unlock THE CIRCLE"}
        </p>

        <div className="passcode-dots-row">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`passcode-dot ${pin.length > idx ? "filled" : ""}`}
              style={{ background: error ? "#ef4444" : undefined, borderColor: error ? "#ef4444" : undefined }}
            />
          ))}
        </div>

        {error && (
          <p style={{ color: "#ef4444", fontSize: 13, fontWeight: 700, margin: "0 0 12px" }}>
            {lang === "sw" ? "PIN siyo sahihi. Jaribu tena." : "Incorrect PIN. Please try again."}
          </p>
        )}

        <div className="passcode-keypad-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              className="passcode-key-btn"
              onClick={() => handleDigit(num.toString())}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            className="passcode-key-btn"
            style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}
            onClick={() => setPin("")}
          >
            {lang === "sw" ? "Futa" : "Clear"}
          </button>
          <button
            type="button"
            className="passcode-key-btn"
            onClick={() => handleDigit("0")}
          >
            0
          </button>
          <button
            type="button"
            className="passcode-key-btn"
            onClick={handleBackspace}
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}

/* Background Ambient Lighting Mesh */
function AmbientBackground() {
  return (
    <div className="ambient-mesh" aria-hidden="true">
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <div className="ambient-orb ambient-orb-3" />
    </div>
  );
}

/* Top Navigation Bar */
function TopHeader({ active, setActive, profile, lang, setLang, dark, setDark, unreadCount, passcodeEnabled, onLockApp }) {
  const t = useTranslation(lang);
  const [term, setTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    const val = e.target.value;
    setTerm(val);
    if (val.trim().length > 1) {
      setSearching(true);
      try {
        const res = await searchProfiles(val);
        setSearchResults(res || []);
      } catch (err) {
        console.warn(err);
      } finally {
        setSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  return (
    <header className="top-header" id="app-top-header">
      <div className="header-left">
        <Brand />
        <div className="header-search">
          <span className="header-search-icon">🔍</span>
          <input
            id="global-search-input"
            type="text"
            value={term}
            onChange={handleSearch}
            placeholder={t.searchPersonPlaceholder}
          />
          {searchResults.length > 0 && (
            <div className="emoji-popover" style={{ position: "absolute", top: "44px", left: 0, width: "320px", display: "flex", flexDirection: "column", gap: 8, zIndex: 100 }}>
              {searchResults.map((p) => (
                <div key={p.id} className="suggestion-row" style={{ padding: "6px", cursor: "pointer" }} onClick={() => { setActive("messages"); setTerm(""); setSearchResults([]); }}>
                  <Avatar name={p.display_name} avatarUrl={p.avatar_url} size="sm" />
                  <div className="suggestion-info">
                    <span className="suggestion-name">{p.display_name}</span>
                    <span className="suggestion-handle">@{p.username}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="header-actions">
        {passcodeEnabled && (
          <button
            type="button"
            id="btn-nav-passcode-lock"
            className="theme-pill-btn"
            onClick={onLockApp}
            title={lang === "sw" ? "Funga Programu (Telegram Passcode)" : "Lock App (Telegram Passcode)"}
            style={{ color: "#0ea5e9" }}
          >
            <span>🔒</span>
          </button>
        )}
        <button
          type="button"
          id="btn-nav-saved-items"
          className={`theme-pill-btn ${active === "saved" ? "active" : ""}`}
          onClick={() => setActive("saved")}
          title={t.savedDownloadsTab}
        >
          <span>🔖</span>
        </button>
        <LanguageToggle lang={lang} setLang={setLang} />
        <ThemeToggle dark={dark} setDark={setDark} />
        <button
          type="button"
          id="btn-nav-notifications"
          className="theme-pill-btn"
          onClick={() => setActive("notifications")}
          title={t.notifications}
          style={{ position: "relative" }}
        >
          <span>🔔</span>
          {unreadCount > 0 && (
            <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
          )}
        </button>
        <button
          type="button"
          id="btn-header-profile"
          onClick={() => setActive("profile")}
          style={{ border: "none", background: "none", padding: 0 }}
        >
          <Avatar name={profile?.display_name || "User"} avatarUrl={profile?.avatar_url} size="sm" />
        </button>
      </div>
    </header>
  );
}

/* Authentication Screen */
function AuthScreen({ lang, setLang, dark, setDark }) {
  const t = useTranslation(lang);
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("customer"); // 'customer' | 'manager'
  const [form, setForm] = useState({ ...blankAuth });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!form.email || !form.password || (mode === "register" && (!form.displayName || !form.username || !form.location))) {
      return setMessage("Tafadhali jaza taarifa zote zinazohitajika (Majina, Username, Barua Pepe, Mahali unapoishi na Nenosiri).");
    }
    if (mode === "register" && form.password.length < 6) {
      return setMessage("Nenosiri liwe na angalau herufi 6.");
    }
    setBusy(true);
    try {
      const result = mode === "login"
        ? await loginUser(form.email, form.password)
        : await registerUser({ ...form, role });
      if (mode === "register" && !result.session) {
        setMessage("Akaunti imeundwa kikamilifu! Sasa unaweza kuingia.");
      }
    } catch (err) {
      setMessage(err.message || t.failedTryAgain);
    } finally {
      setBusy(false);
    }
  };


  const tanzaniaRegions = [
    "Dar es Salaam",
    "Arusha",
    "Mwanza",
    "Dodoma",
    "Mbeya",
    "Morogoro",
    "Tanga",
    "Kilimanjaro (Moshi)",
    "Zanzibar (Mjini Magharibi)",
    "Iringa",
    "Tabora",
    "Kigoma",
    "Shinyanga",
    "Kagera (Bukoba)",
    "Mtwara",
    "Ruvuma (Songea)",
    "Singida",
    "Mara (Musoma)",
    "Manyara",
    "Njombe",
    "Katavi",
    "Songwe",
    "Geita",
    "Simiyu",
    "Nairobi (Kenya)",
    "Kampala (Uganda)",
    "Kigali (Rwanda)"
  ];

  return (
    <main className="auth-page-shell" id="auth-page">
      <AmbientBackground />
      <section className="auth-hero-art">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Brand />
          <div style={{ display: "flex", gap: 10 }}>
            <LanguageToggle lang={lang} setLang={setLang} />
            <ThemeToggle dark={dark} setDark={setDark} />
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 2, margin: "auto 0" }}>
          <p className="eyebrow" style={{ color: "#ffffff" }}>✦ THE CIRCLE DUARA</p>
          <h1 style={{ fontSize: "clamp(34px, 4vw, 56px)", color: "#ffffff", lineHeight: 1.15, margin: "14px 0 16px" }}>
            Mtandao Rasmi wa<br />
            <em style={{ fontFamily: "'Playfair Display', serif", color: "#fbbf24" }}>Affiliate & Matangazo</em><br />
            Tanzania & East Africa
          </h1>
          <p style={{ maxWidth: 460, fontSize: 15, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
            Uongozi Mkuu wa <strong>CEO HAMZA VUKANG</strong>. Ungana kama <strong>Manager</strong> mwenye WhatsApp Catalogue ya duka lako au kama <strong>Mteja Mtangazaji</strong> unayepost bidhaa na kulipia matangazo hewani kwa muda halisi bila akaunti fake.
          </p>
        </div>

        <div className="auth-art-glow" />
      </section>

      <section style={{ display: "grid", placeItems: "center", padding: "24px", zIndex: 1 }}>
        <div className="auth-form-card" id="auth-form-container" style={{ maxWidth: 480, width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Brand />
            <LanguageToggle lang={lang} setLang={setLang} />
          </div>
          <div style={{ display: "flex", borderBottom: "1px solid var(--line)", marginBottom: 18 }}>
            <button
              type="button"
              onClick={() => { setMode("login"); setMessage(""); }}
              style={{
                flex: 1,
                padding: "10px 0",
                background: "none",
                border: "none",
                borderBottom: mode === "login" ? "2px solid var(--primary)" : "none",
                fontWeight: mode === "login" ? 700 : 500,
                color: mode === "login" ? "var(--primary)" : "var(--muted)",
                cursor: "pointer",
                fontSize: 14
              }}
            >
              Ingia Kwenye Akaunti
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setMessage(""); }}
              style={{
                flex: 1,
                padding: "10px 0",
                background: "none",
                border: "none",
                borderBottom: mode === "register" ? "2px solid var(--primary)" : "none",
                fontWeight: mode === "register" ? 700 : 500,
                color: mode === "register" ? "var(--primary)" : "var(--muted)",
                cursor: "pointer",
                fontSize: 14
              }}
            >
              Jiunge na Mtandao (Usajili)
            </button>
          </div>

          <form onSubmit={submit} id="auth-form">
            {mode === "register" && (
              <>
                {/* 1. Anajiunga kama nani? */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    1. Je, unajiunga kama nani? *
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div
                      onClick={() => setRole("customer")}
                      style={{
                        padding: "12px",
                        borderRadius: 10,
                        border: role === "customer" ? "2px solid #18a66a" : "1px solid var(--line)",
                        background: role === "customer" ? "#18a66a15" : "transparent",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 4 }}>🛒</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: role === "customer" ? "#18a66a" : "inherit" }}>
                        Mteja / Mtangazaji
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                        Post Ads & Bidhaa mtandaoni
                      </div>
                    </div>

                    <div
                      onClick={() => setRole("manager")}
                      style={{
                        padding: "12px",
                        borderRadius: 10,
                        border: role === "manager" ? "2px solid #075e54" : "1px solid var(--line)",
                        background: role === "manager" ? "#075e5415" : "transparent",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 4 }}>💼</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: role === "manager" ? "#075e54" : "inherit" }}>
                        Manager wa Duka (Mfanyabiashara)
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                        WhatsApp Catalogue & Oda
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Majina Kamili & Username */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div className="form-group">
                    <label htmlFor="input-fullname">Majina Kamili: *</label>
                    <input
                      id="input-fullname"
                      value={form.displayName}
                      onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                      placeholder="Mfano: Juma Bakari"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="input-username">Jina la Mtumiaji (@username): *</label>
                    <input
                      id="input-username"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                      placeholder="juma_bakari"
                      required
                    />
                  </div>
                </div>

                {/* 3. Mahali Anapoishi */}
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label htmlFor="input-location">Mahali Unapoishi (Mkoa / Wilaya): *</label>
                  <input
                    id="input-location"
                    list="tanzania-regions-list"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Chagua au andika mkoa, mf. Dar es Salaam, Kariakoo"
                    required
                  />
                  <datalist id="tanzania-regions-list">
                    {tanzaniaRegions.map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </div>

                {/* 4. Namba ya Simu & WhatsApp */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div className="form-group">
                    <label htmlFor="input-phone">Simu ya Mobile Money: *</label>
                    <input
                      id="input-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="0754 123 456"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="input-whatsapp">Namba ya WhatsApp: *</label>
                    <input
                      id="input-whatsapp"
                      type="tel"
                      value={form.whatsapp}
                      onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                      placeholder="255754123456"
                      required
                    />
                  </div>
                </div>

                {/* Specific questions for Manager / Business owner */}
                {role === "manager" && (
                  <div
                    style={{
                      background: "rgba(7, 94, 84, 0.08)",
                      border: "1px solid rgba(7, 94, 84, 0.25)",
                      borderRadius: 10,
                      padding: "12px",
                      marginBottom: 12
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#075e54", marginBottom: 8 }}>
                      Taarifa za Biashara / Duka lako (WhatsApp Catalogue):
                    </div>
                    <div className="form-group" style={{ marginBottom: 8 }}>
                      <label htmlFor="input-bizname">Jina la Duka / Biashara:</label>
                      <input
                        id="input-bizname"
                        value={form.businessName}
                        onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                        placeholder="Mfano: Kariakoo Smart Gadgets"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="input-category">Aina ya Bidhaa Unazouza:</label>
                      <select
                        id="input-category"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid var(--line)" }}
                      >
                        <option value="Vifaa vya Kielektroniki & Simu">Vifaa vya Kielektroniki & Simu</option>
                        <option value="Mavazi, Nguo & Mitindo">Mavazi, Nguo & Mitindo</option>
                        <option value="Viatu, Mikoba & Urembo">Viatu, Mikoba & Urembo</option>
                        <option value="Vyakula, Kilimo & Nafaka">Vyakula, Kilimo & Nafaka</option>
                        <option value="Vifaa vya Nyumbani & Samani">Vifaa vya Nyumbani & Samani</option>
                        <option value="Magari, Pikipiki & Vipuri">Magari, Pikipiki & Vipuri</option>
                        <option value="Huduma za Kibiashara">Huduma za Kibiashara</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label htmlFor="input-email">Barua Pepe (Email): *</label>
              <input
                id="input-email"
                type="text"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="barua_pepe@domain.com au username"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label htmlFor="input-password">
                Nenosiri la Akaunti: *
              </label>
              <input
                id="input-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Weka nenosiri..."
                required
              />
            </div>

            <ErrorBox message={message} />

            <button
              id="btn-auth-submit"
              className="button button-primary button-full"
              disabled={busy}
              style={{ marginTop: 14 }}
            >
              {busy ? "Inachakata..." : mode === "login" ? "Ingia kwenye Akaunti" : "Kamilisha Usajili wa Akaunti"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--muted)" }}>
            {mode === "login" ? "Huna akaunti bado?" : "Tayari una akaunti?"}{" "}
            <button
              type="button"
              id="btn-toggle-auth-mode"
              className="text-button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setMessage("");
              }}
            >
              {mode === "login" ? "Jiunge na Mtandao Hapa" : "Ingia Hapa"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

/* Sidebar Navigation */
function Sidebar({ profile, active, setActive, onLogout, unread, lang, setLang, dark, setDark }) {
  const t = useTranslation(lang);
  const isCeo = profile?.role === "ceo";

  const mainLinks = [
    ["ads", "📢", lang === "sw" ? "Matangazo ya Wateja" : "Customer Ads"],
    ["catalogue", "📱", lang === "sw" ? "WhatsApp Catalogue" : "WhatsApp Catalog"],
    ["home", "⌂", t.home],
    ["messages", "✉", t.messages, unread],
  ];

  if (isCeo) {
    mainLinks.unshift(["ceo", "👑", lang === "sw" ? "Ofisi ya CEO (Hamza)" : "CEO Office"]);
  }

  const exploreLinks = [
    ["dashboard", "📊", isCeo ? "CEO Dashboard" : profile?.role === "manager" ? "Manager Stats" : "Mteja Dashboard"],
    ["marketplace", "🛍️", t.marketplace],
    ["reels", "▶", t.reels],
    ["wallet", "💳", t.wallet],
    ["saved", "🔖", t.savedDownloadsTab]
  ];

  const systemLinks = [
    ["profile", "👤", t.profile],
    ["notifications", "🔔", t.notifications, unread],
    ["settings", "⚙", t.settings],
    ["about", "ℹ️", t.about],
    ["terms", "🛡️", t.terms],
    ["help", "❓", t.help]
  ];

  return (
    <aside className="sidebar" id="app-sidebar">
      <nav>
        <span className="nav-section-title">
          {isCeo ? "👑 BIASHARA & UONGOZI" : "🛍️ AFFILIATE & BIASHARA"}
        </span>
        {mainLinks.map(([id, icon, label, badge]) => (
          <button
            id={`nav-item-${id}`}
            className={`nav-item ${active === id ? "active" : ""}`}
            onClick={() => setActive(id)}
            key={id}
          >
            <span className="icon">{icon}</span>
            <span>{label}</span>
            {Boolean(badge) && <span className="nav-badge">{badge}</span>}
          </button>
        ))}

        <span className="nav-section-title">CHUNGUZA & SHUGHULI</span>
        {exploreLinks.map(([id, icon, label]) => (
          <button
            id={`nav-item-${id}`}
            className={`nav-item ${active === id ? "active" : ""}`}
            onClick={() => setActive(id)}
            key={id}
          >
            <span className="icon">{icon}</span>
            <span>{label}</span>
          </button>
        ))}

        <span className="nav-section-title">{t.settings}</span>
        {systemLinks.map(([id, icon, label, badge]) => (
          <button
            id={`nav-item-${id}`}
            className={`nav-item ${active === id ? "active" : ""}`}
            onClick={() => setActive(id)}
            key={id}
          >
            <span className="icon">{icon}</span>
            <span>{label}</span>
            {Boolean(badge) && <span className="nav-badge">{badge}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button
          type="button"
          id="sidebar-profile-capsule"
          className="profile-capsule"
          onClick={() => setActive("profile")}
        >
          <Avatar name={profile.display_name} avatarUrl={profile.avatar_url} size="sm" />
          <div className="profile-capsule-info">
            <span className="profile-capsule-name">{profile.display_name}</span>
            <span className="profile-capsule-tag" style={{ color: isCeo ? "#eab308" : profile?.role === "manager" ? "#10b981" : "var(--muted)", fontWeight: 700 }}>
              {isCeo ? "👑 CEO HAMZA VUKANG" : profile?.role === "manager" ? "💼 AFFILIATE MANAGER" : "🛒 MTEJA MTANGAZAJI"}
            </span>
          </div>
        </button>

        <div className="sidebar-action-row">
          <LanguageToggle lang={lang} setLang={setLang} />
          <button
            type="button"
            id="btn-sidebar-logout"
            className="text-button"
            onClick={onLogout}
            style={{ color: "#ef4444" }}
          >
            <span className="logout-text">{t.logout}</span> 🚪
          </button>
        </div>
      </div>
    </aside>
  );
}

/* Mobile Bottom Navigation Dock */
function MobileBottomNav({ active, setActive, lang, unread, profile }) {
  const isCeo = profile?.role === "ceo";
  const items = [
    ["ads", "📢", "Ads"],
    ["catalogue", "📱", "Catalogue"],
    ["home", "⌂", "Duara"],
    ["messages", "✉", "Gumzo", unread],
    isCeo ? ["ceo", "👑", "CEO"] : ["profile", "👤", "Wasifu"]
  ];

  return (
    <div className="mobile-bottom-nav" id="mobile-bottom-nav">
      {items.map(([id, icon, label, badge]) => (
        <button
          key={id}
          id={`mobile-nav-${id}`}
          className={`mobile-nav-btn ${active === id ? "active" : ""}`}
          onClick={() => setActive(id)}
        >
          <span className="icon">{icon}</span>
          <span>{label}</span>
          {Boolean(badge) && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)" }} />}
        </button>
      ))}
    </div>
  );
}


/* Stories / Status Rail */
function StatusRail({ profile, lang }) {
  const t = useTranslation(lang);
  const [statuses, setStatuses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [background, setBackground] = useState("#10b981");
  const [showEmoji, setShowEmoji] = useState(false);
  const [statusReaction, setStatusReaction] = useState(null);
  const [statusComment, setStatusComment] = useState("");
  const [busy, setBusy] = useState(false);

  const loadStatuses = async () => setStatuses(await getActiveStatuses());

  useEffect(() => {
    loadStatuses().catch(() => {});
    const channel = supabase
      .channel("status-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "statuses" }, () => loadStatuses())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const publish = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;
    setBusy(true);
    try {
      await createStatus(profile.id, content.trim(), background, file);
      setContent("");
      setFile(null);
      await loadStatuses();
    } catch (err) {
      console.warn(err);
    } finally {
      setBusy(false);
    }
  };

  const open = async (status) => {
    setSelected(status);
    setStatusReaction(null);
    setStatusComment("");
    if (status.user_id !== profile.id) {
      await markStatusViewed(status.id, profile.id).catch(() => {});
    }
  };

  const react = async (reaction) => {
    if (!selected) return;
    await reactToStatus(selected.id, profile.id, reaction, statusReaction).catch(() => {});
    setStatusReaction(statusReaction === reaction ? null : reaction);
  };

  const commentStatus = async (e) => {
    e.preventDefault();
    if (!selected || !statusComment.trim()) return;
    await addStatusComment(selected.id, profile.id, statusComment.trim()).catch(() => {});
    setStatusComment("");
  };

  return (
    <section className="stories-card" id="stories-section">
      <div className="stories-header">
        <div>
          <p className="eyebrow">{t.storiesEyebrow}</p>
          <h3 style={{ fontSize: 18 }}>{t.friendsStatus}</h3>
        </div>
        <div className="live-indicator">
          <span className="live-pulse" />
          <span>{t.livePill}</span>
        </div>
      </div>

      <div className="story-track">
        <button
          type="button"
          id="btn-add-story"
          className="story-pill-item add-story-btn"
          onClick={() => document.getElementById("story-quick-input")?.focus()}
        >
          <div className="story-ring-wrap">
            <div className="story-ring-inner">
              <span className="add-story-plus">+</span>
            </div>
          </div>
          <span className="story-user-label">{t.addYours}</span>
        </button>

        {statuses.map((status) => {
          const isMe = status.user_id === profile.id;
          const author = status.profiles?.display_name || "Member";
          return (
            <button
              key={status.id}
              id={`story-pill-${status.id}`}
              className="story-pill-item"
              onClick={() => open(status)}
            >
              <div className="story-ring-wrap">
                <div className="story-ring-inner">
                  <Avatar name={author} avatarUrl={status.profiles?.avatar_url} size="md" />
                </div>
              </div>
              <span className="story-user-label">{isMe ? t.yours : author.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      <form className="story-inline-composer" style={{ background }} onSubmit={publish}>
        <Avatar name={profile.display_name} avatarUrl={profile.avatar_url} size="sm" />
        <input
          id="story-quick-input"
          className="story-inline-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t.setStatusPlaceholder}
          maxLength={300}
        />
        <label className="tool-chip" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}>
          📷
          <input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        <button
          type="button"
          className="tool-chip"
          style={{ background: "rgba(255,255,255,0.2)", color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}
          onClick={() => setShowEmoji(!showEmoji)}
        >
          😊
        </button>
        <input
          type="color"
          className="story-color-picker"
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          title="Pick background color"
        />
        <button
          id="btn-post-story"
          type="submit"
          className="button"
          style={{ background: "#ffffff", color: "var(--primary-dark)", padding: "7px 16px", borderRadius: 10 }}
          disabled={busy}
        >
          {busy ? "..." : t.postStory}
        </button>
      </form>
      {showEmoji && <EmojiPicker onPick={(emoji) => setContent((val) => `${val}${emoji}`)} />}

      {/* Story Full Screen Modal */}
      {selected && (
        <div className="story-viewer" onClick={() => setSelected(null)}>
          <div className="story-content" onClick={(e) => e.stopPropagation()} style={{ background: selected.background || "#10b981" }}>
            {selected.media_url && (
              selected.media_type === "video" ? (
                <video src={selected.media_url} autoPlay controls playsInline />
              ) : (
                <img src={selected.media_url} alt="Story" />
              )
            )}
            <div className="story-copy">
              <strong>{selected.profiles?.display_name || profile.display_name}</strong>
              <p>{selected.content}</p>
              <small>{t.expiresIn24h}</small>
              <div className="story-actions">
                <button type="button" onClick={() => react("like")}>
                  {statusReaction === "like" ? "❤️" : "🤍"} {t.like}
                </button>
                <button type="button" onClick={() => react("kick")}>
                  {statusReaction === "kick" ? `👊 ${t.kicked}` : `👊 ${t.kick}`}
                </button>
              </div>
              <form className="story-comment" onSubmit={commentStatus}>
                <input
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  placeholder={t.replyToStatus}
                />
                <button type="submit">↗</button>
              </form>
            </div>
            <button className="story-close" onClick={() => setSelected(null)}>✕</button>
          </div>
        </div>
      )}
    </section>
  );
}

/* Post Card */
function PostCard({ post, user, onRefresh, lang, onShowToast }) {
  const t = useTranslation(lang);
  const [activeReaction, setActiveReaction] = useState(() => {
    const isLiked = (post.likes || []).some((like) => like.user_id === user.id);
    return isLiked ? "love" : null;
  });
  const [showReactionsBar, setShowReactionsBar] = useState(false);
  const [isSaved, setIsSaved] = useState(() => {
    return getSavedMedia().some((x) => x.id === post.id);
  });
  const [kicked, setKicked] = useState(false);
  const [comment, setComment] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [busy, setBusy] = useState(false);

  const author = post.profiles?.display_name || "Member";

  const handleSelectReaction = async (reactionId) => {
    setShowReactionsBar(false);
    const newReaction = activeReaction === reactionId ? null : reactionId;
    setActiveReaction(newReaction);
    setBusy(true);
    try {
      await toggleLike(user.id, post.id, !newReaction);
      onRefresh();
    } catch (err) {
      console.warn(err);
    } finally {
      setBusy(false);
    }
  };

  const handleSavePost = () => {
    const savedNow = saveMediaItem({
      id: post.id,
      type: post.media_type || (post.media_url ? "image" : "post"),
      media_url: post.media_url,
      caption: post.content,
      author: author,
      authorAvatar: post.profiles?.avatar_url,
      username: post.profiles?.username,
      created_at: post.created_at
    });
    setIsSaved(savedNow);
    if (onShowToast) {
      onShowToast(savedNow ? (lang === "sw" ? "✓ Imehifadhiwa kwenye Mikusanyiko!" : "✓ Saved to your bookmarks!") : (lang === "sw" ? "Imeondolewa kwenye Mikusanyiko" : "Removed from bookmarks"));
    }
  };

  const handleDownloadMedia = async (e) => {
    e.stopPropagation();
    if (!post.media_url) return;
    const ext = post.media_type === "video" ? "mp4" : "jpg";
    const filename = `circle_${post.id}.${ext}`;
    await downloadMedia(post.media_url, filename);
    if (onShowToast) {
      onShowToast(lang === "sw" ? "✓ Upakuaji wa faili umeanza kwenye kifaa chako!" : "✓ Media download started to your device!");
    }
  };

  const kick = async () => {
    try {
      await kickPost(post.id, user.id, kicked);
      setKicked(!kicked);
    } catch (err) {
      console.warn(err);
    }
  };

  const sendComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await addComment(user.id, post.id, comment.trim());
      setComment("");
      onRefresh();
    } catch (err) {
      console.warn(err);
    } finally {
      setBusy(false);
    }
  };

  const currentReactionConfig = FB_REACTIONS.find((r) => r.id === activeReaction);
  const totalReactionsCount = (post.likes?.length || 0) + (activeReaction && !(post.likes || []).some((x) => x.user_id === user.id) ? 1 : 0);

  return (
    <article className="post-card" id={`post-card-${post.id}`}>
      <div className="post-head">
        <Avatar name={author} avatarUrl={post.profiles?.avatar_url} size="md" />
        <div className="post-meta-group">
          <span className="post-author-name">{author}</span>
          <span className="post-time-meta">
            @{post.profiles?.username || "circle"} · {new Date(post.created_at).toLocaleDateString(lang === "sw" ? "sw-TZ" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      <p className="post-body-text">{post.content}</p>

      {post.media_url && (
        <div className="media-wrapper-relative">
          {post.media_type === "video" ? (
            <video src={post.media_url} controls playsInline />
          ) : (
            <img src={post.media_url} alt="Post Attachment" />
          )}

          {/* Direct Media Save & Download Quick Pills */}
          <div className="media-quick-download-bar">
            <button
              type="button"
              className="media-action-pill"
              onClick={handleDownloadMedia}
              title={post.media_type === "video" ? t.downloadVideoBtn : t.downloadImageBtn}
            >
              <span>📥</span>
              <span>{post.media_type === "video" ? (lang === "sw" ? "Pakua Video" : "Download Video") : (lang === "sw" ? "Pakua Picha" : "Download Photo")}</span>
            </button>
            <button
              type="button"
              className="media-action-pill"
              onClick={handleSavePost}
              title={isSaved ? t.unbookmarkMedia : t.bookmarkMedia}
            >
              <span>{isSaved ? "🔖" : "💾"}</span>
              <span>{isSaved ? (lang === "sw" ? "Imehifadhiwa" : "Saved") : (lang === "sw" ? "Hifadhi" : "Save")}</span>
            </button>
          </div>
        </div>
      )}

      {/* Facebook-style Reaction & Comments count summary */}
      <div className="reaction-summary-row">
        <div className="reaction-summary-emojis">
          <span className="reaction-mini-icon">👍</span>
          <span className="reaction-mini-icon">❤️</span>
          <span className="reaction-mini-icon">👊</span>
          <span className="reaction-count-text">
            {totalReactionsCount > 0 ? totalReactionsCount : (activeReaction ? 1 : 0)}
          </span>
        </div>
        {Boolean(post.comments?.[0]?.count) && (
          <span className="muted" style={{ fontSize: 13 }}>
            {post.comments[0].count} {t.comments}
          </span>
        )}
      </div>

      {/* Post Actions Bar with Facebook Reaction trigger and Save Post */}
      <div className="post-actions-bar">
        {/* Facebook Reaction Button with Floating Picker */}
        <div
          className="fb-reaction-wrapper"
          onMouseEnter={() => setShowReactionsBar(true)}
          onMouseLeave={() => setShowReactionsBar(false)}
        >
          {showReactionsBar && (
            <div className="fb-reaction-popover" id={`reactions-popover-${post.id}`}>
              {FB_REACTIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="fb-reaction-btn"
                  onClick={() => handleSelectReaction(r.id)}
                >
                  <span>{r.emoji}</span>
                  <span className="fb-reaction-tooltip">{lang === "sw" ? r.labelSw : r.labelEn}</span>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            id={`btn-react-${post.id}`}
            onClick={() => handleSelectReaction(activeReaction ? activeReaction : "love")}
            disabled={busy}
            className={`action-btn ${activeReaction ? "liked" : ""}`}
            style={{ color: currentReactionConfig ? currentReactionConfig.color : undefined }}
          >
            <span>{currentReactionConfig ? currentReactionConfig.emoji : "🤍"}</span>
            <span>
              {currentReactionConfig
                ? (lang === "sw" ? currentReactionConfig.labelSw : currentReactionConfig.labelEn)
                : t.like}
            </span>
          </button>
        </div>

        <button
          type="button"
          id={`btn-kick-${post.id}`}
          onClick={kick}
          className={`action-btn ${kicked ? "kicked" : ""}`}
        >
          <span>👊</span>
          <span>{kicked ? t.kicked : t.kick}</span>
        </button>

        <button
          type="button"
          id={`btn-reply-${post.id}`}
          onClick={() => setShowCommentBox(!showCommentBox)}
          className="action-btn"
        >
          <span>💬</span>
          <span>{t.reply}</span>
        </button>

        <button
          type="button"
          id={`btn-bookmark-action-${post.id}`}
          onClick={handleSavePost}
          className={`action-btn ${isSaved ? "saved" : ""}`}
          title={isSaved ? t.unbookmarkMedia : t.bookmarkMedia}
        >
          <span>{isSaved ? "🔖" : "💾"}</span>
          <span>{isSaved ? (lang === "sw" ? "Imehifadhiwa" : "Saved") : (lang === "sw" ? "Hifadhi" : "Save")}</span>
        </button>

        <button
          type="button"
          id={`btn-share-${post.id}`}
          className="action-btn"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: "THE CIRCLE", text: post.content, url: window.location.href });
            }
          }}
        >
          <span>↗</span>
          <span>{t.share}</span>
        </button>
      </div>

      {showCommentBox && (
        <form className="inline-comment-form" onSubmit={sendComment}>
          <input
            id={`comment-input-${post.id}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.writeReply}
          />
          <button type="button" className="action-btn" onClick={() => setShowEmoji(!showEmoji)}>
            😊
          </button>
          <button type="submit" className="button button-primary" disabled={busy}>
            {t.send}
          </button>
        </form>
      )}

      {showEmoji && <EmojiPicker onPick={(emoji) => setComment((val) => `${val}${emoji}`)} />}
    </article>
  );
}

/* Home / Main Feed View Alias */
const Home = MainFeed;
export { MainFeed, Home };

/* Suggestions Widget */
function Suggestions({ userId, lang }) {
  const t = useTranslation(lang);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [sent, setSent] = useState({});

  const search = async (e) => {
    const value = e.target.value;
    setTerm(value);
    if (value.length > 1) {
      setResults(await searchProfiles(value));
    } else {
      setResults([]);
    }
  };

  const addFriend = async (person) => {
    try {
      await sendFriendRequest(userId, person.id);
      setSent({ ...sent, [person.id]: true });
    } catch (err) {
      console.warn(err);
    }
  };

  return (
    <div className="rail-card" id="rail-suggestions">
      <h3>{t.discoverPeople}</h3>
      <input
        className="form-group"
        style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", outline: "none", marginBottom: 12, fontSize: 13 }}
        value={term}
        onChange={search}
        placeholder={t.searchPersonPlaceholder}
      />
      {results.map((person) => (
        <div className="suggestion-row" key={person.id}>
          <Avatar name={person.display_name} avatarUrl={person.avatar_url} size="sm" />
          <div className="suggestion-info">
            <span className="suggestion-name">{person.display_name}</span>
            <span className="suggestion-handle">@{person.username}</span>
          </div>
          <button
            type="button"
            className="friend-btn"
            onClick={() => addFriend(person)}
            disabled={sent[person.id]}
          >
            {sent[person.id] ? t.requestSent : t.addFriend}
          </button>
        </div>
      ))}
      {!results.length && (
        <p className="muted" style={{ fontSize: 12, textAlign: "center", padding: "10px 0" }}>
          {lang === "sw" ? "Tafuta jina kuongeza watu." : "Search to connect with others."}
        </p>
      )}
    </div>
  );
}

/* UserProfile Component alias & re-export */
const Profile = UserProfile;
export { UserProfile, Profile };

/* Marketplace View */
function Marketplace({ lang }) {
  const t = useTranslation(lang);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketplaceListings()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="feature-shell" id="marketplace-view">
      <div className="feature-top-banner">
        <div>
          <p className="eyebrow">{t.marketplaceEyebrow}</p>
          <h1 style={{ fontSize: 32, margin: "6px 0 10px" }}>{t.marketplaceTitle}</h1>
          <p className="muted">{t.marketplaceDesc}</p>
        </div>
        <button type="button" className="button button-primary">
          {t.postProductBtn}
        </button>
      </div>

      {loading ? (
        <p className="muted">{t.loadingProducts}</p>
      ) : items.length > 0 ? (
        <div className="feature-grid-3">
          {items.map((item) => (
            <article className="market-card" key={item.id}>
              <div className="market-img-wrap">
                {item.image_url ? <img src={item.image_url} alt={item.title} /> : <span style={{ fontSize: 44, display: "grid", placeItems: "center", height: "100%" }}>🛍️</span>}
              </div>
              <div className="market-info">
                <span className="eyebrow" style={{ fontSize: 10 }}>{item.location || "Tanzania"}</span>
                <h3 style={{ fontSize: 16 }}>{item.title}</h3>
                <span className="market-price">{Number(item.price).toLocaleString()} {item.currency}</span>
                <p className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <span style={{ fontSize: 44 }}>🛍️</span>
          <h3 style={{ margin: "14px 0 6px" }}>{t.emptyMarketplace}</h3>
          <p className="muted">{t.emptyMarketplaceDesc}</p>
        </div>
      )}
    </div>
  );
}

/* Individual Reel Card with Facebook Reactions & Download Video */
function ReelCard({ reel, lang, onShowToast }) {
  const t = useTranslation(lang);
  const [reaction, setReaction] = useState(null);
  const [showPopover, setShowPopover] = useState(false);
  const [isSaved, setIsSaved] = useState(() => {
    return getSavedMedia().some((x) => x.id === reel.id);
  });
  const [downloading, setDownloading] = useState(false);

  const handleSelectReaction = (id) => {
    setReaction(reaction === id ? null : id);
    setShowPopover(false);
    if (onShowToast) {
      const cfg = FB_REACTIONS.find((r) => r.id === id);
      if (cfg) {
        onShowToast(`${cfg.emoji} ${lang === "sw" ? "Umeacha hisia ya" : "Reacted with"} ${lang === "sw" ? cfg.labelSw : cfg.labelEn}`);
      }
    }
  };

  const handleSaveReel = () => {
    const savedNow = saveMediaItem({
      id: reel.id,
      type: "reel",
      media_url: reel.video_url,
      caption: reel.caption,
      author: reel.profiles?.display_name,
      authorAvatar: reel.profiles?.avatar_url,
      username: reel.profiles?.username,
      created_at: reel.created_at
    });
    setIsSaved(savedNow);
    if (onShowToast) {
      onShowToast(savedNow ? (lang === "sw" ? "✓ Reel imehifadhiwa kwenye Mikusanyiko!" : "✓ Reel saved to your bookmarks!") : (lang === "sw" ? "Reel imeondolewa kwenye hifadhi" : "Reel removed from bookmarks"));
    }
  };

  const handleDownloadReel = async () => {
    setDownloading(true);
    await downloadMedia(reel.video_url, `circle_reel_${reel.id}.mp4`);
    setDownloading(false);
    if (onShowToast) {
      onShowToast(lang === "sw" ? "✓ Upakuaji wa Reel umeanza (MP4)!" : "✓ Reel download started (MP4)!");
    }
  };

  const curConfig = FB_REACTIONS.find((r) => r.id === reaction);

  return (
    <article className="reel-card-modern" id={`reel-card-${reel.id}`}>
      <div className="reel-video-wrapper">
        <video src={reel.video_url} controls playsInline preload="metadata" />

        {/* Quick Save & Download Floating Pills */}
        <div className="reel-top-badges">
          <button
            type="button"
            className="media-action-pill"
            onClick={handleDownloadReel}
            disabled={downloading}
            title={t.downloadVideoBtn}
          >
            <span>📥</span>
            <span>{downloading ? "..." : (lang === "sw" ? "Pakua MP4" : "Download MP4")}</span>
          </button>
          <button
            type="button"
            className="media-action-pill"
            onClick={handleSaveReel}
            title={isSaved ? t.unbookmarkMedia : t.bookmarkMedia}
          >
            <span>{isSaved ? "🔖" : "💾"}</span>
            <span>{isSaved ? (lang === "sw" ? "Imehifadhiwa" : "Saved") : (lang === "sw" ? "Hifadhi" : "Save")}</span>
          </button>
        </div>
      </div>

      <div className="reel-overlay-info">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Avatar name={reel.profiles?.display_name || "Creator"} avatarUrl={reel.profiles?.avatar_url} size="xs" />
          <strong style={{ fontSize: 14 }}>{reel.profiles?.display_name || "Member"}</strong>
          {reel.profiles?.username && <span className="muted" style={{ fontSize: 12 }}>@{reel.profiles.username}</span>}
        </div>
        <p style={{ fontSize: 13, margin: "0 0 10px", lineHeight: 1.5 }}>{reel.caption}</p>

        {/* Facebook Reaction Dock & Actions */}
        <div className="reel-actions-row">
          <div
            className="fb-reaction-wrapper"
            onMouseEnter={() => setShowPopover(true)}
            onMouseLeave={() => setShowPopover(false)}
          >
            {showPopover && (
              <div className="fb-reaction-popover" style={{ bottom: "44px", left: 0 }}>
                {FB_REACTIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="fb-reaction-btn"
                    onClick={() => handleSelectReaction(r.id)}
                  >
                    <span>{r.emoji}</span>
                    <span className="fb-reaction-tooltip">{lang === "sw" ? r.labelSw : r.labelEn}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              className={`reel-action-btn ${reaction ? "active" : ""}`}
              onClick={() => handleSelectReaction(reaction ? reaction : "love")}
              style={{ color: curConfig ? curConfig.color : undefined }}
            >
              <span>{curConfig ? curConfig.emoji : "🤍"}</span>
              <span>{curConfig ? (lang === "sw" ? curConfig.labelSw : curConfig.labelEn) : t.like}</span>
            </button>
          </div>

          <button
            type="button"
            className="reel-action-btn"
            onClick={handleDownloadReel}
            title={t.downloadVideoBtn}
          >
            <span>📥</span>
            <span>{lang === "sw" ? "Pakua" : "Download"}</span>
          </button>

          <button
            type="button"
            className={`reel-action-btn ${isSaved ? "active" : ""}`}
            onClick={handleSaveReel}
            title={isSaved ? t.unbookmarkMedia : t.bookmarkMedia}
          >
            <span>{isSaved ? "🔖" : "💾"}</span>
            <span>{isSaved ? (lang === "sw" ? "Imehifadhiwa" : "Saved") : (lang === "sw" ? "Hifadhi" : "Save")}</span>
          </button>

          <button
            type="button"
            className="reel-action-btn"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "THE CIRCLE Reel", text: reel.caption, url: reel.video_url });
              }
            }}
          >
            <span>↗</span>
            <span>{t.share}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

/* Reels View with Save & Download Videos */
function Reels({ profile, lang, onShowToast }) {
  const t = useTranslation(lang);
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getReels().then(setItems).catch(console.warn);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return setMessage(t.chooseVideo);
    setBusy(true);
    setMessage("");
    try {
      const videoUrl = await uploadImage(profile.id, file);
      const newReel = await publishReel(profile.id, videoUrl, caption);
      setItems((current) => [{ ...newReel, profiles: profile }, ...current]);
      setFile(null);
      setCaption("");
      setMessage(t.reelPublished);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="feature-shell" id="reels-view">
      <div className="feature-top-banner">
        <div>
          <p className="eyebrow">{t.reelsEyebrow}</p>
          <h1 style={{ fontSize: 32, margin: "6px 0 10px" }}>{t.reelsTitle}</h1>
          <p className="muted">{t.reelsDesc}</p>
        </div>
      </div>

      <form className="glass-card" onSubmit={submit} style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <label className="tool-chip" style={{ cursor: "pointer" }}>
            <span>🎬</span> {t.chooseVideo}
            <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
          </label>
          <input
            style={{ flex: 1, minWidth: 200, padding: "10px 16px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", outline: "none" }}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={t.reelCaptionPlaceholder}
          />
          <button type="submit" className="button button-primary" disabled={busy}>
            {busy ? t.uploadingReel : t.publishReelBtn}
          </button>
        </div>
        {file && <p style={{ marginTop: 8, fontSize: 12, color: "var(--primary)" }}>🎬 {file.name}</p>}
        <ErrorBox message={message} />
      </form>

      {items.length > 0 ? (
        <div className="reels-grid-3">
          {items.map((reel) => (
            <ReelCard key={reel.id} reel={reel} lang={lang} onShowToast={onShowToast} />
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <span style={{ fontSize: 44 }}>▶</span>
          <h3 style={{ margin: "14px 0 6px" }}>{t.emptyReels}</h3>
          <p className="muted">{t.emptyReelsDesc}</p>
        </div>
      )}
    </div>
  );
}

/* Saved Media & Downloads Collections View */
function SavedMedia({ lang, setActive, onShowToast }) {
  const t = useTranslation(lang);
  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState(() => getSavedMedia());

  const handleRemove = (id) => {
    saveMediaItem({ id });
    setItems(getSavedMedia());
    if (onShowToast) {
      onShowToast(lang === "sw" ? "Imeondolewa kwenye mikusanyiko" : "Removed from saved collections");
    }
  };

  const handleDownload = async (item) => {
    if (!item.media_url) return;
    const ext = item.type === "video" || item.type === "reel" ? "mp4" : "jpg";
    await downloadMedia(item.media_url, `circle_saved_${item.id}.${ext}`);
    if (onShowToast) {
      onShowToast(lang === "sw" ? "✓ Upakuaji wa faili umeanza!" : "✓ Media download started!");
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "video") return item.type === "video";
    if (filter === "image") return item.type === "image" || item.type === "photo";
    if (filter === "reels") return item.type === "reel";
    return true;
  });

  return (
    <div className="feature-shell" id="saved-media-view">
      <div className="feature-top-banner">
        <div>
          <p className="eyebrow">{lang === "sw" ? "HIFADHI YA MAUDHUI" : "SAVED MEDIA & BOOKMARKS"}</p>
          <h1 style={{ fontSize: 32, margin: "6px 0 10px" }}>{t.savedDownloadsTab}</h1>
          <p className="muted">
            {lang === "sw"
              ? "Tazama video na picha zote ulizozihifadhi kutoka kwenye machapisho na reels, na uzipakue moja kwa moja kwenye kifaa chako."
              : "Browse photos and videos you saved across posts and reels, and download them directly to your local device."}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { id: "all", label: lang === "sw" ? "Zote" : "All Items" },
          { id: "video", label: lang === "sw" ? "Video Pekee" : "Videos Only" },
          { id: "image", label: lang === "sw" ? "Picha Pekee" : "Photos Only" },
          { id: "reels", label: lang === "sw" ? "Reels Zilizohifadhiwa" : "Saved Reels" }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`button ${filter === tab.id ? "button-primary" : "button-outline"}`}
            onClick={() => setFilter(tab.id)}
          >
            {tab.label} ({tab.id === "all" ? items.length : items.filter((x) => (tab.id === "video" ? x.type === "video" : tab.id === "image" ? (x.type === "image" || x.type === "photo") : x.type === "reel")).length})
          </button>
        ))}
      </div>

      {filteredItems.length > 0 ? (
        <div className="saved-media-grid">
          {filteredItems.map((item) => (
            <article key={item.id} className="saved-media-card">
              {item.media_url ? (
                <div className="saved-media-preview">
                  {item.type === "video" || item.type === "reel" ? (
                    <video src={item.media_url} controls playsInline />
                  ) : (
                    <img src={item.media_url} alt={item.caption || "Saved Media"} />
                  )}
                </div>
              ) : (
                <div style={{ padding: "20px", background: "var(--card-hover)" }}>
                  <p style={{ fontSize: 14, margin: 0, fontStyle: "italic" }}>"{item.caption}"</p>
                </div>
              )}

              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10, flex: 1, justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    {item.authorAvatar && <Avatar name={item.author || "User"} avatarUrl={item.authorAvatar} size="xs" />}
                    <strong style={{ fontSize: 13 }}>{item.author || "Circle Member"}</strong>
                    {item.username && <span className="muted" style={{ fontSize: 11 }}>@{item.username}</span>}
                  </div>
                  {item.caption && <p style={{ fontSize: 13, color: "var(--ink)", margin: 0 }}>{item.caption}</p>}
                </div>

                <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                  {item.media_url && (
                    <button
                      type="button"
                      className="button button-primary"
                      style={{ flex: 1, fontSize: 12, padding: "8px 12px" }}
                      onClick={() => handleDownload(item)}
                    >
                      📥 {lang === "sw" ? "Pakua Kwenye Kifaa" : "Download File"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="button button-soft"
                    style={{ color: "#ef4444", fontSize: 12, padding: "8px 12px" }}
                    onClick={() => handleRemove(item.id)}
                  >
                    🗑️ {lang === "sw" ? "Ondoa" : "Remove"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <span style={{ fontSize: 48, display: "block", marginBottom: 14 }}>🔖</span>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>
            {lang === "sw" ? "Hakuna Maudhui Yaliyohifadhiwa" : "No Saved Media Found"}
          </h3>
          <p className="muted" style={{ maxWidth: 440, margin: "0 auto 20px" }}>
            {lang === "sw"
              ? "Bofya kitufe cha 'Hifadhi' (💾 au 🔖) kwenye picha, video au reels ili kupakua au kuweka kumbukumbu zako hapa."
              : "Click the 'Save' button (💾 or 🔖) on any photo, video, or reel to bookmark and download media here."}
          </p>
          <button
            type="button"
            className="button button-primary"
            onClick={() => setActive("home")}
          >
            {lang === "sw" ? "Gundua Machapisho" : "Explore Feed"}
          </button>
        </div>
      )}
    </div>
  );
}

/* Wallet View with Tanzanian Mobile Money Integration */
function Wallet({ profile, lang }) {
  const t = useTranslation(lang);
  const [wallet, setWallet] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'deposit' | 'withdraw' | null
  const [selectedMethod, setSelectedMethod] = useState("Vodacom M-Pesa");
  const [amount, setAmount] = useState("20000");
  const [phone, setPhone] = useState(profile?.phone || "0754123456");
  const [accountName, setAccountName] = useState(profile?.display_name || "");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [ussdPromptActive, setUssdPromptActive] = useState(false);
  const [ussdCountdown, setUssdCountdown] = useState(4);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [filterType, setFilterType] = useState("all");

  const loadWallet = async () => {
    try {
      const data = await getWallet(profile.id);
      setWallet(data);
    } catch {
      setWallet({ account: null, transactions: [] });
    }
  };

  useEffect(() => {
    loadWallet();
  }, [profile.id]);

  const channels = [
    {
      name: "Vodacom M-Pesa",
      short: "M-Pesa",
      color: "#e60000",
      bg: "rgba(230,0,0,0.08)",
      till: "554433",
      merchant: "THE CIRCLE DUARA",
      code: "*150*00#"
    },
    {
      name: "Tigo Pesa",
      short: "Tigo Pesa",
      color: "#00377d",
      bg: "rgba(0,55,125,0.08)",
      till: "778899",
      merchant: "DUARA AFFILIATE",
      code: "*150*01#"
    },
    {
      name: "Airtel Money",
      short: "Airtel",
      color: "#ff0000",
      bg: "rgba(255,0,0,0.08)",
      till: "992211",
      merchant: "HAMZA VUKANG BIZ",
      code: "*150*60#"
    },
    {
      name: "HaloPesa",
      short: "HaloPesa",
      color: "#ff6600",
      bg: "rgba(255,102,0,0.08)",
      till: "332211",
      merchant: "DUARA COMMERCE",
      code: "*150*88#"
    }
  ];

  const handleStartDeposit = () => {
    setModalMode("deposit");
    setAmount("20000");
    setReference("MP" + Math.floor(10000000 + Math.random() * 90000000));
    setErrorMsg("");
    setStatusMsg("");
  };

  const handleStartWithdraw = () => {
    setModalMode("withdraw");
    setAmount("10000");
    setErrorMsg("");
    setStatusMsg("");
  };

  const handleTriggerUssdDeposit = () => {
    if (!amount || Number(amount) < 500) {
      setErrorMsg("Kiwango cha chini cha kuweka ni TZS 500.");
      return;
    }
    if (!phone || phone.length < 9) {
      setErrorMsg("Weka namba sahihi ya simu ya Mobile Money.");
      return;
    }
    setErrorMsg("");
    setUssdPromptActive(true);
    setUssdCountdown(4);

    const interval = setInterval(() => {
      setUssdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          completeDepositSubmission();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const completeDepositSubmission = async () => {
    setBusy(true);
    setErrorMsg("");
    try {
      const generatedRef = reference || "TX" + Date.now().toString().slice(-8);
      await depositToWallet(profile.id, Number(amount), selectedMethod, phone, generatedRef);
      setStatusMsg(`✓ Umefanikiwa kuweka TZS ${Number(amount).toLocaleString()} kupitia ${selectedMethod}! Salio limesasishwa.`);
      setUssdPromptActive(false);
      await loadWallet();
      setTimeout(() => {
        setModalMode(null);
        setStatusMsg("");
      }, 2500);
    } catch (err) {
      setErrorMsg(err.message || "Hitilafu imetokea wakati wa kuweka pesa.");
      setUssdPromptActive(false);
    } finally {
      setBusy(false);
    }
  };

  const handleWithdrawSubmission = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) < 1000) {
      setErrorMsg("Kiwango cha chini cha kutoa ni TZS 1,000.");
      return;
    }
    const currentBal = wallet?.account?.balance || 0;
    if (Number(amount) > currentBal) {
      setErrorMsg(`Salio halitoshi! Salio lako ni TZS ${Number(currentBal).toLocaleString()}.`);
      return;
    }
    if (!phone || phone.length < 9) {
      setErrorMsg("Tafadhali weka namba sahihi ya simu ya kupokea.");
      return;
    }
    setBusy(true);
    setErrorMsg("");
    try {
      await withdrawFromWallet(profile.id, Number(amount), selectedMethod, phone, accountName || profile.display_name);
      setStatusMsg(`✓ Umefanikiwa kutoa TZS ${Number(amount).toLocaleString()} kwenda ${selectedMethod} (${phone})! Pesa zimetumwa kwa mtumiaji.`);
      await loadWallet();
      setTimeout(() => {
        setModalMode(null);
        setStatusMsg("");
      }, 2500);
    } catch (err) {
      setErrorMsg(err.message || "Hitilafu wakati wa kutoa pesa.");
    } finally {
      setBusy(false);
    }
  };

  const balance = wallet?.account?.balance || 0;
  const rawTxList = wallet?.transactions || [];
  const filteredTxList = rawTxList.filter((tx) => {
    if (filterType === "deposits") return tx.type === "DEPOSIT";
    if (filterType === "withdrawals") return tx.type === "WITHDRAW";
    if (filterType === "ads") return tx.type === "AD_PAYMENT" || tx.type === "AD_FEE";
    return true;
  });

  return (
    <div className="feature-shell" id="wallet-view">
      <div className="feature-top-banner">
        <div>
          <p className="eyebrow">💳 MFUMO WA PESA & MALIPO</p>
          <h1 style={{ fontSize: 32, margin: "6px 0 10px" }}>{t.walletTitle}</h1>
          <p className="muted">
            Salio lako la Mobile Money (M-Pesa, Tigo Pesa, Airtel, HaloPesa) kwa ajili ya kulipia matangazo, kupokea faida za catalogue na kutoa pesa muda wowote.
          </p>
        </div>
      </div>

      {/* Main Balance Hero Card */}
      <div
        className="wallet-hero"
        style={{
          background: "linear-gradient(135deg, #075e54, #128c7e)",
          borderRadius: 18,
          padding: "28px",
          color: "#ffffff",
          boxShadow: "0 10px 30px rgba(7, 94, 84, 0.25)",
          marginBottom: 24,
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <span style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1, opacity: 0.9 }}>
              {t.availableBalance}
            </span>
            <div style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 900, margin: "4px 0 8px" }}>
              {Number(balance).toLocaleString()} <span style={{ fontSize: 22, fontWeight: 600 }}>{wallet?.account?.currency || "TZS"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, opacity: 0.95 }}>
              <span>✓ Akaunti ya Mobile Money: <strong>{profile?.phone || "0754 123 456"}</strong></span>
              <span>•</span>
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                {profile?.role === "ceo" ? "👑 CEO WALLET" : profile?.role === "manager" ? "💼 MANAGER WALLET" : "🛒 MTEJA WALLET"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              id="btn-wallet-deposit"
              onClick={handleStartDeposit}
              style={{
                background: "#ffffff",
                color: "#075e54",
                border: "none",
                borderRadius: 12,
                padding: "12px 22px",
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}
            >
              <span>📥</span>
              <span>Weka Pesa (Deposit)</span>
            </button>
            <button
              type="button"
              id="btn-wallet-withdraw"
              onClick={handleStartWithdraw}
              style={{
                background: "rgba(255,255,255,0.18)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: 12,
                padding: "12px 22px",
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <span>📤</span>
              <span>Toa Pesa (Withdraw)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Operator Paybill & Till Cards */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>🇹🇿 Mitandao ya Malipo & Namba za Lipa (Tanzania):</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {channels.map((ch) => (
            <div
              key={ch.name}
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: 6
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ color: ch.color, fontSize: 14 }}>{ch.name}</strong>
                <span style={{ fontSize: 11, background: ch.bg, color: ch.color, padding: "2px 6px", borderRadius: 6, fontWeight: 700 }}>
                  {ch.code}
                </span>
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Lipa Namba / Till: <strong style={{ fontSize: 15 }}>{ch.till}</strong>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                Jina la Akaunti: <strong>{ch.merchant}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="glass-card" style={{ padding: "22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, margin: 0 }}>📊 Historia ya Miamala ({filteredTxList.length})</h3>

          <div style={{ display: "flex", gap: 6 }}>
            {[
              ["all", "Zote"],
              ["deposits", "Kuweka Pesa"],
              ["withdrawals", "Kutoa Pesa"],
              ["ads", "Malipo ya Matangazo"]
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilterType(id)}
                style={{
                  background: filterType === id ? "var(--primary)" : "transparent",
                  color: filterType === id ? "#fff" : "var(--muted)",
                  border: filterType === id ? "none" : "1px solid var(--line)",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredTxList.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredTxList.map((tx) => {
              const isDeposit = tx.type === "DEPOSIT";
              const isWithdraw = tx.type === "WITHDRAW";
              return (
                <div
                  key={tx.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px",
                    borderRadius: 10,
                    background: "var(--card-hover)",
                    border: "1px solid var(--line)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: isDeposit ? "rgba(24, 166, 106, 0.12)" : "rgba(239, 68, 68, 0.12)",
                        color: isDeposit ? "#18a66a" : "#ef4444",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 18
                      }}
                    >
                      {isDeposit ? "📥" : isWithdraw ? "📤" : "📢"}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>
                        {tx.description || (isDeposit ? "Kuweka pesa kwa Simu" : "Kutoa pesa kwenda kwa Simu")}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                        {new Date(tx.created_at || Date.now()).toLocaleString()} • <span style={{ color: "#18a66a" }}>Imekamilika</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <strong style={{ fontSize: 16, color: isDeposit ? "#18a66a" : "#ef4444" }}>
                      {isDeposit ? "+" : "-"} {Number(tx.amount).toLocaleString()} {tx.currency || "TZS"}
                    </strong>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      {tx.type}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <span style={{ fontSize: 36 }}>💳</span>
            <p className="muted" style={{ marginTop: 10 }}>Hakuna miamala yoyote iliyorekodiwa kwenye kipengele hiki.</p>
          </div>
        )}
      </div>

      {/* Deposit Modal (Weka Pesa) */}
      {modalMode === "deposit" && (
        <div className="call-modal-overlay">
          <div
            className="call-modal-box"
            style={{ maxWidth: 460, width: "100%", background: "var(--card-bg)", color: "var(--ink)", padding: "24px", borderRadius: 16 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>📥 Weka Pesa kwenye Wallet (Mobile Money)</h3>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--muted)" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              Chagua mtandao wa simu na kiasi unachotaka kuweka moja kwa moja kwenye akaunti yako:
            </p>

            {/* Operator Selection */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {channels.map((c) => (
                <div
                  key={c.name}
                  onClick={() => setSelectedMethod(c.name)}
                  style={{
                    padding: "10px",
                    borderRadius: 10,
                    border: selectedMethod === c.name ? `2px solid ${c.color}` : "1px solid var(--line)",
                    background: selectedMethod === c.name ? c.bg : "transparent",
                    cursor: "pointer",
                    textAlign: "center"
                  }}
                >
                  <strong style={{ color: c.color, fontSize: 13 }}>{c.short}</strong>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>Till: {c.till}</div>
                </div>
              ))}
            </div>

            {/* Amount Selection */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>
                Chagua Kiasi (TZS):
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 8 }}>
                {["5000", "10000", "20000", "50000", "100000", "200000"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v)}
                    style={{
                      padding: "8px",
                      borderRadius: 8,
                      border: amount === v ? "2px solid var(--primary)" : "1px solid var(--line)",
                      background: amount === v ? "var(--primary-soft)" : "transparent",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer",
                      color: amount === v ? "var(--primary)" : "inherit"
                    }}
                  >
                    {Number(v).toLocaleString()}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Au andika kiasi chako mwenyewe..."
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)" }}
              />
            </div>

            {/* Phone Number */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>
                Namba ya Simu ya {selectedMethod}:
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0754 123 456"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)" }}
              />
            </div>

            {/* USSD Prompt Simulation Box */}
            {ussdPromptActive && (
              <div
                style={{
                  background: "#020617",
                  color: "#22c55e",
                  padding: "14px",
                  borderRadius: 10,
                  border: "1px solid #16a34a",
                  marginBottom: 14,
                  textAlign: "center"
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800 }}>📱 Ombi la USSD Push Limetumwa kwenye Simu!</div>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: "6px 0" }}>
                  Tafadhali thibitisha kwenye simu yako namba <strong>{phone}</strong> kwa kuweka PIN yako ya {selectedMethod}...
                </p>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#eab308" }}>
                  Inakamilisha baada ya sekunde {ussdCountdown}...
                </div>
              </div>
            )}

            {errorMsg && (
              <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 12, fontWeight: 600 }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {statusMsg && (
              <div style={{ color: "#18a66a", fontSize: 13, marginBottom: 12, fontWeight: 700 }}>
                {statusMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                type="button"
                className="button button-soft"
                onClick={() => setModalMode(null)}
                style={{ flex: 1 }}
              >
                Ghairi
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={handleTriggerUssdDeposit}
                disabled={busy || ussdPromptActive}
                style={{ flex: 2 }}
              >
                {busy ? "Inachakata..." : ussdPromptActive ? "Inasubiri PIN..." : "Tuma USSD Push (Weka Pesa)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal (Toa Pesa) */}
      {modalMode === "withdraw" && (
        <div className="call-modal-overlay">
          <div
            className="call-modal-box"
            style={{ maxWidth: 460, width: "100%", background: "var(--card-bg)", color: "var(--ink)", padding: "24px", borderRadius: 16 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>📤 Toa Pesa Kwenda Mobile Money</h3>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--muted)" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              Salio Linalopatikana: <strong style={{ color: "var(--primary)" }}>TZS {Number(balance).toLocaleString()}</strong>
            </p>

            <form onSubmit={handleWithdrawSubmission}>
              {/* Operator */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>
                  Mtandao wa Kupokelea Pesa:
                </label>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)" }}
                >
                  {channels.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label htmlFor="input-withdraw-amount">Kiasi cha Kutoa (TZS): *</label>
                <input
                  id="input-withdraw-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Kiwango cha TZS"
                  max={balance}
                  required
                />
              </div>

              {/* Phone */}
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label htmlFor="input-withdraw-phone">Namba ya Simu ya Kupokelea: *</label>
                <input
                  id="input-withdraw-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0754 123 456"
                  required
                />
              </div>

              {/* Name */}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label htmlFor="input-withdraw-name">Jina la Mwenye Namba (Utambulisho):</label>
                <input
                  id="input-withdraw-name"
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder={profile?.display_name || "Jina la mpokeaji"}
                />
              </div>

              {errorMsg && (
                <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 12, fontWeight: 600 }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              {statusMsg && (
                <div style={{ color: "#18a66a", fontSize: 13, marginBottom: 12, fontWeight: 700 }}>
                  {statusMsg}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  className="button button-soft"
                  onClick={() => setModalMode(null)}
                  style={{ flex: 1 }}
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={busy}
                  style={{ flex: 2 }}
                >
                  {busy ? "Inatuma pesa..." : `Thibitisha Kutoa TZS ${Number(amount || 0).toLocaleString()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* Direct Messages View with Live Realtime Chat, Typing Indicators, Media & Calling */
function Messages({ profile, lang, onStartCall }) {
  const t = useTranslation(lang);
  const isSw = lang === "sw";
  const [term, setTerm] = useState("");
  const [people, setPeople] = useState([]);
  const [person, setPerson] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [uploadingChatImg, setUploadingChatImg] = useState(false);
  const chatEndRef = useRef(null);
  const chatFileInputRef = useRef(null);
  const typingTimerRef = useRef(null);

  const search = async (e) => {
    const value = e.target.value;
    setTerm(value);
    if (value.length > 1) setPeople(await searchProfiles(value));
    else setPeople([]);
  };

  const open = async (nextPerson) => {
    setPerson(nextPerson);
    setPeople([]);
    setTerm("");
    setIsOtherTyping(false);
    try {
      const id = await findOrCreateDirectConversation(profile.id, nextPerson.id);
      setConversationId(id);
      const msgs = await getMessages(id);
      setMessages(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setMessage(err.message);
    }
  };

  useEffect(() => {
    if (!conversationId) return;
    return subscribeToConversation(
      conversationId,
      (payload) => {
        setMessages((current) => (current.some((m) => m.id === payload.new.id) ? current : [...current, payload.new]));
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      },
      (payload) => {
        if (payload.new?.signal_type === "typing" && payload.new?.sender_id !== profile.id) {
          setIsOtherTyping(true);
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setIsOtherTyping(false), 2500);
        } else if (payload.new?.signal_type === "offer" || payload.new?.signal_type === "ringing") {
          if (onStartCall && payload.new?.recipient_id === profile.id) {
            onStartCall(person, payload.new?.payload?.type || "audio", true, conversationId);
          }
        }
      }
    );
  }, [conversationId, person, profile.id, onStartCall]);

  const handleInputChange = (e) => {
    setBody(e.target.value);
    if (conversationId && person) {
      sendCallSignal(conversationId, profile.id, person.id, "typing", {}).catch(() => {});
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim() || !conversationId) return;
    const text = body.trim();
    setBody("");
    try {
      const sent = await sendMessage(conversationId, profile.id, text);
      setMessages((current) => (current.some((m) => m.id === sent.id) ? current : [...current, sent]));
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleChatImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;
    setUploadingChatImg(true);
    try {
      const url = await uploadImage(profile.id, file, "post-media");
      const sent = await sendMessage(conversationId, profile.id, "", url);
      setMessages((current) => (current.some((m) => m.id === sent.id) ? current : [...current, sent]));
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setUploadingChatImg(false);
      if (chatFileInputRef.current) chatFileInputRef.current.value = "";
    }
  };

  return (
    <div className="feature-shell" id="messages-view">
      <div className="feature-top-banner">
        <div>
          <p className="eyebrow">{t.messagesEyebrow}</p>
          <h1 style={{ fontSize: 32, margin: "6px 0 10px" }}>{t.messagesTitle}</h1>
        </div>
      </div>

      <div className="messages-box">
        <aside className="messages-contacts-pane">
          <input
            style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", outline: "none", fontSize: 13 }}
            value={term}
            onChange={search}
            placeholder={t.searchChatPlaceholder}
            id="input-search-chats"
          />
          {people.map((p) => (
            <button
              key={p.id}
              className="suggestion-row"
              style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "8px 4px", borderRadius: 10 }}
              onClick={() => open(p)}
              id={`contact-item-${p.id}`}
            >
              <Avatar name={p.display_name} avatarUrl={p.avatar_url} size="sm" />
              <div className="suggestion-info">
                <span className="suggestion-name">{p.display_name}</span>
                <span className="suggestion-handle">@{p.username}</span>
              </div>
            </button>
          ))}
          {!people.length && <p className="muted" style={{ fontSize: 12, padding: "8px 4px" }}>{t.chatHint}</p>}
        </aside>

        <section className="conversation-chat-pane">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {person ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={person.display_name} avatarUrl={person.avatar_url} size="sm" />
                  <div>
                    <strong>{person.display_name}</strong>
                    <small className="muted" style={{ display: "block" }}>
                      @{person.username} • <span style={{ color: "#10b981", fontWeight: 600 }}>● {isSw ? "Mtandaoni" : "Online"}</span>
                    </small>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="button button-soft"
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "8px 14px" }}
                    onClick={() => onStartCall && onStartCall(person, "audio", false, conversationId)}
                    id="btn-voice-call"
                  >
                    🎙️ {isSw ? "Sauti" : "Voice"}
                  </button>
                  <button
                    type="button"
                    className="button button-primary"
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "8px 14px" }}
                    onClick={() => onStartCall && onStartCall(person, "video", false, conversationId)}
                    id="btn-video-call"
                  >
                    📹 {isSw ? "Video" : "Video"}
                  </button>
                </div>
              </>
            ) : (
              <p className="muted">{t.choosePersonHint}</p>
            )}
          </div>

          <div className="chat-messages-container">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`msg-bubble ${m.sender_id === profile.id ? "outgoing" : "incoming"}`}
              >
                {m.media_url && (
                  <img src={m.media_url} alt="Attachment" className="msg-bubble-media" />
                )}
                {m.body && <div>{m.body}</div>}
                <small style={{ display: "block", fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </small>
              </div>
            ))}
            {isOtherTyping && (
              <div className="chat-typing-indicator" id="chat-typing-indicator">
                <span>✍️ {person?.display_name} {isSw ? "anaandika..." : "is typing..."}</span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {person && (
            <form onSubmit={send} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderTop: "1px solid var(--line)" }} id="form-chat-send">
              <input
                type="file"
                accept="image/*"
                ref={chatFileInputRef}
                onChange={handleChatImageUpload}
                style={{ display: "none" }}
              />
              <button
                type="button"
                className="button button-soft"
                style={{ padding: "10px 14px", borderRadius: 12 }}
                onClick={() => chatFileInputRef.current?.click()}
                disabled={uploadingChatImg}
                title={isSw ? "Ambatisha picha" : "Attach photo"}
                id="btn-attach-chat-img"
              >
                {uploadingChatImg ? "⏳" : "📷"}
              </button>
              <input
                style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", outline: "none" }}
                value={body}
                onChange={handleInputChange}
                placeholder={t.typePrivateMsg}
                id="input-chat-message"
              />
              <button type="submit" className="button button-primary" id="btn-send-message">
                {t.send}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

/* Notifications View */
function Notifications({ items, userId, onRead, lang }) {
  const t = useTranslation(lang);
  useEffect(() => {
    onRead();
  }, []);

  const copy = {
    like: t.notifLike,
    comment: t.notifComment,
    follow: t.notifFollow,
    post_kick: t.notifKick,
    status_like: t.notifStatusLike,
    status_comment: t.notifStatusComment,
    status_kick: t.notifStatusKick
  };

  return (
    <div className="feature-shell" id="notifications-view">
      <div className="feature-top-banner">
        <div>
          <p className="eyebrow">{t.liveActivity}</p>
          <h1 style={{ fontSize: 32, margin: "6px 0 10px" }}>{t.yourNotifications}</h1>
        </div>
      </div>

      <div className="glass-card">
        {items.length > 0 ? (
          items.map((n) => (
            <article
              key={n.id}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid var(--line)", opacity: n.read_at ? 0.75 : 1 }}
            >
              <Avatar name={n.actor?.display_name || "Member"} avatarUrl={n.actor?.avatar_url} size="sm" />
              <div style={{ flex: 1 }}>
                <strong>{n.actor?.display_name || "Circle Member"}</strong>{" "}
                <span className="muted">{copy[n.type] || t.notifDefault}</span>
                <small className="muted" style={{ display: "block", fontSize: 11, marginTop: 4 }}>
                  {new Date(n.created_at).toLocaleString()}
                </small>
              </div>
              {!n.read_at && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)" }} />}
            </article>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <span style={{ fontSize: 40, display: "block", marginBottom: 10 }}>🔔</span>
            <h3>{t.noNotifications}</h3>
            <p className="muted">{t.noNotificationsDesc}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* Master Settings View */
function Settings({ profile, setProfile, dark, setDark, lang, setLang, passcodeEnabled, setPasscodeEnabled, passcodePin, setPasscodePin, onLockApp, onShowToast }) {
  const t = useTranslation(lang);
  const [activeTab, setActiveTab] = useState("telegram");
  const [saved, setSaved] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [phone, setPhone] = useState("+255 754 000 111");

  // Telegram Privacy & Security states
  const [pinChangeOpen, setPinChangeOpen] = useState(false);
  const [newPinInput, setNewPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [autoLockDuration, setAutoLockDuration] = useState("5m");
  const [cloudPassword, setCloudPassword] = useState("");
  const [cloudHint, setCloudHint] = useState("");
  const [cloudEmail, setCloudEmail] = useState(profile?.email || "vukangtech@gmail.com");
  const [cloud2FASaved, setCloud2FASaved] = useState(false);
  const [autoDeleteTimer, setAutoDeleteTimer] = useState("off");

  // Telegram Granular Matrix
  const [tgPhoneVisibility, setTgPhoneVisibility] = useState("nobody");
  const [tgFindMeByPhone, setTgFindMeByPhone] = useState("contacts");
  const [tgLastSeen, setTgLastSeen] = useState("nobody");
  const [tgProfilePhoto, setTgProfilePhoto] = useState("contacts");
  const [tgForwardLink, setTgForwardLink] = useState("nobody");
  const [tgP2PCalls, setTgP2PCalls] = useState("contacts");
  const [tgGroupInvites, setTgGroupInvites] = useState("contacts");
  const [tgAccountSelfDestruct, setTgAccountSelfDestruct] = useState("6m");

  // Active Sessions
  const [sessions, setSessions] = useState([
    { id: "s1", current: true, device: "Chrome 128 · macOS Sonoma", ip: "197.250.88.12", location: "Dar es Salaam, Tanzania", active: "Mtandaoni Sasa" },
    { id: "s2", current: false, device: "THE CIRCLE Android App (Samsung Galaxy S24)", ip: "197.250.88.45", location: "Arusha, Tanzania", active: "Masaa 2 yaliyopita" },
    { id: "s3", current: false, device: "THE CIRCLE Desktop · Windows 11", ip: "102.129.64.10", location: "Nairobi, Kenya", active: "Jana" }
  ]);

  // Security states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactor, setTwoFactor] = useState(true);
  const [passwordMsg, setPasswordMsg] = useState("");

  // Privacy states
  const [privateAccount, setPrivateAccount] = useState(false);
  const [activeStatus, setActiveStatus] = useState(true);
  const [directMessages, setDirectMessages] = useState("everyone");
  const [storyPrivacy, setStoryPrivacy] = useState("everyone");
  const [searchIndexing, setSearchIndexing] = useState(true);

  // Notifications states
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [likeNotifs, setLikeNotifs] = useState(true);
  const [commentNotifs, setCommentNotifs] = useState(true);
  const [dmNotifs, setDmNotifs] = useState(true);

  // Moderation states
  const [blockedUsers, setBlockedUsers] = useState([
    { id: "b1", username: "spambot_east", name: "Spam Bot 01" },
    { id: "b2", username: "ad_tracker_bot", name: "Commercial Spam" }
  ]);
  const [newBlockInput, setNewBlockInput] = useState("");
  const [mutedWords, setMutedWords] = useState(["matusi", "utapeli", "scam", "takataka", "betting"]);
  const [newMutedInput, setNewMutedInput] = useState("");
  const [sensitiveFilter, setSensitiveFilter] = useState(true);

  // Data & Storage states
  const [archiveRequested, setArchiveRequested] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleSaveAll = () => {
    if (setProfile && profile) {
      setProfile({
        ...profile,
        display_name: displayName,
        bio: bio
      });
    }
    setSaved(true);
    if (onShowToast) {
      onShowToast(lang === "sw" ? "✓ Mipangilio yote imehifadhiwa salama!" : "✓ All settings saved securely!");
    }
    setTimeout(() => setSaved(false), 4000);
  };

  const handleSetNewPin = (e) => {
    e.preventDefault();
    setPinError("");
    if (!/^\d{4}$/.test(newPinInput)) {
      setPinError(lang === "sw" ? "PIN lazima iwe nambari 4 kamili." : "PIN must be exactly 4 digits.");
      return;
    }
    if (setPasscodePin) setPasscodePin(newPinInput);
    setPinChangeOpen(false);
    setNewPinInput("");
    if (onShowToast) {
      onShowToast(lang === "sw" ? "✓ Msimbo wa siri wa PIN umebadilishwa kikamilifu!" : "✓ Passcode PIN updated successfully!");
    }
  };

  const handleTerminateOtherSessions = () => {
    setSessions(sessions.filter((s) => s.current));
    if (onShowToast) {
      onShowToast(lang === "sw" ? "✓ Vifaa vyote vingine vimeondolewa kwenye akaunti yako!" : "✓ Terminated all other active device sessions!");
    }
  };

  const handleSaveCloud2FA = (e) => {
    e.preventDefault();
    if (cloudPassword.length < 6) {
      if (onShowToast) onShowToast(lang === "sw" ? "Nenosiri la wingu lazima liwe na herufi 6 au zaidi." : "Cloud password must be at least 6 characters.");
      return;
    }
    setCloud2FASaved(true);
    if (onShowToast) {
      onShowToast(lang === "sw" ? "✓ Uthibitishaji wa hatua 2 wa Telegram umewezeshwa!" : "✓ Telegram Two-Step Verification cloud password set!");
    }
    setTimeout(() => setCloud2FASaved(false), 5000);
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg(lang === "sw" ? "Nenosiri jipya lazima liwe na herufi 6 au zaidi." : "Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg(lang === "sw" ? "Manenosiri hayafanani." : "Passwords do not match.");
      return;
    }
    setPasswordMsg(lang === "sw" ? "Nenosiri limesasishwa salama!" : "Password successfully updated!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordMsg(""), 4000);
  };

  const handleAddBlock = (e) => {
    e.preventDefault();
    if (!newBlockInput.trim()) return;
    const clean = newBlockInput.trim().toLowerCase().replace("@", "");
    setBlockedUsers([...blockedUsers, { id: Date.now().toString(), username: clean, name: clean }]);
    setNewBlockInput("");
  };

  const handleUnblock = (id) => {
    setBlockedUsers(blockedUsers.filter((u) => u.id !== id));
  };

  const handleAddMutedWord = (e) => {
    e.preventDefault();
    if (!newMutedInput.trim()) return;
    const word = newMutedInput.trim().toLowerCase();
    if (!mutedWords.includes(word)) {
      setMutedWords([...mutedWords, word]);
    }
    setNewMutedInput("");
  };

  const handleRemoveMutedWord = (wordToRemove) => {
    setMutedWords(mutedWords.filter((w) => w !== wordToRemove));
  };

  const tabs = [
    { id: "telegram", label: t.settingsTabTelegram, icon: "✈️" },
    { id: "account", label: t.settingsTabAccount, icon: "👤" },
    { id: "security", label: t.settingsTabSecurity, icon: "🔒" },
    { id: "privacy", label: t.settingsTabPrivacy, icon: "👁️" },
    { id: "notifications", label: t.settingsTabNotifications, icon: "🔔" },
    { id: "moderation", label: t.settingsTabModeration, icon: "🛡️" },
    { id: "language", label: t.settingsTabLanguage, icon: "🌐" },
    { id: "data", label: t.settingsTabData, icon: "💾" }
  ];

  return (
    <div className="feature-shell" id="settings-view">
      <div className="feature-top-banner">
        <div>
          <p className="eyebrow">{t.settingsEyebrow}</p>
          <h1 style={{ fontSize: 32, margin: "6px 0 10px" }}>{t.settingsTitle}</h1>
          <p className="muted">{t.settingsDesc}</p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="settings-tabs-scroll" id="settings-tab-list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            id={`tab-btn-${tab.id}`}
            className={`settings-tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB: Telegram Privacy & Security Suite */}
      {activeTab === "telegram" && (
        <div className="settings-group-card" id="settings-panel-telegram">
          <div className="tg-security-banner">
            <div className="tg-security-badge-icon">✈️</div>
            <div>
              <h3 style={{ fontSize: 20, margin: "0 0 6px", color: "var(--ink-heading)" }}>
                {lang === "sw" ? "Ulinzi na Faragha ya Kiwango cha Telegram" : "Telegram-Grade Privacy & Security Suite"}
              </h3>
              <p className="muted" style={{ fontSize: 13, margin: 0, maxWidth: 640, lineHeight: 1.6 }}>
                {lang === "sw"
                  ? "Ulinzi mkali usio na uvunjifu: Msimbo wa PIN wa kufunga programu mara moja, manenosiri ya wingu ya 2FA, kufuta mazungumzo kiotomatiki (auto-delete), kuzuia namba na usimbaji fiche wa E2EE."
                  : "Zero-compromise privacy architecture: Local 4-digit App Passcode Lock, Cloud 2-Step Verification, self-destructing auto-delete message timers, stealth matrix, and end-to-end cryptographic safeguards."}
              </p>
            </div>
          </div>

          {/* Section 1: Telegram Passcode Lock */}
          <div className="settings-subgroup">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <div>
                <strong style={{ fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🔒</span> {t.telegramPasscodeTitle}
                </strong>
                <p className="muted" style={{ fontSize: 13, margin: "4px 0 0", maxWidth: 520 }}>
                  {t.telegramPasscodeDesc}
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  id="toggle-telegram-passcode"
                  checked={passcodeEnabled}
                  onChange={(e) => {
                    const nextVal = e.target.checked;
                    if (setPasscodeEnabled) setPasscodeEnabled(nextVal);
                    if (onShowToast) {
                      onShowToast(nextVal ? (lang === "sw" ? "✓ Msimbo wa PIN umewashwa!" : "✓ Passcode Lock enabled!") : (lang === "sw" ? "Msimbo wa PIN umezimwa" : "Passcode Lock disabled"));
                    }
                  }}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {passcodeEnabled && (
              <div style={{ marginTop: 18, padding: "16px", borderRadius: 14, background: "var(--card-hover)", border: "1px solid var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {lang === "sw" ? "HALI YA PIN" : "PIN STATUS"}
                    </span>
                    <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 600 }}>
                      •••• ({lang === "sw" ? "Nambari 4 za siri zimewekwa" : "4-Digit PIN configured"})
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      className="button button-soft"
                      onClick={() => setPinChangeOpen(!pinChangeOpen)}
                    >
                      ✏️ {t.telegramChangePin}
                    </button>
                    <button
                      type="button"
                      id="btn-trigger-lock-now"
                      className="button button-primary"
                      onClick={onLockApp}
                    >
                      🔒 {t.telegramLockNow}
                    </button>
                  </div>
                </div>

                {pinChangeOpen && (
                  <form onSubmit={handleSetNewPin} style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      type="password"
                      maxLength={4}
                      pattern="[0-9]{4}"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value)}
                      placeholder="1234"
                      style={{ width: 120, textAlign: "center", letterSpacing: 6, fontSize: 18, padding: "8px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)" }}
                    />
                    <button type="submit" className="button button-primary">
                      {lang === "sw" ? "Hifadhi PIN Mpya" : "Save New PIN"}
                    </button>
                    <button type="button" className="text-button" onClick={() => setPinChangeOpen(false)}>
                      {lang === "sw" ? "Ghairi" : "Cancel"}
                    </button>
                    {pinError && <span style={{ color: "#ef4444", fontSize: 12 }}>{pinError}</span>}
                  </form>
                )}

                <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>{t.telegramAutoLock}</label>
                  <select
                    value={autoLockDuration}
                    onChange={(e) => setAutoLockDuration(e.target.value)}
                    style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", fontSize: 13 }}
                  >
                    <option value="immediate">{t.telegramAutoLockImmediate}</option>
                    <option value="1m">{t.telegramAutoLock1m}</option>
                    <option value="5m">{t.telegramAutoLock5m}</option>
                    <option value="1h">{t.telegramAutoLock1h}</option>
                    <option value="off">{t.telegramAutoLockOff}</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Two-Step Cloud Verification (Telegram 2FA) */}
          <div className="settings-subgroup">
            <strong style={{ fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🔐</span> {t.telegramTwoStepTitle}
            </strong>
            <p className="muted" style={{ fontSize: 13, margin: "4px 0 16px" }}>
              {t.telegramTwoStepDesc}
            </p>

            <form onSubmit={handleSaveCloud2FA} className="settings-two-step-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>{t.telegramCloudPassword}</label>
                  <input
                    type="password"
                    value={cloudPassword}
                    onChange={(e) => setCloudPassword(e.target.value)}
                    placeholder="••••••••••••"
                  />
                </div>
                <div className="form-group">
                  <label>{t.telegramPasswordHint}</label>
                  <input
                    type="text"
                    value={cloudHint}
                    onChange={(e) => setCloudHint(e.target.value)}
                    placeholder={lang === "sw" ? "mfano: Jina la mbwa wangu wa utotoni" : "e.g. My childhood pet"}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 12 }}>
                <label>{t.telegramRecoveryEmail}</label>
                <input
                  type="email"
                  value={cloudEmail}
                  onChange={(e) => setCloudEmail(e.target.value)}
                  placeholder="vukangtech@gmail.com"
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
                <button type="submit" className="button button-primary">
                  {lang === "sw" ? "Washa Nenosiri la Wingu" : "Enable Cloud Password"}
                </button>
                {cloud2FASaved && (
                  <span style={{ color: "var(--primary)", fontWeight: 700, fontSize: 13 }}>
                    ✓ {lang === "sw" ? "2FA ya Wingu imewezeshwa!" : "Cloud 2FA Active!"}
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Section 3: Auto-Delete Messages Timer */}
          <div className="settings-subgroup">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <strong style={{ fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>⏳</span> {t.telegramAutoDelete}
                </strong>
                <p className="muted" style={{ fontSize: 13, margin: "4px 0 0", maxWidth: 500 }}>
                  {t.telegramAutoDeleteDesc}
                </p>
              </div>

              <select
                value={autoDeleteTimer}
                onChange={(e) => {
                  setAutoDeleteTimer(e.target.value);
                  if (onShowToast) onShowToast(lang === "sw" ? `Kipima muda cha kufuta ujumbe kimesasishwa: ${e.target.value}` : `Auto-delete timer set to: ${e.target.value}`);
                }}
                style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", fontWeight: 600 }}
              >
                <option value="off">{t.telegramAutoDeleteOff}</option>
                <option value="24h">{t.telegramAutoDelete24h}</option>
                <option value="7d">{t.telegramAutoDelete7d}</option>
                <option value="1m">{t.telegramAutoDelete1m}</option>
              </select>
            </div>
          </div>

          {/* Section 4: Telegram Granular Stealth Matrix */}
          <div className="settings-subgroup">
            <strong style={{ fontSize: 16, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span>👁️</span> {lang === "sw" ? "Mfumo wa Kina wa Faragha ya Mawasiliano (Stealth Matrix)" : "Granular Stealth Visibility Matrix"}
            </strong>

            <div style={{ display: "grid", gap: 14 }}>
              {/* Phone Visibility */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 12, background: "var(--card-hover)" }}>
                <div>
                  <strong style={{ fontSize: 14 }}>{t.telegramPhoneNumber}</strong>
                  <p className="muted" style={{ fontSize: 12, margin: 0 }}>{lang === "sw" ? "Nani anaweza kuona nambari yako ya simu" : "Who can see my phone number"}</p>
                </div>
                <select
                  value={tgPhoneVisibility}
                  onChange={(e) => setTgPhoneVisibility(e.target.value)}
                  style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", fontSize: 13 }}
                >
                  <option value="everybody">{t.telegramEverybody}</option>
                  <option value="contacts">{t.telegramMyContacts}</option>
                  <option value="nobody">{t.telegramNobody}</option>
                </select>
              </div>

              {/* Who can find me by phone */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 12, background: "var(--card-hover)" }}>
                <div>
                  <strong style={{ fontSize: 14 }}>{t.telegramWhoCanFindMe}</strong>
                  <p className="muted" style={{ fontSize: 12, margin: 0 }}>{lang === "sw" ? "Kutafutwa kwa nambari ya simu" : "Finding account by phone number"}</p>
                </div>
                <select
                  value={tgFindMeByPhone}
                  onChange={(e) => setTgFindMeByPhone(e.target.value)}
                  style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", fontSize: 13 }}
                >
                  <option value="everybody">{t.telegramEverybody}</option>
                  <option value="contacts">{t.telegramMyContacts}</option>
                </select>
              </div>

              {/* Last seen & online */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 12, background: "var(--card-hover)" }}>
                <div>
                  <strong style={{ fontSize: 14 }}>{t.telegramLastSeen}</strong>
                  <p className="muted" style={{ fontSize: 12, margin: 0 }}>{lang === "sw" ? "Mwisho kuonekana na hali ya mtandaoni" : "Last seen timestamp and online status"}</p>
                </div>
                <select
                  value={tgLastSeen}
                  onChange={(e) => setTgLastSeen(e.target.value)}
                  style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", fontSize: 13 }}
                >
                  <option value="everybody">{t.telegramEverybody}</option>
                  <option value="contacts">{t.telegramMyContacts}</option>
                  <option value="nobody">{t.telegramNobody}</option>
                </select>
              </div>

              {/* Profile photos */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 12, background: "var(--card-hover)" }}>
                <div>
                  <strong style={{ fontSize: 14 }}>{t.telegramProfilePhotos}</strong>
                  <p className="muted" style={{ fontSize: 12, margin: 0 }}>{lang === "sw" ? "Nani anaweza kuona picha yako ya wasifu" : "Who can see profile photos"}</p>
                </div>
                <select
                  value={tgProfilePhoto}
                  onChange={(e) => setTgProfilePhoto(e.target.value)}
                  style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", fontSize: 13 }}
                >
                  <option value="everybody">{t.telegramEverybody}</option>
                  <option value="contacts">{t.telegramMyContacts}</option>
                </select>
              </div>

              {/* Forwarded messages link */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 12, background: "var(--card-hover)" }}>
                <div>
                  <strong style={{ fontSize: 14 }}>{t.telegramForwardedMessages}</strong>
                  <p className="muted" style={{ fontSize: 12, margin: 0 }}>{lang === "sw" ? "Kiungo cha akaunti kwenye ujumbe uliosambazwa" : "Account link on forwarded messages"}</p>
                </div>
                <select
                  value={tgForwardLink}
                  onChange={(e) => setTgForwardLink(e.target.value)}
                  style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", fontSize: 13 }}
                >
                  <option value="everybody">{t.telegramEverybody}</option>
                  <option value="contacts">{t.telegramMyContacts}</option>
                  <option value="nobody">{t.telegramNobody}</option>
                </select>
              </div>

              {/* P2P Calls */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 12, background: "var(--card-hover)" }}>
                <div>
                  <strong style={{ fontSize: 14 }}>{t.telegramCallsP2P}</strong>
                  <p className="muted" style={{ fontSize: 12, margin: 0 }}>{lang === "sw" ? "Simu za moja kwa moja (huficha anwani ya IP)" : "Peer-to-peer calls (masks IP address)"}</p>
                </div>
                <select
                  value={tgP2PCalls}
                  onChange={(e) => setTgP2PCalls(e.target.value)}
                  style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", fontSize: 13 }}
                >
                  <option value="always">{t.telegramCallsAlways}</option>
                  <option value="contacts">{t.telegramCallsContacts}</option>
                  <option value="never">{t.telegramCallsNever}</option>
                </select>
              </div>

              {/* Groups & Channels Invites */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 12, background: "var(--card-hover)" }}>
                <div>
                  <strong style={{ fontSize: 14 }}>{t.telegramGroupsChannels}</strong>
                  <p className="muted" style={{ fontSize: 12, margin: 0 }}>{lang === "sw" ? "Nani anaweza kukuongeza kwenye makundi" : "Who can add me to groups and channels"}</p>
                </div>
                <select
                  value={tgGroupInvites}
                  onChange={(e) => setTgGroupInvites(e.target.value)}
                  style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", fontSize: 13 }}
                >
                  <option value="everybody">{t.telegramEverybody}</option>
                  <option value="contacts">{t.telegramMyContacts}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Active Telegram Sessions & Devices */}
          <div className="settings-subgroup">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
              <div>
                <strong style={{ fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>📱</span> {t.telegramActiveSessions}
                </strong>
                <p className="muted" style={{ fontSize: 13, margin: "4px 0 0" }}>
                  {lang === "sw" ? "Vifaa vyote vilivyounganishwa kwenye akaunti yako ya THE CIRCLE" : "Devices currently authenticated with your THE CIRCLE account"}
                </p>
              </div>
              <button
                type="button"
                id="btn-terminate-all-sessions"
                className="button button-soft"
                style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}
                onClick={handleTerminateOtherSessions}
              >
                🚫 {t.telegramTerminateAll}
              </button>
            </div>

            <div className="telegram-sessions-list">
              {sessions.map((s) => (
                <div key={s.id} className={`telegram-session-item ${s.current ? "current-device" : ""}`}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--card-bg)", display: "grid", placeItems: "center", fontSize: 20 }}>
                      {s.device.includes("Android") ? "📱" : s.device.includes("macOS") ? "💻" : "🖥️"}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <strong style={{ fontSize: 14 }}>{s.device}</strong>
                        {s.current && (
                          <span style={{ fontSize: 11, background: "rgba(16,185,129,0.15)", color: "#10b981", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
                            {lang === "sw" ? "Kifaa Hiki" : "Current Session"}
                          </span>
                        )}
                      </div>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {s.ip} · {s.location} · {s.active}
                      </span>
                    </div>
                  </div>
                  {!s.current && (
                    <button
                      type="button"
                      className="text-button"
                      style={{ color: "#ef4444", fontSize: 12 }}
                      onClick={() => setSessions(sessions.filter((x) => x.id !== s.id))}
                    >
                      {lang === "sw" ? "Ondoa" : "Terminate"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Account Self-Destruct */}
          <div className="settings-subgroup">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <strong style={{ fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>💣</span> {t.telegramDeleteAccountIfAway}
                </strong>
                <p className="muted" style={{ fontSize: 13, margin: "4px 0 0", maxWidth: 500 }}>
                  {lang === "sw"
                    ? "Akaunti yako, ujumbe na maudhui yote yatafutika kiotomatiki ikiwa hutaingia mtandaoni kwa muda uliouchagua."
                    : "If you don't come online at least once within this period, your account will be self-destructed."}
                </p>
              </div>
              <select
                value={tgAccountSelfDestruct}
                onChange={(e) => setTgAccountSelfDestruct(e.target.value)}
                style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", fontWeight: 600 }}
              >
                <option value="1m">{t.telegramSelfDestruct1m}</option>
                <option value="3m">{t.telegramSelfDestruct3m}</option>
                <option value="6m">{t.telegramSelfDestruct6m}</option>
                <option value="1y">{t.telegramSelfDestruct1y}</option>
              </select>
            </div>
          </div>

          {/* Section 7: End-to-End Encryption Verification */}
          <div className="settings-subgroup" style={{ background: "rgba(2,132,199,0.06)", border: "1px solid rgba(2,132,199,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 32 }}>🛡️</div>
              <div>
                <strong style={{ fontSize: 15, color: "#0284c7" }}>
                  {lang === "sw" ? "Usimbaji Fiche wa Mwisho hadi Mwisho (Secret Chat Protocol)" : "End-to-End Encryption Protocol"}
                </strong>
                <p className="muted" style={{ fontSize: 13, margin: "4px 0 8px" }}>
                  {lang === "sw"
                    ? "Alama ya kipekee ya ulinzi wa kidijitali (Visual Key Fingerprint):"
                    : "Cryptographic visual encryption fingerprint:"}
                </p>
                <div style={{ display: "inline-flex", gap: 10, padding: "6px 14px", borderRadius: 10, background: "var(--card-bg)", border: "1px solid var(--line)", fontSize: 20 }}>
                  <span>🦁</span>
                  <span>🛡️</span>
                  <span>💎</span>
                  <span>⚡</span>
                </div>
                <small className="muted" style={{ display: "block", marginTop: 6, fontSize: 11 }}>
                  AES-256-GCM / Diffie-Hellman Key Exchange · Zero Knowledge Verified
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: Account */}
      {activeTab === "account" && (
        <div className="settings-group-card" id="settings-panel-account">
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>👤 {t.settingsTabAccount}</h3>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>{t.displayName}</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Amina Juma"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>{t.username}</label>
            <input
              type="text"
              value={username}
              disabled
              style={{ opacity: 0.7, cursor: "not-allowed" }}
            />
            <span className="muted" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
              {lang === "sw" ? "Jina la kipekee (@username) haliwezi kubadilishwa bila idhini ya usalama." : "Unique username cannot be changed without security verification."}
            </span>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>{t.bio}</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder={lang === "sw" ? "Eleza kidogo kukuhusu..." : "Tell the circle a bit about yourself..."}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label>{lang === "sw" ? "Nambari ya Simu ya Uokoaji" : "Recovery Phone Number"}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: "var(--primary-soft)", border: "1px solid var(--line)" }}>
            <span style={{ fontSize: 20 }}>✦</span>
            <div>
              <strong style={{ fontSize: 14, color: "var(--primary)" }}>{t.dashVerifiedMember}</strong>
              <p className="muted" style={{ fontSize: 12 }}>{lang === "sw" ? "Akaunti yako imeidhinishwa na kukaguliwa kikamilifu." : "Your account is fully verified and recognized."}</p>
            </div>
          </div>

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid rgba(239, 68, 68, 0.2)" }}>
            <h4 style={{ color: "#ef4444", fontSize: 15, marginBottom: 6 }}>⚠️ {t.settingsDeleteAccountLabel}</h4>
            <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>{t.settingsDeleteAccountSub}</p>
            <button
              type="button"
              className="text-button"
              style={{ color: "#ef4444", border: "1px solid #ef4444", padding: "8px 16px", borderRadius: 10, fontWeight: 700 }}
              onClick={() => alert(lang === "sw" ? "Ili kufuta akaunti, tafadhali thibitisha kupitia barua pepe yako au wasiliana na Kituo cha Msaada." : "To delete your account, please verify via email link or contact Support.")}
            >
              {t.settingsDeleteAccountBtn}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: Security & Login */}
      {activeTab === "security" && (
        <div className="settings-group-card" id="settings-panel-security">
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>🔒 {t.settingsTabSecurity}</h3>

          <form onSubmit={handlePasswordUpdate} style={{ marginBottom: 28 }}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>{lang === "sw" ? "Nenosiri la Sasa" : "Current Password"}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>{lang === "sw" ? "Nenosiri Jipya" : "New Password"}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>{lang === "sw" ? "Rudia Nenosiri Jipya" : "Confirm New Password"}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="button button-primary">
              {lang === "sw" ? "Sasisha Nenosiri" : "Update Password"}
            </button>
            {passwordMsg && <p style={{ color: "var(--primary)", marginTop: 10, fontWeight: 600 }}>{passwordMsg}</p>}
          </form>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">
                <span>🛡️</span>
                <span>{t.settingsTwoFactorLabel}</span>
              </div>
              <div className="settings-row-desc">{t.settingsTwoFactorSub}</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={twoFactor}
                onChange={(e) => setTwoFactor(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div style={{ marginTop: 24 }}>
            <div className="settings-row-title" style={{ marginBottom: 8 }}>
              <span>💻</span>
              <span>{t.settingsSessionsLabel}</span>
            </div>
            <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>{t.settingsSessionsSub}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 10, background: "var(--primary-soft)", border: "1px solid var(--line)" }}>
                <div>
                  <strong style={{ fontSize: 14 }}>Chrome on macOS · Dar es Salaam, TZ</strong>
                  <p className="muted" style={{ fontSize: 12 }}>{lang === "sw" ? "Kifaa cha sasa · Mtandaoni sasa" : "Current device · Active now"}</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--primary)" }}>ACTIVE</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 10, background: "var(--card-bg)", border: "1px solid var(--line)" }}>
                <div>
                  <strong style={{ fontSize: 14 }}>The Circle App · Samsung Galaxy S24</strong>
                  <p className="muted" style={{ fontSize: 12 }}>{lang === "sw" ? "Masaa 2 yaliyopita · Arusha, TZ" : "2 hours ago · Arusha, TZ"}</p>
                </div>
                <button
                  type="button"
                  className="text-button"
                  style={{ color: "#ef4444", fontSize: 12 }}
                  onClick={() => alert(lang === "sw" ? "Kifaa kimeondolewa!" : "Device logged out!")}
                >
                  {lang === "sw" ? "Toa" : "Revoke"}
                </button>
              </div>
            </div>

            <button
              type="button"
              className="text-button"
              style={{ marginTop: 14, color: "#ef4444", fontWeight: 700 }}
              onClick={() => alert(lang === "sw" ? "Vifaa vyote vingine vimeondolewa salama!" : "All other devices have been logged out!")}
            >
              🚪 {t.settingsLogOutAllDevices}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Privacy & Visibility */}
      {activeTab === "privacy" && (
        <div className="settings-group-card" id="settings-panel-privacy">
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>👁️ {t.settingsTabPrivacy}</h3>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">{t.settingsPrivateLabel}</div>
              <div className="settings-row-desc">{t.settingsPrivateSub}</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={privateAccount}
                onChange={(e) => setPrivateAccount(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">{t.settingsActiveStatusLabel}</div>
              <div className="settings-row-desc">{t.settingsActiveStatusSub}</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={activeStatus}
                onChange={(e) => setActiveStatus(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">{t.settingsDirectMessagesLabel}</div>
              <div className="settings-row-desc">{t.settingsDirectMessagesSub}</div>
            </div>
            <select
              value={directMessages}
              onChange={(e) => setDirectMessages(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, background: "var(--input-bg)", color: "var(--ink)", border: "1px solid var(--line)" }}
            >
              <option value="everyone">{t.settingsAllowEveryone}</option>
              <option value="friends">{t.settingsAllowFriendsOnly}</option>
            </select>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">{lang === "sw" ? "Uonekanaji wa Hadithi (Story Privacy)" : "Story & Status Privacy"}</div>
              <div className="settings-row-desc">{lang === "sw" ? "Chagua nani anaweza kutazama hadithi unazoweka" : "Control who can watch your ephemeral stories"}</div>
            </div>
            <select
              value={storyPrivacy}
              onChange={(e) => setStoryPrivacy(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, background: "var(--input-bg)", color: "var(--ink)", border: "1px solid var(--line)" }}
            >
              <option value="everyone">{t.settingsAllowEveryone}</option>
              <option value="friends">{t.settingsAllowFriendsOnly}</option>
            </select>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">{lang === "sw" ? "Uonekanaji kwenye Mitambo ya Utafutaji (SEO)" : "Public Search Indexing"}</div>
              <div className="settings-row-desc">{lang === "sw" ? "Ruhusu au zuia Google kuonyesha wasifu wako wa umma" : "Allow search engines to link to your public profile"}</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={searchIndexing}
                onChange={(e) => setSearchIndexing(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      )}

      {/* TAB 4: Notifications */}
      {activeTab === "notifications" && (
        <div className="settings-group-card" id="settings-panel-notifications">
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>🔔 {t.settingsTabNotifications}</h3>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">{t.settingsEmailLabel}</div>
              <div className="settings-row-desc">{t.settingsEmailSub}</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">{lang === "sw" ? "Arifa za Moja kwa Moja (Push Notifications)" : "Push Notifications"}</div>
              <div className="settings-row-desc">{lang === "sw" ? "Pata mlio au taarifa kwenye simu/kivinjari papo hapo" : "Get immediate alerts on your device"}</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={pushNotifs}
                onChange={(e) => setPushNotifs(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">{lang === "sw" ? "Sauti na Mlio wa Programu" : "App Sounds & Haptics"}</div>
              <div className="settings-row-desc">{lang === "sw" ? "Cheza sauti ndogo unapotuma ujumbe au unapopokea Like" : "Play audio cues for messages and reactions"}</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={soundAlerts}
                onChange={(e) => setSoundAlerts(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">{lang === "sw" ? "Arifa za Likes na Maoni" : "Likes & Comments Alerts"}</div>
              <div className="settings-row-desc">{lang === "sw" ? "Julishwa pale mtu anapopenda au kuandika maoni" : "Notify when someone likes or comments on your post"}</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={likeNotifs}
                onChange={(e) => setLikeNotifs(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">{lang === "sw" ? "Arifa za Ujumbe wa Faragha" : "Direct Message Alerts"}</div>
              <div className="settings-row-desc">{lang === "sw" ? "Julishwa mara moja mtu anapokutumia ujumbe mpya" : "Notify immediately upon receiving private chats"}</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={dmNotifs}
                onChange={(e) => setDmNotifs(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      )}

      {/* TAB 5: Moderation & Safety */}
      {activeTab === "moderation" && (
        <div className="settings-group-card" id="settings-panel-moderation">
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>🛡️ {t.settingsTabModeration}</h3>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">{t.settingsSensitiveContentLabel}</div>
              <div className="settings-row-desc">{t.settingsSensitiveContentSub}</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={sensitiveFilter}
                onChange={(e) => setSensitiveFilter(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {/* Muted Words */}
          <div style={{ padding: "20px 0", borderBottom: "1px solid var(--line)" }}>
            <div className="settings-row-title">{t.settingsMutedWordsLabel}</div>
            <div className="settings-row-desc" style={{ marginBottom: 12 }}>{t.settingsMutedWordsSub}</div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {mutedWords.map((word) => (
                <span
                  key={word}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "var(--primary-soft)", color: "var(--ink)", fontSize: 13, fontWeight: 600 }}
                >
                  #{word}
                  <button
                    type="button"
                    onClick={() => handleRemoveMutedWord(word)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0, fontSize: 14 }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddMutedWord} style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                value={newMutedInput}
                onChange={(e) => setNewMutedInput(e.target.value)}
                placeholder={t.settingsAddMutedWord}
                style={{ flex: 1 }}
              />
              <button type="submit" className="button button-primary">
                {lang === "sw" ? "Ongeza" : "Add"}
              </button>
            </form>
          </div>

          {/* Blocked Accounts */}
          <div style={{ padding: "20px 0" }}>
            <div className="settings-row-title">{t.settingsBlockedAccountsLabel}</div>
            <div className="settings-row-desc" style={{ marginBottom: 14 }}>{t.settingsBlockedAccountsSub}</div>

            <form onSubmit={handleAddBlock} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <input
                type="text"
                value={newBlockInput}
                onChange={(e) => setNewBlockInput(e.target.value)}
                placeholder={lang === "sw" ? "Andika username ya kumzuia (mf. @matusi_user)..." : "Enter username to block (e.g. @spammer)..."}
                style={{ flex: 1 }}
              />
              <button type="submit" className="button" style={{ background: "#ef4444", color: "#fff" }}>
                {lang === "sw" ? "Zuia" : "Block"}
              </button>
            </form>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {blockedUsers.length === 0 ? (
                <p className="muted" style={{ fontSize: 13 }}>{lang === "sw" ? "Hujamzuia mtu yeyote kwa sasa." : "No accounts currently blocked."}</p>
              ) : (
                blockedUsers.map((u) => (
                  <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "var(--card-bg)", border: "1px solid var(--line)" }}>
                    <div>
                      <strong style={{ fontSize: 14 }}>{u.name}</strong>
                      <span className="muted" style={{ fontSize: 12, marginLeft: 8 }}>@{u.username}</span>
                    </div>
                    <button
                      type="button"
                      className="text-button"
                      style={{ color: "var(--primary)", fontSize: 13, fontWeight: 700 }}
                      onClick={() => handleUnblock(u.id)}
                    >
                      {lang === "sw" ? "Ondoa Kizuizi" : "Unblock"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Language & Appearance */}
      {activeTab === "language" && (
        <div className="settings-group-card" id="settings-panel-language">
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>🌐 {t.settingsTabLanguage}</h3>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">{t.settingsLangLabel}</div>
              <div className="settings-row-desc">{t.settingsLangSub}</div>
            </div>
            <LanguageToggle lang={lang} setLang={setLang} />
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">{t.settingsDarkLabel}</div>
              <div className="settings-row-desc">{t.settingsDarkSub}</div>
            </div>
            <ThemeToggle dark={dark} setDark={setDark} />
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">{lang === "sw" ? "Mpangilio Mfupi (Compact Feed)" : "Compact Feed Display"}</div>
              <div className="settings-row-desc">{lang === "sw" ? "Punguza nafasi kati ya machapisho kuona maudhui mengi zaidi" : "Reduce feed whitespace to fit more posts on screen"}</div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      )}

      {/* TAB 7: Data & Storage */}
      {activeTab === "data" && (
        <div className="settings-group-card" id="settings-panel-data">
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>💾 {t.settingsTabData}</h3>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">{t.settingsDownloadDataLabel}</div>
              <div className="settings-row-desc">{t.settingsDownloadDataSub}</div>
            </div>
            <button
              type="button"
              className="button button-primary"
              onClick={() => setArchiveRequested(true)}
            >
              {t.settingsRequestArchiveBtn}
            </button>
          </div>
          {archiveRequested && (
            <p style={{ color: "var(--primary)", margin: "10px 0 20px", fontWeight: 600 }}>
              ✓ {t.settingsArchiveRequested}
            </p>
          )}

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">{t.settingsClearCacheLabel}</div>
              <div className="settings-row-desc">{t.settingsClearCacheSub}</div>
            </div>
            <button
              type="button"
              className="button"
              style={{ background: "var(--card-hover)", border: "1px solid var(--line)" }}
              onClick={() => setCacheCleared(true)}
            >
              {t.settingsClearCacheBtn}
            </button>
          </div>
          {cacheCleared && (
            <p style={{ color: "var(--primary)", margin: "10px 0 20px", fontWeight: 600 }}>
              ✓ {t.settingsCacheCleared}
            </p>
          )}

          <div style={{ marginTop: 24, padding: "16px", borderRadius: 12, background: "var(--primary-soft)", border: "1px solid var(--line)" }}>
            <strong style={{ display: "block", marginBottom: 8 }}>{lang === "sw" ? "Muhtasari wa Hifadhi ya Duara" : "Storage Footprint Breakdown"}</strong>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, fontSize: 13 }}>
              <div>📁 {lang === "sw" ? "Picha na Video:" : "Media cache:"} <strong>42.4 MB</strong></div>
              <div>💬 {lang === "sw" ? "Mazungumzo:" : "Messages:"} <strong>8.1 MB</strong></div>
              <div>⚡ {lang === "sw" ? "Kumbukumbu ya Kazi:" : "Local store:"} <strong>1.9 MB</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* Global Save Button */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20 }}>
        <button
          type="button"
          id="btn-save-master-settings"
          className="button button-primary"
          style={{ padding: "12px 28px", fontSize: 15 }}
          onClick={handleSaveAll}
        >
          ✓ {t.saveSettingsBtn}
        </button>
        {saved && <span style={{ color: "var(--primary)", fontWeight: 700 }}>{t.settingsSaved}</span>}
      </div>
    </div>
  );
}

/* ==========================================================================
   Dashboard View
   ========================================================================== */
function Dashboard({ profile, posts = [], lang, setActive }) {
  const t = useTranslation(lang);
  const myPostsCount = posts.filter((p) => p.user_id === profile?.id).length;
  const displayPosts = myPostsCount > 0 ? myPostsCount : posts.length;
  const impressions = ((posts.length * 164) + 420).toLocaleString();

  // Weekly activity metrics
  const days = [
    { label: lang === "sw" ? "J2" : "Mon", count: 28, height: 55 },
    { label: lang === "sw" ? "J3" : "Tue", count: 42, height: 80 },
    { label: lang === "sw" ? "J4" : "Wed", count: 34, height: 65 },
    { label: lang === "sw" ? "J5" : "Thu", count: 56, height: 95 },
    { label: lang === "sw" ? "Iju" : "Fri", count: 68, height: 100 },
    { label: lang === "sw" ? "Jmo" : "Sat", count: 48, height: 75 },
    { label: lang === "sw" ? "Jpi" : "Sun", count: 38, height: 60 }
  ];

  return (
    <div className="feature-shell" id="dashboard-view">
      <div className="feature-top-banner">
        <div>
          <p className="eyebrow">{t.dashboardEyebrow}</p>
          <h1 style={{ fontSize: 32, margin: "6px 0 10px" }}>{t.dashboardTitle}</h1>
          <p className="muted">{t.dashboardDesc}</p>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="quick-actions-bar" id="dashboard-quick-actions">
        <button type="button" className="quick-action-btn" onClick={() => setActive("home")}>
          <span style={{ fontSize: 18 }}>📝</span>
          <span>{t.dashActionPost}</span>
        </button>
        <button type="button" className="quick-action-btn" onClick={() => setActive("reels")}>
          <span style={{ fontSize: 18 }}>🎬</span>
          <span>{t.dashActionReel}</span>
        </button>
        <button type="button" className="quick-action-btn" onClick={() => setActive("marketplace")}>
          <span style={{ fontSize: 18 }}>🛍️</span>
          <span>{t.dashActionProduct}</span>
        </button>
        <button type="button" className="quick-action-btn" onClick={() => setActive("settings")}>
          <span style={{ fontSize: 18 }}>🛡️</span>
          <span>{t.dashActionSettings}</span>
        </button>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="dashboard-metrics-grid" id="dashboard-stats-grid">
        <div className="dash-metric-card">
          <div className="dash-metric-top">
            <span className="dash-metric-title">{t.dashTotalPosts}</span>
            <span className="dash-metric-icon">📝</span>
          </div>
          <div className="dash-metric-value">{displayPosts}</div>
          <div className="dash-metric-trend trend-up">↑ +14% {lang === "sw" ? "juma hili" : "this week"}</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-top">
            <span className="dash-metric-title">{t.dashReach}</span>
            <span className="dash-metric-icon">👁️</span>
          </div>
          <div className="dash-metric-value">{impressions}</div>
          <div className="dash-metric-trend trend-up">↑ +26.4% {lang === "sw" ? "mwezi huu" : "this month"}</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-top">
            <span className="dash-metric-title">{t.dashFollowers}</span>
            <span className="dash-metric-icon">👥</span>
          </div>
          <div className="dash-metric-value">148</div>
          <div className="dash-metric-trend trend-up">↑ +18 {lang === "sw" ? "wapya" : "new"}</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-top">
            <span className="dash-metric-title">{t.dashEngagement}</span>
            <span className="dash-metric-icon">❤️</span>
          </div>
          <div className="dash-metric-value">9.4%</div>
          <div className="dash-metric-trend trend-up">↑ +2.1% {lang === "sw" ? "juu ya wastani" : "above average"}</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-top">
            <span className="dash-metric-title">{t.dashReelsViews}</span>
            <span className="dash-metric-icon">▶</span>
          </div>
          <div className="dash-metric-value">3.2K</div>
          <div className="dash-metric-trend trend-up">↑ +38% {lang === "sw" ? "mionekano" : "views"}</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-top">
            <span className="dash-metric-title">{t.dashAccountHealth}</span>
            <span className="dash-metric-icon">🛡️</span>
          </div>
          <div className="dash-metric-value" style={{ color: "var(--primary)" }}>98%</div>
          <div className="dash-metric-trend" style={{ color: "var(--primary)" }}>✦ {t.dashHealthExcellent}</div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="dash-chart-grid">
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 16 }}>📊 {t.dashWeeklyActivity}</h3>
            <span className="muted" style={{ fontSize: 12 }}>{lang === "sw" ? "Mionekano & Mwingiliano" : "Impressions & Engagement"}</span>
          </div>

          <div className="dash-activity-chart">
            {days.map((d) => (
              <div key={d.label} className="chart-bar-column">
                <span className="chart-bar-val">{d.count}</span>
                <div className="chart-bar-fill" style={{ height: `${d.height}%` }} />
                <span className="chart-bar-label">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>🌍 {t.dashAudienceDistribution}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <strong>Tanzania 🇹🇿</strong>
                <span>65%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "var(--line)", overflow: "hidden" }}>
                <div style={{ width: "65%", height: "100%", background: "var(--primary)" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <strong>Kenya 🇰🇪</strong>
                <span>18%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "var(--line)", overflow: "hidden" }}>
                <div style={{ width: "18%", height: "100%", background: "var(--primary)" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <strong>Uganda & Rwanda 🇺🇬 🇷🇼</strong>
                <span>11%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "var(--line)", overflow: "hidden" }}>
                <div style={{ width: "11%", height: "100%", background: "var(--primary)" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <strong>Diaspora & Worldwide 🌐</strong>
                <span>6%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "var(--line)", overflow: "hidden" }}>
                <div style={{ width: "6%", height: "100%", background: "var(--accent-gold)" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Post Spotlight */}
      <div className="glass-card" style={{ padding: 24, borderLeft: "4px solid var(--primary)" }}>
        <span className="eyebrow" style={{ color: "var(--primary)" }}>✦ {t.dashTopPerformingPost}</span>
        <h4 style={{ fontSize: 17, margin: "8px 0 6px" }}>
          {posts[0]?.content ? posts[0].content.slice(0, 120) + "..." : (lang === "sw" ? "Karibu ndani ya The Circle! Mtandao wa jamii unaojali." : "Welcome to The Circle! A respectful social network.")}
        </h4>
        <div style={{ display: "flex", gap: 18, marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
          <span>❤️ 48 Likes</span>
          <span>💬 12 Comments</span>
          <span>⚡ 6 Kicks</span>
          <span style={{ color: "var(--primary)", fontWeight: 700 }}>★ 99.2% Positive Feedback</span>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   About Page (Featuring CEO HAMZA VUKANG)
   ========================================================================== */
function AboutUs({ lang, setActive }) {
  const t = useTranslation(lang);

  return (
    <div className="feature-shell" id="about-view">
      <div className="feature-top-banner">
        <div>
          <p className="eyebrow">{t.aboutEyebrow}</p>
          <h1 style={{ fontSize: 32, margin: "6px 0 10px" }}>{t.aboutTitle}</h1>
          <p className="muted">{t.aboutDesc}</p>
        </div>
      </div>

      {/* CEO HAMZA VUKANG Spotlight Card */}
      <div className="ceo-spotlight-card" id="ceo-spotlight-card">
        <div className="ceo-profile-flex">
          <div className="ceo-avatar-badge">HV</div>
          <div style={{ flex: 1 }}>
            <span className="eyebrow" style={{ color: "var(--primary)" }}>{t.ceoCardTitle}</span>
            <h2 style={{ fontSize: 30, margin: "6px 0 4px", color: "var(--ink-heading)" }}>{t.ceoName}</h2>
            <strong style={{ color: "var(--accent-gold)", fontSize: 15 }}>{t.ceoRole}</strong>
            <p className="muted" style={{ marginTop: 10, fontSize: 14, lineHeight: 1.65 }}>
              {t.ceoBio}
            </p>
          </div>
        </div>

        <div className="ceo-quote-box">
          <p style={{ margin: 0 }}>{t.ceoQuote}</p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span>🏢</span>
            <span><strong>Makao Makuu:</strong> Dar es Salaam, Tanzania</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span>✉️</span>
            <span><strong>Uongozi:</strong> ceo@thecircle.app</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span>🌍</span>
            <span><strong>Maono:</strong> East Africa & Global Connectivity</span>
          </div>
        </div>
      </div>

      {/* Mission & Vision Cards */}
      <div className="feature-grid-2" style={{ marginBottom: 28 }}>
        <article className="glass-card" style={{ padding: 24 }}>
          <span style={{ fontSize: 30 }}>🎯</span>
          <h3 style={{ fontSize: 18, margin: "12px 0 8px" }}>{t.aboutMissionTitle}</h3>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.7 }}>{t.aboutMissionDesc}</p>
        </article>

        <article className="glass-card" style={{ padding: 24 }}>
          <span style={{ fontSize: 30 }}>🔭</span>
          <h3 style={{ fontSize: 18, margin: "12px 0 8px" }}>{t.aboutVisionTitle}</h3>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.7 }}>{t.aboutVisionDesc}</p>
        </article>
      </div>

      {/* The Core Pillars of THE CIRCLE */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 20, marginBottom: 16 }}>✦ {t.aboutPillarsTitle}</h3>
        <div className="pillars-grid">
          <div className="pillar-item-card">
            <span style={{ fontSize: 28 }}>🔒</span>
            <h4 style={{ margin: "10px 0 6px", fontSize: 16 }}>{t.pillar1Title}</h4>
            <p className="muted" style={{ fontSize: 13 }}>{t.pillar1Desc}</p>
          </div>

          <div className="pillar-item-card">
            <span style={{ fontSize: 28 }}>🛍️</span>
            <h4 style={{ margin: "10px 0 6px", fontSize: 16 }}>{t.pillar2Title}</h4>
            <p className="muted" style={{ fontSize: 13 }}>{t.pillar2Desc}</p>
          </div>

          <div className="pillar-item-card">
            <span style={{ fontSize: 28 }}>🕊️</span>
            <h4 style={{ margin: "10px 0 6px", fontSize: 16 }}>{t.pillar3Title}</h4>
            <p className="muted" style={{ fontSize: 13 }}>{t.pillar3Desc}</p>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="glass-card" style={{ padding: 24, textAlign: "center", background: "var(--primary-soft)" }}>
        <h4 style={{ fontSize: 18, marginBottom: 8 }}>{lang === "sw" ? "Una maoni au unataka kushirikiana na uongozi wetu?" : "Have inquiries or interested in partnering with our leadership?"}</h4>
        <p className="muted" style={{ maxWidth: 520, margin: "0 auto 16px", fontSize: 14 }}>
          {lang === "sw" ? "Timu yetu ya uongozi inayoongozwa na HAMZA VUKANG inakaribisha mawazo, ubia na ushirikiano kutoka kote duniani." : "Our executive leadership headed by HAMZA VUKANG welcomes feedback, innovation, and global partnerships."}
        </p>
        <button
          type="button"
          className="button button-primary"
          onClick={() => setActive && setActive("help")}
        >
          {t.contactSupportHeader} →
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   Safety Terms of Service & Community Guidelines
   ========================================================================== */
function TermsOfService({ lang }) {
  const t = useTranslation(lang);
  const [agreed, setAgreed] = useState(false);

  const sections = [
    { id: "s1", title: t.termSection1Title, text: t.termSection1Desc, badge: "ZERO TOLERANCE" },
    { id: "s2", title: t.termSection2Title, text: t.termSection2Desc, badge: "COMMUNITY RESPECT" },
    { id: "s3", title: t.termSection3Title, text: t.termSection3Desc, badge: "DATA PRIVACY" },
    { id: "s4", title: t.termSection4Title, text: t.termSection4Desc, badge: "ANTI-FRAUD" },
    { id: "s5", title: t.termSection5Title, text: t.termSection5Desc, badge: "COPYRIGHT" },
    { id: "s6", title: t.termSection6Title, text: t.termSection6Desc, badge: "DUE PROCESS" }
  ];

  return (
    <div className="feature-shell" id="terms-view">
      <div className="feature-top-banner">
        <div>
          <p className="eyebrow">{t.termsEyebrow}</p>
          <h1 style={{ fontSize: 32, margin: "6px 0 10px" }}>{t.termsTitle}</h1>
          <p className="muted">{t.termsDesc}</p>
          <span style={{ display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 700, color: "var(--primary)" }}>
            🛡️ {t.termsLastUpdated}
          </span>
        </div>
      </div>

      <div className="terms-card-wrapper" id="terms-content-container">
        {sections.map((sec) => (
          <div key={sec.id} className="terms-section-block">
            <div className="terms-section-heading">
              <span>{sec.title}</span>
              <span className="terms-section-badge">{sec.badge}</span>
            </div>
            <p className="terms-section-text">{sec.text}</p>
          </div>
        ))}
      </div>

      {/* Acceptance action */}
      <div className="glass-card" style={{ padding: 24, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <strong style={{ fontSize: 16, display: "block", marginBottom: 4 }}>
            {lang === "sw" ? "Uthibitisho wa Mwanachama wa Duara" : "Circle Member Agreement"}
          </strong>
          <span className="muted" style={{ fontSize: 13 }}>
            {lang === "sw" ? "Kutumia mtandao huu kunathibitisha kuwa unakubaliana na sera hizi zote za usalama." : "By using The Circle, you agree to abide by all stated safety and community standards."}
          </span>
        </div>

        {agreed ? (
          <span style={{ padding: "10px 20px", borderRadius: 12, background: "var(--primary-soft)", color: "var(--primary)", fontWeight: 800, fontSize: 14 }}>
            ✓ {t.termsAcceptedBadge}
          </span>
        ) : (
          <button
            type="button"
            className="button button-primary"
            onClick={() => setAgreed(true)}
          >
            ✓ {t.termsAcceptanceBtn}
          </button>
        )}
      </div>
    </div>
  );
}

/* Help & Support View */
function HelpSupport({ lang }) {
  const t = useTranslation(lang);
  const [sent, setSent] = useState(false);

  return (
    <div className="feature-shell" id="help-view">
      <div className="feature-top-banner">
        <div>
          <p className="eyebrow">{t.helpEyebrow}</p>
          <h1 style={{ fontSize: 32, margin: "6px 0 10px" }}>{t.helpTitle}</h1>
          <p className="muted">{t.helpDesc}</p>
        </div>
      </div>

      <div className="feature-grid-2" style={{ marginBottom: 28 }}>
        <article className="glass-card">
          <span style={{ fontSize: 32, color: "var(--primary)" }}>❓</span>
          <h3 style={{ margin: "12px 0 8px" }}>{t.faqTitle}</h3>
          <p className="muted" style={{ fontSize: 14 }}>{t.faqDesc}</p>
          <button type="button" className="text-button" style={{ marginTop: 14 }}>
            {t.openFaqBtn} →
          </button>
        </article>

        <article className="glass-card">
          <span style={{ fontSize: 32, color: "var(--accent-gold)" }}>💡</span>
          <h3 style={{ margin: "12px 0 8px" }}>{t.reportTitle}</h3>
          <p className="muted" style={{ fontSize: 14 }}>{t.reportDesc}</p>
          <button type="button" className="text-button" style={{ marginTop: 14 }}>
            {t.reportBtn} →
          </button>
        </article>
      </div>

      <form className="glass-card" style={{ maxWidth: 640 }} onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
        <h3 style={{ fontSize: 18, marginBottom: 14 }}>{t.contactSupportHeader}</h3>
        <textarea
          style={{ width: "100%", padding: 14, borderRadius: 12, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", minHeight: 120, outline: "none", marginBottom: 14 }}
          placeholder={t.supportPlaceholder}
          required
        />
        <button type="submit" className="button button-primary">
          {t.sendMessageBtn}
        </button>
        {sent && <p style={{ color: "var(--primary)", marginTop: 12, fontWeight: 600 }}>{t.supportSentSuccess}</p>}
      </form>
    </div>
  );
}

/* Discover Community View */
function Discover({ profile, lang }) {
  const t = useTranslation(lang);
  return (
    <div className="feature-shell" id="discover-view">
      <div className="feature-top-banner">
        <div>
          <p className="eyebrow">✦ {t.discover}</p>
          <h1 style={{ fontSize: 32, margin: "6px 0 10px" }}>{t.discoverTitle}</h1>
          <p className="muted">{t.discoverDesc}</p>
        </div>
      </div>
      <div style={{ maxWidth: 540 }}>
        <Suggestions userId={profile.id} lang={lang} />
      </div>
    </div>
  );
}

/* Friends Page */
function Friends({ profile, lang }) {
  const t = useTranslation(lang);
  return (
    <div className="feature-shell" id="friends-view">
      <div className="feature-top-banner">
        <div>
          <p className="eyebrow">{t.community}</p>
          <h1 style={{ fontSize: 32, margin: "6px 0 10px" }}>{t.friendsHeaderTitle}</h1>
          <p className="muted">{t.friendsHeaderDesc}</p>
        </div>
      </div>

      <div style={{ maxWidth: 540, marginBottom: 24 }}>
        <Suggestions userId={profile.id} lang={lang} />
      </div>

      <div className="glass-card" style={{ maxWidth: 540, borderLeft: "4px solid var(--primary)" }}>
        <strong style={{ display: "block", marginBottom: 4 }}>{t.friendshipCalloutBold}</strong>
        <span className="muted" style={{ fontSize: 13 }}>{t.friendshipCalloutSub}</span>
      </div>
    </div>
  );
}

/* Main Application Entry */
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [active, setActive] = useState("home");
  const [posts, setPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [booting, setBooting] = useState(true);
  const [dark, setDark] = useState(() => localStorage.getItem("the-circle-theme") === "dark");
  const [lang, setLang] = useState(() => localStorage.getItem("the-circle-language") || "sw");

  // Telegram-style Passcode & Security states
  const [passcodeEnabled, setPasscodeEnabled] = useState(() => localStorage.getItem("circle_passcode_enabled") === "true");
  const [passcodePin, setPasscodePin] = useState(() => localStorage.getItem("circle_passcode_pin") || "1234");
  const [isLocked, setIsLocked] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [activeCall, setActiveCall] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
  };

  const handleStartCall = async (recipient, type = "audio", isIncoming = false, conversationId = null) => {
    setActiveCall({
      type,
      isIncoming,
      recipient,
      conversationId,
      status: isIncoming ? "ringing_incoming" : "ringing_outgoing"
    });

    if (!isIncoming && conversationId && recipient?.id && profile?.id) {
      await sendCallSignal(conversationId, profile.id, recipient.id, "offer", {
        type,
        caller: {
          id: profile.id,
          display_name: profile.display_name,
          username: profile.username,
          avatar_url: profile.avatar_url
        }
      }).catch(() => {});
    }
  };

  useEffect(() => {
    localStorage.setItem("circle_passcode_enabled", passcodeEnabled ? "true" : "false");
  }, [passcodeEnabled]);

  useEffect(() => {
    localStorage.setItem("circle_passcode_pin", passcodePin);
  }, [passcodePin]);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("the-circle-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    localStorage.setItem("the-circle-language", lang);
    document.documentElement.lang = lang === "sw" ? "sw" : "en";
  }, [lang]);

  const load = async (user) => {
    const [p, f, n] = await Promise.all([
      getCurrentProfile(user.id),
      getFeed(),
      getNotifications(user.id)
    ]);
    setProfile(p);
    setPosts(f);
    setNotifications(n);
  };

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setBooting(false);
      return undefined;
    }
    supabase.auth.getSession()
      .then(async (res) => {
        const nextSession = res?.data?.session || null;
        setSession(nextSession);
        if (nextSession?.user) {
          try {
            await load(nextSession.user);
          } catch (err) {
            console.warn("Initial load failed:", err);
          }
        }
      })
      .catch((err) => console.warn("Session check error:", err))
      .finally(() => setBooting(false));

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      if (next?.user) {
        try {
          await load(next.user);
        } catch (err) {
          console.warn("Auth state load failed:", err);
        }
      } else {
        setProfile(null);
        setPosts([]);
      }
    });

    return () => listener?.subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    if (!supabaseConfigured || !supabase || !session) return;
    const refreshNotifications = async () => setNotifications(await getNotifications(session.user.id));
    const stopFeed = subscribeToRealtime(
      async (payload) => {
        if (payload.eventType === "INSERT") setPosts(await getFeed());
      },
      async () => setPosts(await getFeed()),
      refreshNotifications
    );
    const stopInteractions = subscribeToInteractions(
      session.user.id,
      refreshNotifications,
      (signal) => {
        if (signal.signal_type === "offer" || signal.signal_type === "ringing") {
          setActiveCall({
            type: signal.payload?.type || "audio",
            isIncoming: true,
            recipient: signal.payload?.caller || { display_name: "Mwanachama wa Duara", username: "circle_user" },
            conversationId: signal.conversation_id,
            status: "ringing_incoming"
          });
        } else if (signal.signal_type === "hangup") {
          setActiveCall(null);
        }
      }
    );
    return () => {
      stopFeed();
      stopInteractions();
    };
  }, [session]);

  const markRead = async () => {
    if (!session) return;
    await markNotificationsRead(session.user.id).catch(() => {});
    setNotifications((current) =>
      current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() }))
    );
  };

  const onPost = async (content, media, mediaType) => createPost(session.user.id, content, media, mediaType);
  const logout = async () => logoutUser();

  if (!supabaseConfigured) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeContent: "center", padding: 24, background: "#f8fafc" }}>
        <div className="auth-form-card" style={{ maxWidth: 560, width: "100%" }}>
          <Brand />
          <h2 style={{ marginTop: 24 }}>THE CIRCLE haijaunganishwa</h2>
          <p className="muted">Vercel environment variables za Supabase hazijawekwa au zina majina yasiyo sahihi.</p>
          <pre style={{ whiteSpace: "pre-wrap", background: "#0f172a", color: "#e2e8f0", padding: 16, borderRadius: 10, fontSize: 13 }}>VITE_SUPABASE_URL{"\n"}VITE_SUPABASE_PUBLISHABLE_KEY</pre>
          <p className="muted" style={{ fontSize: 13 }}>Weka variables hizi kwenye Vercel kwa Production, Preview na Development, kisha ufanye Redeploy.</p>
        </div>
      </div>
    );
  }

  if (booting) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeContent: "center", justifyItems: "center", gap: 14 }}>
        <AmbientBackground />
        <Brand />
        <p className="muted">{lang === "sw" ? "Inafungua duara lako..." : "Opening your circle..."}</p>
      </div>
    );
  }

  if (!session || !profile) {
    return <AuthScreen lang={lang} setLang={setLang} dark={dark} setDark={setDark} />;
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div id="app-root-shell">
      <AmbientBackground />

      <TopHeader
        active={active}
        setActive={setActive}
        profile={profile}
        lang={lang}
        setLang={setLang}
        dark={dark}
        setDark={setDark}
        unreadCount={unreadCount}
        passcodeEnabled={passcodeEnabled}
        onLockApp={() => {
          setIsLocked(true);
          showToast(lang === "sw" ? "🔒 Programu imefungwa salama na Telegram Passcode!" : "🔒 App locked securely with Telegram Passcode!");
        }}
        onShowToast={showToast}
      />

      <div className="app-shell">
        <Sidebar
          profile={profile}
          active={active}
          setActive={setActive}
          onLogout={logout}
          unread={unreadCount}
          lang={lang}
          setLang={setLang}
          dark={dark}
          setDark={setDark}
          passcodeEnabled={passcodeEnabled}
          onLockApp={() => {
            setIsLocked(true);
            showToast(lang === "sw" ? "🔒 Programu imefungwa na Passcode!" : "🔒 App locked with Passcode!");
          }}
        />

        <main className="main-area" id="main-content-panel">
          {/* Real-time Affiliate & Commerce Core Modules */}
          {active === "ads" && (
            <CustomerAdsDashboard
              profile={profile}
              onShowToast={showToast}
              lang={lang}
            />
          )}

          {active === "catalogue" && (
            <AffiliateManagerCatalogue
              profile={profile}
              onShowToast={showToast}
              lang={lang}
            />
          )}

          {active === "ceo" && (
            <CeoDashboard
              profile={profile}
              onShowToast={showToast}
              lang={lang}
            />
          )}

          {(active === "home" || active === "feed") && (
            <MainFeed
              profile={profile}
              posts={posts}
              setPosts={setPosts}
              onPost={onPost}
              lang={lang}
              onShowToast={showToast}
              setActive={setActive}
              StatusRail={StatusRail}
            />
          )}
          {active === "dashboard" && (
            profile?.role === "ceo" ? (
              <CeoDashboard
                profile={profile}
                onShowToast={showToast}
                lang={lang}
              />
            ) : profile?.role === "manager" ? (
              <AffiliateManagerCatalogue
                profile={profile}
                onShowToast={showToast}
                lang={lang}
              />
            ) : (
              <CustomerAdsDashboard
                profile={profile}
                onShowToast={showToast}
                lang={lang}
              />
            )
          )}

          {active === "messages" && (
            <Messages
              profile={profile}
              lang={lang}
              onStartCall={handleStartCall}
            />
          )}
          {active === "friends" && <Friends profile={profile} lang={lang} />}
          {active === "marketplace" && <Marketplace lang={lang} />}
          {active === "reels" && <Reels profile={profile} lang={lang} onShowToast={showToast} />}
          {active === "saved" && <SavedMedia lang={lang} setActive={setActive} onShowToast={showToast} />}
          {active === "wallet" && <Wallet profile={profile} lang={lang} />}
          {active === "profile" && (
            <UserProfile
              profile={profile}
              setProfile={setProfile}
              posts={posts}
              setPosts={setPosts}
              onPost={onPost}
              lang={lang}
              onShowToast={showToast}
              setActive={setActive}
              PostCard={PostCard}
            />
          )}
          {active === "settings" && (
            <Settings
              profile={profile}
              setProfile={setProfile}
              dark={dark}
              setDark={setDark}
              lang={lang}
              setLang={setLang}
              passcodeEnabled={passcodeEnabled}
              setPasscodeEnabled={setPasscodeEnabled}
              passcodePin={passcodePin}
              setPasscodePin={setPasscodePin}
              onLockApp={() => {
                setIsLocked(true);
                showToast(lang === "sw" ? "🔒 Programu imefungwa!" : "🔒 App locked!");
              }}
              onShowToast={showToast}
            />
          )}
          {active === "about" && <AboutUs lang={lang} setActive={setActive} />}
          {active === "terms" && <TermsOfService lang={lang} />}
          {active === "help" && <HelpSupport lang={lang} />}
          {active === "notifications" && (
            <Notifications
              items={notifications}
              userId={profile.id}
              onRead={markRead}
              lang={lang}
            />
          )}
          {active === "discover" && <Discover profile={profile} lang={lang} />}
        </main>
      </div>

      <MobileBottomNav
        active={active}
        setActive={setActive}
        lang={lang}
        unread={unreadCount}
        profile={profile}
      />

      {/* Telegram-style Passcode Lock Modal */}
      {passcodeEnabled && isLocked && (
        <PasscodeLockModal
          correctPin={passcodePin}
          onUnlock={() => {
            setIsLocked(false);
            showToast(lang === "sw" ? "✓ Programu imefunguliwa salama!" : "✓ App unlocked successfully!");
          }}
          lang={lang}
        />
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <ToastNotification
          message={toastMessage}
          onClose={() => setToastMessage("")}
        />
      )}

      {/* Real-time WebRTC Audio & Video Call Modal */}
      {activeCall && (
        <CallModal
          call={activeCall}
          profile={profile}
          onClose={() => setActiveCall(null)}
          lang={lang}
        />
      )}
    </div>
  );
}

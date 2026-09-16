import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
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
import { translations, useTranslation } from "./lib/translations";
import "./App.css";

const blankAuth = { email: "", password: "", displayName: "", username: "" };

const initials = (name = "Guest") =>
  name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "G";

function Avatar({ name = "Guest", size = "md", avatarUrl }) {
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
        <span className="brand-sub">DUARA</span>
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
function TopHeader({ active, setActive, profile, lang, setLang, dark, setDark, unreadCount }) {
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
  const [form, setForm] = useState(blankAuth);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!form.email || !form.password || (mode === "register" && (!form.displayName || !form.username))) {
      return setMessage(t.fillAllFields);
    }
    if (mode === "register" && form.password.length < 8) {
      return setMessage(t.passwordLengthErr);
    }
    setBusy(true);
    try {
      const result = mode === "login"
        ? await loginUser(form.email, form.password)
        : await registerUser(form);
      if (mode === "register" && !result.session) {
        setMessage(t.accountCreatedVerify);
      }
    } catch (err) {
      setMessage(err.message || t.failedTryAgain);
    } finally {
      setBusy(false);
    }
  };

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
          <p className="eyebrow" style={{ color: "#ffffff" }}>{t.welcomeEyebrow}</p>
          <h1 style={{ fontSize: "clamp(38px, 4.5vw, 68px)", color: "#ffffff", lineHeight: 1.1, margin: "14px 0 20px" }}>
            {t.welcomeTitle1}<br />
            <em style={{ fontFamily: "'Playfair Display', serif", color: "#fbbf24" }}>{t.welcomeTitle2}</em><br />
            {t.welcomeTitle3}
          </h1>
          <p style={{ maxWidth: 440, fontSize: 16, color: "rgba(255,255,255,0.9)", lineHeight: 1.7 }}>
            {t.welcomeDesc}
          </p>
        </div>

        <div className="auth-art-glow" />
      </section>

      <section style={{ display: "grid", placeItems: "center", padding: "30px", zIndex: 1 }}>
        <div className="auth-form-card" id="auth-form-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <Brand />
            <LanguageToggle lang={lang} setLang={setLang} />
          </div>

          <p className="eyebrow">{mode === "login" ? t.welcomeBackEyebrow : t.joinUsEyebrow}</p>
          <h2 style={{ fontSize: 28, margin: "0 0 6px" }}>{mode === "login" ? t.loginTitle : t.registerTitle}</h2>
          <p className="muted" style={{ marginBottom: 24 }}>{mode === "login" ? t.loginSubtitle : t.registerSubtitle}</p>

          <form onSubmit={submit} id="auth-form">
            {mode === "register" && (
              <>
                <div className="form-group">
                  <label htmlFor="input-fullname">{t.displayName}</label>
                  <input
                    id="input-fullname"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    placeholder="Amina Juma"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="input-username">{t.username}</label>
                  <input
                    id="input-username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                    placeholder="amina_juma"
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="input-email">{t.email}</label>
              <input
                id="input-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="wewe@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="input-password">{t.password}</label>
              <input
                id="input-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={t.passwordMin}
              />
            </div>

            <ErrorBox message={message} />

            <button
              id="btn-auth-submit"
              className="button button-primary button-full"
              disabled={busy}
              style={{ marginTop: 14 }}
            >
              {busy ? t.waiting : mode === "login" ? t.loginBtn : t.registerBtn}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--muted)" }}>
            {mode === "login" ? t.noAccount : t.haveAccount}{" "}
            <button
              type="button"
              id="btn-toggle-auth-mode"
              className="text-button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setMessage("");
              }}
            >
              {mode === "login" ? t.registerHere : t.loginHere}
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

  const mainLinks = [
    ["home", "⌂", t.home],
    ["dashboard", "📊", t.dashboard],
    ["messages", "✉", t.messages, unread],
    ["friends", "👥", t.friends],
    ["discover", "✦", t.discover]
  ];

  const exploreLinks = [
    ["marketplace", "🛍️", t.marketplace],
    ["reels", "▶", t.reels],
    ["wallet", "💳", t.wallet]
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
        <span className="nav-section-title">{t.home}</span>
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

        <span className="nav-section-title">{t.marketplace} & {t.reels}</span>
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
            <span className="profile-capsule-tag">@{profile.username}</span>
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
function MobileBottomNav({ active, setActive, lang, unread }) {
  const t = useTranslation(lang);
  const items = [
    ["home", "⌂", t.home],
    ["dashboard", "📊", t.dashboard],
    ["messages", "✉", t.messages, unread],
    ["reels", "▶", t.reels],
    ["marketplace", "🛍️", t.marketplace],
    ["settings", "⚙", t.settings]
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
function PostCard({ post, user, onRefresh, lang }) {
  const t = useTranslation(lang);
  const [liked, setLiked] = useState((post.likes || []).some((like) => like.user_id === user.id));
  const [kicked, setKicked] = useState(false);
  const [comment, setComment] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [busy, setBusy] = useState(false);

  const author = post.profiles?.display_name || "Member";

  const like = async () => {
    setBusy(true);
    try {
      await toggleLike(user.id, post.id, liked);
      setLiked(!liked);
      onRefresh();
    } catch (err) {
      console.warn(err);
    } finally {
      setBusy(false);
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

  const likeCount = (post.likes?.length || 0) + (liked && !(post.likes || []).some((x) => x.user_id === user.id) ? 1 : 0);

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
        <div className="post-media-container">
          {post.media_type === "video" ? (
            <video src={post.media_url} controls playsInline />
          ) : (
            <img src={post.media_url} alt="Post Attachment" />
          )}
        </div>
      )}

      {Boolean(post.comments?.[0]?.count) && (
        <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
          {post.comments[0].count} {t.comments}
        </p>
      )}

      <div className="post-actions-bar">
        <button
          type="button"
          id={`btn-like-${post.id}`}
          onClick={like}
          disabled={busy}
          className={`action-btn ${liked ? "liked" : ""}`}
        >
          <span>{liked ? "❤️" : "🤍"}</span>
          <span>{likeCount}</span>
        </button>

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

/* Home / Feed View */
function Home({ profile, posts, setPosts, onPost, lang }) {
  const t = useTranslation(lang);
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;
    setBusy(true);
    setMessage("");
    try {
      let media = null;
      const mediaType = file ? (file.type.startsWith("video/") ? "video" : "image") : null;
      if (file) media = await uploadImage(profile.id, file);
      const post = await onPost(content.trim() || (mediaType === "video" ? t.newVideo : t.newPhoto), media, mediaType);
      setPosts((current) => [{ ...post, profiles: profile, likes: [], comments: [] }, ...current]);
      setContent("");
      setFile(null);
    } catch (err) {
      setMessage(err.message || t.postSendFailed);
    } finally {
      setBusy(false);
    }
  };

  const refresh = async () => {
    try {
      setPosts(await getFeed());
    } catch (err) {
      setMessage(err.message || t.feedReadFailed);
    }
  };

  return (
    <div className="feed-container" id="feed-container">
      <div className="feed-column">
        <StatusRail profile={profile} lang={lang} />

        <section className="composer-card" id="composer-card">
          <div className="composer-top">
            <Avatar name={profile.display_name} avatarUrl={profile.avatar_url} size="md" />
            <div className="composer-user-info">
              <span className="composer-user-name">{profile.display_name}</span>
              <span className="composer-user-sub">{t.shareWithCircle}</span>
            </div>
          </div>

          <form onSubmit={submit} id="create-post-form">
            <textarea
              id="post-textarea"
              className="composer-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.composerPlaceholder}
              maxLength={600}
            />

            {file && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--primary-soft)", borderRadius: 10, marginBottom: 10, fontSize: 13, color: "var(--primary)" }}>
                <span>{file.type.startsWith("video/") ? "🎬" : "🖼️"}</span>
                <span style={{ fontWeight: 600 }}>{file.name}</span>
                <button type="button" onClick={() => setFile(null)} style={{ marginLeft: "auto", border: "none", background: "none", color: "#ef4444", fontWeight: 700 }}>✕</button>
              </div>
            )}

            <div className="composer-divider" />

            <div className="composer-bottom">
              <div className="composer-tools-group">
                <label className="tool-chip" id="btn-upload-media">
                  <span>📷</span> {t.photoVideo}
                  <input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
                <button
                  type="button"
                  id="btn-post-emoji"
                  className="tool-chip"
                  onClick={() => setShowEmoji(!showEmoji)}
                >
                  <span>😊</span> {t.emoji}
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span className="char-counter">{content.length}/600</span>
                <button
                  type="submit"
                  id="btn-publish-post"
                  className="button button-primary"
                  disabled={busy}
                >
                  {busy ? t.sharingBtn : t.shareBtn}
                </button>
              </div>
            </div>

            {showEmoji && <EmojiPicker onPick={(emoji) => setContent((val) => `${val}${emoji}`)} />}
          </form>

          <ErrorBox message={message} />
        </section>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0" }}>
          <h2 style={{ fontSize: 20 }}>{t.forYou}</h2>
          <button type="button" id="btn-feed-refresh" className="text-button" onClick={refresh}>
            🔄 {t.refresh}
          </button>
        </div>

        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              user={profile}
              onRefresh={async () => setPosts(await getFeed())}
              lang={lang}
            />
          ))
        ) : (
          <div className="glass-card" style={{ textAlign: "center", padding: "60px 20px" }}>
            <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>🌱</span>
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>{t.emptyFeedTitle}</h3>
            <p className="muted">{t.emptyFeedDesc}</p>
          </div>
        )}
      </div>

      <aside className="right-rail" id="feed-right-rail">
        <div className="rail-hero-card">
          <p className="eyebrow">{t.welcomeRailEyebrow}</p>
          <h3 style={{ fontSize: 18, margin: "6px 0 10px" }}>{t.welcomeRailTitle}</h3>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>{t.welcomeRailDesc}</p>
        </div>

        <Suggestions userId={profile.id} lang={lang} />
      </aside>
    </div>
  );
}

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

/* Profile Page */
function Profile({ profile, setProfile, posts, lang }) {
  const t = useTranslation(lang);
  const [name, setName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio || "");
  const [location, setLocation] = useState(profile.location || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [pronouns, setPronouns] = useState(profile.pronouns || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [tab, setTab] = useState("posts");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateProfile(profile.id, {
        display_name: name,
        bio,
        location,
        website,
        pronouns,
        avatar_url: avatarUrl
      });
      setProfile(updated);
      setMessage(t.profileSaved);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const changeAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setMessage(t.selectImagesOnly);
    setUploading(true);
    try {
      const url = await uploadImage(profile.id, file, "avatars");
      setAvatarUrl(url);
      setProfile({ ...profile, avatar_url: url });
      setMessage(t.profilePicUpdated);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setUploading(false);
    }
  };

  const myPosts = posts.filter((post) => post.author_id === profile.id);

  return (
    <div className="feature-shell" id="profile-view">
      <div className="profile-cover-modern" style={profile.cover_url ? { backgroundImage: `url(${profile.cover_url})` } : {}}>
        <span style={{ position: "absolute", bottom: 16, right: 16, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
          {t.addCoverPhoto}
        </span>
      </div>

      <div className="profile-hero-content">
        <div className="profile-avatar-row">
          <div style={{ position: "relative" }}>
            <Avatar name={name} size="lg" avatarUrl={avatarUrl} />
            <label style={{ position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", border: "2px solid var(--card-bg)" }}>
              {uploading ? "..." : "✏️"}
              <input type="file" accept="image/*" onChange={changeAvatar} style={{ display: "none" }} />
            </label>
          </div>

          <button type="button" className="button button-primary" onClick={() => setTab("about")}>
            {t.editProfileBtn}
          </button>
        </div>

        <h1 style={{ fontSize: 28, marginBottom: 4 }}>{name}</h1>
        <p className="muted" style={{ marginBottom: 12 }}>
          @{profile.username} {pronouns && `· ${pronouns}`} {location && `· 📍 ${location}`}
        </p>
        <p style={{ maxWidth: 560, lineHeight: 1.6 }}>{bio || t.noBioYet}</p>

        <div style={{ display: "flex", gap: 30, marginTop: 20 }}>
          <div><strong style={{ fontSize: 18, color: "var(--primary)" }}>{myPosts.length}</strong> <span className="muted" style={{ fontSize: 13 }}>{t.postsTab}</span></div>
          <div><strong style={{ fontSize: 18, color: "var(--primary)" }}>—</strong> <span className="muted" style={{ fontSize: 13 }}>{t.friendsTab}</span></div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {["posts", "about", "friends", "photos"].map((tabId) => (
          <button
            key={tabId}
            type="button"
            className={`button ${tab === tabId ? "button-primary" : "button-outline"}`}
            onClick={() => setTab(tabId)}
          >
            {tabId === "posts" && t.postsTab}
            {tabId === "about" && t.aboutTab}
            {tabId === "friends" && t.friendsTab}
            {tabId === "photos" && t.photosTab}
          </button>
        ))}
      </div>

      {tab === "posts" && (
        <div className="feed-column">
          {myPosts.length > 0 ? (
            myPosts.map((post) => (
              <article key={post.id} className="glass-card" style={{ padding: 18 }}>
                <p style={{ fontSize: 15, lineHeight: 1.6 }}>{post.content}</p>
                <small className="muted" style={{ display: "block", marginTop: 8 }}>
                  {new Date(post.created_at).toLocaleDateString()}
                </small>
              </article>
            ))
          ) : (
            <p className="muted" style={{ padding: 20 }}>{t.noPostsYet}</p>
          )}
        </div>
      )}

      {tab === "about" && (
        <div className="glass-card" style={{ maxWidth: 640 }}>
          <h2 style={{ fontSize: 20, marginBottom: 18 }}>{t.aboutYou}</h2>
          <form onSubmit={save} id="profile-edit-form">
            <div className="form-group">
              <label>{t.nameLabel}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t.pronounsLabel}</label>
              <input value={pronouns} onChange={(e) => setPronouns(e.target.value)} placeholder={t.pronounsPlaceholder} />
            </div>
            <div className="form-group">
              <label>{t.bioLabel}</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} rows={3} />
            </div>
            <div className="form-group">
              <label>{t.locationLabel}</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t.locationPlaceholder} />
            </div>
            <div className="form-group">
              <label>{t.websiteLabel}</label>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
            </div>
            <ErrorBox message={message} />
            <button type="submit" className="button button-primary" style={{ marginTop: 12 }}>
              {t.saveChanges}
            </button>
          </form>
        </div>
      )}

      {tab === "friends" && (
        <div className="glass-card">
          <p className="muted">{t.friendsNotice}</p>
        </div>
      )}

      {tab === "photos" && (
        <div className="glass-card">
          <p className="muted">{t.photosNotice}</p>
        </div>
      )}
    </div>
  );
}

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

/* Reels View */
function Reels({ profile, lang }) {
  const t = useTranslation(lang);
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getReels().then(setItems).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return setMessage(t.selectVideoFirst);
    if (!file.type.startsWith("video/")) return setMessage(t.videoOnlyNotice);
    setBusy(true);
    try {
      const reel = await createReel(profile.id, file, caption);
      setItems((current) => [{ ...reel, profiles: profile }, ...current]);
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
            <article className="reel-card-modern" key={reel.id}>
              <video src={reel.video_url} controls playsInline />
              <div className="reel-overlay-info">
                <strong>{reel.profiles?.display_name || "Member"}</strong>
                <p style={{ fontSize: 13 }}>{reel.caption}</p>
              </div>
            </article>
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

/* Wallet View */
function Wallet({ profile, lang }) {
  const t = useTranslation(lang);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    getWallet(profile.id)
      .then(setWallet)
      .catch(() => setWallet({ account: null, transactions: [] }));
  }, [profile.id]);

  const balance = wallet?.account?.balance || 0;

  return (
    <div className="feature-shell" id="wallet-view">
      <div className="feature-top-banner">
        <div>
          <p className="eyebrow">{t.walletEyebrow}</p>
          <h1 style={{ fontSize: 32, margin: "6px 0 10px" }}>{t.walletTitle}</h1>
          <p className="muted">{t.walletDesc}</p>
        </div>
      </div>

      <div className="wallet-hero">
        <span style={{ fontSize: 14, opacity: 0.9 }}>{t.availableBalance}</span>
        <div className="wallet-balance-num">
          {Number(balance).toLocaleString()} {wallet?.account?.currency || "TZS"}
        </div>
        <p style={{ fontSize: 13, opacity: 0.85, maxWidth: 520 }}>{t.walletNotice}</p>

        <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
          <button type="button" className="button" style={{ background: "#ffffff", color: "var(--primary-dark)" }}>
            {t.depositBtn}
          </button>
          <button type="button" className="button" style={{ background: "rgba(255,255,255,0.2)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.3)" }}>
            {t.withdrawBtn}
          </button>
        </div>
      </div>

      <div className="glass-card">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>{t.recentTransactions}</h3>
        {wallet?.transactions?.length ? (
          wallet.transactions.map((tx) => (
            <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
              <div>
                <strong>{tx.type}</strong>
                <span className="muted" style={{ display: "block", fontSize: 11 }}>{new Date(tx.created_at).toLocaleDateString()}</span>
              </div>
              <strong style={{ color: "var(--primary)" }}>{tx.amount} {tx.currency}</strong>
            </div>
          ))
        ) : (
          <p className="muted">{t.noTransactionsYet}</p>
        )}
      </div>
    </div>
  );
}

/* Direct Messages View */
function Messages({ profile, lang }) {
  const t = useTranslation(lang);
  const [term, setTerm] = useState("");
  const [people, setPeople] = useState([]);
  const [person, setPerson] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [call, setCall] = useState(null);
  const [message, setMessage] = useState("");

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
    try {
      const id = await findOrCreateDirectConversation(profile.id, nextPerson.id);
      setConversationId(id);
      setMessages(await getMessages(id));
    } catch (err) {
      setMessage(err.message);
    }
  };

  useEffect(() => {
    if (!conversationId) return;
    return subscribeToConversation(
      conversationId,
      (payload) => setMessages((current) => (current.some((m) => m.id === payload.new.id) ? current : [...current, payload.new])),
      (payload) => handleSignal(payload.new)
    );
  }, [conversationId]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim() || !conversationId) return;
    try {
      const sent = await sendMessage(conversationId, profile.id, body.trim());
      setMessages((current) => (current.some((m) => m.id === sent.id) ? current : [...current, sent]));
      setBody("");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleSignal = async (signal) => {
    if (!person || signal.recipient_id !== profile.id) return;
    if (signal.signal_type === "ringing") setCall({ incoming: true, active: false });
    if (signal.signal_type === "hangup") {
      call?.peer?.close();
      setCall(null);
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
          />
          {people.map((p) => (
            <button
              key={p.id}
              className="suggestion-row"
              style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "8px 4px", borderRadius: 10 }}
              onClick={() => open(p)}
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
                    <small className="muted" style={{ display: "block" }}>@{person.username}</small>
                  </div>
                </div>
                <button type="button" className="button button-soft" onClick={() => alert("Calling...")}>
                  {t.callBtn}
                </button>
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
                {m.body}
                <small style={{ display: "block", fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </small>
              </div>
            ))}
          </div>

          {person && (
            <form onSubmit={send} style={{ display: "flex", gap: 10, padding: 16, borderTop: "1px solid var(--line)" }}>
              <input
                style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--input-bg)", color: "var(--ink)", outline: "none" }}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t.typePrivateMsg}
              />
              <button type="submit" className="button button-primary">
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
function Settings({ profile, setProfile, dark, setDark, lang, setLang }) {
  const t = useTranslation(lang);
  const [activeTab, setActiveTab] = useState("account");
  const [saved, setSaved] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [phone, setPhone] = useState("+255 754 000 111");

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
    { id: "b2", username: "fake_promoter", name: "Fake Ads" }
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
    setTimeout(() => setSaved(false), 4000);
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
    if (!session) return;
    const refreshNotifications = async () => setNotifications(await getNotifications(session.user.id));
    const stopFeed = subscribeToRealtime(
      async (payload) => {
        if (payload.eventType === "INSERT") setPosts(await getFeed());
      },
      async () => setPosts(await getFeed()),
      refreshNotifications
    );
    const stopInteractions = subscribeToInteractions(session.user.id, refreshNotifications);
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
        />

        <main className="main-area" id="main-content-panel">
          {active === "home" && (
            <Home
              profile={profile}
              posts={posts}
              setPosts={setPosts}
              onPost={onPost}
              lang={lang}
            />
          )}
          {active === "dashboard" && (
            <Dashboard
              profile={profile}
              posts={posts}
              lang={lang}
              setActive={setActive}
            />
          )}
          {active === "messages" && <Messages profile={profile} lang={lang} />}
          {active === "friends" && <Friends profile={profile} lang={lang} />}
          {active === "marketplace" && <Marketplace lang={lang} />}
          {active === "reels" && <Reels profile={profile} lang={lang} />}
          {active === "wallet" && <Wallet profile={profile} lang={lang} />}
          {active === "profile" && (
            <Profile
              profile={profile}
              setProfile={setProfile}
              posts={posts}
              lang={lang}
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
      />
    </div>
  );
}

import { useEffect, useState } from "react";
import { loginUser, registerUser, getFeed, createPost } from "./api/api";
import "./App.css";

const initialForm = { name: "", phone: "", pin: "" };

function Avatar({ name = "Guest", size = "md" }) {
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <div className={`avatar avatar-${size}`}>{initials || "G"}</div>;
}

function Brand() { return <div className="brand"><span className="brand-mark">◉</span> THE CIRCLE</div>; }
function Icon({ children }) { return <span className="icon" aria-hidden="true">{children}</span>; }

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setMessage("");
    if (!form.phone || !form.pin || (mode === "register" && !form.name)) return setMessage("Jaza taarifa zote zinazohitajika.");
    if (!/^\d{4,6}$/.test(form.pin)) return setMessage("PIN iwe na tarakimu 4 hadi 6.");
    setLoading(true);
    try {
      const data = mode === "login" ? await loginUser(form.phone, form.pin) : await registerUser(form.name, form.phone, form.pin);
      if (!data.success) throw new Error(data.message || "Imeshindikana. Jaribu tena.");
      if (mode === "register") { setMode("login"); setMessage("Umesajiliwa. Sasa ingia kwenye akaunti yako."); } else onAuth(data.user);
    } catch (error) { setMessage(error.response?.data?.message || error.message || "Hakuna muunganisho na server."); }
    finally { setLoading(false); }
  };
  return <main className="auth-shell">
    <section className="auth-art"><Brand /><div className="art-copy"><p className="eyebrow">KARIBU KWENYE DUARA</p><h1>Watu wako.<br /><em>Hadithi zako.</em><br />Sehemu yako.</h1><p>Mtandao wa kijamii uliojengwa kwa mazungumzo ya kweli, urafiki wa maana na jamii inayokujali.</p></div><div className="orbit orbit-one" /><div className="orbit orbit-two" /></section>
    <section className="auth-panel"><div className="auth-card"><div className="mobile-brand"><Brand /></div><p className="eyebrow">{mode === "login" ? "KARIBU TENA" : "JIUNGE NASI"}</p><h2>{mode === "login" ? "Ingia kwenye duara" : "Fungua akaunti yako"}</h2><p className="muted">{mode === "login" ? "Endelea na watu na mambo unayopenda." : "Anza kushiriki sauti yako leo."}</p>
      <form onSubmit={submit} className="auth-form">{mode === "register" && <label>Jina lako<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mfano: Amina Juma" /></label>}<label>Namba ya simu<input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="07XX XXX XXX" /></label><label>PIN yako<input type="password" inputMode="numeric" maxLength="6" value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })} placeholder="••••" /></label>{message && <div className="form-message">{message}</div>}<button className="button button-primary button-full" disabled={loading}>{loading ? "Inasubiri..." : mode === "login" ? "Ingia kwenye Duara" : "Jiunge na Duara"}</button></form>
      <p className="switch-auth">{mode === "login" ? "Huna akaunti?" : "Una akaunti tayari?"} <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>{mode === "login" ? "Jisajili hapa" : "Ingia hapa"}</button></p></div></section>
  </main>;
}

function Sidebar({ user, active, setActive, onLogout }) {
  const links = [["home", "⌂", "Nyumbani"], ["discover", "✦", "Gundua"], ["saved", "♡", "Vilivyohifadhiwa"]];
  return <aside className="sidebar"><Brand /><nav>{links.map(([id, icon, label]) => <button className={active === id ? "nav-item active" : "nav-item"} onClick={() => setActive(id)} key={id}><Icon>{icon}</Icon>{label}</button>)}</nav><div className="sidebar-bottom"><button className="profile-mini" onClick={() => setActive("profile")}><Avatar name={user.name} /><span><strong>{user.name}</strong><small>@{user.name.toLowerCase().replace(/\s/g, "")}</small></span></button><button className="logout" onClick={onLogout}>Toka</button></div></aside>;
}

function PostCard({ post }) { return <article className="post-card"><div className="post-head"><Avatar name={post.name} /><div><strong>{post.name}</strong><span className="post-meta">@{post.name.toLowerCase().replace(/\s/g, "")} · {post.created_at || "sasa hivi"}</span></div><button className="more">•••</button></div><p className="post-content">{post.content}</p><div className="post-actions"><button>♡ <span>{post.likes || 0}</span></button><button>◌ <span>Jibu</span></button><button>↗ <span>Shiriki</span></button></div></article>; }

function Feed({ user, posts, onPost }) {
  const [content, setContent] = useState(""); const [posting, setPosting] = useState(false); const [message, setMessage] = useState("");
  const submit = async (event) => { event.preventDefault(); if (!content.trim()) return; setPosting(true); setMessage(""); try { await onPost(content.trim()); setContent(""); } catch (error) { setMessage(error.message); } finally { setPosting(false); } };
  return <><header className="topbar"><div><p className="eyebrow">JUMATATU, 14 SEPTEMBA</p><h1>Nyumbani</h1></div><button className="icon-button">⌕</button></header><div className="feed-layout"><main className="feed"><section className="composer"><div className="post-head"><Avatar name={user.name} /><div><strong>{user.name}</strong><span className="post-meta">Shiriki kitu na duara lako</span></div></div><form onSubmit={submit}><textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Unafikiria nini leo?" maxLength="500" /><div className="composer-foot"><span className="muted">{content.length}/500</span><button className="button button-primary" disabled={posting}>{posting ? "Inatuma..." : "Shiriki"}</button></div></form>{message && <div className="form-message">{message}</div>}</section><div className="section-heading"><h2>Kwa ajili yako</h2><button className="text-button">Mpya zaidi ↓</button></div>{posts.length ? posts.map((post) => <PostCard key={post.id} post={post} />) : <div className="empty-state"><span>◌</span><h3>Duara lako linaanza hapa</h3><p>Shiriki wazo la kwanza na ujenge mazungumzo.</p></div>}</main><aside className="right-rail"><section className="rail-card welcome"><span className="eyebrow">DUARA LAKO</span><h3>Umefika nyumbani.</h3><p>Hapa ndipo mawazo, watu na mambo unayopenda hukutana.</p></section><section className="rail-card"><div className="rail-title"><h3>Watu wa kufuatilia</h3><button className="text-button">Ona wote</button></div>{["Neema Said", "Baraka Mushi", "Zawadi Ali"].map((name, i) => <div className="suggestion" key={name}><Avatar name={name} /><span><strong>{name}</strong><small>{["Msanii wa mji", "Mwandishi", "Mpenda safari"][i]}</small></span><button className="follow">+ Fuata</button></div>)}</section></aside></div></>;
}

function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("duara_user")); } catch { return null; } });
  const [active, setActive] = useState("home"); const [posts, setPosts] = useState([]); const [loading, setLoading] = useState(false);
  useEffect(() => { if (user) { localStorage.setItem("duara_user", JSON.stringify(user)); setLoading(true); getFeed().then((data) => setPosts(data.posts || [])).catch(() => {}).finally(() => setLoading(false)); } }, [user]);
  const logout = () => { localStorage.removeItem("duara_user"); setUser(null); };
  const addPost = async (content) => { const data = await createPost(user.id, content); if (!data.success) throw new Error(data.message || "Post haikutumwa"); setPosts((current) => [{ id: data.post?.id || Date.now(), name: user.name, content, likes: 0, created_at: "sasa hivi" }, ...current]); };
  if (!user) return <AuthScreen onAuth={setUser} />;
  return <div className="app-shell"><Sidebar user={user} active={active} setActive={setActive} onLogout={logout} /><div className="main-area">{active === "home" ? <Feed user={user} posts={loading ? [] : posts} onPost={addPost} /> : <div className="placeholder-page"><span className="placeholder-icon">✦</span><h1>{active === "discover" ? "Gundua" : active === "saved" ? "Vilivyohifadhiwa" : "Wasifu wako"}</h1><p>Sehemu hii ya THE CIRCLE inakuja hivi karibuni. Tutaijenga pamoja.</p><button className="button button-primary" onClick={() => setActive("home")}>Rudi nyumbani</button></div>}</div></div>;
}
export default App;

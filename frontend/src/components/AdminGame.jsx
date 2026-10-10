// AdminGame.jsx — CEO-only panel (profiles.role === 'ceo').
// Real security is in the database functions (is_admin()); this just hides the screen from everyone else.
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { gameAudio } from "../lib/gameAudio";

export default function AdminGame({ user }) {
  const [allowed, setAllowed] = useState(null);
  const [overview, setOverview] = useState(null);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState([]);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [fee, setFee] = useState(100);
  const [max, setMax] = useState(5);
  const [pct, setPct] = useState(80);
  const [rounds, setRounds] = useState([]);
  const [txs, setTxs] = useState([]);
  const [msg, setMsg] = useState("");

  const refresh = useCallback(async () => {
    const { data: o } = await supabase.rpc("admin_overview");
    setOverview(o);
    const { data: r } = await supabase.from("rounds").select("*").order("id", { ascending: false }).limit(10);
    setRounds(r ?? []);
    const { data: t } = await supabase.from("coin_transactions").select("*").order("id", { ascending: false }).limit(15);
    setTxs(t ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      if (!user?.id) {
        setAllowed(false);
        return;
      }
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      const ok = data?.role === "ceo";
      setAllowed(ok);
      if (ok) refresh();
    })();
  }, [user?.id, refresh]);

  if (allowed === null) return <p style={{ padding: 16 }}>Inapakia...</p>;
  if (!allowed) return null;

  const say = (m) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };
  const label = (u) => u.display_name || u.username || u.phone || "(bila jina)";

  async function search() {
    gameAudio.playButtonClick();
    const { data, error } = await supabase.rpc("admin_find_users", { p_query: query });
    if (error) return say(error.message);
    setFound(data ?? []);
  }

  async function credit() {
    gameAudio.playButtonClick();
    const n = parseInt(amount, 10);
    if (!selected || !n || n <= 0) return say("Chagua mchezaji na weka idadi sahihi ya coins.");
    if (!window.confirm(`Ongeza 🪙 ${n} kwa ${label(selected)}?`)) return;
    const { error } = await supabase.rpc("admin_credit_coins", { p_user: selected.id, p_amount: n, p_note: note || null });
    if (error) return say(error.message);
    gameAudio.playJoinRound();
    say("Coins zimeongezwa ✅");
    setAmount(""); setNote(""); setSelected(null); setFound([]);
    refresh();
  }

  async function createRound() {
    gameAudio.playButtonClick();
    const { error } = await supabase.rpc("admin_create_round", { p_fee: Number(fee), p_max: Number(max), p_prize_percent: Number(pct) });
    if (error) return say(error.message);
    gameAudio.playJoinRound();
    say("Raundi imetengenezwa ✅");
    refresh();
  }

  async function cancelRound(id) {
    gameAudio.playButtonClick();
    if (!window.confirm(`Futa raundi #${id} na kurudisha coins zote?`)) return;
    const { error } = await supabase.rpc("admin_cancel_round", { p_round: id });
    if (error) return say(error.message);
    say("Raundi imefutwa, coins zimerudishwa ✅");
    refresh();
  }

  const card = { border: "1px solid var(--line, #ddd)", borderRadius: 12, padding: 12, marginBottom: 12, background: "var(--card-bg, #fff)" };

  return (
    <div style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
      <h2>🛠️ Admin — Duara Droo</h2>
      {msg && <div style={{ background: "#eef", padding: 8, borderRadius: 8, marginBottom: 8, color: "#1e3a8a" }}>{msg}</div>}

      {overview && (
        <div style={{ ...card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>Coins zilizouzwa<br /><b>{overview.coins_sold}</b></div>
          <div>Coins kwenye wallets<br /><b>{overview.coins_in_wallets}</b></div>
          <div>Faida ya Duara (coins)<br /><b>{overview.house_cut}</b></div>
          <div>Raundi: {overview.rounds_open} wazi / {overview.rounds_drawn} zimeisha</div>
        </div>
      )}

      <div style={card}>
        <b>Ongeza coins kwa mchezaji</b>
        <div style={{ display: "flex", gap: 6, margin: "8px 0" }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Jina, username au simu" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line, #ccc)" }} />
          <button className="button button-primary" onClick={search} style={{ padding: "8px 12px" }}>Tafuta</button>
        </div>
        {found.map((u) => (
          <div key={u.id} onClick={() => setSelected(u)}
            style={{ padding: 6, cursor: "pointer", background: selected?.id === u.id ? "#dfd" : "transparent", borderRadius: 6 }}>
            {label(u)} {u.username && `@${u.username}`} · 🪙 {u.coins}
          </div>
        ))}
        {selected && (
          <>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Idadi ya coins" style={{ width: "100%", marginTop: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line, #ccc)" }} />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Maelezo (mf. M-Pesa ref)" style={{ width: "100%", marginTop: 6, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line, #ccc)" }} />
            <button className="button button-primary" onClick={credit} style={{ width: "100%", marginTop: 8, padding: 10 }}>Ongeza coins</button>
          </>
        )}
      </div>

      <div style={card}>
        <b>Tengeneza raundi mpya</b>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, margin: "8px 0" }}>
          <label style={{ fontSize: 12 }}>Ada<input type="number" value={fee} onChange={(e) => setFee(e.target.value)} style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid var(--line, #ccc)" }} /></label>
          <label style={{ fontSize: 12 }}>Wachezaji<input type="number" value={max} onChange={(e) => setMax(e.target.value)} style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid var(--line, #ccc)" }} /></label>
          <label style={{ fontSize: 12 }}>Zawadi %<input type="number" value={pct} onChange={(e) => setPct(e.target.value)} style={{ width: "100%", padding: 6, borderRadius: 6, border: "1px solid var(--line, #ccc)" }} /></label>
        </div>
        <button className="button button-primary" onClick={createRound} style={{ width: "100%", padding: 10 }}>Tengeneza</button>
      </div>

      <div style={card}>
        <b>Raundi za hivi karibuni</b>
        {rounds.map((r) => (
          <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--line, #eee)" }}>
            <span>#{r.id} · 🪙{r.entry_fee} × {r.max_players} · {r.status}</span>
            {r.status === "open" && <button className="button button-soft" onClick={() => cancelRound(r.id)} style={{ padding: "4px 8px", fontSize: 12, color: "#ef4444" }}>Futa</button>}
          </div>
        ))}
      </div>

      <div style={card}>
        <b>Miamala ya hivi karibuni</b>
        {txs.map((t) => (
          <div key={t.id} style={{ fontSize: 13, padding: "4px 0", borderBottom: "1px solid var(--line, #eee)" }}>
            {t.type} · {t.amount > 0 ? "+" : ""}{t.amount} · {new Date(t.created_at).toLocaleString()}
          </div>
        ))}
      </div>
    </div>
  );
}

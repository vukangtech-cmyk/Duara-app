// Game.jsx — replaces the Reels tab in Duara.
// Backend is already live in Supabase (tables: rounds, round_entries, coin_wallets, coin_transactions).
// Assumes ../supabaseClient exports `supabase`. `user` = signed-in user (needs `id`).
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export default function Game({ user }) {
  const [coins, setCoins] = useState(0);
  const [rounds, setRounds] = useState([]);
  const [entries, setEntries] = useState({}); // round_id -> [user_id]
  const [names, setNames] = useState({}); // user_id -> display name
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState("");
  const [spin, setSpin] = useState(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const [{ data: w }, { data: r }, { data: e }] = await Promise.all([
      supabase.from("coin_wallets").select("coins").eq("user_id", user.id).maybeSingle(),
      supabase.from("rounds").select("*").order("id", { ascending: false }).limit(20),
      supabase.from("round_entries").select("round_id, user_id"),
    ]);
    setCoins(w?.coins ?? 0);
    setRounds(r ?? []);
    const grouped = {};
    (e ?? []).forEach((x) => (grouped[x.round_id] ||= []).push(x.user_id));
    setEntries(grouped);

    const ids = [
      ...new Set([...(e ?? []).map((x) => x.user_id), ...(r ?? []).map((x) => x.winner_id).filter(Boolean)]),
    ];
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id, display_name, username").in("id", ids);
      setNames(Object.fromEntries((p ?? []).map((x) => [x.id, x.display_name || x.username || "Mchezaji"])));
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    load();
    const ch = supabase
      .channel("duara-game")
      .on("postgres_changes", { event: "*", schema: "public", table: "rounds" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "round_entries" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "coin_wallets", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [load, user?.id]);

  async function runDraw(round) {
    const { data, error } = await supabase.functions.invoke("draw-round", { body: { round_id: round.id } });
    if (error || data?.error) {
      setMsg("Droo imeshindikana, jaribu tena.");
      return;
    }
    await showSpin(round, data?.winner_id);
  }

  async function join(round) {
    if (!user?.id || user.is_guest) {
      setMsg("Tafadhali ingia kwenye akaunti yako ili kucheza.");
      return;
    }
    setBusy(round.id);
    setMsg("");
    const { error } = await supabase.rpc("join_round", { p_round: round.id });
    if (error) {
      setMsg(error.message.includes("not enough coins") ? "Coins hazitoshi. Wasiliana na Vukang kununua coins." : error.message);
      setBusy(null);
      return;
    }
    const count = (entries[round.id]?.length ?? 0) + 1;
    if (count >= round.max_players) await runDraw(round);
    await load();
    setBusy(null);
  }

  async function showSpin(round, winnerId) {
    const { data } = await supabase.from("round_entries").select("user_id").eq("round_id", round.id);
    const ids = (data ?? []).map((x) => x.user_id);
    const { data: p } = await supabase.from("profiles").select("id, display_name, username").in("id", ids);
    const map = Object.fromEntries((p ?? []).map((x) => [x.id, x.display_name || x.username || "Mchezaji"]));
    const list = ids.map((id) => map[id] ?? "Mchezaji");
    const winner = map[winnerId] ?? "Mchezaji";
    let i = 0;
    const t = setInterval(() => {
      setSpin({ current: list[i % list.length], done: false });
      i++;
    }, 90);
    setTimeout(() => {
      clearInterval(t);
      setSpin({ current: winner, done: true });
    }, 3500);
  }

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>🎰 Duara Droo</h2>
        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--primary, #10b981)" }}>🪙 {coins.toLocaleString()}</div>
      </div>
      <p style={{ fontSize: 13, opacity: 0.7 }}>
        Ingia raundi kwa coins. Raundi ikijaa, mshindi mmoja anachaguliwa na mfumo.
      </p>

      {msg && <div style={{ background: "#fee", padding: 8, borderRadius: 8, marginBottom: 8, color: "#b91c1c" }}>{msg}</div>}

      {spin && (
        <div style={{ textAlign: "center", padding: 20, margin: "12px 0", borderRadius: 12, background: "#111", color: "#fff" }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{spin.current}</div>
          {spin.done && (
            <>
              <div style={{ marginTop: 8 }}>🏆 Mshindi!</div>
              <button className="button button-primary" onClick={() => setSpin(null)} style={{ marginTop: 12, padding: "8px 16px" }}>Sawa</button>
            </>
          )}
        </div>
      )}

      {rounds.length === 0 && <p style={{ opacity: 0.6 }}>Hakuna raundi kwa sasa. Rudi baadaye.</p>}

      {rounds.map((r) => {
        const players = entries[r.id] ?? [];
        const joined = user?.id ? players.includes(user.id) : false;
        const full = players.length >= r.max_players;
        const prizeNow = Math.floor((r.entry_fee * r.max_players * r.prize_percent) / 100);
        return (
          <div key={r.id} style={{ border: "1px solid var(--line, #ddd)", borderRadius: 12, padding: 12, marginBottom: 10, background: "var(--card-bg, #fff)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Raundi #{r.id}</strong>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{r.status === "open" ? "🟢 Wazi" : r.status === "drawn" ? "✅ Imekwisha" : "⛔ Imefutwa"}</span>
            </div>
            <div style={{ fontSize: 14, margin: "6px 0" }}>
              Ada: 🪙 {r.entry_fee} · Zawadi: 🪙 {prizeNow} · Wachezaji: {players.length}/{r.max_players}
            </div>
            {r.status === "drawn" && <div style={{ fontSize: 13, color: "var(--primary, #10b981)" }}>🏆 Mshindi: {names[r.winner_id] ?? "—"}</div>}
            {r.status === "open" && full && (
              <button className="button button-primary" onClick={() => runDraw(r)} style={{ width: "100%", padding: 10 }}>Anza droo</button>
            )}
            {r.status === "open" && !full && (
              <button className="button button-primary" disabled={joined || busy === r.id} onClick={() => join(r)} style={{ width: "100%", padding: 10 }}>
                {joined ? "Umeshaingia" : busy === r.id ? "Inaingia..." : `Ingia (🪙 ${r.entry_fee})`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

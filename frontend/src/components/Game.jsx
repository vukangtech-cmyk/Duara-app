// Game.jsx — Duara Droo (replaces the Reels tab).
// Backend tables: rounds, round_entries, coin_wallets, coin_transactions. `user` = signed-in profile (needs `id`).
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { gameAudio } from "../lib/gameAudio";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString("sw-TZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";

const css = `
@keyframes duaraPop { 0%{transform:scale(.6);opacity:0} 60%{transform:scale(1.06);opacity:1} 100%{transform:scale(1)} }
@keyframes duaraBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
@keyframes duaraShine { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
.duara-win { background: linear-gradient(110deg,#f9d423,#ff8c00,#ff4e50,#ff8c00,#f9d423); background-size: 200% 100%; animation: duaraPop .55s ease-out, duaraShine 4s linear infinite; }
.duara-emoji-row span { display:inline-block; font-size:30px; animation: duaraBounce 1.1s ease-in-out infinite; }
.duara-emoji-row span:nth-child(2){animation-delay:.12s}
.duara-emoji-row span:nth-child(3){animation-delay:.24s}
.duara-emoji-row span:nth-child(4){animation-delay:.36s}
.duara-emoji-row span:nth-child(5){animation-delay:.48s}
`;

export default function Game({ user }) {
  const [coins, setCoins] = useState(0);
  const [rounds, setRounds] = useState([]); // open rounds
  const [entries, setEntries] = useState({}); // round_id -> [user_id]
  const [history, setHistory] = useState([]); // drawn rounds, newest first
  const [unseenWins, setUnseenWins] = useState([]); // my prizes not acknowledged yet
  const [unseenLosses, setUnseenLosses] = useState([]); // drawn rounds I played and lost, not acknowledged yet
  const [stats, setStats] = useState({ wins: 0, total: 0 });
  const [names, setNames] = useState({}); // user_id -> display name
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState("");
  const [spin, setSpin] = useState(null);
  const [muted, setMuted] = useState(() => gameAudio.isMuted());

  const userId = user?.id;

  const toggleSound = () => {
    const next = gameAudio.toggleMute();
    setMuted(next);
    if (!next) {
      gameAudio.playButtonClick();
    }
  };

  const load = useCallback(async () => {
    if (!userId) return;

    const { data: r } = await supabase
      .from("rounds")
      .select("*")
      .eq("status", "open")
      .order("id", { ascending: false })
      .limit(20);
    const openRounds = r ?? [];
    const openIds = openRounds.map((x) => x.id);

    const [wallet, entriesRes, hist, unseen, mine, myUnseenEntries] = await Promise.all([
      supabase.from("coin_wallets").select("coins").eq("user_id", userId).maybeSingle(),
      openIds.length
        ? supabase.from("round_entries").select("round_id, user_id").in("round_id", openIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from("rounds")
        .select("id, entry_fee, max_players, prize, winner_id, drawn_at")
        .eq("status", "drawn")
        .order("drawn_at", { ascending: false })
        .limit(20),
      supabase
        .from("coin_transactions")
        .select("id, amount, round_id")
        .eq("user_id", userId)
        .eq("type", "prize")
        .is("seen_at", null)
        .order("id", { ascending: false }),
      supabase.from("coin_transactions").select("amount").eq("user_id", userId).eq("type", "prize"),
      supabase.from("round_entries").select("round_id").eq("user_id", userId).is("seen_at", null),
    ]);

    setCoins(wallet.data?.coins ?? 0);
    setRounds(openRounds);

    const grouped = {};
    (entriesRes.data ?? []).forEach((x) => (grouped[x.round_id] ||= []).push(x.user_id));
    setEntries(grouped);

    const drawn = hist.data ?? [];
    setHistory(drawn);
    setUnseenWins(unseen.data ?? []);
    const mineRows = mine.data ?? [];
    setStats({ wins: mineRows.length, total: mineRows.reduce((s, x) => s + Number(x.amount), 0) });

    // Rounds I joined, that are finished, that I did not win, and I have not yet acknowledged
    let losses = [];
    const pendingIds = (myUnseenEntries.data ?? []).map((x) => x.round_id);
    if (pendingIds.length) {
      const { data: done } = await supabase
        .from("rounds")
        .select("id, winner_id, prize")
        .in("id", pendingIds)
        .eq("status", "drawn");
      losses = (done ?? []).filter((x) => x.winner_id && x.winner_id !== userId);
    }
    setUnseenLosses(losses);

    const ids = [
      ...new Set([
        ...(entriesRes.data ?? []).map((x) => x.user_id),
        ...drawn.map((x) => x.winner_id).filter(Boolean),
        ...losses.map((x) => x.winner_id),
      ]),
    ];
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id, display_name, username").in("id", ids);
      setNames(Object.fromEntries((p ?? []).map((x) => [x.id, x.display_name || x.username || "Mchezaji"])));
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    load();
    // Any round change (join, draw, cancel) refreshes everyone, so winners and losers see their notice instantly.
    const ch = supabase
      .channel("duara-game")
      .on("postgres_changes", { event: "*", schema: "public", table: "rounds" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "round_entries" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "coin_wallets", filter: `user_id=eq.${userId}` }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [load, userId]);

  async function acknowledge() {
    gameAudio.playButtonClick();
    await supabase.rpc("mark_results_seen");
    setUnseenWins([]);
    setUnseenLosses([]);
    load();
  }

  async function closeSpin() {
    gameAudio.playButtonClick();
    setSpin(null);
    await acknowledge(); // the spin already told this player the result
  }

  async function runDraw(round) {
    gameAudio.playButtonClick();
    const { data, error } = await supabase.functions.invoke("draw-round", { body: { round_id: round.id } });
    if (error || data?.error) {
      setMsg("Droo imeshindikana, jaribu tena.");
      return;
    }
    await showSpin(round, data?.winner_id);
  }

  async function join(round) {
    gameAudio.playButtonClick();
    if (!userId || user?.is_guest) {
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
    gameAudio.playJoinRound();
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
    const prize = Math.floor((round.entry_fee * round.max_players * round.prize_percent) / 100);
    let i = 0;
    gameAudio.playDrumRoll();
    const t = setInterval(() => {
      gameAudio.playSpinTick();
      setSpin({ current: list[i % list.length], done: false });
      i++;
    }, 90);
    setTimeout(() => {
      clearInterval(t);
      setSpin({ current: winner, done: true, winnerId, prize, roundId: round.id });
      if (winnerId === userId) {
        gameAudio.playWinFanfare();
      } else {
        gameAudio.playLoseSound();
      }
    }, 3500);
  }

  const card = { border: "1px solid var(--line, #ddd)", borderRadius: 12, padding: 12, marginBottom: 10, background: "var(--card-bg, #fff)" };

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: "0 auto" }}>
      <style>{css}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>🎰 Duara Droo</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={toggleSound}
            className="button button-soft"
            style={{
              padding: "5px 10px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 4,
              border: "1px solid var(--line)"
            }}
            title={muted ? "Washa sauti ya mchezo" : "Zima sauti ya mchezo"}
          >
            <span>{muted ? "🔇" : "🔊"}</span>
            <span>{muted ? "Kimya" : "Sauti"}</span>
          </button>
          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--primary, #10b981)" }}>🪙 {coins.toLocaleString()}</div>
        </div>
      </div>
      <p style={{ fontSize: 13, opacity: 0.7 }}>
        Ingia raundi kwa coins. Raundi ikijaa, mshindi mmoja anachaguliwa na mfumo.
      </p>

      {stats.wins > 0 && (
        <div style={{ fontSize: 13, marginBottom: 10 }}>
          🏅 Ushindi wako: <b>{stats.wins}</b> · Jumla: <b>🪙 {stats.total.toLocaleString()}</b>
        </div>
      )}

      {msg && <div style={{ background: "#fee", padding: 8, borderRadius: 8, marginBottom: 8, color: "#b91c1c" }}>{msg}</div>}

      {/* WINNER notice (shown after the spin animation has finished) */}
      {!spin &&
        unseenWins.map((w) => (
          <div
            key={w.id}
            className="duara-win"
            style={{ color: "#2b1a00", padding: 16, borderRadius: 14, marginBottom: 12, textAlign: "center", boxShadow: "0 6px 18px rgba(255,140,0,.35)" }}
          >
            <div className="duara-emoji-row">
              <span>🎉</span><span>🥳</span><span>🏆</span><span>🥳</span><span>🎉</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, margin: "6px 0" }}>HONGERA SANA! 🎊</div>
            <div style={{ fontSize: 16 }}>
              Umeshinda 💰 <b>🪙 {Number(w.amount).toLocaleString()}</b> kwenye Raundi #{w.round_id}! 🙌
            </div>
            <div style={{ fontSize: 14, margin: "8px 0 12px" }}>
              Bahati imekuangukia wewe leo 🍀✨ Coins zako tayari ziko kwenye wallet yako 💸🔥
            </div>
            <button className="button button-primary" onClick={acknowledge} style={{ padding: "8px 22px", fontWeight: 700, borderRadius: 999 }}>
              Asante! 🙏
            </button>
          </div>
        ))}

      {/* NON-WINNER notice */}
      {!spin &&
        unseenLosses.map((l) => (
          <div
            key={l.id}
            style={{ background: "var(--card-hover, #eef2f7)", color: "var(--ink, #243b53)", padding: 14, borderRadius: 12, marginBottom: 12, textAlign: "center", animation: "duaraPop .45s ease-out", border: "1px solid var(--line, #ddd)" }}
          >
            <div style={{ fontSize: 20, fontWeight: 800 }}>😔 Hukushinda Raundi #{l.id}</div>
            <div style={{ margin: "6px 0" }}>
              🏆 Mshindi: <b>{names[l.winner_id] ?? "Mchezaji"}</b> (🪙 {Number(l.prize).toLocaleString()})
            </div>
            <div style={{ fontSize: 14, marginBottom: 10 }}>
              Usikate tamaa, bahati inayofuata ni yako! 💪🍀 Jaribu tena!
            </div>
            <button className="button button-soft" onClick={acknowledge} style={{ padding: "6px 20px", borderRadius: 999 }}>Sawa 👍</button>
          </div>
        ))}

      {/* Spin overlay for the player who completed the round */}
      {spin && (
        <div style={{ textAlign: "center", padding: 20, margin: "12px 0", borderRadius: 12, background: "#111", color: "#fff" }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{spin.current}</div>
          {spin.done && spin.winnerId === userId && (
            <div className="duara-win" style={{ color: "#2b1a00", marginTop: 14, padding: 14, borderRadius: 12 }}>
              <div className="duara-emoji-row">
                <span>🎉</span><span>🥳</span><span>🏆</span><span>🥳</span><span>🎉</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, margin: "6px 0" }}>HONGERA SANA, WEWE NDIYE MSHINDI! 🎊</div>
              <div style={{ fontSize: 16 }}>
                Umeshinda 💰 <b>🪙 {Number(spin.prize).toLocaleString()}</b> 🙌🔥
              </div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Coins zimeingia kwenye wallet yako 💸✨</div>
            </div>
          )}
          {spin.done && spin.winnerId !== userId && (
            <div style={{ marginTop: 12 }}>
              <div>🏆 Mshindi ni <b>{spin.current}</b></div>
              <div style={{ fontSize: 14, marginTop: 6, opacity: 0.9 }}>
                😔 Pole, hukushinda safari hii. Bahati inayofuata ni yako! 💪🍀
              </div>
            </div>
          )}
          {spin.done && (
            <button className="button button-primary" onClick={closeSpin} style={{ marginTop: 14, padding: "6px 22px", borderRadius: 999 }}>
              {spin.winnerId === userId ? "Asante! 🙏" : "Sawa 👍"}
            </button>
          )}
        </div>
      )}

      <h3 style={{ margin: "16px 0 8px" }}>Raundi Wazi</h3>
      {rounds.length === 0 && <p style={{ opacity: 0.6 }}>Hakuna raundi wazi kwa sasa. Rudi baadaye.</p>}

      {rounds.map((r) => {
        const players = entries[r.id] ?? [];
        const joined = userId ? players.includes(userId) : false;
        const full = players.length >= r.max_players;
        const prizeNow = Math.floor((r.entry_fee * r.max_players * r.prize_percent) / 100);
        return (
          <div key={r.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Raundi #{r.id}</strong>
              <span style={{ fontSize: 12, fontWeight: 700 }}>🟢 Wazi</span>
            </div>
            <div style={{ fontSize: 14, margin: "6px 0" }}>
              Ada: 🪙 {r.entry_fee} · Zawadi: 🪙 {prizeNow} · Wachezaji: {players.length}/{r.max_players}
            </div>
            {full ? (
              <button className="button button-primary" onClick={() => runDraw(r)} style={{ width: "100%", padding: 10 }}>Anza droo</button>
            ) : (
              <button className="button button-primary" disabled={joined || busy === r.id} onClick={() => join(r)} style={{ width: "100%", padding: 10 }}>
                {joined ? "Umeshaingia" : busy === r.id ? "Inaingia..." : `Ingia (🪙 ${r.entry_fee})`}
              </button>
            )}
          </div>
        );
      })}

      <h3 style={{ margin: "22px 0 8px" }}>🏆 Washindi wa Zamani</h3>
      {history.length === 0 && <p style={{ opacity: 0.6 }}>Bado hakuna mshindi. Uwe wa kwanza!</p>}
      {history.map((h) => {
        const mine = userId && h.winner_id === userId;
        return (
          <div
            key={h.id}
            style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", background: mine ? "rgba(251, 191, 36, 0.15)" : undefined, border: mine ? "1px solid rgba(251, 191, 36, 0.5)" : undefined }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>
                {names[h.winner_id] ?? "Mchezaji"} {mine && "(Wewe 🎉)"}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Raundi #{h.id} · {h.max_players} wachezaji · {fmtDate(h.drawn_at)}
              </div>
            </div>
            <div style={{ fontWeight: 800 }}>🪙 {Number(h.prize).toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
}

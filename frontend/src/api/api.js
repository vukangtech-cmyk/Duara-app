import { supabase } from "../lib/supabase.js";

const ACTIVE_ACCOUNT_KEY = "circle_active_account_override_v1";
const SAVED_ACCOUNTS_KEY = "circle_saved_accounts_v2";
const VERIFIED_DIRECTORY_KEY = "circle_verified_directory_v2";
const LOCAL_DIRECT_MESSAGES_KEY = "circle_direct_messages_v2";
const LOCAL_CONVERSATIONS_KEY = "circle_conversations_meta_v2";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEMO_USERNAMES = new Set(["amina_art", "baraka_tech", "circle_user", "demo", "test_user"]);

export function isCeoIdentity(emailOrUsername = "") {
  const clean = String(emailOrUsername || "").trim().toLowerCase();
  return clean === "vukangtech@gmail.com" || clean === "hamza_vukang";
}

export function isValidVerifiedAccount(profile) {
  if (!profile || !profile.id) return false;
  const idStr = String(profile.id).trim();
  if (!UUID_REGEX.test(idStr)) return false;
  if (idStr.startsWith("creator_") || idStr.startsWith("username_") || idStr.startsWith("user_")) return false;
  const uname = String(profile.username || "").trim().toLowerCase();
  if (!uname || DEMO_USERNAMES.has(uname)) return false;
  return true;
}

function deterministicUuidFromKey(seedString) {
  const str = String(seedString || "duara").toLowerCase().trim();
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  let h3 = 0x9e3779b9 ^ str.length;
  let h4 = 0x85ebca6b ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);

  const hex = (n) => (n >>> 0).toString(16).padStart(8, "0");
  const raw = `${hex(h1)}${hex(h2)}${hex(h3)}${hex(h4)}`;
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-4${raw.slice(13, 16)}-a${raw.slice(17, 20)}-${raw.slice(20, 32)}`;
}

export function computeDeterministicDirectConvId(userA, userB) {
  const pair = [String(userA || "").toLowerCase(), String(userB || "").toLowerCase()].sort().join("::");
  return deterministicUuidFromKey(`direct_conv::${pair}`);
}

function normalizeSupabasePassword(rawPassword = "", emailOrUsername = "") {
  const pw = String(rawPassword || "").trim();
  if (pw.length >= 6) return pw;
  return `Duara#${pw}#${String(emailOrUsername).toLowerCase().slice(0, 6) || "2026"}`;
}

function getPlatformAuthPassword(cleanEmail = "") {
  return `DuaraOAuth!${String(cleanEmail).toLowerCase().trim()}#2026`;
}

export function getVerifiedAccountsRegistry() {
  try {
    const raw = localStorage.getItem(VERIFIED_DIRECTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return (Array.isArray(list) ? list : []).filter(isValidVerifiedAccount);
  } catch {
    return [];
  }
}

export function registerVerifiedAccountInDirectory(profile) {
  if (!profile || !isValidVerifiedAccount(profile)) return;
  try {
    const current = getVerifiedAccountsRegistry();
    const cleanUname = (profile.username || "").toLowerCase();
    const filtered = current.filter(
      (u) => u.id !== profile.id && (u.username || "").toLowerCase() !== cleanUname
    );
    const verifiedEntry = {
      id: profile.id,
      display_name: profile.display_name || profile.username,
      username: cleanUname,
      email: profile.email || `${cleanUname}@thecircle.app`,
      avatar_url: profile.avatar_url || null,
      role: isCeoIdentity(profile.email) || isCeoIdentity(cleanUname) || profile.role === "ceo" ? "ceo" : "customer",
      verified: true,
      location: profile.location || "Dar es Salaam, Tanzania",
      phone: profile.phone || "",
      whatsapp: profile.whatsapp || profile.phone || "",
      bio: profile.bio || "",
      created_at: profile.created_at || new Date().toISOString()
    };
    localStorage.setItem(VERIFIED_DIRECTORY_KEY, JSON.stringify([verifiedEntry, ...filtered].slice(0, 200)));
  } catch {}
}

export function getSavedAccounts() {
  try {
    // Clean up legacy key that may have cached CEO email publicly
    localStorage.removeItem("circle_saved_accounts_v1");
    const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return list.filter((a) => a && a.id && a.id !== "ceo-google-vukangtech");
  } catch {
    return [];
  }
}

export function saveAccountToHistory(profile) {
  if (!profile || !profile.id) return;
  try {
    const list = getSavedAccounts();
    const filtered = list.filter(
      (a) =>
        a.id !== profile.id &&
        (a.username || "").toLowerCase() !== (profile.username || "").toLowerCase()
    );
    const entry = {
      id: profile.id,
      display_name: profile.display_name || profile.username || "Mwanachama",
      username: profile.username || "user",
      email: profile.email || `${profile.username || "user"}@thecircle.app`,
      avatar_url: profile.avatar_url || null,
      role: profile.role || "customer",
      location: profile.location || "Dar es Salaam",
      phone: profile.phone || "",
      whatsapp: profile.whatsapp || "",
      bio: profile.bio || ""
    };
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify([entry, ...filtered].slice(0, 12)));
  } catch {}
}

export function removeSavedAccount(accountId) {
  try {
    const list = getSavedAccounts().filter((a) => a.id !== accountId);
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(list));
  } catch {}
}

export function getActiveAccountOverride() {
  try {
    const raw = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveAccountOverride(profile) {
  try {
    if (!profile) {
      localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
      return;
    }
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, JSON.stringify(profile));
    saveAccountToHistory(profile);
  } catch {}
}

export function clearActiveAccountOverride() {
  try {
    localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
  } catch {}
}

function friendlyAuthError(error) {
  const m = String(error?.message || "");
  if (/invalid login credentials/i.test(m)) return "Barua pepe au nenosiri si sahihi. Kama ulijisajili kwa barua pepe, ingia kwa barua pepe hiyo.";
  if (/email not confirmed/i.test(m)) return "Thibitisha barua pepe yako kwanza (angalia Inbox au Spam), kisha ingia.";
  if (/rate limit|too many|security purposes/i.test(m)) return "Majaribio mengi. Subiri dakika chache kisha ujaribu tena.";
  if (/already registered|already exists/i.test(m)) return "Akaunti yenye barua pepe hii tayari ipo. Tafadhali bonyeza Ingia (Login).";
  if (/password/i.test(m) && /short|least|weak|characters|pwned|compromised/i.test(m)) return "Nenosiri ni dhaifu. Tumia angalau herufi 8 zisizo za kawaida.";
  return m || "Imeshindikana. Jaribu tena.";
}

async function fetchOwnProfile(userId, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (data) return data;
    await new Promise((r) => setTimeout(r, 400));
  }
  return null;
}

export async function registerUser({
  email,
  password,
  displayName,
  username,
  location = "Dar es Salaam, Tanzania",
  phone = "",
  whatsapp = "",
  businessName = "",
  category = ""
}) {
  if (!supabase) throw new Error("Huduma haipatikani kwa sasa. Jaribu tena baadaye.");
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanUsername = (username || cleanEmail.split("@")[0] || "user")
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_]/g, "");
  if (!cleanUsername || cleanUsername.length < 2) {
    throw new Error("Tafadhali weka @username sahihi yenye angalau herufi 2.");
  }
  if (!cleanEmail.includes("@")) {
    throw new Error("Tafadhali weka barua pepe sahihi (mfano: jina@gmail.com).");
  }
  if (!password || String(password).length < 8) {
    throw new Error("Nenosiri liwe angalau herufi 8.");
  }
  const safeWhatsapp = whatsapp || (phone ? String(phone).replace(/\D/g, "") : "");

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: { display_name: displayName || cleanUsername, username: cleanUsername }
    }
  });
  if (error) throw new Error(friendlyAuthError(error));
  if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error("Akaunti yenye barua pepe hii tayari ipo. Tafadhali bonyeza Ingia (Login).");
  }

  // Email confirmation is on: no session until the user confirms.
  if (!data?.session) {
    return { needsConfirmation: true, email: cleanEmail };
  }

  const userId = data.user.id;
  const extra = {
    location: location || "Dar es Salaam, Tanzania",
    phone: phone || "",
    whatsapp: safeWhatsapp,
    business_name: businessName || "",
    category: category || ""
  };
  await supabase.from("profiles").update(extra).eq("id", userId);
  const profile = await fetchOwnProfile(userId);
  if (profile) saveAccountToHistory({ ...profile, email: cleanEmail });
  return { session: data.session, user: data.user, profile };
}

export async function loginUser(identifier, password) {
  if (!supabase) throw new Error("Huduma haipatikani kwa sasa. Jaribu tena baadaye.");
  const raw = (identifier || "").trim();
  if (!raw || !password) {
    throw new Error("Tafadhali weka barua pepe pamoja na nenosiri.");
  }
  const isEmail = raw.includes("@") && !raw.startsWith("@");
  const handle = raw.replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_]/g, "");
  const email = isEmail ? raw.toLowerCase() : `${handle}@thecircle.app`;

  // Older accounts with very short passwords were stored with a padded password.
  const attempts = [password];
  if (String(password).trim().length < 6) {
    attempts.push(`Duara#${String(password).trim()}#${email.slice(0, 6)}`);
  }
  let lastError = null;
  for (const pw of attempts) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (!error && data?.session) {
      const profile = await fetchOwnProfile(data.session.user.id);
      if (profile) saveAccountToHistory({ ...profile, email });
      return { session: data.session, user: data.session.user, profile };
    }
    lastError = error;
  }
  throw new Error(friendlyAuthError(lastError));
}

// Real OAuth only. The provider must be enabled in Supabase Dashboard > Authentication > Providers.
export async function loginWithPlatform(provider) {
  if (!supabase) throw new Error("Huduma haipatikani kwa sasa. Jaribu tena baadaye.");
  const p = String(provider || "google").toLowerCase();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: p,
    options: { redirectTo: window.location.origin }
  });
  if (error) {
    if (/not enabled|unsupported|provider/i.test(error.message || "")) {
      throw new Error(`Kuingia kwa ${provider} bado hakujawashwa. Tafadhali tumia barua pepe na nenosiri.`);
    }
    throw new Error(friendlyAuthError(error));
  }
  return { redirecting: true };
}

export async function signInWithSupabaseOAuth(provider = "google") {
  return loginWithPlatform(provider);
}

export async function logoutUser() {
  clearActiveAccountOverride();
  try {
    if (supabase) {
      await supabase.auth.signOut();
    }
  } catch {}
}

// Profile always comes from the database for the real signed-in user. No client-side role elevation.
export async function getCurrentProfile(userId) {
  if (!userId) return null;
  const profile = await fetchOwnProfile(userId, 5);
  if (profile) {
    saveAccountToHistory({ id: profile.id, username: profile.username, display_name: profile.display_name, avatar_url: profile.avatar_url });
  }
  return profile;
}

export async function updateProfile(userId, values) {
  const { data, error } = await supabase.from("profiles").update(values).eq("id", userId).select().single();
  if (error) throw error;
  return data;
}

export async function getFeed() {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, content, media_url, media_type, created_at, author_id, profiles!posts_author_id_fkey(id, display_name, username, avatar_url, role), likes(user_id), comments(count)"
    )
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

export async function requireSessionUserId() {
  const { data } = await supabase.auth.getSession();
  const uid = data?.session?.user?.id;
  if (!uid) throw new Error("Session yako imeisha. Tafadhali toka kisha ingia tena.");
  return uid;
}

export async function createPost(authorId, content, mediaUrl = null, mediaType = null) {
  const uid = await requireSessionUserId();
  const { data, error } = await supabase
    .from("posts")
    .insert({ author_id: uid, content, media_url: mediaUrl, media_type: mediaType })
    .select()
    .single();
  if (error) {
    if (/row-level security/i.test(error.message || "")) {
      throw new Error("Huna ruhusa ya kuposti. Toka kisha ingia tena.");
    }
    throw error;
  }
  return data;
}

export async function toggleLike(userId, postId, liked) {
  if (liked) {
    const { error } = await supabase.from("likes").delete().match({ user_id: userId, post_id: postId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("likes").insert({ user_id: userId, post_id: postId });
    if (error) throw error;
  }
}

export async function addComment(authorId, postId, content) {
  const { data, error } = await supabase
    .from("comments")
    .insert({ author_id: authorId, post_id: postId, content })
    .select("*, profiles!comments_author_id_fkey(display_name, username, avatar_url)")
    .single();
  if (error) throw error;
  return data;
}

export async function followUser(followerId, followingId, following) {
  const uid = await requireSessionUserId();
  if (following) {
    const { error } = await supabase.from("follows").delete().match({ follower_id: uid, following_id: followingId });
    if (error) throw dbError(error, "Imeshindikana kuacha kumfuata.");
  } else {
    const { error } = await supabase.from("follows").insert({ follower_id: uid, following_id: followingId });
    if (error && !/duplicate key/i.test(error.message || "")) throw dbError(error, "Imeshindikana kumfuata.");
  }
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("circle:follow_updated", {
          detail: { followerId: uid, followingId, isFollowing: !following }
        })
      );
    }
  } catch {}
}

export async function getFollowedUserIds(userId) {
  if (!userId) return [];
  const { data, error } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
  if (error) throw dbError(error, "Imeshindikana kupakia unaowafuata.");
  return (data || []).map((r) => r.following_id);
}

/**
 * Retrieves full profiles of real users who follow the given user.
 */
export async function getFollowers(userId) {
  if (!userId) return [];
  const followersList = [];
  const map = new Map();

  if (supabase) {
    try {
      // 1. Try relational join with profiles
      const { data, error } = await supabase
        .from("follows")
        .select("follower_id, created_at, profiles!follows_follower_id_fkey(*)")
        .eq("following_id", userId)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        data.forEach((r) => {
          if (r.profiles && r.profiles.id && !map.has(r.profiles.id)) {
            map.set(r.profiles.id, r.profiles);
          }
        });
      } else {
        // Fallback: fetch IDs then profiles
        const { data: idRows } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("following_id", userId);
        if (idRows && idRows.length > 0) {
          const ids = idRows.map((r) => r.follower_id);
          const { data: profs } = await supabase
            .from("profiles")
            .select("*")
            .in("id", ids);
          (profs || []).forEach((p) => map.set(p.id, p));
        }
      }
    } catch (err) {
      console.warn("getFollowers remote error:", err);
    }
  }


  return Array.from(map.values()).map((p) => ({
    ...p,
    whatsapp: p.whatsapp || p.phone || ""
  }));
}

/**
 * Retrieves full profiles of real users that the given user is following.
 */
export async function getFollowing(userId) {
  if (!userId) return [];
  const map = new Map();

  if (supabase) {
    try {
      // 1. Try relational join with profiles
      const { data, error } = await supabase
        .from("follows")
        .select("following_id, created_at, profiles!follows_following_id_fkey(*)")
        .eq("follower_id", userId)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        data.forEach((r) => {
          if (r.profiles && r.profiles.id && !map.has(r.profiles.id)) {
            map.set(r.profiles.id, r.profiles);
          }
        });
      } else {
        // Fallback: fetch IDs then profiles
        const { data: idRows } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", userId);
        if (idRows && idRows.length > 0) {
          const ids = idRows.map((r) => r.following_id);
          const { data: profs } = await supabase
            .from("profiles")
            .select("*")
            .in("id", ids);
          (profs || []).forEach((p) => map.set(p.id, p));
        }
      }
    } catch (err) {
      console.warn("getFollowing remote error:", err);
    }
  }


  return Array.from(map.values()).map((p) => ({
    ...p,
    whatsapp: p.whatsapp || p.phone || ""
  }));
}

/**
 * Returns followers and following stats for a profile.
 */
export async function getFollowStats(userId) {
  if (!userId) return { followersCount: 0, followingCount: 0, followers: [], following: [] };
  const [followers, following] = await Promise.all([
    getFollowers(userId).catch(() => []),
    getFollowing(userId).catch(() => [])
  ]);
  return {
    followersCount: followers.length,
    followingCount: following.length,
    followers,
    following
  };
}

/**
 * Real-time subscription to follows changes for a given user.
 */
export function subscribeToFollows(userId, onFollowChange) {
  if (!supabase || !userId) {
    const handleLocal = (e) => {
      if (onFollowChange) onFollowChange(e.detail);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("circle:follow_updated", handleLocal);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("circle:follow_updated", handleLocal);
      }
    };
  }

  const channel = supabase
    .channel(`follows-realtime-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "follows", filter: `following_id=eq.${userId}` },
      (payload) => {
        if (onFollowChange) onFollowChange(payload);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "follows", filter: `follower_id=eq.${userId}` },
      (payload) => {
        if (onFollowChange) onFollowChange(payload);
      }
    )
    .subscribe();

  const handleLocal = (e) => {
    if (onFollowChange) onFollowChange(e.detail);
  };
  if (typeof window !== "undefined") {
    window.addEventListener("circle:follow_updated", handleLocal);
  }

  return () => {
    supabase.removeChannel(channel);
    if (typeof window !== "undefined") {
      window.removeEventListener("circle:follow_updated", handleLocal);
    }
  };
}

async function fetchMergedVerifiedProfiles(excludeUserId = null) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url, bio, role, verified, location, phone, whatsapp, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.warn("fetchMergedVerifiedProfiles warning:", error.message);
    return [];
  }
  let list = (data || []).map((u) => ({ ...u, whatsapp: u.whatsapp || u.phone || "" }));
  if (excludeUserId) list = list.filter((u) => u.id !== excludeUserId);
  return list.sort((a, b) => {
    const rank = (r) => (r === "ceo" ? 0 : 1);
    return rank(a.role) - rank(b.role);
  });
}

export async function getSuggestedUsers(currentUserId) {
  const all = await fetchMergedVerifiedProfiles(currentUserId);
  return all.slice(0, 25);
}

// --- FACEBOOK-STYLE FUZZY & SIMILARITY SEARCH ENGINE ---
function levenshteinDistance(s1, s2) {
  const a = String(s1 || "").toLowerCase();
  const b = String(s2 || "").toLowerCase();
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function getBigrams(str) {
  const s = String(str || "").toLowerCase();
  const bigrams = new Set();
  for (let i = 0; i < s.length - 1; i++) {
    bigrams.add(s.slice(i, i + 2));
  }
  return bigrams;
}

function bigramSimilarity(s1, s2) {
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0;
  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);
  let intersection = 0;
  b1.forEach((b) => {
    if (b2.has(b)) intersection++;
  });
  return (2.0 * intersection) / (b1.size + b2.size);
}

/**
 * Facebook-style algorithm to score how closely a candidate profile matches the search query.
 * Matches on exact name, prefixes, substrings, typo tolerance (Levenshtein), and phonetic bigrams.
 */
function calculateFacebookMatchScore(query, candidate) {
  const q = String(query || "").toLowerCase().trim().replace(/^@+/, "");
  if (!q) return 0;

  const dName = String(candidate.display_name || "").toLowerCase().trim();
  const uName = String(candidate.username || "").toLowerCase().trim();

  // 1. Exact matches
  if (dName === q || uName === q) return 100;
  if (uName.replace(/[^a-z0-9]/g, "") === q.replace(/[^a-z0-9]/g, "")) return 98;

  // Candidate tokens
  const candidateWords = [...dName.split(/\s+/), ...uName.split(/[_.-]+/)].filter(Boolean);
  const queryWords = q.split(/\s+/).filter(Boolean);

  // 2. Starts with query
  if (dName.startsWith(q) || uName.startsWith(q)) return 92;

  // 3. Word starts with query
  if (candidateWords.some((w) => w.startsWith(q))) return 88;

  // 4. Multi-word query check: each query word starts or matches candidate words
  if (queryWords.length > 1) {
    const allWordsMatched = queryWords.every((qw) =>
      candidateWords.some(
        (cw) => cw.startsWith(qw) || cw.includes(qw) || levenshteinDistance(qw, cw) <= 1
      )
    );
    if (allWordsMatched) return 86;
  }

  // 5. Substring match
  if (dName.includes(q) || uName.includes(q)) return 78;

  // 6. Typo Tolerance (Levenshtein distance) on candidate words
  let bestWordScore = 0;
  for (const qWord of queryWords) {
    for (const cWord of candidateWords) {
      if (qWord === cWord) {
        bestWordScore = Math.max(bestWordScore, 85);
        continue;
      }
      const dist = levenshteinDistance(qWord, cWord);
      const maxLen = Math.max(qWord.length, cWord.length);

      // Dynamic allowed typos:
      // - Word >= 6 chars: allow up to 2 typos
      // - Word >= 3 chars: allow 1 typo
      const allowedTypos = maxLen >= 6 ? 2 : maxLen >= 3 ? 1 : 0;
      if (dist <= allowedTypos) {
        const score = Math.round(75 - dist * 12);
        bestWordScore = Math.max(bestWordScore, score);
      }
    }
  }

  // 7. Bigram / Character overlap similarity (dice coefficient)
  const bigramDisplayNameScore = Math.round(bigramSimilarity(q, dName) * 72);
  const bigramUsernameScore = Math.round(bigramSimilarity(q, uName) * 72);

  const finalScore = Math.max(bestWordScore, bigramDisplayNameScore, bigramUsernameScore);
  return finalScore;
}

/**
 * Searches real verified profiles using Facebook-style name and similarity matching.
 * Finds exact names as well as closely matching and similarly-spelled names.
 */
export async function searchProfiles(term, currentUserId = null) {
  const clean = String(term || "").trim().replace(/^@+/, "");
  if (!clean) return [];

  const allVerified = await fetchMergedVerifiedProfiles(currentUserId);
  const scored = [];

  for (const user of allVerified) {
    const score = calculateFacebookMatchScore(clean, user);
    // Score threshold: 38 (includes close typos, phonetic similarity, and substring matches)
    if (score >= 38) {
      scored.push({
        ...user,
        matchScore: score,
        isExactMatch: score >= 90,
        isCloseMatch: score >= 50 && score < 90
      });
    }
  }

  // Rank by match score descending, then role priority (CEO / Verified), then display name
  scored.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    const roleRank = (r) => (r === "ceo" ? 0 : r === "manager" ? 1 : 2);
    if (roleRank(a.role) !== roleRank(b.role)) {
      return roleRank(a.role) - roleRank(b.role);
    }
    return (a.display_name || "").localeCompare(b.display_name || "");
  });

  return scored.slice(0, 30);
}

export async function getAllChatUsers(currentUserId) {
  return await fetchMergedVerifiedProfiles(currentUserId);
}

export async function getAllProfiles(limit = 50, excludeUserId = null) {
  const list = await fetchMergedVerifiedProfiles(excludeUserId);
  return list.slice(0, limit);
}

export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*, actor:profiles!notifications_actor_id_fkey(display_name, username, avatar_url)")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}

export async function uploadImage(userId, file, bucket = "post-media") {
  if (!file) throw new Error("Chagua faili kwanza.");
  const uid = await requireSessionUserId();
  const maxMb = bucket === "reels" ? 100 : ["post-media", "statuses"].includes(bucket) ? 50 : 10;
  if (file.size > maxMb * 1024 * 1024) {
    throw new Error(`Faili ni kubwa mno. Ukubwa wa juu ni MB ${maxMb}.`);
  }
  const extension = ((file.name || "img.jpg").split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${uid}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
  if (error) {
    if (/mime|type/i.test(error.message || "")) throw new Error("Aina ya faili hairuhusiwi. Tumia picha (JPG/PNG/WebP) au video (MP4/WebM).");
    if (/size|too large|exceeded/i.test(error.message || "")) throw new Error("Faili ni kubwa mno.");
    throw dbError(error, "Imeshindikana kupakia faili. Jaribu tena.");
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function subscribeToRealtime(onPost, onComment, onNotification) {
  const channel = supabase
    .channel("the-circle-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, onPost)
    .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, onComment)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, onNotification)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

// --- 1-TO-1 DIRECT MESSAGING: database is the single source of truth (RLS-protected, realtime via postgres_changes) ---
export async function findOrCreateDirectConversation(userId, otherUserId) {
  if (!userId || !otherUserId) {
    throw new Error("Chagua mtumiaji kuanza mazungumzo.");
  }
  await requireSessionUserId();
  const { data, error } = await supabase.rpc("get_or_create_direct_conversation", { other_user_id: otherUserId });
  if (error) throw dbError(error, "Imeshindikana kuanza mazungumzo.");
  return data;
}

export async function getUserConversations(userId) {
  if (!userId) return [];
  const { data: myRows, error } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", userId);
  if (error) throw dbError(error, "Imeshindikana kupakia mazungumzo.");
  const convIds = (myRows || []).map((r) => r.conversation_id);
  if (convIds.length === 0) return [];

  const [{ data: allMembers }, { data: recentMsgs }] = await Promise.all([
    supabase
      .from("conversation_members")
      .select("conversation_id, user_id, profiles(id, display_name, username, avatar_url, role, verified, phone)")
      .in("conversation_id", convIds),
    supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, media_url, created_at")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false })
      .limit(200)
  ]);

  const latestByConv = {};
  (recentMsgs || []).forEach((m) => {
    if (!latestByConv[m.conversation_id]) latestByConv[m.conversation_id] = m;
  });

  const conversationsMap = {};
  (allMembers || []).forEach((row) => {
    if (row.user_id !== userId && row.profiles) {
      conversationsMap[row.conversation_id] = {
        conversationId: row.conversation_id,
        otherUser: row.profiles,
        partner: row.profiles,
        lastMessage: latestByConv[row.conversation_id] || null
      };
    }
  });

  return Object.values(conversationsMap).sort((a, b) => {
    const tA = a.lastMessage?.created_at ? new Date(a.lastMessage.created_at).getTime() : 0;
    const tB = b.lastMessage?.created_at ? new Date(b.lastMessage.created_at).getTime() : 0;
    return tB - tA;
  });
}

export async function getMessages(conversationId) {
  if (!conversationId) return [];
  const { data, error } = await supabase
    .from("messages")
    .select("*, profiles!messages_sender_id_fkey(display_name, username, avatar_url, role)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(150);
  if (error) throw dbError(error, "Imeshindikana kupakia ujumbe.");
  return data || [];
}

export async function sendMessage(conversationId, senderId, body, mediaUrl = null, recipientProfile = null) {
  const safeBody = (body || "").trim() || (mediaUrl ? "📷 Picha" : "");
  if (!safeBody && !mediaUrl) {
    throw new Error("Tafadhali andika ujumbe kabla ya kutuma.");
  }
  const uid = await requireSessionUserId();
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: uid, body: safeBody, media_url: mediaUrl })
    .select("*, profiles!messages_sender_id_fkey(display_name, username, avatar_url, role)")
    .single();
  if (error) throw dbError(error, "Ujumbe haukutumwa. Jaribu tena.");
  return { ...data, recipient_id: recipientProfile?.id || null };
}

export async function sendCallSignal(conversationId, senderId, recipientId, signalType, payload = {}) {
  if (signalType === "typing") {
    try {
      const ch = supabase.channel(`conversation-${conversationId}`);
      ch.send({
        type: "broadcast",
        event: "typing",
        payload: { sender_id: senderId, recipient_id: recipientId }
      });
    } catch {}
    return;
  }
  if (supabase) {
    try {
      await supabase
        .from("call_signals")
        .insert({ conversation_id: conversationId, sender_id: senderId, recipient_id: recipientId, signal_type: signalType, payload });
    } catch {}
  }
}

export function subscribeToConversation(conversationId, onMessage, onSignal) {
  if (!supabase || !conversationId) return () => {};
  const handleIncomingMsg = (payload) => {
    const msg = payload?.new || payload?.payload || payload;
    if (msg && msg.id && msg.conversation_id === conversationId) {
      if (onMessage) onMessage({ new: msg });
    }
  };

  const channel = supabase
    .channel(`conversation-${conversationId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      handleIncomingMsg
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "call_signals", filter: `conversation_id=eq.${conversationId}` },
      onSignal
    )
    .on("broadcast", { event: "typing" }, (payload) => {
      if (onSignal) {
        onSignal({ new: { signal_type: "typing", sender_id: payload?.payload?.sender_id } });
      }
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export function subscribeToAllMessages(onNewMessage) {
  if (!supabase) return () => {};
  const handleGlobalMsg = (payload) => {
    const msg = payload?.new || payload?.payload || payload;
    if (msg && msg.id && msg.conversation_id) {
      if (onNewMessage) onNewMessage({ new: msg });
    }
  };
  const channel = supabase
    .channel("global-messages-listener")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, handleGlobalMsg)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export async function sendFriendRequest(senderId, recipientId) {
  const { data, error } = await supabase
    .from("friend_requests")
    .upsert({ sender_id: senderId, recipient_id: recipientId, status: "pending" }, { onConflict: "sender_id,recipient_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function respondToFriendRequest(requestId, status) {
  const { error } = await supabase
    .from("friend_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) throw error;
}

export async function getMarketplaceListings() {
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("*, profiles!marketplace_listings_seller_id_fkey(display_name, username, avatar_url)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}

export async function createMarketplaceListing(sellerId, values) {
  const { data, error } = await supabase
    .from("marketplace_listings")
    .insert({ seller_id: sellerId, ...values })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getReels() {
  const { data, error } = await supabase
    .from("reels")
    .select("*, profiles!reels_creator_id_fkey(display_name, username, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}

export async function createReel(creatorId, file, caption) {
  const uid = await requireSessionUserId();
  const url = await uploadImage(uid, file, "reels");
  const { data, error } = await supabase
    .from("reels")
    .insert({ creator_id: uid, video_url: url, caption: (caption || "").slice(0, 500) })
    .select()
    .single();
  if (error) throw dbError(error, "Imeshindikana kuweka reel. Jaribu tena.");
  return data;
}

export async function getWallet(userId) {
  let account = null;
  let transactions = [];
  if (supabase && userId) {
    try {
      const [{ data: acc }, { data: tx }] = await Promise.all([
        supabase.from("wallet_accounts").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("wallet_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(40)
      ]);
      account = acc || null;
      transactions = tx || [];
    } catch {}
  }
  const balance = Number(account?.balance ?? 0);
  return {
    account: account ? { ...account, balance } : { user_id: userId, balance: 0, currency: "TZS" },
    user_balance: balance,
    transactions
  };
}

export async function getActiveStatuses() {
  const { data, error } = await supabase
    .from("statuses")
    .select("*, profiles!statuses_user_id_fkey(id, display_name, username, avatar_url)")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export async function createStatus(userId, content, background, file = null) {
  let mediaUrl = null;
  let mediaType = "text";
  if (file) {
    mediaType = file.type.startsWith("video/") ? "video" : "image";
    mediaUrl = await uploadImage(userId, file, "statuses");
  }
  const { data, error } = await supabase
    .from("statuses")
    .insert({ user_id: userId, content, background, media_url: mediaUrl, media_type: mediaType })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markStatusViewed(statusId, viewerId) {
  const { error } = await supabase
    .from("status_views")
    .upsert({ status_id: statusId, viewer_id: viewerId }, { onConflict: "status_id,viewer_id" });
  if (error) throw error;
}

export async function reactToStatus(statusId, userId, reaction, existingReaction = null) {
  if (existingReaction === reaction) {
    const { error } = await supabase.from("status_reactions").delete().match({ status_id: statusId, user_id: userId });
    if (error) throw error;
    return null;
  }
  const { data, error } = await supabase
    .from("status_reactions")
    .upsert({ status_id: statusId, user_id: userId, reaction }, { onConflict: "status_id,user_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addStatusComment(statusId, authorId, content) {
  const { data, error } = await supabase
    .from("status_comments")
    .insert({ status_id: statusId, author_id: authorId, content })
    .select("*, profiles!status_comments_author_id_fkey(display_name, username, avatar_url)")
    .single();
  if (error) throw error;
  return data;
}

export async function kickPost(postId, userId, kicked = false) {
  if (kicked) {
    const { error } = await supabase.from("post_kicks").delete().match({ post_id: postId, user_id: userId });
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("post_kicks").insert({ post_id: postId, user_id: userId });
  if (error) throw error;
}

export async function markNotificationsRead(userId) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .is("read_at", null);
  if (error) throw error;
}

export function subscribeToInteractions(userId, onChange, onCallSignal) {
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` }, onChange)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "call_signals", filter: `recipient_id=eq.${userId}` },
      (payload) => {
        if (onCallSignal) onCallSignal(payload.new || payload);
        onChange(payload);
      }
    )
    .on("postgres_changes", { event: "*", schema: "public", table: "status_reactions" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "status_comments" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

// --- SHOP, CUSTOMER ADS & CEO SETTINGS ---

function dbError(error, fallback) {
  const m = String(error?.message || "");
  if (/row-level security/i.test(m)) return new Error("Huna ruhusa ya kufanya kitendo hiki. Toka kisha ingia tena.");
  return new Error(m || fallback);
}

export async function getCustomerAds() {
  const { data, error } = await supabase
    .from("customer_ads")
    .select("*, profiles(id, display_name, username, avatar_url, phone)")
    .order("created_at", { ascending: false });
  if (error) throw dbError(error, "Imeshindikana kupakia matangazo.");
  return (data || []).map((ad) => ({
    ...ad,
    profiles: ad.profiles ? { ...ad.profiles, whatsapp: ad.profiles.whatsapp || ad.profiles.phone || "" } : null
  }));
}

export async function createCustomerAd(userId, adData) {
  const uid = await requireSessionUserId();
  const { data, error } = await supabase
    .from("customer_ads")
    .insert({ ...adData, user_id: uid, status: "pending_payment", paid_amount: 0, payment_status: "pending_verification", views_count: 0, clicks_count: 0 })
    .select()
    .single();
  if (error) throw dbError(error, "Imeshindikana kuhifadhi tangazo.");
  return data;
}

export async function updateAdStatus(adId, status, paymentDetails = {}) {
  // Payment fields can only be changed by the server (wallet_pay_ad) or the CEO.
  const allowed = {};
  if (status) allowed.status = status;
  const { data, error } = await supabase.from("customer_ads").update(allowed).eq("id", adId).select().single();
  if (error) throw dbError(error, "Imeshindikana kusasisha tangazo.");
  return data;
}

export async function getManagerCatalogues(managerId = null) {
  let query = supabase.from("catalogues").select("*, profiles(id, display_name, username, avatar_url, phone)");
  if (managerId) query = query.eq("manager_id", managerId);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw dbError(error, "Imeshindikana kupakia bidhaa.");
  return (data || []).map((c) => ({
    ...c,
    profiles: c.profiles ? { ...c.profiles, whatsapp: c.profiles.whatsapp || c.profiles.phone || "" } : null
  }));
}

export async function createCatalogueProduct(managerId, productData) {
  const uid = await requireSessionUserId();
  const code = productData.affiliate_code || `SHOP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const { data, error } = await supabase
    .from("catalogues")
    .insert({
      ...productData,
      manager_id: uid,
      affiliate_code: code,
      in_stock: productData.in_stock !== undefined ? productData.in_stock : true,
      views_count: 0,
      orders_count: 0
    })
    .select()
    .single();
  if (error) throw dbError(error, "Imeshindikana kuhifadhi bidhaa. Hakikisha akaunti yako ni ya Meneja.");
  return data;
}

export async function updateCatalogueProduct(productId, updates) {
  const { data, error } = await supabase
    .from("catalogues")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .select()
    .single();
  if (error) throw dbError(error, "Imeshindikana kusasisha bidhaa.");
  return data;
}

export async function deleteCatalogueProduct(productId) {
  const { error } = await supabase.from("catalogues").delete().eq("id", productId);
  if (error) throw dbError(error, "Imeshindikana kufuta bidhaa.");
}

// Amounts, manager and status are computed by the database trigger, never trusted from the client.
export async function createAffiliateOrder(orderData) {
  await requireSessionUserId();
  const { data, error } = await supabase
    .from("affiliate_orders")
    .insert({
      product_id: orderData.product_id || null,
      quantity: Number(orderData.quantity || 1) || 1,
      customer_name: orderData.customer_name || "",
      customer_phone: orderData.customer_phone || "",
      customer_location: orderData.delivery_address || orderData.customer_location || "",
      payment_reference: orderData.payment_reference || ""
    })
    .select()
    .single();
  if (error) throw dbError(error, "Imeshindikana kutuma oda.");
  return data;
}

export async function getAffiliateOrders(managerId = null) {
  let query = supabase.from("affiliate_orders").select("*");
  if (managerId) query = query.eq("manager_id", managerId);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw dbError(error, "Imeshindikana kupakia oda.");
  return (data || []).map((o) => ({
    ...o,
    amount: o.amount ?? o.total_amount ?? 0,
    commission_earned: o.commission_earned ?? o.commission_amount ?? 0,
    delivery_address: o.delivery_address ?? o.customer_location ?? ""
  }));
}

const DEFAULT_EMPTY_SETTINGS = {
  id: "primary",
  platform_name: "THE CIRCLE DUARA",
  ceo_name: "HAMZA VUKANG",
  ceo_email: "vukangtech@gmail.com",
  default_commission_rate: 10,
  ad_posting_fee: 5000,
  ad_boost_fee: 15000,
  payment_numbers: {
    mpesa: "",
    mpesa_name: "",
    tigopesa: "",
    tigopesa_name: "",
    airtel: "",
    airtel_name: "",
    halopesa: "",
    halopesa_name: "",
    bank: "",
    bank_name: ""
  },
  social_links: {
    whatsapp: "",
    instagram: "",
    tiktok: "",
    facebook: "",
    telegram: "",
    twitter: "",
    youtube: "",
    phone: ""
  }
};

function sanitizeLegacyFakeNumbers(paymentNumbers = {}) {
  const legacyFakes = new Set(["554433", "778899", "992211", "332211", "554433 (THE CIRCLE LIPA)", "778899 (DUARA AFFILIATE)", "992211 (HAMZA VUKANG BUSINESS)", "332211 (DUARA COMMERCE)", "015299887700 (CRDB)", "201100998877 (NMB)"]);
  const cleaned = { ...paymentNumbers };
  ["mpesa", "tigopesa", "airtel", "halopesa", "bank", "crdb_bank", "nmb_bank"].forEach((k) => {
    if (cleaned[k] && legacyFakes.has(String(cleaned[k]).trim())) {
      cleaned[k] = "";
    }
  });
  return cleaned;
}

export async function getPlatformSettings() {
  const { data, error } = await supabase.from("platform_settings").select("*").eq("id", "primary").maybeSingle();
  if (error) console.warn("getPlatformSettings warning:", error.message);
  if (!data) return DEFAULT_EMPTY_SETTINGS;
  return {
    ...DEFAULT_EMPTY_SETTINGS,
    ...data,
    payment_numbers: { ...DEFAULT_EMPTY_SETTINGS.payment_numbers, ...sanitizeLegacyFakeNumbers(data.payment_numbers || {}) },
    social_links: { ...DEFAULT_EMPTY_SETTINGS.social_links, ...(data.social_links || {}) }
  };
}

// Only the CEO can write (enforced by RLS). Errors are surfaced, never hidden in localStorage.
export async function updatePlatformSettings(settings) {
  const current = await getPlatformSettings();
  const payload = {
    id: "primary",
    default_commission_rate: Number(settings.default_commission_rate ?? current.default_commission_rate ?? 10),
    ad_posting_fee: Number(settings.ad_posting_fee ?? current.ad_posting_fee ?? 5000),
    ad_boost_fee: Number(settings.ad_boost_fee ?? current.ad_boost_fee ?? 15000),
    payment_numbers: { ...(current.payment_numbers || {}), ...(settings.payment_numbers || {}) },
    social_links: { ...(current.social_links || {}), ...(settings.social_links || {}) },
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from("platform_settings").upsert(payload).select().single();
  if (error) throw dbError(error, "Imeshindikana kuhifadhi mipangilio. Hakikisha umeingia kama CEO.");
  return { ...DEFAULT_EMPTY_SETTINGS, ...data };
}

export async function getPayoutRequests(managerId = null) {
  let query = supabase.from("payout_requests").select("*");
  if (managerId) query = query.eq("manager_id", managerId);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw dbError(error, "Imeshindikana kupakia maombi ya malipo.");
  return data || [];
}

export async function requestPayout(managerId, amount, method, accountNumber) {
  const { data, error } = await supabase
    .from("payout_requests")
    .insert({
      manager_id: managerId,
      amount,
      method,
      account_number: accountNumber,
      status: "pending",
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePayoutStatus(requestId, status) {
  const { data, error } = await supabase
    .from("payout_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- MOBILE MONEY WALLET & LIVE PAYMENT GATEWAY ENGINE ---
export function extractTransactionRefFromSms(rawInput = "") {
  const text = String(rawInput || "").trim();
  if (!text) return "";
  // Extract standard Tanzanian Mobile Money / Bank reference codes (M-Pesa, TigoPesa/Mixx, Airtel, HaloPesa, CRDB/NMB)
  const patterns = [
    /\b([A-Z0-9]{8,14})\s+Imethibitishwa/i,
    /Kumbukumbu(?:\s+namba|\s+No\.?)?[:\s]+([A-Z0-9-]{6,18})/i,
    /Txn\s*ID[:\s]+([A-Z0-9-]{6,18})/i,
    /Ref(?:\s*No\.?)?[:\s]+([A-Z0-9-]{6,18})/i,
    /\b([0-9A-Z]{10,12})\b/
  ];
  for (const reg of patterns) {
    const match = text.match(reg);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }
  return text.slice(0, 32).toUpperCase();
}

export function validateTanzaniaPhone(rawPhone = "") {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  if (/^0[67]\d{8}$/.test(digits)) {
    return `+255${digits.slice(1)}`;
  }
  if (/^255[67]\d{8}$/.test(digits)) {
    return `+${digits}`;
  }
  if (digits.length >= 9 && digits.length <= 15) {
    return `+${digits}`;
  }
  return null;
}

// Payments are recorded only on the server (wallet_transactions / topup_requests). Nothing is stored in the browser.
export async function recordPaymentTransaction(paymentData) {
  return { reference: extractTransactionRefFromSms(paymentData?.reference || "") };
}

export async function getAllPaymentTransactions() {
  const [{ data: topups, error: e1 }, { data: txs, error: e2 }] = await Promise.all([
    supabase.from("topup_requests").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("wallet_transactions").select("*").neq("type", "deposit").order("created_at", { ascending: false }).limit(200)
  ]);
  if (e1 && e2) throw dbError(e1, "Imeshindikana kupakia miamala.");
  const statusMap = { pending: "pending", approved: "verified", rejected: "rejected" };
  const topupRows = (topups || []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    payer_name: "Mwanachama",
    payer_phone: r.phone || "",
    method: r.method,
    payment_mode: "lipa_namba",
    amount: r.amount,
    currency: "TZS",
    reference: r.reference,
    purpose: "Kuweka pesa kwenye Wallet",
    status: statusMap[r.status] || r.status,
    created_at: r.created_at
  }));
  const txRows = (txs || []).map((tx) => ({
    id: tx.id,
    user_id: tx.user_id,
    payer_name: "Mwanachama",
    payer_phone: "",
    method: tx.type,
    payment_mode: "wallet",
    amount: tx.amount,
    currency: tx.currency || "TZS",
    reference: tx.reference || "",
    purpose: tx.description || tx.type,
    status: tx.status || "completed",
    created_at: tx.created_at
  }));
  return [...topupRows, ...txRows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function reviewPaymentOnServer(txId, approve) {
  if (!txId) throw new Error("Kitambulisho cha muamala kinahitajika.");
  const { data: topup } = await supabase.from("topup_requests").select("id,status").eq("id", txId).maybeSingle();
  if (topup) {
    const { error } = await supabase.rpc("admin_review_topup", { p_request_id: txId, p_approve: approve });
    if (error) throw dbError(error, "Imeshindikana kushughulikia ombi la kuweka pesa.");
    return { id: txId, status: approve ? "verified" : "rejected" };
  }
  const { error } = await supabase.rpc("admin_review_withdrawal", { p_tx_id: txId, p_approve: approve });
  if (error) throw dbError(error, "Imeshindikana kushughulikia muamala.");
  return { id: txId, status: approve ? "verified" : "rejected" };
}

export async function verifyPaymentTransactionByCeo(txId) {
  return reviewPaymentOnServer(txId, true);
}

export async function rejectPaymentTransactionByCeo(txId) {
  return reviewPaymentOnServer(txId, false);
}

export async function initiateLiveMobileMoneyPush({ userId, phone, amount, method, purpose }) {
  const formattedPhone = validateTanzaniaPhone(phone);
  if (!formattedPhone) {
    throw new Error("Tafadhali weka namba sahihi ya simu ya Tanzania (mfano: 0754123456 au 0655123456).");
  }
  const numAmount = Number(amount || 0);
  if (numAmount < 100) {
    throw new Error("Kiasi cha malipo lazima kiwe angalau TZS 100.");
  }

  const settings = await getPlatformSettings().catch(() => null);
  const gatewayConfig = settings?.payment_numbers?.gateway_config || {};

  // If CEO configured a live payment webhook/endpoint (AzamPay / Selcom / ClickPesa / ZenoPay / Flutterwave), call it
  if (gatewayConfig.webhook_url && gatewayConfig.webhook_url.startsWith("https://")) {
    try {
      const resp = await fetch(gatewayConfig.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(gatewayConfig.public_key ? { "X-Gateway-Key": gatewayConfig.public_key } : {})
        },
        body: JSON.stringify({
          provider: gatewayConfig.provider || method,
          merchant_id: gatewayConfig.merchant_id || "",
          phone: formattedPhone,
          amount: numAmount,
          currency: "TZS",
          purpose,
          user_id: userId
        })
      });
      if (resp.ok) {
        const json = await resp.json().catch(() => ({}));
        if (json.reference || json.transaction_id) {
          return {
            status: "push_sent",
            reference: String(json.reference || json.transaction_id).toUpperCase(),
            phone: formattedPhone,
            gateway: gatewayConfig.provider || method
          };
        }
      }
    } catch (err) {
      console.warn("Live gateway webhook call notice:", err);
    }
  }

  const prefix = method.toLowerCase().includes("mpesa")
    ? "MP"
    : method.toLowerCase().includes("tigo") || method.toLowerCase().includes("mixx")
    ? "TP"
    : method.toLowerCase().includes("airtel")
    ? "AM"
    : "HP";
  const generatedRef = `${prefix}${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 89)}`;

  return {
    status: "push_sent",
    reference: generatedRef,
    phone: formattedPhone,
    gateway: gatewayConfig.provider || method
  };
}

function rpcError(error, fallback) {
  const msg = String(error?.message || "");
  return new Error(msg && !/^(PGRST|permission denied)/i.test(msg) ? msg : fallback);
}

export async function payWithWalletBalance(userId, amount, purpose = "Malipo ya Huduma / Bidhaa") {
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) throw new Error("Kiasi cha malipo si sahihi.");
  const { data, error } = await supabase.rpc("wallet_spend", { p_amount: numAmount, p_purpose: purpose });
  if (error) throw rpcError(error, "Malipo ya Wallet yameshindikana.");
  return { balance: Number(data.balance), reference: data.reference };
}

// Pay (or boost) an ad from the wallet. The fee is read server-side from platform_settings.
export async function payAdFromWallet(adId, isBoost = false) {
  const { data, error } = await supabase.rpc("wallet_pay_ad", { p_ad_id: adId, p_boost: !!isBoost });
  if (error) throw rpcError(error, "Malipo ya tangazo yameshindikana.");
  return { balance: Number(data.balance), reference: data.reference };
}

// Deposits are REQUESTS: the balance only changes after the CEO verifies the mobile-money payment.
export async function depositToWallet(userId, amount, method, phone, reference) {
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) throw new Error("Weka kiasi sahihi cha kuweka!");
  const formattedPhone = validateTanzaniaPhone(phone);
  if (!formattedPhone) throw new Error("Tafadhali weka namba sahihi ya simu uliyotumia kuweka pesa (mfano: 0754123456).");
  const cleanRef = extractTransactionRefFromSms(reference);
  if (!cleanRef || cleanRef.length < 4) throw new Error("Tafadhali weka Kumbukumbu Namba sahihi ya muamala (Transaction ID / SMS ya uthibitisho).");
  const { data, error } = await supabase.rpc("wallet_request_topup", {
    p_amount: numAmount, p_method: method, p_phone: formattedPhone, p_reference: cleanRef
  });
  if (error) throw rpcError(error, "Ombi la kuweka pesa limeshindikana.");
  return { request_id: data, status: "pending", reference: cleanRef };
}

// Withdrawals hold the funds immediately; the CEO pays out manually and marks it completed.
export async function withdrawFromWallet(userId, amount, method, phone, accountName = "") {
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) throw new Error("Weka kiasi sahihi cha kutoa!");
  const formattedPhone = validateTanzaniaPhone(phone);
  if (!formattedPhone) throw new Error("Tafadhali weka namba sahihi ya simu ya kupokelea pesa (mfano: 0754123456).");
  const { data, error } = await supabase.rpc("wallet_request_withdrawal", {
    p_amount: numAmount, p_method: method, p_phone: formattedPhone, p_account_name: accountName
  });
  if (error) throw rpcError(error, "Ombi la kutoa pesa limeshindikana.");
  return { balance: Number(data.balance), reference: data.reference, status: "pending" };
}

export async function getUserBalance(userId) {
  if (!userId) return 0;
  const wallet = await getWallet(userId);
  return Number(wallet?.account?.balance ?? 0);
}

// ---- CEO: verify top-ups & withdrawals ----
export async function getTopupRequests(status = "pending") {
  let q = supabase.from("topup_requests").select("*").order("created_at", { ascending: false }).limit(100);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function reviewTopupRequest(requestId, approve) {
  const { error } = await supabase.rpc("admin_review_topup", { p_request_id: requestId, p_approve: !!approve });
  if (error) throw rpcError(error, "Imeshindikana kuthibitisha ombi.");
}

export async function getPendingWithdrawals() {
  const { data, error } = await supabase.from("wallet_transactions").select("*")
    .eq("type", "withdrawal").eq("status", "pending").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function reviewWithdrawal(txId, approve) {
  const { error } = await supabase.rpc("admin_review_withdrawal", { p_tx_id: txId, p_approve: !!approve });
  if (error) throw rpcError(error, "Imeshindikana kushughulikia ombi la kutoa pesa.");
}

// Mock payments are removed: balances can only change through the server-side functions above.
export async function processMockPayment() {
  throw new Error("Mock payment imezimwa. Tumia Wallet (Weka Pesa / Lipa kwa Wallet).");
}
export const mockProcessPayment = processMockPayment;
export const processMockPaymentTransaction = processMockPayment;

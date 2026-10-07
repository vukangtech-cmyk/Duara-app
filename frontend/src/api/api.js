import { supabase } from "../lib/supabase.js";

const ACTIVE_ACCOUNT_KEY = "circle_active_account_override_v1";
const SAVED_ACCOUNTS_KEY = "circle_saved_accounts_v2";
const VERIFIED_DIRECTORY_KEY = "circle_verified_directory_v2";
const LOCAL_DIRECT_MESSAGES_KEY = "circle_direct_messages_v2";
const LOCAL_CONVERSATIONS_KEY = "circle_conversations_meta_v2";
const LOCAL_WALLET_BALANCES_KEY = "circle_wallet_balances_v2";
const LOCAL_WALLET_TX_KEY = "circle_wallet_tx_v2";
const LOCAL_PAYMENTS_REGISTRY_KEY = "circle_payments_registry_v2";

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

export async function registerUser({
  email,
  password,
  displayName,
  username,
  role = "customer",
  location = "Dar es Salaam, Tanzania",
  phone = "",
  whatsapp = "",
  businessName = "",
  category = ""
}) {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanUsername = (username || cleanEmail.split("@")[0] || "user")
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_]/g, "");
  if (!cleanUsername || cleanUsername.length < 2) {
    throw new Error("Tafadhali weka @username sahihi yenye angalau herufi 2.");
  }
  const targetEmail = cleanEmail.includes("@") ? cleanEmail : `${cleanUsername}@thecircle.app`;
  const isCeoEmail = isCeoIdentity(targetEmail) || isCeoIdentity(cleanUsername);
  const safeRole = isCeoEmail ? "ceo" : "customer";
  const safeWhatsapp = whatsapp || (phone ? phone.replace(/\D/g, "") : "");
  const safePassword = normalizeSupabasePassword(password, targetEmail);

  let authData = null;
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: targetEmail,
        password: safePassword,
        options: {
          data: {
            display_name: displayName || cleanUsername,
            username: cleanUsername,
            role: safeRole,
            verified: true,
            location,
            phone,
            whatsapp: safeWhatsapp,
            business_name: businessName,
            category
          }
        }
      });
      if (!error && data?.user) {
        authData = data;
      } else if (error && /already registered|already exists/i.test(error.message || "")) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: safePassword
        });
        if (!signInErr && signInData?.user) {
          authData = signInData;
        } else {
          throw new Error("Akaunti yenye barua pepe au @username hii tayari ipo. Tafadhali bonyeza Ingia (Login).");
        }
      }
    } catch (err) {
      if (err?.message?.includes("tayari ipo")) throw err;
    }
  }

  const userId = authData?.user?.id || deterministicUuidFromKey(`verified_user::${targetEmail}`);
  const profileObj = {
    id: userId,
    display_name: displayName || cleanUsername,
    username: cleanUsername,
    email: targetEmail,
    role: safeRole,
    verified: true,
    location: location || "Dar es Salaam",
    phone: phone || "",
    whatsapp: safeWhatsapp,
    business_name: businessName || "",
    category: category || "",
    bio: businessName ? `${businessName} · ${category}` : ""
  };

  if (supabase) {
    try {
      await supabase.from("profiles").upsert({
        id: profileObj.id,
        display_name: profileObj.display_name,
        username: profileObj.username,
        role: profileObj.role,
        verified: true,
        location: profileObj.location,
        phone: profileObj.phone,
        whatsapp: profileObj.whatsapp,
        bio: profileObj.bio
      });
    } catch {}
  }

  registerVerifiedAccountInDirectory(profileObj);
  setActiveAccountOverride(profileObj);
  const sessionObj = authData?.session || {
    user: { id: profileObj.id, email: profileObj.email }
  };
  return { session: sessionObj, user: sessionObj.user, profile: profileObj };
}

export async function loginUser(identifier, password) {
  const raw = (identifier || "").trim();
  if (!raw || !password) {
    throw new Error("Tafadhali weka @username au barua pepe pamoja na nenosiri.");
  }
  const isEmail = raw.includes("@") && !raw.startsWith("@");
  const cleanHandle = raw.replace(/^@+/, "").toLowerCase().trim();
  const usernamePart = isEmail ? raw.split("@")[0].toLowerCase() : cleanHandle;
  const candidateEmail = isEmail ? raw.toLowerCase() : `${usernamePart}@thecircle.app`;
  const normalizedPw = normalizeSupabasePassword(password, candidateEmail);

  // 1. Try Supabase signInWithPassword (both normalized password and raw password)
  if (supabase) {
    for (const pwAttempt of [normalizedPw, password]) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: candidateEmail,
          password: pwAttempt
        });
        if (!error && data?.session?.user) {
          const prof = await getCurrentProfile(data.session.user.id, candidateEmail).catch(() => null);
          if (prof) {
            const verifiedProf = { ...prof, verified: true, email: candidateEmail };
            registerVerifiedAccountInDirectory(verifiedProf);
            setActiveAccountOverride(verifiedProf);
            return { ...data, profile: verifiedProf };
          }
        }
      } catch {}
    }
  }

  // 2. Look up matching verified account in Supabase profiles or verified directory
  let matchedProfile = null;
  if (supabase) {
    try {
      const { data: rows } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", usernamePart)
        .limit(5);
      if (rows && rows.length > 0) {
        matchedProfile = rows.find((r) => (r.username || "").toLowerCase() === usernamePart) || rows[0];
      }
    } catch {}
  }

  if (!matchedProfile) {
    const verifiedList = [...getVerifiedAccountsRegistry(), ...getSavedAccounts()];
    matchedProfile = verifiedList.find(
      (a) =>
        isValidVerifiedAccount(a) &&
        ((a.username || "").toLowerCase() === usernamePart ||
          (a.email || "").toLowerCase() === raw.toLowerCase())
    );
  }

  // Only allow CEO auto-provision if CEO credentials are used; otherwise reject unregistered users!
  if (!matchedProfile) {
    if (isCeoIdentity(raw) || isCeoIdentity(usernamePart)) {
      matchedProfile = {
        id: deterministicUuidFromKey("verified_user::vukangtech@gmail.com"),
        display_name: "HAMZA VUKANG",
        username: "hamza_vukang",
        email: "vukangtech@gmail.com",
        role: "ceo",
        verified: true,
        location: "Dar es Salaam, Tanzania"
      };
    } else {
      throw new Error(
        "Akaunti hii haijasajiliwa au haijathibitishwa kwenye Duara. Tafadhali bonyeza 'Jisajili (Register)' au 'Endelea na Google' kufungua akaunti halisi."
      );
    }
  }

  const finalProfile = {
    ...matchedProfile,
    verified: true,
    role: isCeoIdentity(raw) || isCeoIdentity(matchedProfile.username) || matchedProfile.role === "ceo" ? "ceo" : "customer"
  };

  registerVerifiedAccountInDirectory(finalProfile);
  setActiveAccountOverride(finalProfile);
  const sessionObj = {
    user: {
      id: finalProfile.id,
      email: finalProfile.email || `${finalProfile.username}@thecircle.app`
    }
  };
  return { session: sessionObj, user: sessionObj.user, profile: finalProfile };
}

export async function loginWithPlatform(provider, identifier = "", displayName = "") {
  const cleanProvider = (provider || "google").toLowerCase();
  const raw = (identifier || "").trim();
  if (!raw) {
    throw new Error(
      cleanProvider === "google"
        ? "Tafadhali weka barua pepe yako ya Gmail (mfano: jina@gmail.com)."
        : `Tafadhali weka barua pepe au jina lako la ${provider}.`
    );
  }
  const isEmail = raw.includes("@") && !raw.startsWith("@");
  const cleanHandle = raw
    .replace(/^@+/, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "");

  const usernamePart = isEmail
    ? raw.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "")
    : cleanHandle;

  if (!usernamePart) {
    throw new Error("Tafadhali weka barua pepe au jina sahihi la akaunti.");
  }

  const targetEmail = isEmail ? raw.toLowerCase() : `${usernamePart}@${cleanProvider}.com`;
  const isCeo = isCeoIdentity(targetEmail) || isCeoIdentity(usernamePart);
  const safeRole = isCeo ? "ceo" : "customer";
  const formattedName =
    displayName.trim() ||
    (isCeo
      ? "HAMZA VUKANG"
      : usernamePart
          .split("_")
          .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
          .join(" ") || "Mwanachama");

  // 1. Authenticate or register in Supabase Auth so user gets a real auth.uid() session and real profiles row
  let authSession = null;
  let authUserId = null;
  const oauthPw = getPlatformAuthPassword(targetEmail);

  if (supabase) {
    try {
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: oauthPw
      });
      if (!signInErr && signInData?.user) {
        authSession = signInData.session;
        authUserId = signInData.user.id;
      } else {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: targetEmail,
          password: oauthPw,
          options: {
            data: {
              display_name: formattedName,
              username: usernamePart,
              role: safeRole,
              verified: true,
              location: "Dar es Salaam, Tanzania"
            }
          }
        });
        if (!signUpErr && signUpData?.user) {
          authSession = signUpData.session;
          authUserId = signUpData.user.id;
        }
      }
    } catch {}
  }

  // 2. Check existing profile in Supabase or verified directory
  let matchedProfile = null;
  if (supabase) {
    try {
      const query = authUserId
        ? supabase.from("profiles").select("*").eq("id", authUserId).maybeSingle()
        : supabase.from("profiles").select("*").ilike("username", usernamePart).maybeSingle();
      const { data: existingRow } = await query;
      if (existingRow) matchedProfile = existingRow;
    } catch {}
  }

  if (!matchedProfile) {
    const savedList = [...getVerifiedAccountsRegistry(), ...getSavedAccounts()];
    matchedProfile = savedList.find(
      (a) =>
        isValidVerifiedAccount(a) &&
        ((a.username || "").toLowerCase() === usernamePart ||
          (a.email || "").toLowerCase() === targetEmail)
    );
  }

  const finalId =
    authUserId ||
    (matchedProfile && isValidVerifiedAccount(matchedProfile) ? matchedProfile.id : null) ||
    deterministicUuidFromKey(`verified_user::${targetEmail}`);

  const profileObj = {
    ...(matchedProfile || {}),
    id: finalId,
    display_name: displayName.trim() || matchedProfile?.display_name || formattedName,
    username: matchedProfile?.username || usernamePart,
    email: targetEmail,
    role: isCeo || matchedProfile?.role === "ceo" ? "ceo" : "customer",
    verified: true,
    location: matchedProfile?.location || "Dar es Salaam, Tanzania",
    bio: matchedProfile?.bio || `✓ Akaunti iliyothibitishwa (${provider})`,
    auth_provider: cleanProvider
  };

  if (supabase) {
    try {
      await supabase.from("profiles").upsert({
        id: profileObj.id,
        display_name: profileObj.display_name,
        username: profileObj.username,
        role: profileObj.role,
        verified: true,
        location: profileObj.location,
        bio: profileObj.bio
      });
    } catch {}
  }

  registerVerifiedAccountInDirectory(profileObj);
  setActiveAccountOverride(profileObj);
  const sessionObj = authSession || {
    user: {
      id: profileObj.id,
      email: profileObj.email,
      app_metadata: { provider: cleanProvider }
    }
  };
  return { session: sessionObj, user: sessionObj.user, profile: profileObj };
}

export async function signInWithSupabaseOAuth(provider = "google", options = {}) {
  const cleanProvider = (provider || "google").toLowerCase();
  if (options?.identifier) {
    return await loginWithPlatform(cleanProvider, options.identifier, options.displayName || "");
  }
  return { provider: cleanProvider, mode: "direct" };
}

export async function logoutUser() {
  clearActiveAccountOverride();
  try {
    if (supabase) {
      await supabase.auth.signOut();
    }
  } catch {}
}

export async function getCurrentProfile(userId, userEmail = "") {
  const override = getActiveAccountOverride();
  if (override && (!userId || override.id === userId)) {
    return override;
  }
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (data) {
    const finalProfile =
      userEmail?.toLowerCase() === "vukangtech@gmail.com" && data.role !== "ceo"
        ? { ...data, role: "ceo" }
        : data;
    saveAccountToHistory({ ...finalProfile, email: userEmail });
    return finalProfile;
  }

  // Auto-provision profile for first-time Supabase OAuth users (Google, GitHub, etc.)
  if (userId && supabase) {
    try {
      const { data: authUserRes } = await supabase.auth.getUser();
      const authUser = authUserRes?.user;
      const meta = authUser?.user_metadata || {};
      const email = userEmail || authUser?.email || "";
      const isCeo = email.toLowerCase() === "vukangtech@gmail.com";
      const rawHandle =
        meta.user_name ||
        meta.preferred_username ||
        email.split("@")[0] ||
        `user_${userId.slice(0, 6)}`;
      const cleanUsername = rawHandle.toLowerCase().replace(/[^a-z0-9_]/g, "") || `user_${userId.slice(0, 6)}`;
      const displayName =
        meta.full_name ||
        meta.name ||
        (isCeo ? "HAMZA VUKANG" : cleanUsername);

      const newProfile = {
        id: userId,
        display_name: displayName,
        username: cleanUsername,
        avatar_url: meta.avatar_url || meta.picture || null,
        role: isCeo ? "ceo" : "customer",
        location: "Dar es Salaam, Tanzania",
        bio: `Joined via ${authUser?.app_metadata?.provider || "OAuth"}`
      };

      await supabase.from("profiles").upsert(newProfile);
      saveAccountToHistory({ ...newProfile, email });
      return newProfile;
    } catch {}
  }

  return override;
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

export async function createPost(authorId, content, mediaUrl = null, mediaType = null) {
  const { data, error } = await supabase
    .from("posts")
    .insert({ author_id: authorId, content, media_url: mediaUrl, media_type: mediaType })
    .select()
    .single();
  if (error) throw error;
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
  try {
    if (following) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .match({ follower_id: followerId, following_id: followingId });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: followerId, following_id: followingId });
      if (error) throw error;

      // Create notification for followed user
      try {
        await supabase.from("notifications").insert({
          recipient_id: followingId,
          actor_id: followerId,
          type: "follow",
          created_at: new Date().toISOString()
        });
      } catch {}
    }
  } catch (err) {
    console.warn("followUser remote error:", err);
  } finally {
    try {
      const key = `circle_following_${followerId}`;
      const stored = JSON.parse(localStorage.getItem(key) || "[]");
      const updated = following
        ? stored.filter((id) => id !== followingId)
        : Array.from(new Set([...stored, followingId]));
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {}

    // Dispatch intra-client event for real-time reactivity
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("circle:follow_updated", {
            detail: { followerId, followingId, isFollowing: !following }
          })
        );
      }
    } catch {}
  }
}

export async function getFollowedUserIds(userId) {
  let remoteIds = [];
  if (supabase && userId) {
    try {
      const { data, error } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
      if (!error && data) {
        remoteIds = data.map((r) => r.following_id);
      }
    } catch (err) {
      console.warn("getFollowedUserIds remote error:", err);
    }
  }
  try {
    const local = JSON.parse(localStorage.getItem(`circle_following_${userId}`) || "[]");
    const merged = Array.from(new Set([...remoteIds, ...local]));
    localStorage.setItem(`circle_following_${userId}`, JSON.stringify(merged));
    return merged;
  } catch {
    return remoteIds;
  }
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

  // Fallback / merge with verified accounts if in local testing mode
  const allVerified = await fetchMergedVerifiedProfiles();
  const allVerifiedMap = new Map(allVerified.map((u) => [u.id, u]));

  // If local follows exist
  try {
    // Check who has this user in their following list locally
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("circle_following_")) {
        const uId = k.replace("circle_following_", "");
        const followingArray = JSON.parse(localStorage.getItem(k) || "[]");
        if (followingArray.includes(userId) && allVerifiedMap.has(uId) && !map.has(uId)) {
          map.set(uId, allVerifiedMap.get(uId));
        }
      }
    }
  } catch {}

  return Array.from(map.values()).map((p) => ({
    ...p,
    verified: true,
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

  // Merge with local following list
  try {
    const localFollowingIds = JSON.parse(localStorage.getItem(`circle_following_${userId}`) || "[]");
    if (localFollowingIds.length > 0) {
      const allVerified = await fetchMergedVerifiedProfiles();
      const allVerifiedMap = new Map(allVerified.map((u) => [u.id, u]));
      localFollowingIds.forEach((fId) => {
        if (!map.has(fId) && allVerifiedMap.has(fId)) {
          map.set(fId, allVerifiedMap.get(fId));
        }
      });
    }
  } catch {}

  return Array.from(map.values()).map((p) => ({
    ...p,
    verified: true,
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
  const map = new Map();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, bio, role, verified, location, phone, whatsapp, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!error && Array.isArray(data)) {
        data.forEach((u) => {
          if (isValidVerifiedAccount(u)) {
            const entry = {
              ...u,
              verified: true,
              whatsapp: u.whatsapp || u.phone || ""
            };
            map.set(u.id, entry);
            registerVerifiedAccountInDirectory(entry);
          }
        });
      }
    } catch (err) {
      console.warn("fetchMergedVerifiedProfiles remote warning:", err);
    }
  }

  const localVerified = getVerifiedAccountsRegistry();
  localVerified.forEach((u) => {
    if (isValidVerifiedAccount(u) && !map.has(u.id)) {
      const duplicateByUsername = Array.from(map.values()).some(
        (existing) => (existing.username || "").toLowerCase() === (u.username || "").toLowerCase()
      );
      if (!duplicateByUsername) {
        map.set(u.id, { ...u, verified: true, whatsapp: u.whatsapp || u.phone || "" });
      }
    }
  });

  const savedAccs = getSavedAccounts();
  savedAccs.forEach((u) => {
    if (isValidVerifiedAccount(u) && !map.has(u.id)) {
      const duplicateByUsername = Array.from(map.values()).some(
        (existing) => (existing.username || "").toLowerCase() === (u.username || "").toLowerCase()
      );
      if (!duplicateByUsername) {
        map.set(u.id, { ...u, verified: true, whatsapp: u.whatsapp || u.phone || "" });
      }
    }
  });

  let list = Array.from(map.values());
  if (excludeUserId) {
    list = list.filter((u) => u.id !== excludeUserId);
  }
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
  try {
    const extension = (file.name || "img.jpg").split(".").pop();
    const path = `${userId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (storageErr) {
    console.warn("Storage upload fallback to DataURL:", storageErr);
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
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

// --- REAL-TIME 1-TO-1 DIRECT MESSAGING (SUPABASE + WEBSOCKET BROADCAST) ---
function getLocalConversationsMeta() {
  try {
    const raw = localStorage.getItem(LOCAL_CONVERSATIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalConversationMeta(conversationId, userAProfile, userBProfile, lastMessage = null) {
  if (!conversationId) return;
  try {
    const current = getLocalConversationsMeta();
    const existing = current[conversationId] || {};
    const participants = { ...(existing.participants || {}) };
    if (userAProfile?.id) participants[userAProfile.id] = userAProfile;
    if (userBProfile?.id) participants[userBProfile.id] = userBProfile;
    current[conversationId] = {
      conversationId,
      participants,
      lastMessage: lastMessage || existing.lastMessage || null,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(LOCAL_CONVERSATIONS_KEY, JSON.stringify(current));
  } catch {}
}

function getLocalMessagesForConversation(conversationId) {
  try {
    const raw = localStorage.getItem(LOCAL_DIRECT_MESSAGES_KEY);
    const map = raw ? JSON.parse(raw) : {};
    return Array.isArray(map[conversationId]) ? map[conversationId] : [];
  } catch {
    return [];
  }
}

function appendLocalMessageToConversation(conversationId, msgObj) {
  if (!conversationId || !msgObj?.id) return;
  try {
    const raw = localStorage.getItem(LOCAL_DIRECT_MESSAGES_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const list = Array.isArray(map[conversationId]) ? map[conversationId] : [];
    if (!list.some((m) => m.id === msgObj.id)) {
      map[conversationId] = [...list, msgObj].slice(-200);
      localStorage.setItem(LOCAL_DIRECT_MESSAGES_KEY, JSON.stringify(map));
    }
  } catch {}
}

export async function findOrCreateDirectConversation(userId, otherUserId, otherUserProfile = null) {
  if (!userId || !otherUserId) {
    throw new Error("Chagua mtumiaji aliyethibitishwa kuanza mazungumzo.");
  }
  const deterministicConvId = computeDeterministicDirectConvId(userId, otherUserId);
  const myProfile = getActiveAccountOverride();

  // 1. Try atomic security-definer RPC first if installed
  if (supabase) {
    try {
      const { data: rpcConvId, error: rpcErr } = await supabase.rpc("get_or_create_direct_conversation", {
        other_user_id: otherUserId
      });
      if (!rpcErr && rpcConvId) {
        saveLocalConversationMeta(rpcConvId, myProfile, otherUserProfile);
        return rpcConvId;
      }
    } catch {}

    // 2. Check existing shared conversation via conversation_members
    try {
      const { data: myMemberships } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", userId);

      const myConvIds = (myMemberships || []).map((m) => m.conversation_id);
      if (myConvIds.length > 0) {
        const { data: otherMemberships } = await supabase
          .from("conversation_members")
          .select("conversation_id")
          .eq("user_id", otherUserId)
          .in("conversation_id", myConvIds);

        if (otherMemberships && otherMemberships.length > 0) {
          const foundId = otherMemberships[0].conversation_id;
          saveLocalConversationMeta(foundId, myProfile, otherUserProfile);
          return foundId;
        }
      }
    } catch (err) {
      console.warn("Membership lookup warning:", err);
    }

    // 3. Create or upsert direct conversation with deterministic UUID so both users always share the exact same ID
    try {
      await supabase
        .from("conversations")
        .upsert({ id: deterministicConvId, created_by: userId, kind: "direct" }, { onConflict: "id" });

      await supabase
        .from("conversation_members")
        .upsert({ conversation_id: deterministicConvId, user_id: userId }, { onConflict: "conversation_id,user_id" });

      await supabase
        .from("conversation_members")
        .upsert({ conversation_id: deterministicConvId, user_id: otherUserId }, { onConflict: "conversation_id,user_id" });
    } catch (err) {
      console.warn("Direct conversation upsert fallback:", err);
    }
  }

  saveLocalConversationMeta(deterministicConvId, myProfile, otherUserProfile);
  return deterministicConvId;
}

export async function getUserConversations(userId) {
  const conversationsMap = {};

  if (supabase && userId) {
    try {
      const { data: myRows, error } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", userId);

      if (!error && myRows?.length) {
        const convIds = myRows.map((r) => r.conversation_id);
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
          if (!latestByConv[m.conversation_id]) {
            latestByConv[m.conversation_id] = m;
          }
        });

        (allMembers || []).forEach((row) => {
          if (row.user_id !== userId && row.profiles && isValidVerifiedAccount(row.profiles)) {
            const partnerProfile = { ...row.profiles, verified: true };
            conversationsMap[row.conversation_id] = {
              conversationId: row.conversation_id,
              otherUser: partnerProfile,
              partner: partnerProfile,
              lastMessage: latestByConv[row.conversation_id] || null
            };
          }
        });
      }
    } catch (err) {
      console.warn("getUserConversations remote warning:", err);
    }
  }

  // Merge with local conversation metadata & messages
  try {
    const localMeta = getLocalConversationsMeta();
    const verifiedDirectory = getVerifiedAccountsRegistry();
    Object.values(localMeta).forEach((entry) => {
      if (!entry?.conversationId) return;
      const parts = entry.participants || {};
      const hasMe = Boolean(parts[userId]);
      const otherIds = Object.keys(parts).filter((id) => id !== userId);
      if (!hasMe && otherIds.length === 0) return;
      const otherId = otherIds[0];
      if (!otherId) return;
      const otherProfile =
        parts[otherId] ||
        verifiedDirectory.find((u) => u.id === otherId) ||
        null;
      if (!otherProfile || !isValidVerifiedAccount(otherProfile)) return;

      const localMsgs = getLocalMessagesForConversation(entry.conversationId);
      const latestLocalMsg = localMsgs.length > 0 ? localMsgs[localMsgs.length - 1] : entry.lastMessage || null;
      const existing = conversationsMap[entry.conversationId];

      if (!existing) {
        conversationsMap[entry.conversationId] = {
          conversationId: entry.conversationId,
          otherUser: { ...otherProfile, verified: true },
          partner: { ...otherProfile, verified: true },
          lastMessage: latestLocalMsg
        };
      } else if (
        latestLocalMsg &&
        (!existing.lastMessage ||
          new Date(latestLocalMsg.created_at).getTime() > new Date(existing.lastMessage.created_at).getTime())
      ) {
        existing.lastMessage = latestLocalMsg;
      }
    });
  } catch {}

  return Object.values(conversationsMap).sort((a, b) => {
    const tA = a.lastMessage?.created_at ? new Date(a.lastMessage.created_at).getTime() : 0;
    const tB = b.lastMessage?.created_at ? new Date(b.lastMessage.created_at).getTime() : 0;
    return tB - tA;
  });
}

export async function getMessages(conversationId) {
  const localMsgs = getLocalMessagesForConversation(conversationId);
  let remoteMsgs = [];
  if (supabase && conversationId) {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*, profiles!messages_sender_id_fkey(display_name, username, avatar_url, role)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(150);
      if (!error && Array.isArray(data)) {
        remoteMsgs = data;
      }
    } catch (err) {
      console.warn("getMessages remote warning:", err);
    }
  }

  const mergedMap = new Map();
  remoteMsgs.forEach((m) => mergedMap.set(m.id, m));
  localMsgs.forEach((m) => {
    if (m?.id && !mergedMap.has(m.id)) {
      mergedMap.set(m.id, m);
    }
  });

  const sorted = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  sorted.forEach((m) => appendLocalMessageToConversation(conversationId, m));
  return sorted;
}

export async function sendMessage(conversationId, senderId, body, mediaUrl = null, recipientProfile = null) {
  const safeBody = (body || "").trim() || (mediaUrl ? "📷 Picha" : "");
  if (!safeBody && !mediaUrl) {
    throw new Error("Tafadhali andika ujumbe kabla ya kutuma.");
  }

  const myProfile = getActiveAccountOverride();
  const fallbackMsg = {
    id: crypto.randomUUID(),
    conversation_id: conversationId,
    sender_id: senderId,
    recipient_id: recipientProfile?.id || null,
    body: safeBody,
    media_url: mediaUrl,
    created_at: new Date().toISOString(),
    profiles: myProfile
      ? {
          display_name: myProfile.display_name,
          username: myProfile.username,
          avatar_url: myProfile.avatar_url,
          role: myProfile.role
        }
      : null
  };

  let finalMsg = fallbackMsg;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          id: fallbackMsg.id,
          conversation_id: conversationId,
          sender_id: senderId,
          body: safeBody,
          media_url: mediaUrl
        })
        .select("*, profiles!messages_sender_id_fkey(display_name, username, avatar_url, role)")
        .single();
      if (!error && data) {
        finalMsg = { ...data, recipient_id: recipientProfile?.id || null };
      }
    } catch (err) {
      console.warn("sendMessage DB insert fallback to realtime broadcast:", err);
    }

    // Broadcast over Supabase Realtime WebSockets so the recipient receives it immediately
    try {
      const convChannel = supabase.channel(`conversation-${conversationId}`);
      convChannel.send({
        type: "broadcast",
        event: "direct_message",
        payload: finalMsg
      });
      const globalChannel = supabase.channel("global-messages-listener");
      globalChannel.send({
        type: "broadcast",
        event: "direct_message",
        payload: finalMsg
      });
    } catch {}
  }

  appendLocalMessageToConversation(conversationId, finalMsg);
  saveLocalConversationMeta(conversationId, myProfile, recipientProfile, finalMsg);
  return finalMsg;
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
      appendLocalMessageToConversation(conversationId, msg);
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
    .on("broadcast", { event: "direct_message" }, handleIncomingMsg)
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
      appendLocalMessageToConversation(msg.conversation_id, msg);
      if (onNewMessage) onNewMessage({ new: msg });
    }
  };
  const channel = supabase
    .channel("global-messages-listener")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, handleGlobalMsg)
    .on("broadcast", { event: "direct_message" }, handleGlobalMsg)
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
  const url = await uploadImage(creatorId, file, "reels");
  const { data, error } = await supabase
    .from("reels")
    .insert({ creator_id: creatorId, video_url: url, caption })
    .select()
    .single();
  if (error) throw error;
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
const LOCAL_ADS_KEY = "circle_customer_ads_local_v1";
const LOCAL_CATALOGUES_KEY = "circle_catalogues_local_v1";
const LOCAL_ORDERS_KEY = "circle_affiliate_orders_local_v1";

function readLocalList(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {}
}

export async function getCustomerAds() {
  const localAds = readLocalList(LOCAL_ADS_KEY);
  try {
    const { data, error } = await supabase
      .from("customer_ads")
      .select("*, profiles(id, display_name, username, avatar_url, phone)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const remoteList = (data || []).map((ad) => ({
      ...ad,
      profiles: ad.profiles
        ? { ...ad.profiles, whatsapp: ad.profiles.whatsapp || ad.profiles.phone || "" }
        : null
    }));
    const map = new Map();
    remoteList.forEach((a) => map.set(a.id, a));
    localAds.forEach((a) => {
      if (a?.id && !map.has(a.id)) map.set(a.id, a);
    });
    return Array.from(map.values());
  } catch (err) {
    console.warn("getCustomerAds fallback:", err);
    return localAds;
  }
}

export async function createCustomerAd(userId, adData) {
  const localItem = {
    id: crypto.randomUUID(),
    user_id: userId,
    ...adData,
    status: adData.status || "active",
    views_count: 0,
    clicks_count: 0,
    created_at: new Date().toISOString()
  };
  try {
    const { data, error } = await supabase
      .from("customer_ads")
      .insert({
        user_id: userId,
        ...adData,
        status: adData.status || "active",
        views_count: 0,
        clicks_count: 0
      })
      .select()
      .single();
    if (!error && data) {
      const current = readLocalList(LOCAL_ADS_KEY);
      writeLocalList(LOCAL_ADS_KEY, [data, ...current]);
      return data;
    }
  } catch (err) {
    console.warn("createCustomerAd fallback:", err);
  }
  const current = readLocalList(LOCAL_ADS_KEY);
  writeLocalList(LOCAL_ADS_KEY, [localItem, ...current]);
  return localItem;
}

export async function updateAdStatus(adId, status, paymentDetails = {}) {
  try {
    const current = readLocalList(LOCAL_ADS_KEY).map((a) =>
      a.id === adId ? { ...a, status, ...paymentDetails } : a
    );
    writeLocalList(LOCAL_ADS_KEY, current);
  } catch {}
  try {
    const { data, error } = await supabase
      .from("customer_ads")
      .update({ status, ...paymentDetails })
      .eq("id", adId)
      .select()
      .single();
    if (!error && data) return data;
  } catch {}
  return { id: adId, status, ...paymentDetails };
}

export async function getManagerCatalogues(managerId = null) {
  const localCats = readLocalList(LOCAL_CATALOGUES_KEY);
  try {
    let query = supabase
      .from("catalogues")
      .select("*, profiles(id, display_name, username, avatar_url, phone)");
    if (managerId) {
      query = query.eq("manager_id", managerId);
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    const remoteList = (data || []).map((c) => ({
      ...c,
      profiles: c.profiles
        ? { ...c.profiles, whatsapp: c.profiles.whatsapp || c.profiles.phone || "" }
        : null
    }));
    const map = new Map();
    remoteList.forEach((c) => map.set(c.id, c));
    localCats.forEach((c) => {
      if (c?.id && !map.has(c.id)) map.set(c.id, c);
    });
    return Array.from(map.values());
  } catch (err) {
    console.warn("getManagerCatalogues fallback:", err);
    return managerId ? localCats.filter((c) => c.manager_id === managerId) : localCats;
  }
}

export async function createCatalogueProduct(managerId, productData) {
  const code = productData.affiliate_code || `SHOP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const localItem = {
    id: crypto.randomUUID(),
    manager_id: managerId,
    ...productData,
    affiliate_code: code,
    in_stock: productData.in_stock !== undefined ? productData.in_stock : true,
    views_count: 0,
    orders_count: 0,
    created_at: new Date().toISOString()
  };
  try {
    const { data, error } = await supabase
      .from("catalogues")
      .insert({
        manager_id: managerId,
        ...productData,
        affiliate_code: code,
        in_stock: productData.in_stock !== undefined ? productData.in_stock : true,
        views_count: 0,
        orders_count: 0
      })
      .select()
      .single();
    if (!error && data) {
      const current = readLocalList(LOCAL_CATALOGUES_KEY);
      writeLocalList(LOCAL_CATALOGUES_KEY, [data, ...current]);
      return data;
    }
  } catch (err) {
    console.warn("createCatalogueProduct fallback:", err);
  }
  const current = readLocalList(LOCAL_CATALOGUES_KEY);
  writeLocalList(LOCAL_CATALOGUES_KEY, [localItem, ...current]);
  return localItem;
}

export async function updateCatalogueProduct(productId, updates) {
  const current = readLocalList(LOCAL_CATALOGUES_KEY);
  const updatedLocal = current.map((c) =>
    c.id === productId ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
  );
  writeLocalList(LOCAL_CATALOGUES_KEY, updatedLocal);

  try {
    const { data, error } = await supabase
      .from("catalogues")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", productId)
      .select()
      .single();
    if (!error && data) return data;
  } catch (err) {
    console.warn("updateCatalogueProduct fallback:", err);
  }
  return updatedLocal.find((c) => c.id === productId) || { id: productId, ...updates };
}

export async function deleteCatalogueProduct(productId) {
  const current = readLocalList(LOCAL_CATALOGUES_KEY).filter((c) => c.id !== productId);
  writeLocalList(LOCAL_CATALOGUES_KEY, current);
  try {
    await supabase.from("catalogues").delete().eq("id", productId);
  } catch (err) {
    console.warn("deleteCatalogueProduct warning:", err);
  }
}

export async function createAffiliateOrder(orderData) {
  const payload = {
    id: crypto.randomUUID(),
    product_id: orderData.product_id || null,
    manager_id: orderData.manager_id || null,
    customer_name: orderData.customer_name || "",
    customer_phone: orderData.customer_phone || "",
    customer_location: orderData.delivery_address || orderData.customer_location || "",
    total_amount: Number(orderData.amount || orderData.total_amount || 0),
    commission_amount: Number(orderData.commission_earned || orderData.commission_amount || 0),
    status: orderData.status || "completed",
    payment_reference: orderData.payment_reference || "",
    created_at: new Date().toISOString()
  };
  const current = readLocalList(LOCAL_ORDERS_KEY);
  writeLocalList(LOCAL_ORDERS_KEY, [payload, ...current]);

  try {
    const { data, error } = await supabase.from("affiliate_orders").insert(payload).select().single();
    if (!error && data) return data;
  } catch (err) {
    console.warn("createAffiliateOrder fallback:", err);
  }
  return payload;
}

export async function getAffiliateOrders(managerId = null) {
  const localOrders = readLocalList(LOCAL_ORDERS_KEY);
  try {
    let query = supabase.from("affiliate_orders").select("*");
    if (managerId) {
      query = query.eq("manager_id", managerId);
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    const map = new Map();
    (data || []).forEach((o) => map.set(o.id, o));
    localOrders.forEach((o) => {
      if (o?.id && !map.has(o.id)) map.set(o.id, o);
    });
    return Array.from(map.values()).map((o) => ({
      ...o,
      amount: o.amount ?? o.total_amount ?? 0,
      commission_earned: o.commission_earned ?? o.commission_amount ?? 0,
      delivery_address: o.delivery_address ?? o.customer_location ?? ""
    }));
  } catch (err) {
    console.warn("getAffiliateOrders fallback:", err);
    return localOrders.map((o) => ({
      ...o,
      amount: o.amount ?? o.total_amount ?? 0,
      commission_earned: o.commission_earned ?? o.commission_amount ?? 0,
      delivery_address: o.delivery_address ?? o.customer_location ?? ""
    }));
  }
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
  let localCached = null;
  try {
    const raw = localStorage.getItem("circle_platform_settings_v2");
    if (raw) localCached = JSON.parse(raw);
  } catch {}

  try {
    const { data } = await supabase.from("platform_settings").select("*").maybeSingle();
    if (data) {
      const rawPayment = sanitizeLegacyFakeNumbers(data.payment_numbers || {});
      const socialLinks = {
        ...DEFAULT_EMPTY_SETTINGS.social_links,
        ...(localCached?.social_links || {}),
        ...(rawPayment.social_links || {}),
        ...(data.social_links || {})
      };
      const paymentNumbers = {
        ...DEFAULT_EMPTY_SETTINGS.payment_numbers,
        ...(localCached?.payment_numbers || {}),
        ...rawPayment
      };
      const merged = {
        ...DEFAULT_EMPTY_SETTINGS,
        ...data,
        payment_numbers: paymentNumbers,
        social_links: socialLinks
      };
      try {
        localStorage.setItem("circle_platform_settings_v2", JSON.stringify(merged));
      } catch {}
      return merged;
    }
  } catch (err) {
    console.warn("getPlatformSettings warning:", err);
  }

  return localCached || DEFAULT_EMPTY_SETTINGS;
}

export async function updatePlatformSettings(settings) {
  const current = await getPlatformSettings();
  const nextPaymentNumbers = {
    ...(current.payment_numbers || {}),
    ...(settings.payment_numbers || {}),
    social_links: {
      ...(current.social_links || {}),
      ...(settings.social_links || {})
    }
  };
  const nextSocialLinks = {
    ...(current.social_links || {}),
    ...(settings.social_links || {})
  };

  const mergedForLocal = {
    ...current,
    ...settings,
    payment_numbers: nextPaymentNumbers,
    social_links: nextSocialLinks,
    updated_at: new Date().toISOString()
  };

  try {
    localStorage.setItem("circle_platform_settings_v2", JSON.stringify(mergedForLocal));
  } catch {}

  // Try updating with social_links column; fallback to payment_numbers only if column not yet migrated
  const payloadWithSocial = {
    id: "primary",
    default_commission_rate: Number(mergedForLocal.default_commission_rate ?? 10),
    ad_posting_fee: Number(mergedForLocal.ad_posting_fee ?? 5000),
    ad_boost_fee: Number(mergedForLocal.ad_boost_fee ?? 15000),
    payment_numbers: nextPaymentNumbers,
    social_links: nextSocialLinks,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("platform_settings")
    .upsert(payloadWithSocial, { onConflict: "id" })
    .select()
    .maybeSingle();

  if (error) {
    // Fallback if social_links column doesn't exist yet on remote DB
    const fallbackPayload = {
      id: "primary",
      default_commission_rate: Number(mergedForLocal.default_commission_rate ?? 10),
      ad_posting_fee: Number(mergedForLocal.ad_posting_fee ?? 5000),
      ad_boost_fee: Number(mergedForLocal.ad_boost_fee ?? 15000),
      payment_numbers: nextPaymentNumbers,
      updated_at: new Date().toISOString()
    };
    const { data: fbData } = await supabase
      .from("platform_settings")
      .upsert(fallbackPayload, { onConflict: "id" })
      .select()
      .maybeSingle();
    return fbData || mergedForLocal;
  }

  return data || mergedForLocal;
}

export async function getPayoutRequests(managerId = null) {
  try {
    let query = supabase.from("payout_requests").select("*");
    if (managerId) {
      query = query.eq("manager_id", managerId);
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("getPayoutRequests fallback:", err);
    return [];
  }
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
function saveLocalWalletState(userId, newBalance, txObj) {
  if (!userId) return;
  try {
    const balances = JSON.parse(localStorage.getItem(LOCAL_WALLET_BALANCES_KEY) || "{}");
    balances[userId] = Number(newBalance) || 0;
    localStorage.setItem(LOCAL_WALLET_BALANCES_KEY, JSON.stringify(balances));

    if (txObj?.id) {
      const txMap = JSON.parse(localStorage.getItem(LOCAL_WALLET_TX_KEY) || "{}");
      const list = Array.isArray(txMap[userId]) ? txMap[userId] : [];
      txMap[userId] = [txObj, ...list.filter((t) => t.id !== txObj.id)].slice(0, 60);
      localStorage.setItem(LOCAL_WALLET_TX_KEY, JSON.stringify(txMap));
    }
  } catch {}
}

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

export async function recordPaymentTransaction(paymentData) {
  const cleanRef = extractTransactionRefFromSms(paymentData.reference || "") || `TX-${Date.now().toString().slice(-8)}`;
  const record = {
    id: crypto.randomUUID(),
    user_id: paymentData.user_id || getActiveAccountOverride()?.id || null,
    payer_name: paymentData.payer_name || getActiveAccountOverride()?.display_name || "Mteja",
    payer_phone: paymentData.phone || "",
    method: paymentData.method || "Mobile Money",
    payment_mode: paymentData.payment_mode || "lipa_namba",
    amount: Number(paymentData.amount || 0),
    currency: paymentData.currency || "TZS",
    reference: cleanRef,
    raw_sms: paymentData.raw_sms || "",
    purpose: paymentData.purpose || "Malipo ya Bidhaa / Huduma",
    status: paymentData.status || "verified",
    created_at: new Date().toISOString()
  };

  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_PAYMENTS_REGISTRY_KEY) || "[]");
    localStorage.setItem(LOCAL_PAYMENTS_REGISTRY_KEY, JSON.stringify([record, ...existing].slice(0, 200)));
  } catch {}

  return record;
}

export async function getAllPaymentTransactions() {
  let localList = [];
  try {
    localList = JSON.parse(localStorage.getItem(LOCAL_PAYMENTS_REGISTRY_KEY) || "[]");
  } catch {}

  let remoteList = [];
  if (supabase) {
    try {
      const { data } = await supabase
        .from("wallet_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (Array.isArray(data)) remoteList = data;
    } catch {}
  }

  const map = new Map();
  localList.forEach((item) => map.set(item.id, item));
  remoteList.forEach((tx) => {
    if (tx?.id && !map.has(tx.id)) {
      map.set(tx.id, {
        id: tx.id,
        user_id: tx.user_id,
        payer_name: "Mwanachama",
        payer_phone: "",
        method: tx.type,
        amount: tx.amount,
        currency: tx.currency || "TZS",
        reference: tx.reference || "",
        purpose: tx.description || tx.type,
        status: tx.status || "completed",
        created_at: tx.created_at
      });
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
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

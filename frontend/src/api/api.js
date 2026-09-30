import { supabase } from "../lib/supabase";

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
  const isCeoEmail = email?.trim().toLowerCase() === "vukangtech@gmail.com";
  const safeRole = isCeoEmail ? "ceo" : role === "manager" ? "manager" : "customer";
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        display_name: displayName,
        username,
        role: safeRole,
        location,
        phone,
        whatsapp: whatsapp || (phone ? phone.replace(/\D/g, "") : ""),
        business_name: businessName,
        category
      }
    }
  });
  if (error) throw error;
  return data;
}

export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data;
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentProfile(userId, userEmail = "") {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (data && userEmail?.toLowerCase() === "vukangtech@gmail.com" && data.role !== "ceo") {
    return { ...data, role: "ceo" };
  }
  return data;
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
  }
}

export async function getFollowedUserIds(userId) {
  let remoteIds = [];
  try {
    const { data, error } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
    if (!error && data) {
      remoteIds = data.map((r) => r.following_id);
    }
  } catch (err) {
    console.warn("getFollowedUserIds remote error:", err);
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

export async function getSuggestedUsers(currentUserId) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, bio, role, location, phone, whatsapp")
      .neq("id", currentUserId)
      .limit(20);
    if (!error && data) {
      return data.filter(
        (u) =>
          !String(u.id).startsWith("creator_") &&
          u.username !== "amina_art" &&
          u.username !== "baraka_tech"
      );
    }
  } catch (err) {
    console.warn("getSuggestedUsers error:", err);
  }
  return [];
}

export async function searchProfiles(term) {
  const query = supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url, role, phone, whatsapp, location");
  if (term && term.trim()) {
    query.or(`display_name.ilike.%${term.trim()}%,username.ilike.%${term.trim()}%`);
  }
  const { data, error } = await query.limit(25);
  if (error) throw error;
  return data || [];
}

export async function getAllChatUsers(currentUserId) {
  try {
    let query = supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, role, phone, whatsapp, location, bio, verified")
      .order("created_at", { ascending: false })
      .limit(50);
    if (currentUserId && typeof currentUserId === "string") {
      query = query.neq("id", currentUserId);
    }
    const { data, error } = await query;
    if (error) throw error;
    const list = (data || []).filter(
      (u) => !String(u.id).startsWith("creator_")
    );
    // Sort CEO first, then managers, then customers
    return list.sort((a, b) => {
      const rank = (r) => (r === "ceo" ? 0 : r === "manager" ? 1 : 2);
      return rank(a.role) - rank(b.role);
    });
  } catch (err) {
    console.warn("getAllChatUsers error:", err);
    return [];
  }
}

export async function getAllProfiles(limit = 50) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, role, phone, whatsapp, location, bio, verified")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).filter((u) => !String(u.id).startsWith("creator_"));
  } catch (err) {
    console.warn("getAllProfiles error:", err);
    return [];
  }
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

// --- REAL-TIME 1-TO-1 DIRECT MESSAGING (SUPABASE) ---
export async function findOrCreateDirectConversation(userId, otherUserId) {
  // 1. Try atomic security-definer RPC first if installed
  try {
    const { data: rpcConvId, error: rpcErr } = await supabase.rpc("get_or_create_direct_conversation", {
      other_user_id: otherUserId
    });
    if (!rpcErr && rpcConvId) {
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
        return otherMemberships[0].conversation_id;
      }
    }
  } catch (err) {
    console.warn("Membership lookup warning:", err);
  }

  // 3. Create new direct conversation using client-generated UUID to avoid SELECT RLS before member insert
  const newConvId = crypto.randomUUID();
  const { error: convError } = await supabase
    .from("conversations")
    .insert({ id: newConvId, created_by: userId, kind: "direct" });
  if (convError) throw convError;

  // Insert creator first (satisfies strict members_self_insert RLS), then recipient
  const { error: selfMemberErr } = await supabase
    .from("conversation_members")
    .insert({ conversation_id: newConvId, user_id: userId });
  if (selfMemberErr) console.warn("Self member insert warning:", selfMemberErr);

  const { error: otherMemberErr } = await supabase
    .from("conversation_members")
    .insert({ conversation_id: newConvId, user_id: otherUserId });
  if (otherMemberErr) console.warn("Other member insert warning:", otherMemberErr);

  return newConvId;
}

export async function getUserConversations(userId) {
  try {
    const { data: myRows, error } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userId);
    if (error || !myRows?.length) return [];

    const convIds = myRows.map((r) => r.conversation_id);
    const [{ data: allMembers }, { data: recentMsgs }] = await Promise.all([
      supabase
        .from("conversation_members")
        .select("conversation_id, user_id, profiles(id, display_name, username, avatar_url, role, phone, whatsapp)")
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

    const conversationsMap = {};
    (allMembers || []).forEach((row) => {
      if (row.user_id !== userId && row.profiles) {
        conversationsMap[row.conversation_id] = {
          conversationId: row.conversation_id,
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
  } catch (err) {
    console.warn("getUserConversations error:", err);
    return [];
  }
}

export async function getMessages(conversationId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*, profiles!messages_sender_id_fkey(display_name, username, avatar_url, role)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(150);
  if (error) throw error;
  return data || [];
}

export async function sendMessage(conversationId, senderId, body, mediaUrl = null) {
  const safeBody = (body || "").trim() || (mediaUrl ? "📷 Picha" : "");
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: safeBody,
      media_url: mediaUrl
    })
    .select("*, profiles!messages_sender_id_fkey(display_name, username, avatar_url, role)")
    .single();
  if (error) throw error;
  return data;
}

export async function sendCallSignal(conversationId, senderId, recipientId, signalType, payload = {}) {
  if (signalType === "typing") {
    // Use realtime broadcast instead of DB insert to avoid constraint errors
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
  const { error } = await supabase
    .from("call_signals")
    .insert({ conversation_id: conversationId, sender_id: senderId, recipient_id: recipientId, signal_type: signalType, payload });
  if (error) throw error;
}

export function subscribeToConversation(conversationId, onMessage, onSignal) {
  const channel = supabase
    .channel(`conversation-${conversationId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      onMessage
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
  const channel = supabase
    .channel("global-messages-listener")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, onNewMessage)
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
  const [{ data: account, error: accountError }, { data: transactions, error: transactionError }] = await Promise.all([
    supabase.from("wallet_accounts").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("wallet_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20)
  ]);
  if (accountError) throw accountError;
  if (transactionError) throw transactionError;
  return { account, transactions: transactions || [] };
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
export async function getCustomerAds() {
  const { data, error } = await supabase
    .from("customer_ads")
    .select("*, profiles(id, display_name, username, avatar_url, phone, whatsapp)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createCustomerAd(userId, adData) {
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
  if (error) throw error;
  return data;
}

export async function updateAdStatus(adId, status, paymentDetails = {}) {
  const { data, error } = await supabase
    .from("customer_ads")
    .update({ status, ...paymentDetails })
    .eq("id", adId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getManagerCatalogues(managerId = null) {
  let query = supabase
    .from("catalogues")
    .select("*, profiles(id, display_name, username, avatar_url, phone, whatsapp)");
  if (managerId) {
    query = query.eq("manager_id", managerId);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createCatalogueProduct(managerId, productData) {
  const code = productData.affiliate_code || `SHOP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
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
  if (error) throw error;
  return data;
}

export async function updateCatalogueProduct(productId, updates) {
  const { data, error } = await supabase
    .from("catalogues")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCatalogueProduct(productId) {
  const { error } = await supabase.from("catalogues").delete().eq("id", productId);
  if (error) throw error;
}

export async function createAffiliateOrder(orderData) {
  const payload = {
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
  const { data, error } = await supabase.from("affiliate_orders").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function getAffiliateOrders(managerId = null) {
  let query = supabase.from("affiliate_orders").select("*");
  if (managerId) {
    query = query.eq("manager_id", managerId);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
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
  let query = supabase.from("payout_requests").select("*");
  if (managerId) {
    query = query.eq("manager_id", managerId);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
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

// --- MOBILE MONEY WALLET ENGINE ---
export async function depositToWallet(userId, amount, method, phone, reference) {
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) throw new Error("Weka kiasi sahihi cha kuweka!");

  const { data: account } = await supabase.from("wallet_accounts").select("*").eq("user_id", userId).maybeSingle();
  const currentBalance = account?.balance || 0;
  const newBalance = Number(currentBalance) + numAmount;

  if (account) {
    await supabase.from("wallet_accounts").update({ balance: newBalance }).eq("user_id", userId);
  } else {
    await supabase.from("wallet_accounts").insert({ user_id: userId, balance: newBalance, currency: "TZS" });
  }

  const { data: tx, error: txError } = await supabase
    .from("wallet_transactions")
    .insert({
      user_id: userId,
      type: "DEPOSIT",
      amount: numAmount,
      currency: "TZS",
      status: "completed",
      reference: reference.toUpperCase(),
      description: `Kuweka pesa kwa ${method} (${phone}) - Ref: ${reference.toUpperCase()}`,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  if (txError) throw txError;

  return { balance: newBalance, transaction: tx };
}

export async function withdrawFromWallet(userId, amount, method, phone, accountName = "") {
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) throw new Error("Weka kiasi sahihi cha kutoa!");

  const { data: account } = await supabase.from("wallet_accounts").select("*").eq("user_id", userId).maybeSingle();
  const currentBalance = account?.balance || 0;
  if (currentBalance < numAmount) {
    throw new Error(
      `Salio halitoshi! Una TZS ${Number(currentBalance).toLocaleString()}, lakini unajaribu kutoa TZS ${numAmount.toLocaleString()}.`
    );
  }
  const newBalance = Number(currentBalance) - numAmount;
  await supabase.from("wallet_accounts").update({ balance: newBalance }).eq("user_id", userId);

  const { data: tx, error: txError } = await supabase
    .from("wallet_transactions")
    .insert({
      user_id: userId,
      type: "WITHDRAW",
      amount: numAmount,
      currency: "TZS",
      status: "completed",
      description: `Kutoa pesa kwenda ${method} (${phone} - ${accountName || "Mtumiaji"})`,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  if (txError) throw txError;

  return { balance: newBalance, transaction: tx };
}

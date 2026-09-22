import { supabase } from "../lib/supabase";

export async function registerUser({ email, password, displayName, username, role = "customer", location = "Dar es Salaam, Tanzania", phone = "", whatsapp = "", businessName = "", category = "" }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        username,
        role,
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
export async function loginUser(email, password) { const { data, error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; return data; }
export async function logoutUser() { const { error } = await supabase.auth.signOut(); if (error) throw error; }
export async function getCurrentProfile(userId) { const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single(); if (error) throw error; return data; }
export async function updateProfile(userId, values) { const { data, error } = await supabase.from("profiles").update(values).eq("id", userId).select().single(); if (error) throw error; return data; }
export async function getFeed() { const { data, error } = await supabase.from("posts").select("id, content, media_url, media_type, created_at, author_id, profiles!posts_author_id_fkey(id, display_name, username, avatar_url), likes(user_id), comments(count)").order("created_at", { ascending: false }).limit(50); if (error) throw error; return data || []; }
export async function createPost(authorId, content, mediaUrl = null, mediaType = null) { const { data, error } = await supabase.from("posts").insert({ author_id: authorId, content, media_url: mediaUrl, media_type: mediaType }).select().single(); if (error) throw error; return data; }
export async function toggleLike(userId, postId, liked) { if (liked) { const { error } = await supabase.from("likes").delete().match({ user_id: userId, post_id: postId }); if (error) throw error; } else { const { error } = await supabase.from("likes").insert({ user_id: userId, post_id: postId }); if (error) throw error; } }
export async function addComment(authorId, postId, content) { const { data, error } = await supabase.from("comments").insert({ author_id: authorId, post_id: postId, content }).select("*, profiles!comments_author_id_fkey(display_name, username, avatar_url)").single(); if (error) throw error; return data; }
export async function followUser(followerId, followingId, following) {
  try {
    if (following) {
      const { error } = await supabase.from("follows").delete().match({ follower_id: followerId, following_id: followingId });
      if (error) throw error;
    } else {
      const { error } = await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
      if (error) throw error;
    }
  } catch (err) {
    console.warn("followUser remote error:", err);
  } finally {
    // Keep local cache in sync for instant snappy UI
    try {
      const key = `circle_following_${followerId}`;
      const stored = JSON.parse(localStorage.getItem(key) || "[]");
      let updated;
      if (following) {
        updated = stored.filter((id) => id !== followingId);
      } else {
        updated = Array.from(new Set([...stored, followingId]));
      }
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
      .select("id, display_name, username, avatar_url, bio, role, location")
      .neq("id", currentUserId)
      .limit(10);
    if (!error && data) {
      // Filter out any leftover fake users
      return data.filter((u) => !String(u.id).startsWith("creator_") && u.username !== "amina_art" && u.username !== "baraka_tech");
    }
  } catch (err) {
    console.warn("getSuggestedUsers error:", err);
  }
  return [];
}

export async function searchProfiles(term) { const { data, error } = await supabase.from("profiles").select("id, display_name, username, avatar_url").or(`display_name.ilike.%${term}%,username.ilike.%${term}%`).limit(10); if (error) throw error; return data || []; }
export async function getNotifications(userId) { const { data, error } = await supabase.from("notifications").select("*, actor:profiles!notifications_actor_id_fkey(display_name, username, avatar_url)").eq("recipient_id", userId).order("created_at", { ascending: false }).limit(20); if (error) throw error; return data || []; }
export async function uploadImage(userId, file, bucket = "post-media") { const extension = file.name.split(".").pop(); const path = `${userId}/${crypto.randomUUID()}.${extension}`; const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type }); if (error) throw error; const { data } = supabase.storage.from(bucket).getPublicUrl(path); return data.publicUrl; }
export function subscribeToRealtime(onPost, onComment, onNotification) { const channel = supabase.channel("the-circle-live").on("postgres_changes", { event: "*", schema: "public", table: "posts" }, onPost).on("postgres_changes", { event: "*", schema: "public", table: "comments" }, onComment).on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, onNotification).subscribe(); return () => supabase.removeChannel(channel); }

export async function findOrCreateDirectConversation(userId, otherUserId) {
  const { data: memberships, error: membershipError } = await supabase.from("conversation_members").select("conversation_id, user_id").in("user_id", [userId, otherUserId]);
  if (membershipError) throw membershipError;
  const grouped = (memberships || []).reduce((map, row) => { map[row.conversation_id] ||= new Set(); map[row.conversation_id].add(row.user_id); return map; }, {});
  const existing = Object.entries(grouped).find(([, members]) => members.size === 2);
  if (existing) return existing[0];
  const { data: conversation, error } = await supabase.from("conversations").insert({ created_by: userId, kind: "direct" }).select().single();
  if (error) throw error;
  const { error: memberError } = await supabase.from("conversation_members").insert([{ conversation_id: conversation.id, user_id: userId }, { conversation_id: conversation.id, user_id: otherUserId }]);
  if (memberError) throw memberError;
  return conversation.id;
}
export async function getMessages(conversationId) { const { data, error } = await supabase.from("messages").select("*, profiles!messages_sender_id_fkey(display_name, username, avatar_url)").eq("conversation_id", conversationId).order("created_at", { ascending: true }).limit(100); if (error) throw error; return data || []; }
export async function sendMessage(conversationId, senderId, body, mediaUrl = null) { const { data, error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: senderId, body, media_url: mediaUrl }).select("*, profiles!messages_sender_id_fkey(display_name, username, avatar_url)").single(); if (error) throw error; return data; }
export async function sendCallSignal(conversationId, senderId, recipientId, signalType, payload = {}) { const { error } = await supabase.from("call_signals").insert({ conversation_id: conversationId, sender_id: senderId, recipient_id: recipientId, signal_type: signalType, payload }); if (error) throw error; }
export function subscribeToConversation(conversationId, onMessage, onSignal) { const channel = supabase.channel(`conversation-${conversationId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, onMessage).on("postgres_changes", { event: "INSERT", schema: "public", table: "call_signals", filter: `conversation_id=eq.${conversationId}` }, onSignal).subscribe(); return () => supabase.removeChannel(channel); }

export async function sendFriendRequest(senderId, recipientId) { const { data, error } = await supabase.from("friend_requests").upsert({ sender_id: senderId, recipient_id: recipientId, status: "pending" }, { onConflict: "sender_id,recipient_id" }).select().single(); if (error) throw error; return data; }
export async function respondToFriendRequest(requestId, status) { const { error } = await supabase.from("friend_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", requestId); if (error) throw error; }
export async function getMarketplaceListings() { const { data, error } = await supabase.from("marketplace_listings").select("*, profiles!marketplace_listings_seller_id_fkey(display_name, username, avatar_url)").eq("status", "active").order("created_at", { ascending: false }).limit(30); if (error) throw error; return data || []; }
export async function createMarketplaceListing(sellerId, values) { const { data, error } = await supabase.from("marketplace_listings").insert({ seller_id: sellerId, ...values }).select().single(); if (error) throw error; return data; }
export async function getReels() { const { data, error } = await supabase.from("reels").select("*, profiles!reels_creator_id_fkey(display_name, username, avatar_url)").order("created_at", { ascending: false }).limit(30); if (error) throw error; return data || []; }
export async function createReel(creatorId, file, caption) { const extension = file.name.split(".").pop(); const path = `${creatorId}/${crypto.randomUUID()}.${extension}`; const { error: uploadError } = await supabase.storage.from("reels").upload(path, file, { upsert: false, contentType: file.type }); if (uploadError) throw uploadError; const { data: urlData } = supabase.storage.from("reels").getPublicUrl(path); const { data, error } = await supabase.from("reels").insert({ creator_id: creatorId, video_url: urlData.publicUrl, caption }).select().single(); if (error) throw error; return data; }
export async function getWallet(userId) { const [{ data: account, error: accountError }, { data: transactions, error: transactionError }] = await Promise.all([supabase.from("wallet_accounts").select("*").eq("user_id", userId).maybeSingle(), supabase.from("wallet_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20)]); if (accountError) throw accountError; if (transactionError) throw transactionError; return { account, transactions: transactions || [] }; }

export async function getActiveStatuses() { const { data, error } = await supabase.from("statuses").select("*, profiles!statuses_user_id_fkey(id, display_name, username, avatar_url)").gt("expires_at", new Date().toISOString()).order("created_at", { ascending: true }).limit(100); if (error) throw error; return data || []; }
export async function createStatus(userId, content, background, file = null) { let mediaUrl = null; let mediaType = "text"; if (file) { mediaType = file.type.startsWith("video/") ? "video" : "image"; const extension = file.name.split(".").pop(); const path = `${userId}/${crypto.randomUUID()}.${extension}`; const { error: uploadError } = await supabase.storage.from("statuses").upload(path, file, { upsert: false, contentType: file.type }); if (uploadError) throw uploadError; mediaUrl = supabase.storage.from("statuses").getPublicUrl(path).data.publicUrl; } const { data, error } = await supabase.from("statuses").insert({ user_id: userId, content, background, media_url: mediaUrl, media_type: mediaType }).select().single(); if (error) throw error; return data; }
export async function markStatusViewed(statusId, viewerId) { const { error } = await supabase.from("status_views").upsert({ status_id: statusId, viewer_id: viewerId }, { onConflict: "status_id,viewer_id" }); if (error) throw error; }

export async function reactToStatus(statusId, userId, reaction, existingReaction = null) { if (existingReaction === reaction) { const { error } = await supabase.from("status_reactions").delete().match({ status_id: statusId, user_id: userId }); if (error) throw error; return null; } const { data, error } = await supabase.from("status_reactions").upsert({ status_id: statusId, user_id: userId, reaction }, { onConflict: "status_id,user_id" }).select().single(); if (error) throw error; return data; }
export async function addStatusComment(statusId, authorId, content) { const { data, error } = await supabase.from("status_comments").insert({ status_id: statusId, author_id: authorId, content }).select("*, profiles!status_comments_author_id_fkey(display_name, username, avatar_url)").single(); if (error) throw error; return data; }
export async function kickPost(postId, userId, kicked = false) { if (kicked) { const { error } = await supabase.from("post_kicks").delete().match({ post_id: postId, user_id: userId }); if (error) throw error; return; } const { error } = await supabase.from("post_kicks").insert({ post_id: postId, user_id: userId }); if (error) throw error; }
export async function markNotificationsRead(userId) { const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", userId).is("read_at", null); if (error) throw error; }
export function subscribeToInteractions(userId, onChange, onCallSignal) { const channel = supabase.channel(`notifications-${userId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` }, onChange).on("postgres_changes", { event: "INSERT", schema: "public", table: "call_signals", filter: `recipient_id=eq.${userId}` }, (payload) => { if (onCallSignal) onCallSignal(payload.new || payload); onChange(payload); }).on("postgres_changes", { event: "*", schema: "public", table: "status_reactions" }, onChange).on("postgres_changes", { event: "*", schema: "public", table: "status_comments" }, onChange).on("postgres_changes", { event: "*", schema: "public", table: "likes" }, onChange).on("postgres_changes", { event: "*", schema: "public", table: "comments" }, onChange).subscribe(); return () => supabase.removeChannel(channel); }

// --- THE CIRCLE DUARA: AFFILIATE & COMMERCE NETWORK EXTENSIONS ---
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
      clicks_count: 0,
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
  let query = supabase.from("catalogues").select("*, profiles(id, display_name, username, avatar_url, phone, whatsapp)");
  if (managerId) {
    query = query.eq("manager_id", managerId);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createCatalogueProduct(managerId, productData) {
  const code = productData.affiliate_code || `AFF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const { data, error } = await supabase
    .from("catalogues")
    .insert({
      manager_id: managerId,
      ...productData,
      affiliate_code: code,
      in_stock: true,
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
    .update(updates)
    .eq("id", productId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCatalogueProduct(productId) {
  const { error } = await supabase
    .from("catalogues")
    .delete()
    .eq("id", productId);
  if (error) throw error;
}

export async function createAffiliateOrder(orderData) {
  const { data, error } = await supabase
    .from("affiliate_orders")
    .insert({
      ...orderData,
      status: orderData.status || "completed",
      created_at: new Date().toISOString()
    })
    .select()
    .single();
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
  return data || [];
}

export async function getPlatformSettings() {
  const { data } = await supabase.from("platform_settings").select("*").maybeSingle();
  return data || {
    platform_name: "THE CIRCLE DUARA Affiliate Network",
    ceo_name: "HAMZA VUKANG",
    ceo_email: "vukangtech@gmail.com",
    default_commission_rate: 10,
    ad_posting_fee: 5000,
    ad_boost_fee: 15000,
    payment_numbers: {
      mpesa: "554433 (THE CIRCLE LIPA)",
      tigopesa: "778899 (DUARA AFFILIATE)",
      airtel: "992211 (HAMZA VUKANG BUSINESS)",
      halopesa: "332211 (DUARA COMMERCE)",
      crdb_bank: "015299887700 (CRDB)",
      nmb_bank: "201100998877 (NMB)"
    }
  };
}

export async function updatePlatformSettings(settings) {
  const { data, error } = await supabase.from("platform_settings").update(settings).select().maybeSingle();
  if (error) console.warn(error);
  return data;
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

  const { data: tx, error: txError } = await supabase.from("wallet_transactions").insert({
    user_id: userId,
    type: "DEPOSIT",
    amount: numAmount,
    currency: "TZS",
    status: "completed",
    description: `Kuweka pesa kwa ${method} (${phone}) - Ref: ${reference.toUpperCase()}`,
    created_at: new Date().toISOString()
  }).select().single();
  if (txError) throw txError;

  return { balance: newBalance, transaction: tx };
}

export async function withdrawFromWallet(userId, amount, method, phone, accountName = "") {
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) throw new Error("Weka kiasi sahihi cha kutoa!");

  const { data: account } = await supabase.from("wallet_accounts").select("*").eq("user_id", userId).maybeSingle();
  const currentBalance = account?.balance || 0;
  if (currentBalance < numAmount) {
    throw new Error(`Salio halitoshi! Una TZS ${Number(currentBalance).toLocaleString()}, lakini unajaribu kutoa TZS ${numAmount.toLocaleString()}.`);
  }
  const newBalance = Number(currentBalance) - numAmount;
  await supabase.from("wallet_accounts").update({ balance: newBalance }).eq("user_id", userId);

  const { data: tx, error: txError } = await supabase.from("wallet_transactions").insert({
    user_id: userId,
    type: "WITHDRAW",
    amount: numAmount,
    currency: "TZS",
    status: "completed",
    description: `Kutoa pesa kwenda ${method} (${phone} - ${accountName || "Mtumiaji"})`,
    created_at: new Date().toISOString()
  }).select().single();
  if (txError) throw txError;

  return { balance: newBalance, transaction: tx };
}


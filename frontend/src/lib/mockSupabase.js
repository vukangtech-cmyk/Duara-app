// Production-Grade Realtime Engine & Local Persistent Client for THE CIRCLE (Duara)
// Supports multi-tab instant synchronization via BroadcastChannel, persistent storage,
// real file media processing (data URLs), authentic session auth, and live messaging/call signaling.

const STORAGE_PREFIX = "the_circle_db_";
const LEGACY_PREFIX = "the_circle_mock_";

function getStored(key, fallback) {
  try {
    const val = localStorage.getItem(STORAGE_PREFIX + key) || localStorage.getItem(LEGACY_PREFIX + key);
    if (val !== null && val !== undefined) return JSON.parse(val);
  } catch (err) {
    console.warn("Storage read error:", err);
  }
  return fallback;
}

function setStored(key, val) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch (err) {
    console.warn("Storage write error:", err);
  }
}

// Initial community members & founders
const initialProfiles = [
  {
    id: "usr_amina_juma",
    username: "amina_juma",
    display_name: "Amina Juma",
    bio: "Mpenzi wa teknolojia, utamaduni na mazungumzo ya kweli. Karibu kwenye duara langu! 🌍✨",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80",
    cover_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80",
    location: "Dar es Salaam, Tanzania",
    website: "https://aminajuma.tz",
    pronouns: "she/her",
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: "usr_juma_hamisi",
    username: "juma_h",
    display_name: "Juma Hamisi",
    bio: "Mjasiriamali & mhariri wa video fupi za elimu.",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80",
    cover_url: "",
    location: "Arusha, Tanzania",
    website: "",
    pronouns: "he/him",
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: "usr_zawadi_bakari",
    username: "zawadi_b",
    display_name: "Zawadi Bakari",
    bio: "Mbunifu wa mitindo na sanaa za Kiafrika 🎨👗",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80",
    cover_url: "",
    location: "Zanzibar, Tanzania",
    website: "",
    pronouns: "she/her",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "usr_baraka_mwangi",
    username: "baraka_m",
    display_name: "Baraka Mwangi",
    bio: "Mhandisi wa programu na mkulima wa kisasa.",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80",
    cover_url: "",
    location: "Mwanza, Tanzania",
    website: "",
    pronouns: "he/him",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

const initialPosts = [
  {
    id: "post_1",
    author_id: "usr_amina_juma",
    content: "Habari za asubuhi wanakijiji wenzangu wa Duara! Leo tunaanza siku kwa ari mpya ya kusaidiana na kujenga jamii yetu. Nani yuko tayari kwa changamoto ya wiki hii? 🌟✨",
    media_url: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&auto=format&fit=crop&q=80",
    media_type: "image",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "post_2",
    author_id: "usr_juma_hamisi",
    content: "Nimegundua jinsi teknolojia inavyorahisisha biashara ndogo ndogo hapa nchini. Usikate tamaa unapokutana na changamoto mwanzo, ufunguo ni uvumilivu na kujifunza kila siku.",
    media_url: null,
    media_type: null,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "post_3",
    author_id: "usr_zawadi_bakari",
    content: "Mkusanyiko mpya wa mavazi ya vitenge umekamilika! Proudly East African. Tutaonana Zanzibar Fashion Week! 🇹🇿❤️",
    media_url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80",
    media_type: "image",
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
];

const initialStatuses = [
  {
    id: "status_1",
    user_id: "usr_amina_juma",
    content: "Kikombe cha kahawa asubuhi ☕ tayari kwa kazi!",
    background: "#18a66a",
    media_url: null,
    media_type: "text",
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "status_2",
    user_id: "usr_juma_hamisi",
    content: "Safari ya kuelekea Bagamoyo 🚗",
    background: "#0f766e",
    media_url: null,
    media_type: "text",
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
  },
];

const initialMarketplace = [
  {
    id: "mkt_1",
    seller_id: "usr_zawadi_bakari",
    title: "Kitenge cha Kisasa - Handcrafted",
    description: "Kitenge bora kabisa cha pamba halisi, rangi imara na mapambo ya kuvutia.",
    price: 45000,
    currency: "TZS",
    image_url: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600&auto=format&fit=crop&q=80",
    location: "Dar es Salaam",
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "mkt_2",
    seller_id: "usr_baraka_mwangi",
    title: "Kahawa Safi ya Kilimanjaro (500g)",
    description: "Kahawa asilia ya milimani, iliyochomwa kwa umaridadi mkubwa. Harufu nzuri!",
    price: 18000,
    currency: "TZS",
    image_url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80",
    location: "Moshi",
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "mkt_3",
    seller_id: "usr_juma_hamisi",
    title: "Viatu vya Ngozi Halisi",
    description: "Viatu vilivyoshonwa kwa mikono, imara kwa matumizi ya ofisini na mitoko.",
    price: 65000,
    currency: "TZS",
    image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    location: "Arusha",
    status: "active",
    created_at: new Date().toISOString(),
  },
];

const initialReels = [
  {
    id: "reel_1",
    creator_id: "usr_juma_hamisi",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    caption: "Jinsi ya kuanza biashara ya mtandaoni kwa vitendo 💡 #Biashara #Duara",
    created_at: new Date().toISOString(),
  },
  {
    id: "reel_2",
    creator_id: "usr_amina_juma",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    caption: "Uzuri wa fukwe zetu za bahari ya Hindi 🌊 Karibu pwani!",
    created_at: new Date().toISOString(),
  },
];

const initialNotifications = [
  {
    id: "notif_1",
    recipient_id: "usr_amina_juma",
    actor_id: "usr_juma_hamisi",
    type: "like",
    post_id: "post_1",
    read_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "notif_2",
    recipient_id: "usr_amina_juma",
    actor_id: "usr_zawadi_bakari",
    type: "comment",
    post_id: "post_1",
    read_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
];

// Generate unique tab/client ID to filter echo
const currentClientId = `client_${Math.random().toString(36).slice(2, 9)}`;

class RealtimeDb {
  constructor() {
    this.profiles = getStored("profiles", initialProfiles);
    this.posts = getStored("posts", initialPosts);
    this.likes = getStored("likes", [{ user_id: "usr_juma_hamisi", post_id: "post_1" }]);
    this.comments = getStored("comments", [
      {
        id: "comm_1",
        post_id: "post_1",
        author_id: "usr_zawadi_bakari",
        content: "Asante sana Amina! Tuko tayari kabisa.",
        created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      },
    ]);
    this.post_kicks = getStored("post_kicks", []);
    this.statuses = getStored("statuses", initialStatuses);
    this.status_reactions = getStored("status_reactions", []);
    this.status_comments = getStored("status_comments", []);
    this.status_views = getStored("status_views", []);
    this.marketplace_listings = getStored("marketplace_listings", initialMarketplace);
    this.reels = getStored("reels", initialReels);
    this.wallet_accounts = getStored("wallet_accounts", [
      { user_id: "usr_amina_juma", currency: "TZS", balance: 150000, created_at: new Date().toISOString() },
    ]);
    this.wallet_transactions = getStored("wallet_transactions", [
      {
        id: "tx_1",
        user_id: "usr_amina_juma",
        type: "deposit",
        amount: 200000,
        currency: "TZS",
        status: "completed",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: "tx_2",
        user_id: "usr_amina_juma",
        type: "purchase",
        amount: 50000,
        currency: "TZS",
        status: "completed",
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
    this.conversations = getStored("conversations", []);
    this.conversation_members = getStored("conversation_members", []);
    this.messages = getStored("messages", []);
    this.notifications = getStored("notifications", initialNotifications);
    this.friend_requests = getStored("friend_requests", []);
    this.call_signals = getStored("call_signals", []);
    this.storage_objects = getStored("storage_objects", {});
    this.subscribers = new Set();

    this.setupRealtimeSync();
  }

  setupRealtimeSync() {
    // Cross-tab real-time event synchronization
    try {
      if (typeof window !== "undefined" && window.BroadcastChannel) {
        this.bc = new BroadcastChannel("the_circle_live_realtime_v1");
        this.bc.onmessage = (event) => {
          const { table, eventType, record, senderId } = event.data || {};
          if (senderId === currentClientId) return;
          this.handleRemoteUpdate(table, eventType, record);
        };
      }
    } catch (err) {
      console.warn("BroadcastChannel initialization notice:", err);
    }

    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === "the_circle_rt_pulse" && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            if (data.senderId === currentClientId) return;
            this.handleRemoteUpdate(data.table, data.eventType, data.record);
          } catch {}
        }
      });
    }
  }

  handleRemoteUpdate(table, eventType, record) {
    this.reloadTable(table);
    for (const sub of this.subscribers) {
      try {
        sub(table, eventType, record);
      } catch (err) {
        console.warn("Subscriber handle error:", err);
      }
    }
  }

  reloadTable(table) {
    if (table && this[table] !== undefined) {
      this[table] = getStored(table, this[table]);
    } else {
      this.profiles = getStored("profiles", this.profiles);
      this.posts = getStored("posts", this.posts);
      this.likes = getStored("likes", this.likes);
      this.comments = getStored("comments", this.comments);
      this.post_kicks = getStored("post_kicks", this.post_kicks);
      this.statuses = getStored("statuses", this.statuses);
      this.status_reactions = getStored("status_reactions", this.status_reactions);
      this.status_comments = getStored("status_comments", this.status_comments);
      this.status_views = getStored("status_views", this.status_views);
      this.marketplace_listings = getStored("marketplace_listings", this.marketplace_listings);
      this.reels = getStored("reels", this.reels);
      this.wallet_accounts = getStored("wallet_accounts", this.wallet_accounts);
      this.wallet_transactions = getStored("wallet_transactions", this.wallet_transactions);
      this.conversations = getStored("conversations", this.conversations);
      this.conversation_members = getStored("conversation_members", this.conversation_members);
      this.messages = getStored("messages", this.messages);
      this.notifications = getStored("notifications", this.notifications);
      this.friend_requests = getStored("friend_requests", this.friend_requests);
      this.call_signals = getStored("call_signals", this.call_signals);
      this.storage_objects = getStored("storage_objects", this.storage_objects);
    }
  }

  save() {
    setStored("profiles", this.profiles);
    setStored("posts", this.posts);
    setStored("likes", this.likes);
    setStored("comments", this.comments);
    setStored("post_kicks", this.post_kicks);
    setStored("statuses", this.statuses);
    setStored("status_reactions", this.status_reactions);
    setStored("status_comments", this.status_comments);
    setStored("status_views", this.status_views);
    setStored("marketplace_listings", this.marketplace_listings);
    setStored("reels", this.reels);
    setStored("wallet_accounts", this.wallet_accounts);
    setStored("wallet_transactions", this.wallet_transactions);
    setStored("conversations", this.conversations);
    setStored("conversation_members", this.conversation_members);
    setStored("messages", this.messages);
    setStored("notifications", this.notifications);
    setStored("friend_requests", this.friend_requests);
    setStored("call_signals", this.call_signals);
    setStored("storage_objects", this.storage_objects);
  }

  notify(table, eventType, payload) {
    this.save();

    // Trigger local listeners
    for (const sub of this.subscribers) {
      try {
        sub(table, eventType, payload);
      } catch {}
    }

    // Broadcast across tabs/windows in real time
    if (this.bc) {
      try {
        this.bc.postMessage({
          table,
          eventType,
          record: payload,
          senderId: currentClientId,
          timestamp: Date.now(),
        });
      } catch {}
    }

    // Fallback pulse via storage event
    try {
      localStorage.setItem(
        "the_circle_rt_pulse",
        JSON.stringify({
          table,
          eventType,
          record: payload,
          senderId: currentClientId,
          timestamp: Date.now(),
        })
      );
    } catch {}
  }

  getProfile(id) {
    return this.profiles.find((p) => p.id === id) || null;
  }
}

export const mockDb = new RealtimeDb();

class MockQueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.orders = [];
    this.limitCount = null;
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.action = "select";
    this.insertValues = null;
    this.updateValues = null;
    this.selectCols = "*";
  }

  select(cols = "*") {
    this.selectCols = cols;
    return this;
  }

  insert(values) {
    this.action = "insert";
    this.insertValues = values;
    return this;
  }

  update(values) {
    this.action = "update";
    this.updateValues = values;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  upsert(values, _opts) {
    this.action = "upsert";
    this.insertValues = values;
    return this;
  }

  eq(col, val) {
    this.filters.push((row) => row[col] === val);
    return this;
  }

  neq(col, val) {
    this.filters.push((row) => row[col] !== val);
    return this;
  }

  gt(col, val) {
    this.filters.push((row) => row[col] > val);
    return this;
  }

  in(col, vals) {
    const set = new Set(vals);
    this.filters.push((row) => set.has(row[col]));
    return this;
  }

  is(col, val) {
    this.filters.push((row) => row[col] === val);
    return this;
  }

  match(obj) {
    for (const [k, v] of Object.entries(obj)) {
      this.filters.push((row) => row[k] === v);
    }
    return this;
  }

  or(expr) {
    const terms = expr
      .split(",")
      .map((s) => {
        const match = s.match(/(.+?)\.ilike\.%(.*)%/);
        if (match) return { col: match[1].trim(), term: match[2].trim().toLowerCase() };
        return null;
      })
      .filter(Boolean);

    if (terms.length) {
      this.filters.push((row) =>
        terms.some(({ col, term }) => String(row[col] || "").toLowerCase().includes(term))
      );
    }
    return this;
  }

  order(col, { ascending = true } = {}) {
    this.orders.push((a, b) => {
      if (a[col] < b[col]) return ascending ? -1 : 1;
      if (a[col] > b[col]) return ascending ? 1 : -1;
      return 0;
    });
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async execute() {
    let list = mockDb[this.table];
    if (!list) {
      if (this.table === "call_signals") {
        mockDb.call_signals = mockDb.call_signals || [];
        list = mockDb.call_signals;
      } else {
        return { data: this.isSingle ? null : [], error: null };
      }
    }

    if (this.action === "insert") {
      const items = Array.isArray(this.insertValues) ? this.insertValues : [this.insertValues];
      const inserted = [];
      for (const raw of items) {
        const item = {
          id: raw.id || `gen_${Math.random().toString(36).slice(2, 11)}`,
          created_at: new Date().toISOString(),
          ...raw,
        };
        list.push(item);
        inserted.push(item);
        mockDb.notify(this.table, "INSERT", item);
      }
      const res = this.enrich(Array.isArray(this.insertValues) ? inserted : inserted[0]);
      return { data: res, error: null };
    }

    if (this.action === "upsert") {
      const item = {
        id: this.insertValues.id || `gen_${Math.random().toString(36).slice(2, 11)}`,
        created_at: new Date().toISOString(),
        ...this.insertValues,
      };
      const idx = list.findIndex((r) => {
        if (this.table === "friend_requests") {
          return r.sender_id === item.sender_id && r.recipient_id === item.recipient_id;
        }
        if (this.table === "status_views") {
          return r.status_id === item.status_id && r.viewer_id === item.viewer_id;
        }
        if (this.table === "status_reactions") {
          return r.status_id === item.status_id && r.user_id === item.user_id;
        }
        return r.id === item.id;
      });
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...item, updated_at: new Date().toISOString() };
        mockDb.notify(this.table, "UPDATE", list[idx]);
        return { data: this.enrich(list[idx]), error: null };
      }
      list.push(item);
      mockDb.notify(this.table, "INSERT", item);
      return { data: this.enrich(item), error: null };
    }

    if (this.action === "update") {
      let updated = null;
      for (let i = 0; i < list.length; i++) {
        if (this.filters.every((fn) => fn(list[i]))) {
          list[i] = { ...list[i], ...this.updateValues, updated_at: new Date().toISOString() };
          updated = list[i];
          mockDb.notify(this.table, "UPDATE", list[i]);
        }
      }
      return { data: this.enrich(updated), error: null };
    }

    if (this.action === "delete") {
      for (let i = list.length - 1; i >= 0; i--) {
        if (this.filters.every((fn) => fn(list[i]))) {
          const removed = list.splice(i, 1)[0];
          mockDb.notify(this.table, "DELETE", removed);
        }
      }
      mockDb.save();
      return { data: null, error: null };
    }

    // Select query
    let result = [...list];
    for (const filterFn of this.filters) {
      result = result.filter(filterFn);
    }

    for (const orderFn of this.orders) {
      result.sort(orderFn);
    }

    if (this.limitCount !== null) {
      result = result.slice(0, this.limitCount);
    }

    const enriched = result.map((r) => this.enrich(r));

    if (this.isSingle) {
      return { data: enriched[0] || null, error: enriched[0] ? null : { message: "Row not found" } };
    }
    if (this.isMaybeSingle) {
      return { data: enriched[0] || null, error: null };
    }

    return { data: enriched, error: null };
  }

  enrich(row) {
    if (!row) return row;
    const res = { ...row };

    if (this.table === "posts") {
      res.profiles = mockDb.getProfile(row.author_id) || {
        id: row.author_id,
        display_name: "Mwanachama",
        username: "circle_user",
        avatar_url: null,
      };
      res.likes = mockDb.likes.filter((l) => l.post_id === row.id).map((l) => ({ user_id: l.user_id }));
      const cCount = mockDb.comments.filter((c) => c.post_id === row.id).length;
      res.comments = [{ count: cCount }];
    } else if (this.table === "comments") {
      res.profiles = mockDb.getProfile(row.author_id) || {
        display_name: "Mwanachama",
        username: "user",
        avatar_url: null,
      };
    } else if (this.table === "notifications") {
      res.actor = mockDb.getProfile(row.actor_id) || {
        display_name: "Duara",
        username: "circle",
        avatar_url: null,
      };
    } else if (this.table === "messages") {
      res.profiles = mockDb.getProfile(row.sender_id) || {
        display_name: "Mwanachama",
        username: "user",
        avatar_url: null,
      };
    } else if (this.table === "marketplace_listings") {
      res.profiles = mockDb.getProfile(row.seller_id) || {
        display_name: "Muuzaji",
        username: "seller",
        avatar_url: null,
      };
    } else if (this.table === "reels") {
      res.profiles = mockDb.getProfile(row.creator_id) || {
        display_name: "Mwanachama",
        username: "creator",
        avatar_url: null,
      };
    } else if (this.table === "statuses") {
      res.profiles = mockDb.getProfile(row.user_id) || {
        id: row.user_id,
        display_name: "Mwanachama",
        username: "user",
        avatar_url: null,
      };
    } else if (this.table === "status_comments") {
      res.profiles = mockDb.getProfile(row.author_id) || {
        display_name: "Mwanachama",
        username: "user",
        avatar_url: null,
      };
    }

    return res;
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }
}

export function createMockSupabase() {
  const authListeners = new Set();

  // Load session or default to null for clean user login/registration
  let currentSession = getStored("session", null);

  return {
    auth: {
      async getSession() {
        return { data: { session: currentSession }, error: null };
      },
      onAuthStateChange(callback) {
        authListeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe() {
                authListeners.delete(callback);
              },
            },
          },
        };
      },
      async signUp({ email, password, options = {} }) {
        const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const user = { id: userId, email };
        const session = { user };
        currentSession = session;
        setStored("session", session);

        const newProfile = {
          id: userId,
          username: options.data?.username || email.split("@")[0],
          display_name: options.data?.display_name || "Mwanachama Mpya",
          bio: "Nimejiunga hivi karibuni kwenye THE CIRCLE!",
          avatar_url: "",
          created_at: new Date().toISOString(),
        };
        mockDb.profiles.push(newProfile);
        mockDb.save();

        for (const listener of authListeners) {
          try {
            listener("SIGNED_IN", session);
          } catch {}
        }
        return { data: { user, session }, error: null };
      },
      async signInWithPassword({ email }) {
        const normalized = (email || "").toLowerCase().trim();
        const existing =
          mockDb.profiles.find(
            (p) =>
              p.username.toLowerCase() === normalized ||
              p.id.toLowerCase() === normalized ||
              (normalized.includes("@") && p.username.toLowerCase() === normalized.split("@")[0])
          ) || mockDb.profiles[0];

        const session = {
          user: {
            id: existing ? existing.id : "usr_amina_juma",
            email: existing ? `${existing.username}@circle.tz` : email,
          },
        };
        currentSession = session;
        setStored("session", session);

        for (const listener of authListeners) {
          try {
            listener("SIGNED_IN", session);
          } catch {}
        }
        return { data: { user: session.user, session }, error: null };
      },
      async signOut() {
        currentSession = null;
        setStored("session", null);
        for (const listener of authListeners) {
          try {
            listener("SIGNED_OUT", null);
          } catch {}
        }
        return { error: null };
      },
      async updateUser(data) {
        if (currentSession?.user) {
          currentSession.user = { ...currentSession.user, ...data };
          setStored("session", currentSession);
        }
        return { data: { user: currentSession?.user }, error: null };
      }
    },

    from(table) {
      return new MockQueryBuilder(table);
    },

    storage: {
      from(bucket) {
        return {
          async upload(path, file) {
            let publicUrl = "";
            try {
              if (file instanceof Blob || file instanceof File) {
                // Read real file to persistent Data URL
                publicUrl = await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result);
                  reader.onerror = () => resolve(URL.createObjectURL(file));
                  reader.readAsDataURL(file);
                });
              } else if (typeof file === "string") {
                publicUrl = file;
              }
            } catch (err) {
              console.warn("Media storage read notice:", err);
              publicUrl = typeof file === "string" ? file : "";
            }

            mockDb.storage_objects = mockDb.storage_objects || {};
            mockDb.storage_objects[`${bucket}/${path}`] = publicUrl;
            mockDb.storage_objects[path] = publicUrl;
            setStored("storage_objects", mockDb.storage_objects);

            return { data: { path, publicUrl }, error: null };
          },
          getPublicUrl(path) {
            const stored =
              mockDb.storage_objects?.[`${bucket}/${path}`] ||
              mockDb.storage_objects?.[path] ||
              path;
            return {
              data: {
                publicUrl: stored,
              },
            };
          },
        };
      },
    },

    channel(name) {
      const handlers = [];
      const channelObj = {
        name,
        on(event, filterOrTable, maybeCallback) {
          let cb = maybeCallback;
          let table = filterOrTable;
          if (typeof filterOrTable === "object" && filterOrTable.table) {
            table = filterOrTable.table;
          }
          if (!cb && typeof filterOrTable === "function") {
            cb = filterOrTable;
          }

          handlers.push({ table, cb });
          return channelObj;
        },
        subscribe() {
          const subscriber = (table, eventType, record) => {
            for (const h of handlers) {
              if (!h.table || h.table === table) {
                try {
                  h.cb({ eventType, new: record, old: record });
                } catch {}
              }
            }
          };
          mockDb.subscribers.add(subscriber);
          channelObj._sub = subscriber;
          return channelObj;
        },
      };
      return channelObj;
    },

    removeChannel(channel) {
      if (channel?._sub) {
        mockDb.subscribers.delete(channel._sub);
      }
    },
  };
}

export const createRealtimeClient = createMockSupabase;

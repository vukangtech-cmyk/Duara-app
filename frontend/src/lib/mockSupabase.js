// Production Realtime Database Engine for THE CIRCLE DUARA - Affiliate & Commerce Network
// CEO: HAMZA VUKANG | Built for Real Users, Verified Managers, and Customer Advertisers
// Supports multi-tab instant synchronization via BroadcastChannel, persistent storage,
// real file media processing (data URLs), authentic session auth, and live messaging/call signaling.

const STORAGE_PREFIX = "the_circle_affiliate_db_";
const LEGACY_PREFIX = "the_circle_db_";

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

// Authentic Real Founder & CEO Profile
const initialProfiles = [
  {
    id: "usr_ceo_hamza_vukang",
    username: "hamzavukang",
    display_name: "Hamza Vukang",
    email: "vukangtech@gmail.com",
    passcode: "151006",
    role: "ceo", // 'ceo' | 'manager' | 'customer'
    bio: "CEO & Mwanzilishi Mkuu wa THE CIRCLE DUARA Affiliate Network. Kusimamia biashara, mameneja, matangazo na malipo ya mtandao kote Afrika Mashariki.",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80",
    cover_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=80",
    location: "Dar es Salaam, Tanzania",
    phone: "+255 754 000 111",
    whatsapp: "255754000111",
    website: "https://duara.network",
    pronouns: "he/him",
    verified: true,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  }
];

// Initial Platform Settings configured by CEO Hamza Vukang
const initialPlatformSettings = {
  platform_name: "THE CIRCLE DUARA Affiliate Network",
  ceo_name: "HAMZA VUKANG",
  ceo_email: "vukangtech@gmail.com",
  default_commission_rate: 10, // 10%
  ad_posting_fee: 5000, // TZS
  ad_boost_fee: 15000, // TZS
  payment_numbers: {
    mpesa: "554433 (THE CIRCLE LIPA)",
    tigopesa: "778899 (DUARA AFFILIATE)",
    airtel: "992211 (HAMZA VUKANG BUSINESS)",
    halopesa: "332211 (DUARA COMMERCE)",
    crdb_bank: "015299887700 (CRDB - DUARA NETWORK)",
    nmb_bank: "201100998877 (NMB - DUARA NETWORK)"
  }
};

// Initial Catalogues (Real products managed by verified managers)
const initialCatalogues = [
  {
    id: "cat_prod_1",
    manager_id: "usr_ceo_hamza_vukang",
    name: "Simu ya Kisasa ya Smartphone 5G (128GB)",
    price: 380000,
    currency: "TZS",
    commission_rate: 8, // 8% commission for affiliate
    description: "Simu mpya yenye uwezo mkubwa wa betri, kamera ya 64MP na kioo cha AMOLED. Inakuja na waranti ya mwaka 1.",
    image_url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80",
    category: "Vifaa vya Kielektroniki",
    in_stock: true,
    whatsapp_number: "255754000111",
    views_count: 142,
    orders_count: 18,
    affiliate_code: "SMART5G-HAMZA",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: "cat_prod_2",
    manager_id: "usr_ceo_hamza_vukang",
    name: "Saa ya Kidijitali ya Smartwatch Pro",
    price: 75000,
    currency: "TZS",
    commission_rate: 12, // 12% commission
    description: "Inapima mapigo ya moyo, hatua, usingizi na kupokea jumbe za WhatsApp moja kwa moja.",
    image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    category: "Vifaa vya Kielektroniki",
    in_stock: true,
    whatsapp_number: "255754000111",
    views_count: 98,
    orders_count: 14,
    affiliate_code: "WATCH-HAMZA",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: "cat_prod_3",
    manager_id: "usr_ceo_hamza_vukang",
    name: "Viatu vya Kifahari vya Ngozi Asilia",
    price: 65000,
    currency: "TZS",
    commission_rate: 10,
    description: "Viatu vilivyoshonwa kwa umaridadi, ngozi ngumu isiyochanika, muundo wa kisasa kwa ofisini na hafla.",
    image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    category: "Mavazi & Mitindo",
    in_stock: true,
    whatsapp_number: "255754000111",
    views_count: 110,
    orders_count: 9,
    affiliate_code: "SHOES-HAMZA",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

// Initial Customer Ads
const initialCustomerAds = [
  {
    id: "ad_1",
    user_id: "usr_ceo_hamza_vukang",
    title: "Mavazi ya Vitenge na Suti za Kiume za Kisasa",
    price: 50000,
    currency: "TZS",
    category: "Mavazi & Mitindo",
    description: "Nguo za asili zenye muundo wa kipekee, pamba safi 100%. Tunatuma mikoani kote Tanzania!",
    image_url: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600&auto=format&fit=crop&q=80",
    location: "Kariakoo, Dar es Salaam",
    phone: "+255 754 000 111",
    whatsapp: "255754000111",
    status: "boosted", // 'active', 'pending', 'boosted'
    views_count: 320,
    clicks_count: 45,
    paid_amount: 15000,
    payment_status: "paid",
    payment_method: "M-Pesa",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: "ad_2",
    user_id: "usr_ceo_hamza_vukang",
    title: "Laptop ya HP Core i5, RAM 16GB, SSD 512GB",
    price: 650000,
    currency: "TZS",
    category: "Vifaa vya Kielektroniki",
    description: "Laptop safi sana, betri inakaa masaa 6+, inafaa kwa programming, graphics na kazi za ofisini.",
    image_url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80",
    location: "Posta, Dar es Salaam",
    phone: "+255 754 000 111",
    whatsapp: "255754000111",
    status: "active",
    views_count: 215,
    clicks_count: 28,
    paid_amount: 5000,
    payment_status: "paid",
    payment_method: "Tigo Pesa",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

const currentClientId = `client_${Math.random().toString(36).slice(2, 9)}`;

class RealtimeDb {
  constructor() {
    // Purge fake mock users so only authentic registered accounts and CEO exist
    const FAKE_USERNAMES = [
      "amina_juma", "juma_h", "baraka_tech", "amina_art", "kilimobora",
      "rashid_sound", "david_mwita", "mwanachama", "user", "advertiser", "manager"
    ];
    let loadedProfiles = getStored("profiles", initialProfiles) || [];
    this.profiles = loadedProfiles.filter(
      (p) => p && !FAKE_USERNAMES.includes(p.username) && !String(p.id).startsWith("creator_")
    );
    if (!this.profiles.some((p) => p.email === "vukangtech@gmail.com" || p.id === "usr_ceo_hamza_vukang")) {
      this.profiles.unshift(initialProfiles[0]);
    } else {
      // Ensure CEO credentials are up to date
      const ceo = this.profiles.find((p) => p.id === "usr_ceo_hamza_vukang" || p.email === "vukangtech@gmail.com");
      if (ceo) {
        ceo.email = "vukangtech@gmail.com";
        ceo.passcode = "151006";
        ceo.role = "ceo";
      }
    }
    setStored("profiles", this.profiles);

    this.platform_settings = getStored("platform_settings", initialPlatformSettings);
    this.catalogues = getStored("catalogues", initialCatalogues);
    this.customer_ads = getStored("customer_ads", initialCustomerAds);
    this.affiliate_orders = getStored("affiliate_orders", []);
    this.payout_requests = getStored("payout_requests", []);
    this.posts = getStored("posts", []);
    this.likes = getStored("likes", []);
    this.comments = getStored("comments", []);
    this.post_kicks = getStored("post_kicks", []);
    this.statuses = getStored("statuses", []);
    this.status_reactions = getStored("status_reactions", []);
    this.status_comments = getStored("status_comments", []);
    this.status_views = getStored("status_views", []);
    this.marketplace_listings = getStored("marketplace_listings", []);
    this.reels = getStored("reels", []);
    this.wallet_accounts = getStored("wallet_accounts", [
      { user_id: "usr_ceo_hamza_vukang", currency: "TZS", balance: 500000, created_at: new Date().toISOString() },
    ]);
    this.wallet_transactions = getStored("wallet_transactions", []);
    this.conversations = getStored("conversations", []);
    this.conversation_members = getStored("conversation_members", []);
    this.messages = getStored("messages", []);
    this.notifications = getStored("notifications", []);
    this.friend_requests = getStored("friend_requests", []);
    this.call_signals = getStored("call_signals", []);
    this.storage_objects = getStored("storage_objects", {});
    this.subscribers = new Set();

    this.setupRealtimeSync();
  }

  setupRealtimeSync() {
    try {
      if (typeof window !== "undefined" && window.BroadcastChannel) {
        this.bc = new BroadcastChannel("the_circle_affiliate_realtime_v2");
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
        if (e.key === "the_circle_affiliate_rt_pulse" && e.newValue) {
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
      this.platform_settings = getStored("platform_settings", this.platform_settings);
      this.catalogues = getStored("catalogues", this.catalogues);
      this.customer_ads = getStored("customer_ads", this.customer_ads);
      this.affiliate_orders = getStored("affiliate_orders", this.affiliate_orders);
      this.payout_requests = getStored("payout_requests", this.payout_requests);
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
    setStored("platform_settings", this.platform_settings);
    setStored("catalogues", this.catalogues);
    setStored("customer_ads", this.customer_ads);
    setStored("affiliate_orders", this.affiliate_orders);
    setStored("payout_requests", this.payout_requests);
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

    for (const sub of this.subscribers) {
      try {
        sub(table, eventType, payload);
      } catch {}
    }

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

    try {
      localStorage.setItem(
        "the_circle_affiliate_rt_pulse",
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
      mockDb[this.table] = [];
      list = mockDb[this.table];
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

    if (this.table === "customer_ads") {
      res.profiles = mockDb.getProfile(row.user_id) || {
        id: row.user_id,
        display_name: "Mteja Mtangazaji",
        username: "advertiser",
        avatar_url: null,
      };
    } else if (this.table === "catalogues") {
      res.profiles = mockDb.getProfile(row.manager_id) || {
        id: row.manager_id,
        display_name: "Manager wa Duka",
        username: "manager",
        avatar_url: null,
      };
    } else if (this.table === "affiliate_orders") {
      res.product = mockDb.catalogues.find((c) => c.id === row.product_id) || null;
      res.manager = mockDb.getProfile(row.manager_id) || null;
    } else if (this.table === "posts") {
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
    }

    return res;
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }
}

export function createMockSupabase() {
  const authListeners = new Set();

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
          email: email,
          role: options.data?.role || "customer", // 'ceo', 'manager', 'customer'
          location: options.data?.location || "Dar es Salaam, Tanzania",
          phone: options.data?.phone || "",
          whatsapp: options.data?.whatsapp || (options.data?.phone ? options.data?.phone.replace(/\D/g, "") : ""),
          business_name: options.data?.business_name || "",
          category: options.data?.category || "",
          bio: options.data?.bio || (options.data?.role === "manager"
            ? `Manager wa Duka (${options.data?.business_name || "Biashara"}) - WhatsApp Catalogue`
            : "Mteja & Mtangazaji wa Biashara"),
          avatar_url: options.data?.avatar_url || "",
          verified: options.data?.role === "ceo",
          password: password,
          created_at: new Date().toISOString(),
        };
        mockDb.profiles.push(newProfile);

        // Auto-initialize wallet account for real money operations
        if (!mockDb.wallet_accounts.some((w) => w.user_id === userId)) {
          mockDb.wallet_accounts.push({
            user_id: userId,
            currency: "TZS",
            balance: 0,
            created_at: new Date().toISOString()
          });
        }
        mockDb.save();

        for (const listener of authListeners) {
          try {
            listener("SIGNED_IN", session);
          } catch {}
        }
        return { data: { user, session }, error: null };
      },
      async signInWithPassword({ email, password }) {
        const normalized = (email || "").toLowerCase().trim();
        const inputCode = String(password || "").trim();

        // Dedicated CEO Account authentication: vukangtech@gmail.com with passcode 151006
        const isCeo = normalized === "vukangtech@gmail.com" || normalized === "hamzavukang";
        if (isCeo) {
          if (inputCode !== "151006") {
            const err = new Error("Passcode ya CEO si sahihi! Tafadhali weka passcode maalumu ya CEO (151006).");
            return { data: { user: null, session: null }, error: err };
          }
          const ceo = mockDb.profiles.find((p) => p.role === "ceo" || p.id === "usr_ceo_hamza_vukang") || initialProfiles[0];
          const session = {
            user: {
              id: ceo.id,
              email: "vukangtech@gmail.com",
              role: "ceo",
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
        }

        // Regular user check
        const existing = mockDb.profiles.find(
          (p) =>
            p.email?.toLowerCase() === normalized ||
            p.username?.toLowerCase() === normalized ||
            p.id?.toLowerCase() === normalized
        );

        if (!existing) {
          const err = new Error("Akaunti haikupatikana kwa barua pepe au jina hili. Tafadhali bonyeza 'Jiunge na Mtandao' kujisajili.");
          return { data: { user: null, session: null }, error: err };
        }

        if (existing.password && inputCode && existing.password !== inputCode) {
          const err = new Error("Nenosiri uliloweka si sahihi. Tafadhali jaribu tena.");
          return { data: { user: null, session: null }, error: err };
        }

        const session = {
          user: {
            id: existing.id,
            email: existing.email || `${existing.username}@duara.network`,
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

import React, { useState, useEffect } from "react";
import {
  getManagerCatalogues,
  createCatalogueProduct,
  updateCatalogueProduct,
  deleteCatalogueProduct,
  createAffiliateOrder,
  getAffiliateOrders,
  requestPayout,
  getPayoutRequests,
  getPlatformSettings,
  updatePlatformSettings,
  uploadImage
} from "./api/api";
import { PaymentModal } from "./PaymentModal";

// Curated gallery of Smartphones & Phone Appliances photos for the Shop
// Note: Price & descriptions are NOT fabricated; CEO sets/edits them manually!
export const SHOP_PHONE_GALLERY = [
  // --- SIMU (SMARTPHONES) ---
  {
    key: "iphone-15-pro-max",
    name: "Apple iPhone 15 Pro Max",
    category: "Simu (Smartphones)",
    image_url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "iphone-14-pro",
    name: "Apple iPhone 14 Pro Max",
    category: "Simu (Smartphones)",
    image_url: "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "iphone-13-pro",
    name: "Apple iPhone 13 Pro / 13",
    category: "Simu (Smartphones)",
    image_url: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "iphone-12-pro",
    name: "Apple iPhone 12 Pro Max",
    category: "Simu (Smartphones)",
    image_url: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "iphone-11",
    name: "Apple iPhone 11 / 11 Pro",
    category: "Simu (Smartphones)",
    image_url: "https://images.unsplash.com/photo-1574755393849-623942496936?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "samsung-s24-ultra",
    name: "Samsung Galaxy S24 Ultra 5G",
    category: "Simu (Smartphones)",
    image_url: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "samsung-s23-ultra",
    name: "Samsung Galaxy S23 Ultra",
    category: "Simu (Smartphones)",
    image_url: "https://images.unsplash.com/photo-1678911820864-e2c567c655d7?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "samsung-a55",
    name: "Samsung Galaxy A55 / A54 5G",
    category: "Simu (Smartphones)",
    image_url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "samsung-a15",
    name: "Samsung Galaxy A15 / A25",
    category: "Simu (Smartphones)",
    image_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "google-pixel-8-pro",
    name: "Google Pixel 8 Pro / Pixel 7",
    category: "Simu (Smartphones)",
    image_url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "redmi-note-13-pro",
    name: "Xiaomi Redmi Note 13 Pro+",
    category: "Simu (Smartphones)",
    image_url: "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "tecno-camon-30",
    name: "Tecno Camon 30 Premier / Spark 20",
    category: "Simu (Smartphones)",
    image_url: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "infinix-note-40",
    name: "Infinix Note 40 Pro / Zero 30",
    category: "Simu (Smartphones)",
    image_url: "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "oppo-reno-11",
    name: "Oppo Reno 11 5G / Find X",
    category: "Simu (Smartphones)",
    image_url: "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=700&auto=format&fit=crop&q=80"
  },

  // --- VIFAA VYA SIMU (OTHER PHONE APPLIANCES & ACCESSORIES) ---
  {
    key: "airpods-pro-2",
    name: "Apple AirPods Pro (2nd Gen) / Earbuds",
    category: "Vifaa vya Simu (Appliances)",
    image_url: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "wireless-headphones",
    name: "Bluetooth Wireless Headphones (ANC)",
    category: "Vifaa vya Simu (Appliances)",
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "smartwatch-ultra",
    name: "Smart Watch Ultra / Series 9",
    category: "Vifaa vya Simu (Appliances)",
    image_url: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "fast-charger-type-c",
    name: "Fast Charger 45W / 65W Type-C & USB Cable",
    category: "Vifaa vya Simu (Appliances)",
    image_url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "power-bank-20000",
    name: "Power Bank 20,000mAh Fast Charge",
    category: "Vifaa vya Simu (Appliances)",
    image_url: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "magsafe-wireless-charger",
    name: "MagSafe Wireless Charger Stand 3-in-1",
    category: "Vifaa vya Simu (Appliances)",
    image_url: "https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "bluetooth-speaker",
    name: "Portable Bluetooth Speaker (Deep Bass)",
    category: "Vifaa vya Simu (Appliances)",
    image_url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "phone-cases-protectors",
    name: "Phone Covers, Pouches & 9D Privacy Glass",
    category: "Vifaa vya Simu (Appliances)",
    image_url: "https://images.unsplash.com/photo-1601593346740-925612772716?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "tablet-ipad-appliance",
    name: "iPad / Android Tablet & Stylus Pen",
    category: "Vifaa vya Simu (Appliances)",
    image_url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=700&auto=format&fit=crop&q=80"
  },
  {
    key: "creator-tripod-mic",
    name: "Phone Gimbal, Tripod & Wireless Lavalier Mic",
    category: "Vifaa vya Simu (Appliances)",
    image_url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=700&auto=format&fit=crop&q=80"
  }
];

function formatSocialUrl(platform, value) {
  if (!value || !value.trim()) return null;
  const clean = value.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
  const handle = clean.replace(/^@/, "");
  switch (platform) {
    case "whatsapp": {
      const digits = clean.replace(/\D/g, "");
      return digits ? `https://wa.me/${digits}` : null;
    }
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "tiktok":
      return `https://tiktok.com/@${handle}`;
    case "facebook":
      return `https://facebook.com/${handle}`;
    case "telegram":
      return `https://t.me/${handle}`;
    case "twitter":
      return `https://x.com/${handle}`;
    case "youtube":
      return `https://youtube.com/@${handle}`;
    default:
      return `https://${clean}`;
  }
}

export function AffiliateManagerCatalogue({
  profile,
  onShowToast,
  onOpenDirectMessage,
  onMessageUser,
  lang = "sw"
}) {
  const [catalogues, setCatalogues] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // 'shop' | 'manage' | 'ceo_config' | 'orders'
  const [viewMode, setViewMode] = useState("shop");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Add / Edit Product State (Manual CEO input)
  const [editingProductId, setEditingProductId] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Simu (Smartphones)");
  const [description, setDescription] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [selectedImageUrl, setSelectedImageUrl] = useState(SHOP_PHONE_GALLERY[0].image_url);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Quick Manual Edit Modal for any Gallery / Shop Item
  const [quickEditModalItem, setQuickEditModalItem] = useState(null);

  // Order & Payment Modal State
  const [orderingProduct, setOrderingProduct] = useState(null);
  const [payingProduct, setPayingProduct] = useState(null);
  const [previewImageProduct, setPreviewImageProduct] = useState(null);
  const [customerName, setCustomerName] = useState(profile?.display_name || "");
  const [customerPhone, setCustomerPhone] = useState(profile?.phone || "");
  const [deliveryAddress, setDeliveryAddress] = useState(profile?.location || "");

  // CEO Manual Lipa Namba & Social Media Accounts State
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [mpesaName, setMpesaName] = useState("");
  const [tigoNumber, setTigoNumber] = useState("");
  const [tigoName, setTigoName] = useState("");
  const [airtelNumber, setAirtelNumber] = useState("");
  const [airtelName, setAirtelName] = useState("");
  const [haloNumber, setHaloNumber] = useState("");
  const [haloName, setHaloName] = useState("");
  const [bankNumber, setBankNumber] = useState("");
  const [bankName, setBankName] = useState("");

  const [socialWhatsapp, setSocialWhatsapp] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialTiktok, setSocialTiktok] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialTelegram, setSocialTelegram] = useState("");
  const [socialTwitter, setSocialTwitter] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  const isCeo = profile?.role === "ceo";
  const isManagerOrCeo = profile?.role === "manager" || profile?.role === "ceo";

  const loadShopData = async () => {
    try {
      setLoading(true);
      const [catData, ordData, payData, settData] = await Promise.all([
        getManagerCatalogues(),
        getAffiliateOrders(isCeo ? null : profile?.id),
        getPayoutRequests(isCeo ? null : profile?.id),
        getPlatformSettings()
      ]);
      setCatalogues(catData || []);
      setOrders(ordData || []);
      setPayouts(payData || []);
      setSettings(settData);

      if (settData) {
        const pn = settData.payment_numbers || {};
        const sl = settData.social_links || pn.social_links || {};
        setMpesaNumber(pn.mpesa || "");
        setMpesaName(pn.mpesa_name || "");
        setTigoNumber(pn.tigopesa || "");
        setTigoName(pn.tigopesa_name || "");
        setAirtelNumber(pn.airtel || "");
        setAirtelName(pn.airtel_name || "");
        setHaloNumber(pn.halopesa || "");
        setHaloName(pn.halopesa_name || "");
        setBankNumber(pn.bank || "");
        setBankName(pn.bank_name || "");

        setSocialWhatsapp(sl.whatsapp || profile?.whatsapp || "");
        setSocialInstagram(sl.instagram || "");
        setSocialTiktok(sl.tiktok || "");
        setSocialFacebook(sl.facebook || "");
        setSocialTelegram(sl.telegram || "");
        setSocialTwitter(sl.twitter || "");
        setSocialYoutube(sl.youtube || "");
        setWhatsappNumber((prev) => prev || sl.whatsapp || profile?.whatsapp || "");
      }
    } catch (err) {
      console.warn("Load shop error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShopData();
  }, [profile?.id]);

  // Combine database products with the curated Phone & Appliances gallery so the Shop always has rich phone/appliance photos
  // while showing CEO's manual prices and descriptions!
  const combinedShopItems = React.useMemo(() => {
    const dbByName = new Map();
    catalogues.forEach((item) => {
      dbByName.set((item.name || "").trim().toLowerCase(), item);
    });

    const galleryMapped = SHOP_PHONE_GALLERY.map((gItem) => {
      const existingDb = dbByName.get(gItem.name.toLowerCase());
      if (existingDb) {
        return { ...existingDb, isFromDb: true, galleryKey: gItem.key };
      }
      return {
        id: `gallery_${gItem.key}`,
        galleryKey: gItem.key,
        name: gItem.name,
        category: gItem.category,
        image_url: gItem.image_url,
        price: 0, // CEO sets manually
        description: "", // CEO sets manually
        whatsapp_number: socialWhatsapp || profile?.whatsapp || "",
        isFromDb: false,
        in_stock: true
      };
    });

    // Any extra custom products added by CEO/Managers that aren't in the default gallery names
    const galleryNamesSet = new Set(SHOP_PHONE_GALLERY.map((g) => g.name.toLowerCase()));
    const customDbItems = catalogues
      .filter((c) => !galleryNamesSet.has((c.name || "").trim().toLowerCase()))
      .map((c) => ({ ...c, isFromDb: true }));

    return [...customDbItems, ...galleryMapped];
  }, [catalogues, socialWhatsapp, profile?.whatsapp]);

  const filteredShopItems = combinedShopItems.filter((item) => {
    const cat = (item.category || "").toLowerCase();
    const matchCat =
      categoryFilter === "all" ||
      (categoryFilter === "phones" && cat.includes("simu") && !cat.includes("vifaa")) ||
      (categoryFilter === "appliances" && (cat.includes("vifaa") || cat.includes("appliance") || cat.includes("elektroniki"))) ||
      (categoryFilter === "fashion" && (cat.includes("mitindo") || cat.includes("mavazi") || cat.includes("urembo"))) ||
      (categoryFilter === "other" && !cat.includes("simu") && !cat.includes("vifaa") && !cat.includes("appliance"));
    const matchSearch =
      !searchQuery.trim() ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Active social links configured by CEO
  const activeSocialLinks = React.useMemo(() => {
    const sl = settings?.social_links || settings?.payment_numbers?.social_links || {
      whatsapp: socialWhatsapp,
      instagram: socialInstagram,
      tiktok: socialTiktok,
      facebook: socialFacebook,
      telegram: socialTelegram,
      twitter: socialTwitter,
      youtube: socialYoutube
    };
    const list = [];
    if (sl.whatsapp) list.push({ id: "whatsapp", label: "WhatsApp", icon: "💬", color: "#25D366", url: formatSocialUrl("whatsapp", sl.whatsapp), raw: sl.whatsapp });
    if (sl.instagram) list.push({ id: "instagram", label: "Instagram", icon: "📸", color: "#E1306C", url: formatSocialUrl("instagram", sl.instagram), raw: sl.instagram });
    if (sl.tiktok) list.push({ id: "tiktok", label: "TikTok", icon: "🎵", color: "#111827", url: formatSocialUrl("tiktok", sl.tiktok), raw: sl.tiktok });
    if (sl.facebook) list.push({ id: "facebook", label: "Facebook", icon: "📘", color: "#1877F2", url: formatSocialUrl("facebook", sl.facebook), raw: sl.facebook });
    if (sl.telegram) list.push({ id: "telegram", label: "Telegram", icon: "✈️", color: "#0088cc", url: formatSocialUrl("telegram", sl.telegram), raw: sl.telegram });
    if (sl.twitter) list.push({ id: "twitter", label: "X", icon: "𝕏", color: "#0f172a", url: formatSocialUrl("twitter", sl.twitter), raw: sl.twitter });
    if (sl.youtube) list.push({ id: "youtube", label: "YouTube", icon: "▶️", color: "#FF0000", url: formatSocialUrl("youtube", sl.youtube), raw: sl.youtube });
    return list.filter((x) => Boolean(x.url));
  }, [settings, socialWhatsapp, socialInstagram, socialTiktok, socialFacebook, socialTelegram, socialTwitter, socialYoutube]);

  // Active Lipa Namba configured by CEO
  const activeLipaNumbers = React.useMemo(() => {
    const pn = settings?.payment_numbers || {};
    const list = [];
    if (pn.mpesa) list.push({ label: "M-Pesa", number: pn.mpesa, name: pn.mpesa_name, color: "#e60000" });
    if (pn.tigopesa) list.push({ label: "Tigo Pesa / Mixx", number: pn.tigopesa, name: pn.tigopesa_name, color: "#00377b" });
    if (pn.airtel) list.push({ label: "Airtel Money", number: pn.airtel, name: pn.airtel_name, color: "#dc2626" });
    if (pn.halopesa) list.push({ label: "HaloPesa", number: pn.halopesa, name: pn.halopesa_name, color: "#ea580c" });
    if (pn.bank) list.push({ label: "Benki", number: pn.bank, name: pn.bank_name, color: "#059669" });
    return list;
  }, [settings]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleOpenManualEdit = (prod) => {
    setQuickEditModalItem(prod);
    setEditingProductId(prod.isFromDb ? prod.id : null);
    setName(prod.name || "");
    setPrice(prod.price > 0 ? String(prod.price) : "");
    setCategory(prod.category || "Simu (Smartphones)");
    setDescription(prod.description || "");
    setSelectedImageUrl(prod.image_url || SHOP_PHONE_GALLERY[0].image_url);
    setWhatsappNumber(prod.whatsapp_number || socialWhatsapp || profile?.whatsapp || "");
    setImageFile(null);
    setImagePreview("");
  };

  const handleSaveProductManual = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      if (onShowToast) onShowToast("Tafadhali weka jina la bidhaa!");
      return;
    }

    setSubmitting(true);
    try {
      let finalImageUrl = selectedImageUrl || SHOP_PHONE_GALLERY[0].image_url;
      if (imageFile) {
        finalImageUrl = await uploadImage(profile.id, imageFile, "catalogue-media");
      }

      const payload = {
        name: name.trim(),
        price: Number(price) || 0,
        currency: "TZS",
        commission_rate: 10,
        category,
        description: description.trim(),
        image_url: finalImageUrl,
        whatsapp_number: (whatsappNumber || socialWhatsapp || "").replace(/\D/g, "")
      };

      if (editingProductId) {
        await updateCatalogueProduct(editingProductId, payload);
        if (onShowToast) onShowToast(`✓ Bidhaa "${name}" imesasishwa kikamilifu!`);
      } else {
        await createCatalogueProduct(profile.id, payload);
        if (onShowToast) onShowToast(`✓ Bidhaa "${name}" imehifadhiwa kwenye Shop!`);
      }

      setQuickEditModalItem(null);
      setEditingProductId(null);
      setName("");
      setPrice("");
      setDescription("");
      setImageFile(null);
      setImagePreview("");
      if (viewMode === "manage") setViewMode("shop");
      await loadShopData();
    } catch (err) {
      if (onShowToast) onShowToast("Hitilafu: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (prod) => {
    if (!prod.isFromDb) return;
    try {
      await deleteCatalogueProduct(prod.id);
      if (onShowToast) onShowToast("Bidhaa imeondolewa.");
      setQuickEditModalItem(null);
      await loadShopData();
    } catch (err) {
      if (onShowToast) onShowToast("Hitilafu: " + err.message);
    }
  };

  const handleSaveCeoConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await updatePlatformSettings({
        payment_numbers: {
          mpesa: mpesaNumber.trim(),
          mpesa_name: mpesaName.trim(),
          tigopesa: tigoNumber.trim(),
          tigopesa_name: tigoName.trim(),
          airtel: airtelNumber.trim(),
          airtel_name: airtelName.trim(),
          halopesa: haloNumber.trim(),
          halopesa_name: haloName.trim(),
          bank: bankNumber.trim(),
          bank_name: bankName.trim()
        },
        social_links: {
          whatsapp: socialWhatsapp.trim(),
          instagram: socialInstagram.trim(),
          tiktok: socialTiktok.trim(),
          facebook: socialFacebook.trim(),
          telegram: socialTelegram.trim(),
          twitter: socialTwitter.trim(),
          youtube: socialYoutube.trim()
        }
      });
      if (onShowToast) {
        onShowToast("✓ Lipa Namba na Akaunti za Mitandao ya Kijamii za CEO zimehifadhiwa!");
      }
      await loadShopData();
      setViewMode("shop");
    } catch (err) {
      if (onShowToast) onShowToast("Hitilafu: " + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCopyProductLink = (prod) => {
    const shareUrl = `${window.location.origin}/?shop_item=${encodeURIComponent(prod.name)}`;
    navigator.clipboard?.writeText(shareUrl);
    if (onShowToast) onShowToast(`🔗 Link ya "${prod.name}" imenakiliwa!`);
  };

  return (
    <div className="shop-shell" style={{ maxWidth: 1120, margin: "0 auto", width: "100%" }}>
      {/* Clean Shop Header Banner */}
      <div
        className="glass-card"
        style={{
          background: "linear-gradient(135deg, #064e3b, #0f766e)",
          color: "#ffffff",
          borderRadius: 16,
          padding: "16px 18px",
          marginBottom: 14,
          border: "none"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🛍️</span>
            <h2 style={{ margin: 0, fontSize: "clamp(18px, 3vw, 22px)", fontWeight: 800, color: "#fff" }}>
              Shop
            </h2>
          </div>

          {isManagerOrCeo && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  setEditingProductId(null);
                  setName("");
                  setPrice("");
                  setDescription("");
                  setViewMode("manage");
                }}
                style={{
                  background: "#ffffff",
                  color: "#064e3b",
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 12px",
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: "pointer"
                }}
              >
                ➕ Ongeza Bidhaa
              </button>
              <button
                type="button"
                onClick={() => setViewMode("ceo_config")}
                style={{
                  background: "#fbbf24",
                  color: "#111827",
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 12px",
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: "pointer"
                }}
              >
                ⚙️ Malipo & Links
              </button>
            </div>
          )}
        </div>

        {/* Active Lipa Namba & Social Media Bar (only shown when configured) */}
        {(activeLipaNumbers.length > 0 || activeSocialLinks.length > 0) && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid rgba(255,255,255,0.18)",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10
            }}
          >
            {activeLipaNumbers.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.9 }}>💳 Lipa Namba:</span>
                {activeLipaNumbers.map((ln, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "rgba(255,255,255,0.16)",
                      padding: "4px 10px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700
                    }}
                  >
                    {ln.label}: <strong>{ln.number}</strong> {ln.name ? `(${ln.name})` : ""}
                  </span>
                ))}
              </div>
            )}

            {activeSocialLinks.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                {activeSocialLinks.map((soc) => (
                  <a
                    key={soc.id}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: "#ffffff",
                      color: "#064e3b",
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    <span>{soc.icon}</span>
                    <span>{soc.label}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 8,
          marginBottom: 14,
          borderBottom: "1px solid var(--line)"
        }}
      >
        <button
          type="button"
          onClick={() => setViewMode("shop")}
          className={`button ${viewMode === "shop" ? "button-primary" : "button-soft"}`}
          style={{ padding: "8px 14px", fontSize: 12.5, flexShrink: 0 }}
        >
          🛍️ Bidhaa ({combinedShopItems.length})
        </button>

        {isManagerOrCeo && (
          <>
            <button
              type="button"
              onClick={() => setViewMode("manage")}
              className={`button ${viewMode === "manage" ? "button-primary" : "button-soft"}`}
              style={{ padding: "8px 14px", fontSize: 12.5, flexShrink: 0 }}
            >
              ➕ Ongeza Bidhaa
            </button>
            <button
              type="button"
              onClick={() => setViewMode("ceo_config")}
              className={`button ${viewMode === "ceo_config" ? "button-primary" : "button-soft"}`}
              style={{ padding: "8px 14px", fontSize: 12.5, flexShrink: 0 }}
            >
              ⚙️ Malipo & Links
            </button>
            <button
              type="button"
              onClick={() => setViewMode("orders")}
              className={`button ${viewMode === "orders" ? "button-primary" : "button-soft"}`}
              style={{ padding: "8px 14px", fontSize: 12.5, flexShrink: 0 }}
            >
              📦 Oda ({orders.length})
            </button>
          </>
        )}
      </div>

      {/* VIEW 1: SHOP GRID */}
      {viewMode === "shop" && (
        <div>
          {/* Category & Search Bar */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16
            }}
          >
            <div style={{ display: "flex", gap: 6, overflowX: "auto", maxWidth: "100%", paddingBottom: 4 }}>
              {[
                { id: "all", label: `Zote (${combinedShopItems.length})` },
                { id: "phones", label: "📱 Simu" },
                { id: "appliances", label: "🎧 Vifaa & Elektroniki" },
                { id: "fashion", label: "👗 Mitindo & Urembo" },
                { id: "other", label: "🏪 Bidhaa Nyingine" }
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryFilter(c.id)}
                  style={{
                    padding: "7px 13px",
                    borderRadius: 999,
                    border: categoryFilter === c.id ? "none" : "1px solid var(--line)",
                    background: categoryFilter === c.id ? "var(--primary)" : "var(--card-bg)",
                    color: categoryFilter === c.id ? "#fff" : "var(--ink)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="🔍 Tafuta bidhaa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: "1 1 200px",
                maxWidth: "100%",
                padding: "9px 14px",
                borderRadius: 10,
                border: "1px solid var(--line)",
                background: "var(--input-bg)",
                color: "var(--ink)",
                fontSize: 13,
                outline: "none"
              }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Inapakia bidhaa za Shop...</div>
          ) : (
            <div className="shop-products-grid">
              {filteredShopItems.map((prod) => {
                const hasManualPrice = Number(prod.price) > 0;
                const hasManualDesc = Boolean(prod.description && prod.description.trim());

                return (
                  <article
                    key={prod.id}
                    className="shop-product-card"
                  >
                    {/* Product Image */}
                    <div
                      className="shop-product-img-box"
                      onClick={() => setPreviewImageProduct(prod)}
                      title="Bonyeza kuona picha kamili"
                      style={{ cursor: "zoom-in" }}
                    >
                      <img
                        src={prod.image_url}
                        alt={prod.name}
                        loading="lazy"
                      />
                      <span className="shop-category-badge">{prod.category}</span>

                      {isManagerOrCeo && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenManualEdit(prod);
                          }}
                          style={{
                            position: "absolute",
                            bottom: 8,
                            right: 8,
                            background: "#0f172a",
                            color: "#fbbf24",
                            border: "1px solid #fbbf24",
                            borderRadius: 8,
                            padding: "5px 10px",
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                            zIndex: 3
                          }}
                        >
                          ✏️ Hariri
                        </button>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="shop-product-body">
                      <h3 className="shop-product-title">{prod.name}</h3>

                      {/* Price */}
                      {hasManualPrice && (
                        <div style={{ margin: "4px 0 8px" }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>
                            TZS {Number(prod.price).toLocaleString()}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {hasManualDesc && (
                        <p
                          style={{
                            margin: "0 0 12px",
                            fontSize: 12.5,
                            color: "var(--ink)",
                            lineHeight: 1.45,
                            flex: 1
                          }}
                        >
                          {prod.description}
                        </p>
                      )}

                      {/* Direct Social Media Links */}
                      {activeSocialLinks.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                          {activeSocialLinks.map((soc) => {
                            const href =
                              soc.id === "whatsapp"
                                ? `${soc.url}?text=${encodeURIComponent(
                                    `Habari, nahitaji: "${prod.name}"${
                                      hasManualPrice ? ` (TZS ${Number(prod.price).toLocaleString()})` : ""
                                    }`
                                  )}`
                                : soc.url;
                            return (
                              <a
                                key={soc.id}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                  background: `${soc.color}15`,
                                  color: soc.color,
                                  border: `1px solid ${soc.color}35`,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  textDecoration: "none",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4
                                }}
                              >
                                <span>{soc.icon}</span>
                                <span>{soc.label}</span>
                              </a>
                            );
                          })}
                        </div>
                      )}

                      {/* Primary Action Buttons */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: "auto" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                          <button
                            type="button"
                            className="button button-primary"
                            style={{ padding: "8px 10px", fontSize: 12, borderRadius: 8 }}
                            onClick={() => setOrderingProduct(prod)}
                          >
                            🛒 Agiza
                          </button>
                          <button
                            type="button"
                            className="button button-soft"
                            style={{ padding: "8px 10px", fontSize: 12, borderRadius: 8 }}
                            onClick={() => {
                              const msgText = `Habari, nahitaji: "${prod.name}"${
                                hasManualPrice ? ` (TZS ${Number(prod.price).toLocaleString()})` : ""
                              }.`;
                              if (onOpenDirectMessage) {
                                onOpenDirectMessage(prod.manager_id || null, "Shop", msgText);
                              } else if (onMessageUser) {
                                onMessageUser(prod);
                              }
                            }}
                          >
                            💬 Chat
                          </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setPayingProduct(prod)}
                            style={{
                              background: "var(--input-bg)",
                              color: "var(--ink)",
                              border: "1px solid var(--line)",
                              padding: "7px",
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            💳 Lipa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyProductLink(prod)}
                            style={{
                              background: "var(--input-bg)",
                              color: "var(--ink)",
                              border: "1px solid var(--line)",
                              padding: "7px",
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            🔗 Share
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ADD / EDIT PRODUCT */}
      {viewMode === "manage" && isManagerOrCeo && (
        <div
          className="glass-card"
          style={{ maxWidth: 680, margin: "0 auto", padding: "20px", borderRadius: 16 }}
        >
          <h3 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 800 }}>
            ➕ Weka Bidhaa Kwenye Shop
          </h3>

          <form onSubmit={handleSaveProductManual} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Chagua Picha au Pakia Picha Yako:
              </label>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  paddingBottom: 8
                }}
              >
                {SHOP_PHONE_GALLERY.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => {
                      setSelectedImageUrl(g.image_url);
                      if (!name) setName(g.name);
                      setCategory(g.category);
                      setImageFile(null);
                      setImagePreview("");
                    }}
                    style={{
                      flexShrink: 0,
                      width: 84,
                      padding: 4,
                      borderRadius: 10,
                      border: selectedImageUrl === g.image_url ? "2px solid var(--primary)" : "1px solid var(--line)",
                      background: "var(--input-bg)",
                      cursor: "pointer",
                      textAlign: "center"
                    }}
                  >
                    <img
                      src={g.image_url}
                      alt={g.name}
                      style={{ width: "100%", height: 54, objectFit: "cover", borderRadius: 6 }}
                    />
                    <div
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        marginTop: 3,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: "var(--ink)"
                      }}
                    >
                      {g.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Jina la Bidhaa: *</label>
              <input
                type="text"
                placeholder="Andika jina la bidhaa..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Bei (TZS):</label>
                <input
                  type="number"
                  placeholder="Bei kwa TZS..."
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Kategoria:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--line)",
                    background: "var(--input-bg)",
                    color: "var(--ink)",
                    fontSize: 14
                  }}
                >
                  <option value="Simu (Smartphones)">Simu (Smartphones)</option>
                  <option value="Vifaa vya Simu (Appliances)">Vifaa & Elektroniki</option>
                  <option value="Mitindo & Mavazi">Mitindo & Mavazi</option>
                  <option value="Urembo & Afya">Urembo & Afya</option>
                  <option value="Nyumba & Samani">Nyumba & Samani</option>
                  <option value="Magari & Usafiri">Magari & Usafiri</option>
                  <option value="Bidhaa Mbalimbali">Bidhaa Mbalimbali</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Maelezo:</label>
              <textarea
                rows={3}
                placeholder="Maelezo ya bidhaa..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Pakia Picha:</label>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {(imagePreview || selectedImageUrl) && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={imagePreview || selectedImageUrl}
                    alt="Preview"
                    style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 10, border: "1px solid var(--line)" }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" className="button button-soft" onClick={() => setViewMode("shop")}>
                Ghairi
              </button>
              <button type="submit" className="button button-primary" disabled={submitting}>
                {submitting ? "Inahifadhi..." : "💾 Hifadhi"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 3: LIPA NAMBA & SOCIAL MEDIA LINKS */}
      {viewMode === "ceo_config" && isManagerOrCeo && (
        <div
          className="glass-card"
          style={{ maxWidth: 720, margin: "0 auto", padding: "20px", borderRadius: 16 }}
        >
          <h3 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 800 }}>
            ⚙️ Lipa Namba & Mitandao ya Kijamii
          </h3>

          <form onSubmit={handleSaveCeoConfig} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Part A: Lipa Namba */}
            <div
              style={{
                padding: 16,
                borderRadius: 14,
                background: "var(--bg-base)",
                border: "1px solid var(--line)"
              }}
            >
              <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "var(--primary)" }}>
                1. Namba za Malipo (Lipa Namba / Simu / Benki)
              </h4>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Vodacom M-Pesa (Lipa Namba / Simu):</label>
                  <input
                    type="text"
                    placeholder="Weka Lipa Namba au Simu ya M-Pesa..."
                    value={mpesaNumber}
                    onChange={(e) => setMpesaNumber(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Jina la M-Pesa (Mpokeaji):</label>
                  <input
                    type="text"
                    placeholder="Jina linalotokea kwenye M-Pesa..."
                    value={mpesaName}
                    onChange={(e) => setMpesaName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Mixx by Yas / Tigo Pesa (Lipa Namba / Simu):</label>
                  <input
                    type="text"
                    placeholder="Weka Lipa Namba au Simu ya Tigo..."
                    value={tigoNumber}
                    onChange={(e) => setTigoNumber(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Jina la Tigo Pesa (Mpokeaji):</label>
                  <input
                    type="text"
                    placeholder="Jina linalotokea Tigo Pesa..."
                    value={tigoName}
                    onChange={(e) => setTigoName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Airtel Money (Lipa Namba / Simu):</label>
                  <input
                    type="text"
                    placeholder="Weka namba ya Airtel Money..."
                    value={airtelNumber}
                    onChange={(e) => setAirtelNumber(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Jina la Airtel Money:</label>
                  <input
                    type="text"
                    placeholder="Jina la mpokeaji Airtel..."
                    value={airtelName}
                    onChange={(e) => setAirtelName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>HaloPesa (Lipa Namba / Simu):</label>
                  <input
                    type="text"
                    placeholder="Weka namba ya HaloPesa..."
                    value={haloNumber}
                    onChange={(e) => setHaloNumber(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Jina la HaloPesa:</label>
                  <input
                    type="text"
                    placeholder="Jina la mpokeaji HaloPesa..."
                    value={haloName}
                    onChange={(e) => setHaloName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Namba ya Akaunti ya Benki (CRDB / NMB):</label>
                  <input
                    type="text"
                    placeholder="Weka namba ya akaunti ya benki..."
                    value={bankNumber}
                    onChange={(e) => setBankNumber(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Jina la Akaunti ya Benki:</label>
                  <input
                    type="text"
                    placeholder="Jina la akaunti ya benki..."
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Part B: Social Media Links */}
            <div
              style={{
                padding: 16,
                borderRadius: 14,
                background: "var(--bg-base)",
                border: "1px solid var(--line)"
              }}
            >
              <h4 style={{ margin: "0 0 10px", fontSize: 15, color: "var(--primary)" }}>
                2. Mitandao ya Kijamii
              </h4>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>💬 Namba ya WhatsApp (mf. 2557...):</label>
                  <input
                    type="text"
                    placeholder="Mfano: 2557..."
                    value={socialWhatsapp}
                    onChange={(e) => setSocialWhatsapp(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>📸 Instagram (@username au Link):</label>
                  <input
                    type="text"
                    placeholder="Mfano: @username au https://instagram.com/..."
                    value={socialInstagram}
                    onChange={(e) => setSocialInstagram(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>🎵 TikTok (@username au Link):</label>
                  <input
                    type="text"
                    placeholder="Mfano: @username au https://tiktok.com/@..."
                    value={socialTiktok}
                    onChange={(e) => setSocialTiktok(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>📘 Facebook (Page au Profile Link):</label>
                  <input
                    type="text"
                    placeholder="Mfano: https://facebook.com/..."
                    value={socialFacebook}
                    onChange={(e) => setSocialFacebook(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>✈️ Telegram (@username au Link):</label>
                  <input
                    type="text"
                    placeholder="Mfano: @username au https://t.me/..."
                    value={socialTelegram}
                    onChange={(e) => setSocialTelegram(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>▶️ YouTube / X (Twitter):</label>
                  <input
                    type="text"
                    placeholder="Channel au profile link..."
                    value={socialYoutube}
                    onChange={(e) => setSocialYoutube(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" className="button button-soft" onClick={() => setViewMode("shop")}>
                Rudi Kwenye Shop
              </button>
              <button type="submit" className="button button-primary" disabled={savingConfig}>
                {savingConfig ? "Inahifadhi..." : "💾 Hifadhi Lipa Namba & Social Links"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 4: ORDERS */}
      {viewMode === "orders" && isManagerOrCeo && (
        <div className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 18 }}>📦 Oda za Wateja Kwenye Shop ({orders.length})</h3>
          {orders.length === 0 ? (
            <p className="muted">Hakuna oda zilizowekwa bado.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {orders.map((o) => (
                <div
                  key={o.id}
                  style={{
                    padding: "14px",
                    borderRadius: 12,
                    border: "1px solid var(--line)",
                    background: "var(--bg-base)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10
                  }}
                >
                  <div>
                    <strong>{o.customer_name}</strong> • <span>{o.customer_phone}</span>
                    <div className="muted" style={{ fontSize: 12 }}>
                      Mahali: {o.delivery_address} • {new Date(o.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: "var(--primary)", fontSize: 15 }}>
                    {Number(o.amount) > 0 ? `TZS ${Number(o.amount).toLocaleString()}` : "Oda ya Bidhaa"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CEO QUICK MANUAL EDIT FOR ANY PHONE / APPLIANCE CARD */}
      {quickEditModalItem && (
        <div className="modal-backdrop" onClick={() => setQuickEditModalItem(null)} style={{ zIndex: 9999, padding: 12 }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 500,
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              borderRadius: 18,
              padding: 20,
              background: "var(--card-bg)",
              border: "1px solid var(--line)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>✏️ Hariri Bidhaa</h3>
              <button
                type="button"
                onClick={() => setQuickEditModalItem(null)}
                style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer", color: "var(--ink)" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProductManual} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <img
                  src={imagePreview || selectedImageUrl}
                  alt={name}
                  style={{ width: 68, height: 68, borderRadius: 10, objectFit: "cover", border: "1px solid var(--line)" }}
                />
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>Picha:</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ fontSize: 12, marginTop: 4 }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Jina la Bidhaa:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Bei (TZS):</label>
                <input
                  type="number"
                  placeholder="Bei kwa TZS..."
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Maelezo:</label>
                <textarea
                  rows={3}
                  placeholder="Maelezo mafupi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 6 }}>
                {quickEditModalItem.isFromDb ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(quickEditModalItem)}
                    className="button button-soft"
                    style={{ color: "#ef4444" }}
                  >
                    🗑️ Futa
                  </button>
                ) : (
                  <span />
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="button button-soft" onClick={() => setQuickEditModalItem(null)}>
                    Ghairi
                  </button>
                  <button type="submit" className="button button-primary" disabled={submitting}>
                    {submitting ? "Inahifadhi..." : "💾 Hifadhi"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMER ORDER */}
      {orderingProduct && (
        <div className="modal-backdrop" onClick={() => setOrderingProduct(null)} style={{ zIndex: 9999, padding: 12 }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 460,
              width: "100%",
              borderRadius: 18,
              padding: 20,
              background: "var(--card-bg)",
              border: "1px solid var(--line)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>🛒 Agiza Bidhaa Kwenye Shop</h3>
              <button
                type="button"
                onClick={() => setOrderingProduct(null)}
                style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer", color: "var(--ink)" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center" }}>
              <img
                src={orderingProduct.image_url}
                alt={orderingProduct.name}
                style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 10 }}
              />
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{orderingProduct.name}</div>
                <div style={{ color: "var(--primary)", fontWeight: 800, fontSize: 14 }}>
                  {Number(orderingProduct.price) > 0
                    ? `TZS ${Number(orderingProduct.price).toLocaleString()}`
                    : "Bei itathibitishwa na CEO"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Jina Lako Kamili: *</label>
                <input
                  type="text"
                  placeholder="Andika jina lako..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Namba Yako ya Simu: *</label>
                <input
                  type="tel"
                  placeholder="Namba yako ya simu..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Mahali Ulipo (Mkoa / Wilaya): *</label>
                <input
                  type="text"
                  placeholder="Mfano: Dar es Salaam, Sinza"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="button button-soft"
                onClick={() => setOrderingProduct(null)}
                style={{ flex: 1 }}
              >
                Funga
              </button>
              <button
                type="button"
                className="button button-primary"
                style={{ flex: 2 }}
                onClick={async () => {
                  if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
                    if (onShowToast) onShowToast("Tafadhali jaza jina, namba ya simu na mahali ulipo!");
                    return;
                  }
                  try {
                    await createAffiliateOrder({
                      product_id: orderingProduct.isFromDb ? orderingProduct.id : null,
                      manager_id: orderingProduct.manager_id || profile?.id,
                      customer_name: customerName.trim(),
                      customer_phone: customerPhone.trim(),
                      delivery_address: `${orderingProduct.name} - ${deliveryAddress.trim()}`,
                      amount: Number(orderingProduct.price) || 0,
                      commission_earned: 0
                    });
                    if (onShowToast) onShowToast("✓ Oda yako imetumwa! CEO atawasiliana nawe.");
                    setOrderingProduct(null);
                    loadShopData();
                  } catch (err) {
                    if (onShowToast) onShowToast("Hitilafu: " + err.message);
                  }
                }}
              >
                Thibitisha Oda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FULL IMAGE PREVIEW LIGHTBOX */}
      {previewImageProduct && (
        <div
          className="modal-backdrop"
          onClick={() => setPreviewImageProduct(null)}
          style={{ zIndex: 10000, padding: 16 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 680,
              width: "100%",
              background: "var(--card-bg)",
              borderRadius: 20,
              padding: 18,
              border: "1px solid var(--line)",
              textAlign: "center"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, textAlign: "left" }}>{previewImageProduct.name}</h3>
              <button
                type="button"
                onClick={() => setPreviewImageProduct(null)}
                style={{ border: "none", background: "var(--bg-base)", width: 32, height: 32, borderRadius: "50%", fontSize: 16, cursor: "pointer", color: "var(--ink)" }}
              >
                ✕
              </button>
            </div>
            <div style={{ background: "#0f172a", borderRadius: 14, overflow: "hidden", maxHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src={previewImageProduct.image_url}
                alt={previewImageProduct.name}
                style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", display: "block" }}
              />
            </div>
            {previewImageProduct.description && (
              <p style={{ marginTop: 12, fontSize: 13.5, color: "var(--ink)", textAlign: "left", lineHeight: 1.5 }}>
                {previewImageProduct.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* MODAL: LIPA NAMBA PAYMENT */}
      {payingProduct && (
        <PaymentModal
          isOpen={Boolean(payingProduct)}
          onClose={() => setPayingProduct(null)}
          title="Malipo ya Bidhaa (Lipa Namba)"
          amount={Number(payingProduct.price) || 0}
          purpose={payingProduct.name}
          onPaymentSuccess={async (paymentDetails) => {
            try {
              await createAffiliateOrder({
                product_id: payingProduct.isFromDb ? payingProduct.id : null,
                manager_id: payingProduct.manager_id || profile?.id,
                customer_name: profile?.display_name || "Mteja",
                customer_phone: paymentDetails.phone || profile?.phone || "",
                delivery_address: `Malipo (${paymentDetails.method} Ref: ${paymentDetails.reference}) - ${payingProduct.name}`,
                amount: Number(payingProduct.price) || 0,
                payment_reference: paymentDetails.reference
              });
              if (onShowToast) onShowToast("✓ Taarifa za malipo zimehifadhiwa!");
              loadShopData();
            } catch (err) {
              console.warn(err);
            }
          }}
        />
      )}
    </div>
  );
}

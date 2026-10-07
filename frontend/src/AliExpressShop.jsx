import React, { useState, useEffect, useMemo } from "react";
import {
  getManagerCatalogues,
  createCatalogueProduct,
  uploadImage,
  getPlatformSettings,
  followUser,
  getFollowedUserIds
} from "./api/api";
import { PaymentModal } from "./PaymentModal";

// ============================================================================
// CURATED ALIEXPRESS ASSET & PRODUCT CATALOGUE
// Covers:
// 1. Kupangisha Vyumba & Maeneo (Rentals & Leases)
// 2. Kununua Nyumba & Viwanja (Real Estate & Land)
// 3. Magari & Assets (Vehicles, Bikes & Heavy Machinery)
// 4. Electronics, Fashion, Home, Beauty, Agri, Hardware & Tools
// ============================================================================

export const SEED_SHOP_ITEMS = [];

// Top Navigation Categories in AliExpress Style
export const SHOP_CATEGORIES = [
  { id: "all", label: "Zote (All)", icon: "🛍️" },
  { id: "rentals", label: "Vyumba & Maeneo (Rentals)", icon: "🏠", highlight: true },
  { id: "realestate", label: "Nyumba & Viwanja", icon: "🏢", highlight: true },
  { id: "vehicles", label: "Magari & Assets", icon: "🚗", highlight: true },
  { id: "electronics", label: "Simu & Elektroniki", icon: "📱" },
  { id: "fashion", label: "Mitindo & Mavazi", icon: "👗" },
  { id: "home", label: "Nyumbani & Samani", icon: "🛋️" },
  { id: "beauty", label: "Urembo & Afya", icon: "💄" },
  { id: "agriculture", label: "Kilimo & Vyakula", icon: "🌾" },
  { id: "tools", label: "Zana za Ujenzi", icon: "🔨" }
];

export function AliExpressShop({
  profile,
  onShowToast,
  onViewUserProfile,
  lang = "sw",
  onOpenAuth
}) {
  const isSw = lang === "sw";

  // State - Real user and catalogue listings only
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem("aliexpress_custom_listings");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return [];
  });

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("popular"); // 'popular' | 'price_low' | 'price_high' | 'newest' | 'rating'
  const [priceMax, setPriceMax] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedRentalType, setSelectedRentalType] = useState("all");

  // Cart & Wishlist
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("aliexpress_cart") || "[]");
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);

  // Active Detail Modal
  const [detailItem, setDetailItem] = useState(null);
  const [activeModalImage, setActiveModalImage] = useState(0);

  // Direct Checkout / Payment Modal
  const [paymentItem, setPaymentItem] = useState(null);

  // Add Listing Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newListing, setNewListing] = useState({
    name: "",
    category: "rentals",
    price: "",
    original_price: "",
    location: "Dar es Salaam",
    description: "",
    image_url: "",
    rentPeriod: "kwa mwezi",
    specsText: "",
    phone: profile?.phone || "",
    whatsapp: profile?.whatsapp || profile?.phone || ""
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [followedIds, setFollowedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("followed_user_ids") || "[]");
    } catch {
      return [];
    }
  });

  // Countdown timer for Flash Deals (AliExpress style)
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 24, seconds: 45 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save Cart to storage
  useEffect(() => {
    try {
      localStorage.setItem("aliexpress_cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Load backend catalogues if available
  useEffect(() => {
    getManagerCatalogues()
      .then((remoteItems) => {
        if (Array.isArray(remoteItems) && remoteItems.length > 0) {
          const formatted = remoteItems.map((c) => ({
            id: c.id,
            name: c.name || c.title || "Bidhaa",
            category: c.category || "electronics",
            categoryLabel: c.category || "Bidhaa",
            price: Number(c.price) || 0,
            original_price: c.original_price ? Number(c.original_price) : 0,
            currency: c.currency || "TZS",
            image_url: c.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
            images: Array.isArray(c.images) && c.images.length ? c.images : [c.image_url],
            description: c.description || "",
            rating: 4.8,
            orders_count: c.orders_count || 12,
            isChoice: true,
            badge: "Verified Listing",
            seller: {
              id: c.manager_id,
              name: c.profiles?.display_name || "Muuzaji wa Duara",
              phone: c.whatsapp_number || c.profiles?.phone || "",
              whatsapp: c.whatsapp_number || c.profiles?.phone || "",
              verified: true
            }
          }));

          setItems((prev) => {
            const existingIds = new Set(prev.map((x) => x.id));
            const newOnes = formatted.filter((f) => !existingIds.has(f.id));
            return [...newOnes, ...prev];
          });
        }
      })
      .catch(() => {});
  }, []);

  // Add to cart
  const handleAddToCart = (item, e) => {
    if (e) e.stopPropagation();
    setCart((prev) => {
      const exists = prev.find((x) => x.id === item.id);
      if (exists) {
        return prev.map((x) => (x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    if (onShowToast) {
      onShowToast(isSw ? `✓ "${item.name}" imewekwa kwenye mkokoteni!` : `✓ "${item.name}" added to cart!`);
    }
  };

  // Follow / Unfollow seller or landlord
  const handleToggleFollow = async (sellerId, sellerName, e) => {
    if (e) e.stopPropagation();
    if (!sellerId) return;
    const isNow = !followedIds.includes(sellerId);
    let updated;
    if (isNow) {
      updated = [...followedIds, sellerId];
    } else {
      updated = followedIds.filter((id) => id !== sellerId);
    }
    setFollowedIds(updated);
    try {
      localStorage.setItem("followed_user_ids", JSON.stringify(updated));
      if (profile?.id) {
        await followUser(profile.id, sellerId);
      }
    } catch {}
    if (onShowToast) {
      onShowToast(
        isNow
          ? `✓ Umemfollow ${sellerName || "Muuzaji"}!`
          : `✓ Umeacha kumfollow ${sellerName || "Muuzaji"}`
      );
    }
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let list = [...items];

    // Category
    if (activeCategory !== "all") {
      list = list.filter((item) => {
        const cat = (item.category || "").toLowerCase();
        if (activeCategory === "rentals") return cat.includes("rental") || cat.includes("panga") || cat.includes("vyumba");
        if (activeCategory === "realestate") return cat.includes("realestate") || cat.includes("nyumba") || cat.includes("kiwanja") || cat.includes("shamba");
        if (activeCategory === "vehicles") return cat.includes("vehicle") || cat.includes("gari") || cat.includes("pikipiki") || cat.includes("bajaji");
        return cat.includes(activeCategory);
      });
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q) ||
          item.categoryLabel?.toLowerCase().includes(q)
      );
    }

    // Price Filter
    if (priceMax && !isNaN(Number(priceMax))) {
      list = list.filter((item) => item.price <= Number(priceMax));
    }

    // Location Filter
    if (selectedLocation !== "all") {
      list = list.filter((item) => item.location?.toLowerCase().includes(selectedLocation.toLowerCase()));
    }

    // Rental type
    if (selectedRentalType !== "all") {
      list = list.filter((item) => item.propertyType === selectedRentalType);
    }

    // Sorting
    if (sortBy === "price_low") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_high") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "newest") {
      // reverse default
    } else {
      // Popular (orders count)
      list.sort((a, b) => (b.orders_count || 0) - (a.orders_count || 0));
    }

    return list;
  }, [items, activeCategory, searchTerm, priceMax, selectedLocation, selectedRentalType, sortBy]);

  // Flash Deals items (Top discounted items)
  const flashDeals = useMemo(() => {
    return items.filter((x) => x.original_price && x.original_price > x.price).slice(0, 6);
  }, [items]);

  // Handle Image Upload for new listing
  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadImage(profile?.id || "guest", file);
      setNewListing((prev) => ({ ...prev, image_url: uploadedUrl }));
      if (onShowToast) onShowToast("✓ Picha imepakiwa kikamilifu!");
    } catch {
      // Fallback object URL
      const fallbackUrl = URL.createObjectURL(file);
      setNewListing((prev) => ({ ...prev, image_url: fallbackUrl }));
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit New Listing
  const handleCreateListing = async (e) => {
    e.preventDefault();
    if (!newListing.name.trim() || !newListing.price) {
      alert("Tafadhali weka jina la bidhaa/asset na bei.");
      return;
    }

    const priceNum = Number(newListing.price);
    const origPriceNum = newListing.original_price ? Number(newListing.original_price) : priceNum * 1.2;

    const newItem = {
      id: `custom_${Date.now()}`,
      name: newListing.name.trim(),
      category: newListing.category,
      categoryLabel:
        newListing.category === "rentals"
          ? "Kupanga (Vyumba & Maeneo)"
          : newListing.category === "realestate"
          ? "Kununua: Nyumba & Viwanja"
          : newListing.category === "vehicles"
          ? "Magari & Assets"
          : "Bidhaa Rasmi",
      price: priceNum,
      original_price: origPriceNum,
      currency: "TZS",
      rentPeriod: newListing.category === "rentals" ? newListing.rentPeriod : undefined,
      location: newListing.location || "Dar es Salaam",
      image_url:
        newListing.image_url ||
        (newListing.category === "rentals"
          ? "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80"
          : newListing.category === "vehicles"
          ? "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"),
      images: [
        newListing.image_url ||
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80"
      ],
      description: newListing.description || "",
      rating: 5.0,
      orders_count: 1,
      isChoice: true,
      badge: "Tangazo Jipya",
      specs: newListing.specsText ? { Maelezo: newListing.specsText } : {},
      seller: {
        id: profile?.id || "seller-custom",
        name: profile?.display_name || "Mwenye Mali",
        phone: newListing.phone || profile?.phone || "",
        whatsapp: newListing.whatsapp || profile?.whatsapp || "",
        verified: true
      }
    };

    // Save locally
    try {
      const stored = JSON.parse(localStorage.getItem("aliexpress_custom_listings") || "[]");
      stored.unshift(newItem);
      localStorage.setItem("aliexpress_custom_listings", JSON.stringify(stored));
    } catch {}

    // Save to database
    if (profile?.id && profile.role !== "guest") {
      createCatalogueProduct(profile.id, {
        name: newItem.name,
        price: newItem.price,
        original_price: newItem.original_price,
        category: newItem.category,
        image_url: newItem.image_url,
        description: newItem.description,
        whatsapp_number: newListing.whatsapp || profile?.phone
      }).catch(() => {});
    }

    setItems((prev) => [newItem, ...prev]);
    setAddModalOpen(false);
    setNewListing({
      name: "",
      category: "rentals",
      price: "",
      original_price: "",
      location: "Dar es Salaam",
      description: "",
      image_url: "",
      rentPeriod: "kwa mwezi",
      specsText: "",
      phone: profile?.phone || "",
      whatsapp: profile?.whatsapp || profile?.phone || ""
    });

    if (onShowToast) {
      onShowToast("✓ Tangazo lako limewekwa hewani kwenye Shop!");
    }
  };

  const totalCartAmount = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  return (
    <div className="aliexpress-container" id="aliexpress-shop-root">
      {/* 1. ALIEXPRESS TOP SEARCH & ACTION BAR */}
      <div className="aliexpress-top-bar">
        <div className="aliexpress-brand-block">
          <div className="aliexpress-logo-icon">🛍️</div>
          <div>
            <div className="aliexpress-brand-name">DUARA EXPRESS</div>
            <div className="aliexpress-brand-sub">Soko la Kimataifa & Assets Tanzania</div>
          </div>
        </div>

        {/* Global AliExpress Search Bar */}
        <div className="aliexpress-search-wrapper">
          <input
            type="text"
            className="aliexpress-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              isSw
                ? "Tafuta simu, vyumba vya kupanga, nyumba, magari, mavazi..."
                : "Search phones, rentals, houses, cars, fashion..."
            }
          />
          {searchTerm && (
            <button
              type="button"
              className="aliexpress-search-clear"
              onClick={() => setSearchTerm("")}
            >
              ✕
            </button>
          )}
          <button type="button" className="aliexpress-search-btn">
            <span>🔍</span>
            <span className="search-btn-text">{isSw ? "Tafuta" : "Search"}</span>
          </button>
        </div>

        {/* Action Buttons: Tangaza Asset + Cart */}
        <div className="aliexpress-header-actions">
          <button
            type="button"
            className="aliexpress-post-btn"
            onClick={() => setAddModalOpen(true)}
            title="Tangaza Chumba, Nyumba, Gari au Bidhaa"
          >
            <span>+</span>
            <span>{isSw ? "Tangaza Asset / Bidhaa" : "Post Asset / Item"}</span>
          </button>

          <button
            type="button"
            className="aliexpress-cart-trigger"
            onClick={() => setCartOpen(true)}
            title="Mkokoteni wa Manunuzi"
          >
            <span className="cart-icon">🛒</span>
            <span className="cart-label">{isSw ? "Mkokoteni" : "Cart"}</span>
            {cart.length > 0 && <span className="cart-badge">{cart.reduce((a, b) => a + b.quantity, 0)}</span>}
          </button>
        </div>
      </div>

      {/* 2. ALIEXPRESS HORIZONTAL CATEGORY BAR */}
      <nav className="aliexpress-category-rail" aria-label="Shop Categories">
        {SHOP_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                setSelectedRentalType("all");
              }}
              className={`aliexpress-category-pill ${isActive ? "active" : ""} ${cat.highlight ? "highlight" : ""}`}
            >
              <span className="cat-icon">{cat.icon}</span>
              <span className="cat-label">{cat.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. ALIEXPRESS SUPERDEALS & FLASH SALE BANNER */}
      {flashDeals.length > 0 && (
        <div className="aliexpress-superdeals-banner">
          <div className="superdeals-header">
            <div className="superdeals-title-wrap">
              <span className="superdeals-lightning">⚡</span>
              <span className="superdeals-title">SUPER DEALS</span>
              <span className="superdeals-sub">Mauzo ya Chapchap · Hadi 60% Punguzo</span>
            </div>

            <div className="superdeals-timer">
              <span className="timer-label">{isSw ? "Muda uliobaki:" : "Ends in:"}</span>
              <span className="timer-box">{String(timeLeft.hours).padStart(2, "0")}</span>:
              <span className="timer-box">{String(timeLeft.minutes).padStart(2, "0")}</span>:
              <span className="timer-box">{String(timeLeft.seconds).padStart(2, "0")}</span>
            </div>
          </div>

          {/* Horizontal Mini Flash Deals Carousel */}
          <div className="superdeals-track">
            {flashDeals.map((deal) => {
              const discountPct = Math.round(((deal.original_price - deal.price) / deal.original_price) * 100);
              return (
                <div
                  key={deal.id}
                  className="superdeals-mini-card"
                  onClick={() => setDetailItem(deal)}
                >
                  <div className="mini-card-img-wrap">
                    <img src={deal.image_url} alt={deal.name} loading="lazy" />
                    <span className="mini-card-discount">-{discountPct}%</span>
                  </div>
                  <div className="mini-card-price">
                    <span className="mini-curr">TZS</span> {deal.price.toLocaleString()}
                  </div>
                  <div className="mini-card-original">
                    TZS {deal.original_price.toLocaleString()}
                  </div>
                  <div className="mini-card-title">{deal.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. REAL ESTATE & ASSET QUICK FILTER BAR (WHEN IN RENTALS, REAL ESTATE, VEHICLES) */}
      {(activeCategory === "rentals" || activeCategory === "realestate" || activeCategory === "vehicles") && (
        <div className="aliexpress-asset-filter-bar">
          <div className="asset-filter-heading">
            <span>📌</span>
            <span>
              {activeCategory === "rentals"
                ? "Chuja Vyumba & Maeneo ya Kupanga"
                : activeCategory === "realestate"
                ? "Chuja Nyumba na Viwanja vya Kununua"
                : "Chuja Magari na Vifaa Vizito"}
            </span>
          </div>

          <div className="asset-filter-controls">
            {activeCategory === "rentals" && (
              <select
                className="asset-filter-select"
                value={selectedRentalType}
                onChange={(e) => setSelectedRentalType(e.target.value)}
              >
                <option value="all">Aina Zote za Upangaji</option>
                <option value="apartment">Apartments za Kisasa</option>
                <option value="single_master">Vyumba Master (Single)</option>
                <option value="commercial_frame">Fremu za Biashara / Maduka</option>
                <option value="standalone_house">Nyumba Nzima ya Kupanga</option>
              </select>
            )}

            <select
              className="asset-filter-select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="all">Maeneo Yote (Tanzania)</option>
              <option value="Mikocheni">Mikocheni</option>
              <option value="Sinza">Sinza</option>
              <option value="Kariakoo">Kariakoo</option>
              <option value="Mbezi">Mbezi Beach</option>
              <option value="Kigamboni">Kigamboni</option>
              <option value="Goba">Goba</option>
              <option value="Bagamoyo">Bagamoyo / Kerege</option>
            </select>

            <div className="asset-filter-price-wrap">
              <span>Bei ya Juu:</span>
              <input
                type="number"
                placeholder="Mfano: 500000"
                className="asset-price-input"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
              />
              {priceMax && (
                <button type="button" onClick={() => setPriceMax("")} className="asset-clear-price">
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. TOOLBAR: SORT & ITEM COUNT */}
      <div className="aliexpress-toolbar">
        <div className="toolbar-count">
          <span>{filteredItems.length}</span> {isSw ? "vitu vimepatikana" : "items found"}
        </div>

        <div className="toolbar-sort">
          <span className="sort-label">{isSw ? "Panga kwa:" : "Sort by:"}</span>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="popular">{isSw ? "Maarufu Zaidi (Popular)" : "Most Popular"}</option>
            <option value="price_low">{isSw ? "Bei: Chini kwenda Juu" : "Price: Low to High"}</option>
            <option value="price_high">{isSw ? "Bei: Juu kwenda Chini" : "Price: High to Low"}</option>
            <option value="rating">{isSw ? "Nyota & Ubora (Rating)" : "Top Rated"}</option>
            <option value="newest">{isSw ? "Mapya Zaidi (Newest)" : "Newest"}</option>
          </select>
        </div>
      </div>

      {/* 6. ALIEXPRESS PRODUCTS & ASSETS GRID */}
      {filteredItems.length === 0 ? (
        <div
          className="aliexpress-empty-state"
          style={{
            padding: "40px 20px",
            textAlign: "center",
            background: "var(--card-bg)",
            borderRadius: 16,
            border: "1px dashed var(--line)",
            margin: "16px 0"
          }}
        >
          <span className="empty-icon" style={{ fontSize: 44, display: "block", marginBottom: 12 }}>
            {items.length === 0 ? "🛍️" : "🔍"}
          </span>
          <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800 }}>
            {items.length === 0
              ? (isSw ? "Soko Liko Wazi – Kuwa wa Kwanza Kutangaza!" : "Shop is Live – Be the First to Post!")
              : (isSw ? "Hakuna bidhaa au asset iliyopatikana" : "No items match your search")}
          </h3>
          <p
            style={{
              margin: "0 0 18px",
              fontSize: 13,
              color: "var(--muted)",
              maxWidth: 520,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.5
            }}
          >
            {items.length === 0
              ? (isSw
                  ? "Vyumba vya kupanga, nyumba, viwanja, magari, simu na bidhaa zako sasa unaweza kuzitangaza hapa na wateja wataona mara moja."
                  : "Post your rental rooms, houses, plots, vehicles, phones, and items here for all customers to browse.")
              : (isSw
                  ? "Jaribu kubadilisha maneno ya utafutaji au futa vichungi (filters)."
                  : "Try broadening your search terms or clearing filters.")}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="button button-primary"
              onClick={() => setAddModalOpen(true)}
              style={{ padding: "12px 22px", fontSize: 14, borderRadius: 12, fontWeight: 800 }}
            >
              + {isSw ? "Tangaza Asset au Bidhaa Yako Sasa" : "Post Asset or Item Now"}
            </button>
            {items.length > 0 && (
              <button
                type="button"
                className="aliexpress-reset-btn"
                onClick={() => {
                  setSearchTerm("");
                  setActiveCategory("all");
                  setPriceMax("");
                  setSelectedLocation("all");
                  setSelectedRentalType("all");
                }}
              >
                {isSw ? "Onyesha Bidhaa Zote" : "Show All Products"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="aliexpress-grid">
          {filteredItems.map((item) => {
            const hasDiscount = item.original_price && item.original_price > item.price;
            const discountPct = hasDiscount
              ? Math.round(((item.original_price - item.price) / item.original_price) * 100)
              : null;
            const isRental = item.category === "rentals";
            const isRealEstate = item.category === "realestate";
            const isVehicle = item.category === "vehicles";
            const isFollowingSeller = item.seller?.id && followedIds.includes(item.seller.id);

            return (
              <div
                key={item.id}
                className="aliexpress-card"
                onClick={() => setDetailItem(item)}
              >
                {/* Product Image & Badges */}
                <div className="aliexpress-card-image-wrap">
                  <img src={item.image_url} alt={item.name} loading="lazy" />

                  {/* Top Badges */}
                  <div className="card-badge-top-left">
                    {item.isChoice && <span className="choice-pill">Choice</span>}
                    {discountPct && <span className="discount-pill">-{discountPct}%</span>}
                    {isRental && <span className="rental-pill">Kupanga</span>}
                    {isRealEstate && <span className="asset-pill">Asset</span>}
                    {isVehicle && <span className="vehicle-pill">Gari</span>}
                  </div>

                  {/* Quick Action Overlay */}
                  <button
                    type="button"
                    className="card-quick-cart"
                    onClick={(e) => handleAddToCart(item, e)}
                    title="Weka kwenye mkokoteni"
                  >
                    🛒
                  </button>
                </div>

                {/* Card Content */}
                <div className="aliexpress-card-content">
                  {/* Title */}
                  <h4 className="aliexpress-card-title" title={item.name}>
                    {item.name}
                  </h4>

                  {/* Location or Category Kicker */}
                  <div className="aliexpress-card-kicker">
                    {item.location ? `📍 ${item.location}` : item.categoryLabel}
                  </div>

                  {/* Rating & Sold count */}
                  <div className="aliexpress-card-meta">
                    <span className="card-stars">★ {item.rating || 4.9}</span>
                    <span className="card-sep">·</span>
                    <span className="card-sold">
                      {isRental || isRealEstate
                        ? `${item.orders_count || 12} wameulizia`
                        : `${item.orders_count || 50}+ sold`}
                    </span>
                  </div>

                  {/* Price Block */}
                  <div className="aliexpress-card-price-block">
                    <div className="card-current-price">
                      <span className="price-currency">TZS</span>
                      <span className="price-num">{item.price.toLocaleString()}</span>
                      {isRental && <span className="price-period">/{item.rentPeriod || "mwezi"}</span>}
                    </div>

                    {hasDiscount && (
                      <div className="card-original-price">
                        TZS {item.original_price.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Free Delivery / Verified Landlord Badge */}
                  <div className="aliexpress-card-shipping">
                    {isRental
                      ? "✓ Mwenye Nyumba Halisi"
                      : isRealEstate
                      ? "✓ Hati Miliki Imethibitishwa"
                      : isVehicle
                      ? "✓ Kaguzi Imekamilika"
                      : "✓ Usafirishaji Bure"}
                  </div>

                  {/* Seller / Landlord info & Actions */}
                  <div className="aliexpress-card-footer">
                    <div className="card-seller-info">
                      <span className="seller-name">{item.seller?.name || "Duara Seller"}</span>
                    </div>

                    <div className="card-footer-buttons">
                      {item.seller?.id && (
                        <button
                          type="button"
                          className={`card-follow-btn ${isFollowingSeller ? "followed" : ""}`}
                          onClick={(e) => handleToggleFollow(item.seller.id, item.seller.name, e)}
                        >
                          {isFollowingSeller ? "✓ Ume-follow" : "+ Follow"}
                        </button>
                      )}

                      <button
                        type="button"
                        className="card-buy-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPaymentItem(item);
                        }}
                      >
                        {isRental ? "Panga" : isRealEstate ? "Nunua" : isVehicle ? "Tazama" : "Nunua"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7. ALIEXPRESS PRODUCT / ASSET DETAIL MODAL */}
      {detailItem && (
        <div className="modal-backdrop" onClick={() => setDetailItem(null)}>
          <div
            className="aliexpress-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="detail-modal-close"
              onClick={() => setDetailItem(null)}
            >
              ✕
            </button>

            <div className="detail-modal-body">
              {/* Left Column: Image Gallery */}
              <div className="detail-modal-gallery">
                <div className="detail-main-image-wrap">
                  <img
                    src={
                      Array.isArray(detailItem.images) && detailItem.images.length > 0
                        ? detailItem.images[activeModalImage] || detailItem.image_url
                        : detailItem.image_url
                    }
                    alt={detailItem.name}
                  />
                  {detailItem.isChoice && <span className="choice-badge-large">Choice Certified</span>}
                </div>

                {/* Thumbnails */}
                {Array.isArray(detailItem.images) && detailItem.images.length > 1 && (
                  <div className="detail-thumbnails-row">
                    {detailItem.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`detail-thumb-btn ${activeModalImage === idx ? "active" : ""}`}
                        onClick={() => setActiveModalImage(idx)}
                      >
                        <img src={img} alt={`Thumb ${idx}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Specs, Price & Checkout */}
              <div className="detail-modal-info">
                <div className="detail-kicker">
                  <span>{detailItem.categoryLabel}</span>
                  {detailItem.location && <span> · 📍 {detailItem.location}</span>}
                </div>

                <h2 className="detail-title">{detailItem.name}</h2>

                {/* Rating & Inquiries */}
                <div className="detail-meta-row">
                  <span className="detail-stars">★ {detailItem.rating || 4.9}</span>
                  <span className="detail-rating-text">({detailItem.orders_count || 24} reviews/orders)</span>
                  <span className="detail-verified">✓ 100% Verified by Duara</span>
                </div>

                {/* Price Box */}
                <div className="detail-price-box">
                  <div className="detail-price-main">
                    <span className="detail-curr">TZS</span>
                    <span className="detail-amount">{detailItem.price.toLocaleString()}</span>
                    {detailItem.rentPeriod && <span className="detail-period">/{detailItem.rentPeriod}</span>}
                  </div>
                  {detailItem.original_price && detailItem.original_price > detailItem.price && (
                    <div className="detail-price-old">
                      Bei ya Awali: TZS {detailItem.original_price.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Specifications Grid */}
                {detailItem.specs && Object.keys(detailItem.specs).length > 0 && (
                  <div className="detail-specs-card">
                    <div className="specs-card-title">Vipengele Muhimu (Specifications):</div>
                    <div className="specs-table">
                      {Object.entries(detailItem.specs).map(([k, v]) => (
                        <div key={k} className="specs-row">
                          <span className="specs-key">{k}:</span>
                          <span className="specs-val">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {detailItem.description && (
                  <div className="detail-description">
                    <p>{detailItem.description}</p>
                  </div>
                )}

                {/* Seller & Landlord Block */}
                <div className="detail-seller-box">
                  <div className="seller-profile-wrap">
                    <span className="seller-avatar">👤</span>
                    <div>
                      <div className="seller-title">{detailItem.seller?.name || "Duara Merchant"}</div>
                      <div className="seller-sub">Muuzaji / Mwenye Nyumba Aliyethibitishwa</div>
                    </div>
                  </div>

                  {detailItem.seller?.id && (
                    <button
                      type="button"
                      className="seller-follow-btn"
                      onClick={() => handleToggleFollow(detailItem.seller.id, detailItem.seller.name)}
                    >
                      {followedIds.includes(detailItem.seller.id) ? "✓ Ume-follow" : "+ Follow"}
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="detail-actions-group">
                  {/* WhatsApp Direct Contact */}
                  {detailItem.seller?.whatsapp && (
                    <a
                      href={`https://wa.me/${detailItem.seller.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Habari, nimeona tangazo lako la "${detailItem.name}" (TZS ${detailItem.price.toLocaleString()}) kwenye Duara Shop. Naomba maelezo zaidi.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp-direct"
                    >
                      <span>💬</span> WhatsApp Direct
                    </a>
                  )}

                  {/* Phone Call */}
                  {detailItem.seller?.phone && (
                    <a href={`tel:${detailItem.seller.phone}`} className="btn-call-direct">
                      <span>📞</span> Piga Simu
                    </a>
                  )}

                  {/* Add to Cart */}
                  <button
                    type="button"
                    className="btn-add-cart-large"
                    onClick={() => handleAddToCart(detailItem)}
                  >
                    🛒 Weka Mkokoteni
                  </button>

                  {/* Instant Buy / Book Button */}
                  <button
                    type="button"
                    className="btn-buy-now-large"
                    onClick={() => {
                      setDetailItem(null);
                      setPaymentItem(detailItem);
                    }}
                  >
                    ⚡ {detailItem.category === "rentals" ? "Panga Sasa" : "Nunua Sasa (Instant Buy)"}
                  </button>
                </div>

                {/* Buyer Protection Guarantee */}
                <div className="detail-protection-guarantee">
                  <span>🛡️</span>
                  <span>
                    <strong>Ulinzi wa Mnunuzi wa Duara:</strong> Malipo yako yanalindwa. Pesa
                    hazitolewi hadi uhakikishe umepokea bidhaa au umekagua chumba/nyumba.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. SHOPPING CART DRAWER */}
      {cartOpen && (
        <div className="modal-backdrop" onClick={() => setCartOpen(false)}>
          <div className="aliexpress-cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-header">
              <h3>🛒 Mkokoteni Wako ({cart.length})</h3>
              <button type="button" className="drawer-close-btn" onClick={() => setCartOpen(false)}>
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="cart-drawer-empty">
                <span style={{ fontSize: 48 }}>🛍️</span>
                <p>Mkokoteni wako hauna bidhaa bado.</p>
                <button
                  type="button"
                  className="aliexpress-reset-btn"
                  onClick={() => setCartOpen(false)}
                >
                  Anza Kununua
                </button>
              </div>
            ) : (
              <>
                <div className="cart-drawer-items">
                  {cart.map((cartItem) => (
                    <div key={cartItem.id} className="cart-drawer-item">
                      <img src={cartItem.image_url} alt={cartItem.name} />
                      <div className="cart-item-info">
                        <div className="cart-item-name">{cartItem.name}</div>
                        <div className="cart-item-price">
                          TZS {cartItem.price.toLocaleString()} x {cartItem.quantity}
                        </div>
                        <div className="cart-qty-controls">
                          <button
                            type="button"
                            onClick={() => {
                              if (cartItem.quantity > 1) {
                                setCart((prev) =>
                                  prev.map((x) =>
                                    x.id === cartItem.id ? { ...x, quantity: x.quantity - 1 } : x
                                  )
                                );
                              } else {
                                setCart((prev) => prev.filter((x) => x.id !== cartItem.id));
                              }
                            }}
                          >
                            -
                          </button>
                          <span>{cartItem.quantity}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setCart((prev) =>
                                prev.map((x) =>
                                  x.id === cartItem.id ? { ...x, quantity: x.quantity + 1 } : x
                                )
                              );
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="cart-remove-item"
                        onClick={() => setCart((prev) => prev.filter((x) => x.id !== cartItem.id))}
                        title="Ondoa"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cart-drawer-footer">
                  <div className="cart-drawer-total">
                    <span>Jumla Kuu:</span>
                    <span className="total-val">TZS {totalCartAmount.toLocaleString()}</span>
                  </div>

                  <button
                    type="button"
                    className="cart-checkout-btn"
                    onClick={() => {
                      setCartOpen(false);
                      setPaymentItem({
                        id: `cart-bundle-${Date.now()}`,
                        name: `Manunuzi ya Mkokoteni (${cart.length} vitu)`,
                        price: totalCartAmount,
                        currency: "TZS"
                      });
                    }}
                  >
                    ✓ Kamilisha Malipo (Checkout)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 9. ADD LISTING / TANGAZA ASSET MODAL */}
      {addModalOpen && (
        <div className="modal-backdrop" onClick={() => setAddModalOpen(false)}>
          <div className="aliexpress-add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-modal-header">
              <h3>+ Tangaza Chumba, Nyumba, Gari au Bidhaa</h3>
              <button type="button" className="drawer-close-btn" onClick={() => setAddModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="add-modal-form">
              <div className="form-group">
                <label>Aina ya Tangazo / Category *</label>
                <select
                  value={newListing.category}
                  onChange={(e) => setNewListing({ ...newListing, category: e.target.value })}
                  required
                >
                  <option value="rentals">🏠 Kupangisha: Chumba, Apartment, Fremu au Eneo</option>
                  <option value="realestate">🏢 Kununua: Nyumba Kamili, Kiwanja, au Shamba</option>
                  <option value="vehicles">🚗 Magari, Pikipiki, Bajaji au Mitambo</option>
                  <option value="electronics">📱 Simu & Vifaa vya Kielektroniki</option>
                  <option value="fashion">👗 Mitindo, Mavazi & Viatu</option>
                  <option value="home">🛋️ Samani & Vifaa vya Nyumbani</option>
                  <option value="beauty">💄 Urembo & Afya</option>
                  <option value="agriculture">🌾 Kilimo & Mazao</option>
                  <option value="tools">🔨 Zana za Ujenzi & Hardware</option>
                </select>
              </div>

              <div className="form-group">
                <label>Jina la Bidhaa / Asset / Chumba *</label>
                <input
                  type="text"
                  placeholder="Mfano: Apartment ya Kisasa Vyumba 2 / Toyota IST 2012"
                  value={newListing.name}
                  onChange={(e) => setNewListing({ ...newListing, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Bei (TZS) *</label>
                  <input
                    type="number"
                    placeholder="Mfano: 250000"
                    value={newListing.price}
                    onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
                    required
                  />
                </div>

                {newListing.category === "rentals" && (
                  <div className="form-group">
                    <label>Muda wa Kodi</label>
                    <select
                      value={newListing.rentPeriod}
                      onChange={(e) => setNewListing({ ...newListing, rentPeriod: e.target.value })}
                    >
                      <option value="kwa mwezi">Kwa Mwezi</option>
                      <option value="miezi 3">Miezi 3</option>
                      <option value="miezi 6">Miezi 6</option>
                      <option value="kwa mwaka">Kwa Mwaka</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Mahali / Eneo (Location) *</label>
                <input
                  type="text"
                  placeholder="Mfano: Mikocheni B, Sinza, Kariakoo, au Arusha..."
                  value={newListing.location}
                  onChange={(e) => setNewListing({ ...newListing, location: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Namba ya Simu ya Kupigiwa</label>
                  <input
                    type="tel"
                    placeholder="0714 000 000"
                    value={newListing.phone}
                    onChange={(e) => setNewListing({ ...newListing, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Namba ya WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="0714 000 000"
                    value={newListing.whatsapp}
                    onChange={(e) => setNewListing({ ...newListing, whatsapp: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Picha ya Bidhaa / Asset (Pakia au Weka URL)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImage}
                  style={{ marginBottom: 8 }}
                />
                {uploadingImage && <div className="uploading-hint">Inapakia picha...</div>}
                <input
                  type="url"
                  placeholder="Au weka Image URL hapa..."
                  value={newListing.image_url}
                  onChange={(e) => setNewListing({ ...newListing, image_url: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Vipengele vya Ziada / Specifications</label>
                <input
                  type="text"
                  placeholder="Mfano: Vyumba 2, Choo ndani, Luku ya pekee, Maji 24/7, Gari Automatic..."
                  value={newListing.specsText}
                  onChange={(e) => setNewListing({ ...newListing, specsText: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Maelezo ya Ziada (Description)</label>
                <textarea
                  rows={3}
                  placeholder="Eleza kwa ufupi sifa za chumba, nyumba, gari au bidhaa yako..."
                  value={newListing.description}
                  onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                />
              </div>

              <div className="add-modal-footer">
                <button
                  type="button"
                  className="button button-soft"
                  onClick={() => setAddModalOpen(false)}
                >
                  Ghairi
                </button>
                <button type="submit" className="button button-primary">
                  ✓ Weka Hewani Tangazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. REAL PAYMENT PROCESSING MODAL INTEGRATION */}
      {paymentItem && (
        <PaymentModal
          profile={profile}
          purpose={`Malipo ya ${paymentItem.name}`}
          amount={paymentItem.price}
          itemId={paymentItem.id}
          onSuccess={() => {
            setPaymentItem(null);
            if (onShowToast) {
              onShowToast("✓ Malipo yamekamilika! Muuzaji amearifiwa kutoa huduma.");
            }
          }}
          onClose={() => setPaymentItem(null)}
        />
      )}
    </div>
  );
}

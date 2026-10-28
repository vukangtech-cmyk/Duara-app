import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import CategoryChips from "../components/CategoryChips.jsx";
import ListingCard from "../components/ListingCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";

const PAGE_SIZE = 18;

export default function Home() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [featuredListings, setFeaturedListings] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all"); // 'all', 'bidhaa', 'huduma'
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [heroSearch, setHeroSearch] = useState("");

  const fetchListings = useCallback(async (isInitial = true, category = selectedCategory, type = typeFilter) => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const from = isInitial ? 0 : listings.length;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("listings")
        .select(`
          id,
          title,
          description,
          price,
          type,
          images,
          region,
          institution,
          is_featured,
          created_at,
          category_id,
          profiles (
            id,
            display_name,
            phone,
            avatar_url
          )
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (category) {
        query = query.eq("category_id", category);
      }

      if (type !== "all") {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;

      const newItems = data || [];
      if (isInitial) {
        setListings(newItems);
      } else {
        setListings((prev) => [...prev, ...newItems]);
      }
      setHasMore(newItems.length === PAGE_SIZE);

      // Also fetch featured listings on initial load
      if (isInitial) {
        const { data: featuredData } = await supabase
          .from("listings")
          .select(`
            id,
            title,
            price,
            type,
            images,
            region,
            institution,
            is_featured,
            created_at,
            profiles (
              id,
              display_name,
              phone
            )
          `)
          .eq("status", "active")
          .eq("is_featured", true)
          .order("created_at", { ascending: false })
          .limit(4);

        setFeaturedListings(featuredData || []);
      }
    } catch (err) {
      console.warn("Hitilafu ya kupakia matangazo:", err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, typeFilter, listings.length]);

  useEffect(() => {
    fetchListings(true, selectedCategory, typeFilter);
  }, [selectedCategory, typeFilter]);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/tafuta?q=${encodeURIComponent(heroSearch.trim())}`);
    }
  };

  return (
    <div>
      {/* Hero Welcome Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(20, 184, 166, 0.08) 100%)",
        border: "1px solid var(--primary-border, rgba(16, 185, 129, 0.2))",
        borderRadius: "20px",
        padding: "28px 20px",
        marginBottom: "24px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ maxWidth: "680px" }}>
          <div style={{
            display: "inline-block",
            fontSize: "12px",
            fontWeight: "700",
            color: "var(--primary, #10b981)",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            padding: "4px 10px",
            borderRadius: "12px",
            marginBottom: "10px"
          }}>
            🇹🇿 Soko Huria la Kidijitali Tanzania
          </div>
          <h1 style={{
            fontSize: "clamp(22px, 4vw, 32px)",
            fontWeight: "800",
            color: "var(--ink-heading, #0f172a)",
            lineHeight: "1.2",
            margin: "0 0 10px 0"
          }}>
            Nunua na Uza Bidhaa au Huduma Moja kwa Moja
          </h1>
          <p style={{
            fontSize: "14px",
            color: "var(--muted, #64748b)",
            lineHeight: "1.5",
            margin: "0 0 20px 0"
          }}>
            Ungana na wanafunzi wa vyuo na jamii kote nchini. Wasiliana na muuzaji moja kwa moja kupitia WhatsApp bila madalali.
          </p>

          {/* Quick Hero Search Input */}
          <form onSubmit={handleHeroSearch} style={{ display: "flex", gap: "8px", maxWidth: "520px" }}>
            <input
              type="text"
              placeholder="Unatafuta nini leo? (mf. HP Laptop, Kitabu, Chumba...)"
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "12px",
                border: "1px solid var(--line, #cbd5e1)",
                backgroundColor: "#ffffff",
                fontSize: "14px",
                outline: "none"
              }}
            />
            <button
              type="submit"
              style={{
                padding: "12px 20px",
                backgroundColor: "var(--primary, #10b981)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              Tafuta
            </button>
          </form>
        </div>
      </div>

      {/* Category Chips Bar */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px"
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "var(--ink-heading, #0f172a)" }}>
            Kategoria za Sokoni
          </h2>
          <Link to="/tafuta" style={{ fontSize: "12px", color: "var(--primary, #10b981)", textDecoration: "none", fontWeight: "600" }}>
            Kila Kitu →
          </Link>
        </div>
        <CategoryChips
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => setSelectedCategory(catId)}
        />
      </div>

      {/* Filter Tabs (All / Bidhaa / Huduma) */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--line, #e2e8f0)",
        paddingBottom: "12px",
        marginBottom: "20px",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "all", label: "Zote" },
            { id: "bidhaa", label: "📦 Bidhaa" },
            { id: "huduma", label: "🛠️ Huduma" }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTypeFilter(tab.id)}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: typeFilter === tab.id ? "700" : "500",
                border: "none",
                backgroundColor: typeFilter === tab.id ? "var(--ink-heading, #0f172a)" : "transparent",
                color: typeFilter === tab.id ? "#ffffff" : "var(--muted, #64748b)",
                cursor: "pointer",
                transition: "all 0.15s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Link
          to="/ongeza"
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "var(--primary, #10b981)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          <span>+ Uza bure sokoni</span>
        </Link>
      </div>

      {/* Featured Section (if any exists) */}
      {featuredListings.length > 0 && selectedCategory === null && typeFilter === "all" && (
        <section style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <span style={{ fontSize: "18px" }}>⭐</span>
            <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "var(--ink-heading, #0f172a)" }}>
              Matangazo Maalum (Featured)
            </h2>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "16px"
          }}>
            {featuredListings.map((listing) => (
              <ListingCard key={`featured-${listing.id}`} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {/* Main Listings Grid */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "var(--ink-heading, #0f172a)" }}>
            Matangazo Mapya
          </h2>
          <span style={{ fontSize: "13px", color: "var(--muted, #64748b)" }}>
            {listings.length} yamepatikana
          </span>
        </div>

        {loading ? (
          <Loader message="Inapakia matangazo ya sokoni..." />
        ) : listings.length === 0 ? (
          <EmptyState
            title="Hakuna bidhaa bado. Kuwa wa kwanza kuweka!"
            description="Hakuna matangazo yaliyopatikana katika sehemu hii kwa sasa. Unaweza kuweka tangazo lako sasa na likawafikia maelfu ya wanunuzi."
            actionText="+ Weka Tangazo Lako Bure"
            actionLink="/ongeza"
            icon="🛍️"
          />
        ) : (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "16px"
            }}>
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {hasMore && (
              <div style={{ textAlign: "center", marginTop: "32px" }}>
                <button
                  type="button"
                  onClick={() => fetchListings(false)}
                  disabled={loadingMore}
                  style={{
                    padding: "10px 24px",
                    backgroundColor: "var(--card-bg, #ffffff)",
                    border: "1px solid var(--line, #cbd5e1)",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "var(--ink-heading, #0f172a)",
                    cursor: loadingMore ? "not-allowed" : "pointer"
                  }}
                >
                  {loadingMore ? "Inapakia zaidi..." : "Pakia Matangazo Zaidi"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

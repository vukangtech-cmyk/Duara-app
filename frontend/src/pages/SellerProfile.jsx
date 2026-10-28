import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import ListingCard from "../components/ListingCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";
import { formatRelativeDate, buildWhatsAppLink } from "../utils/format.js";

export default function SellerProfile() {
  const { id } = useParams();
  const [seller, setSeller] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadSellerData() {
      if (!supabase || !id) return;
      setLoading(true);
      setErrorMsg("");

      try {
        // Fetch seller profile
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("id, display_name, phone, institution, region, avatar_url, bio, created_at, is_blocked")
          .eq("id", id)
          .maybeSingle();

        if (profileErr) throw profileErr;
        if (!profileData) {
          if (mounted) setErrorMsg("Muuzaji huyu hajapatikana.");
          return;
        }

        if (profileData.is_blocked) {
          if (mounted) setErrorMsg("Akaunti ya muuzaji huyu imesimamishwa.");
          return;
        }

        if (mounted) setSeller(profileData);

        // Fetch seller's active listings
        const { data: listingsData, error: listErr } = await supabase
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
            profiles (id, display_name, phone)
          `)
          .eq("seller_id", id)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (listErr) throw listErr;
        if (mounted) setListings(listingsData || []);
      } catch (err) {
        if (mounted) setErrorMsg(err.message || "Hitilafu imetokea.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSellerData();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return <Loader message="Inapakia ukurasa wa muuzaji..." />;
  }

  if (errorMsg || !seller) {
    return (
      <EmptyState
        title="Muuzaji Hajapatikana"
        description={errorMsg || "Ukurasa wa muuzaji huyu hauwezi kuonekana kwa sasa."}
        actionText="Rudi Sokoni"
        actionLink="/"
        icon="👤"
      />
    );
  }

  const whatsappUrl = seller.phone ? buildWhatsAppLink(seller.phone, "", window.location.href) : null;

  return (
    <div>
      {/* Seller Header Profile Card */}
      <div style={{
        backgroundColor: "var(--card-bg, #ffffff)",
        borderRadius: "16px",
        border: "1px solid var(--line, #e2e8f0)",
        padding: "24px",
        marginBottom: "28px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "18px",
        boxShadow: "var(--shadow-sm)"
      }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "var(--primary, #10b981)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            fontWeight: "800"
          }}>
            {seller.display_name ? seller.display_name.charAt(0).toUpperCase() : "M"}
          </div>

          <div>
            <h1 style={{
              fontSize: "22px",
              fontWeight: "800",
              color: "var(--ink-heading, #0f172a)",
              margin: "0 0 4px 0"
            }}>
              {seller.display_name || "Muuzaji wa Duara"}
            </h1>
            <div style={{ display: "flex", gap: "12px", fontSize: "13px", color: "var(--muted, #64748b)", flexWrap: "wrap" }}>
              <span>📍 {seller.region || "Tanzania"}</span>
              {seller.institution && (
                <>
                  <span>•</span>
                  <span>🏛️ {seller.institution}</span>
                </>
              )}
              <span>•</span>
              <span>Mwanachama tangu {formatRelativeDate(seller.created_at)}</span>
            </div>
            {seller.bio && (
              <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "var(--ink, #334155)", maxWidth: "540px" }}>
                {seller.bio}
              </p>
            )}
          </div>
        </div>

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "10px",
              backgroundColor: "#22c55e",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: "700",
              fontSize: "14px",
              boxShadow: "0 2px 8px rgba(34, 197, 94, 0.25)"
            }}
          >
            <span>💬</span>
            <span>WhatsApp Muuzaji</span>
          </a>
        )}
      </div>

      {/* Listings by this seller */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--ink-heading, #0f172a)", margin: 0 }}>
            Matangazo ya {seller.display_name} ({listings.length})
          </h2>
        </div>

        {listings.length === 0 ? (
          <EmptyState
            title="Muuzaji huyu hana matangazo mengine kwa sasa"
            description="Huenda bidhaa zake zimeshauzwa au bado hajaweka matangazo mapya."
            actionText="Tazama Matangazo Mengi Sokoni"
            actionLink="/tafuta"
            icon="🛍️"
          />
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "16px"
          }}>
            {listings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

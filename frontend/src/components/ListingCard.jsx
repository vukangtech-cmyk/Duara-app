import React from "react";
import { Link } from "react-router-dom";
import { formatPrice, formatRelativeDate, buildWhatsAppLink } from "../utils/format.js";

export default function ListingCard({ listing }) {
  if (!listing) return null;

  const hasImages = Array.isArray(listing.images) && listing.images.length > 0;
  const primaryImage = hasImages ? listing.images[0] : null;
  const isService = listing.type === "huduma";
  const seller = listing.profiles || null;
  const sellerPhone = seller?.phone || "";

  const whatsappUrl = sellerPhone ? buildWhatsAppLink(sellerPhone, listing.title, `${window.location.origin}/bidhaa/${listing.id}`) : null;

  return (
    <div
      style={{
        backgroundColor: "var(--card-bg, #ffffff)",
        borderRadius: "14px",
        overflow: "hidden",
        border: "1px solid var(--line, #e2e8f0)",
        boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04))",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        position: "relative"
      }}
      className="marketplace-card"
    >
      {/* Featured Badge */}
      {listing.is_featured && (
        <div style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 2,
          backgroundColor: "#f59e0b",
          color: "#ffffff",
          fontSize: "11px",
          fontWeight: "700",
          padding: "3px 8px",
          borderRadius: "6px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          gap: "4px"
        }}>
          ⭐ Tangazo Maalum
        </div>
      )}

      {/* Type Badge (Bidhaa / Huduma) */}
      <div style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        zIndex: 2,
        backgroundColor: isService ? "#3b82f6" : "rgba(16, 185, 129, 0.95)",
        color: "#ffffff",
        fontSize: "11px",
        fontWeight: "600",
        padding: "3px 8px",
        borderRadius: "6px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.15)"
      }}>
        {isService ? "Huduma" : "Bidhaa"}
      </div>

      {/* Image Thumbnail Link */}
      <Link
        to={`/bidhaa/${listing.id}`}
        style={{
          display: "block",
          position: "relative",
          width: "100%",
          paddingTop: "68%",
          backgroundColor: "#f1f5f9",
          overflow: "hidden"
        }}
      >
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={listing.title}
            loading="lazy"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
          />
        ) : (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "8px",
            color: "#94a3b8"
          }}>
            <span style={{ fontSize: "36px" }}>{isService ? "🛠️" : "📦"}</span>
            <span style={{ fontSize: "11px", fontWeight: "500" }}>Picha haipo</span>
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div style={{
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        justifyContent: "space-between"
      }}>
        <div>
          {/* Price */}
          <div style={{
            fontSize: "18px",
            fontWeight: "800",
            color: "var(--primary, #10b981)",
            marginBottom: "4px"
          }}>
            {formatPrice(listing.price)}
          </div>

          {/* Title */}
          <Link
            to={`/bidhaa/${listing.id}`}
            style={{
              textDecoration: "none",
              color: "var(--ink-heading, #0f172a)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              fontSize: "14px",
              fontWeight: "600",
              lineHeight: "1.4",
              marginBottom: "8px"
            }}
          >
            {listing.title}
          </Link>
        </div>

        {/* Location & Meta info */}
        <div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            color: "var(--muted, #64748b)",
            marginBottom: "10px"
          }}>
            <span>📍 {listing.region || "Tanzania"}</span>
            {listing.institution && listing.institution !== "Mtu Binafsi / Nje ya Chuo" && (
              <>
                <span>•</span>
                <span style={{
                  maxWidth: "140px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>{listing.institution.split(" - ")[0]}</span>
              </>
            )}
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "10px",
            borderTop: "1px solid var(--line, #f1f5f9)",
            fontSize: "11px",
            color: "var(--muted, #94a3b8)"
          }}>
            <span>{formatRelativeDate(listing.created_at)}</span>

            {/* Quick WhatsApp Action if phone available */}
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: "#22c55e",
                  color: "#ffffff",
                  textDecoration: "none",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "600"
                }}
                title="Wasiliana kwa WhatsApp"
              >
                <span>WhatsApp</span>
              </a>
            ) : (
              <Link
                to={`/bidhaa/${listing.id}`}
                style={{
                  color: "var(--primary, #10b981)",
                  textDecoration: "none",
                  fontWeight: "600"
                }}
              >
                Tazama →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

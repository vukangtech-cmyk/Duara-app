import React from "react";
import EmptyState from "../components/EmptyState.jsx";

export default function NotFound() {
  return (
    <EmptyState
      title="Ukurasa Haujapatikana (404)"
      description="Samahani, ukurasa unaoutafuta haupo au kiungo unachotumia kimebadilika."
      actionText="Rudi Nyumbani Sokoni"
      actionLink="/"
      icon="🧭"
    />
  );
}

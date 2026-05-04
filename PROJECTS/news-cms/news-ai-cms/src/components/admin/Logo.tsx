import React from "react";

const Logo: React.FC = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", padding: "0.5rem 0" }}>
    <div aria-hidden="true" style={{
      width: 40, height: 40, borderRadius: 10,
      background: "linear-gradient(135deg, #8b7355 0%, #4a7c3a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 20,
      boxShadow: "0 4px 12px -2px rgba(139,115,85,0.4)"
    }}>N</div>
    <div style={{ lineHeight: 1.1 }}>
      <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "1.1rem", color: "#1a1a1a" }}>News AI</div>
      <div style={{ fontSize: "0.72rem", color: "#8b7355", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>CMS</div>
    </div>
  </div>
);
export default Logo;

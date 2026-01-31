"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [activeButton, setActiveButton] = useState<string | null>(null);

  const getButtonStyle = (id: string): React.CSSProperties => {
    let style: React.CSSProperties = {
      backgroundColor: "#402b2c",
      color: "white",
      borderRadius: "1rem",
      padding: "0.75rem 1.5rem",
      fontSize: "1rem",
      cursor: "pointer",
      transition: "all 0.2s ease",
      border: "none",
    };

    if (hoveredButton === id) style = { ...style, backgroundColor: "#5a3b38" };
    if (activeButton === id) style = { ...style, backgroundColor: "#2d1c1b", transform: "scale(0.98)" };

    return style;
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#a3dfff" }}>
      {/* Navbar */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          backgroundColor: "#56baf2",
          color: "white",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          zIndex: 1000,
        }}
      >
        <h1
          style={{ fontSize: "1.5rem", fontWeight: "bold", cursor: "pointer" }}
          onClick={() => router.push("/home")}
        >
          🍪 Rays Cookies
        </h1>
        <div style={{ display: "flex", gap: "1rem" }}>
          {["home", "order"].map((page) => (
            <button
              key={page}
              style={{
                backgroundColor: "transparent",
                color: "white",
                border: "none",
                cursor: "pointer",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                transition: "all 0.2s ease",
                ...(hoveredButton === page ? { backgroundColor: "rgba(255,255,255,0.2)" } : {}),
                ...(activeButton === page ? { backgroundColor: "rgba(255,255,255,0.35)", transform: "scale(0.97)" } : {}),
              }}
              onClick={() => router.push(page === "home" ? "/home" : "/order")}
              onMouseEnter={() => setHoveredButton(page)}
              onMouseLeave={() => setHoveredButton(null)}
              onMouseDown={() => setActiveButton(page)}
              onMouseUp={() => setActiveButton(null)}
            >
              {page === "home" ? "Home" : "Make Order"}
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <div
        style={{
          padding: "6rem 2rem 2rem 2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#402b2c", textAlign: "center" }}>
          🍪 Welcome to Rays Cookies!
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#402b2c", textAlign: "center", maxWidth: "600px" }}>
          Freshly baked cookies delivered with love. Choose your favourite flavours and place an order today!
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "160px", height: "160px", backgroundColor: "white", borderRadius: "1rem", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
          <div style={{ width: "160px", height: "160px", backgroundColor: "white", borderRadius: "1rem", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
          <div style={{ width: "160px", height: "160px", backgroundColor: "white", borderRadius: "1rem", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
        </div>

        <button
          style={getButtonStyle("mainOrder")}
          onClick={() => router.push("/order")}
          onMouseEnter={() => setHoveredButton("mainOrder")}
          onMouseLeave={() => setHoveredButton(null)}
          onMouseDown={() => setActiveButton("mainOrder")}
          onMouseUp={() => setActiveButton(null)}
        >
          Make an Order
        </button>
      </div>
    </div>
  );
}

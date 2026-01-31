"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [activeButton, setActiveButton] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Login successful, redirect to admin dashboard
    router.push("/admin");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const navButtonStyle = (id: string): React.CSSProperties => ({
    backgroundColor:
      activeButton === id
        ? "rgba(255,255,255,0.35)"
        : hoveredButton === id
        ? "rgba(255,255,255,0.2)"
        : "transparent",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "0.5rem",
    cursor: "pointer",
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#a3dfff" }}>
      {/* NAVBAR */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          backgroundColor: "#56baf2",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          zIndex: 1000,
        }}
      >
        <h1
          style={{ fontSize: "1.5rem", fontWeight: "bold", cursor: "pointer", color: "white" }}
          onClick={() => router.push("/home")}
        >
          🍪 Rays Cookies
        </h1>

        <div style={{ display: "flex", gap: "1rem" }}>
          {["home", "order"].map(page => (
            <button
              key={page}
              style={navButtonStyle(page)}
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

      {/* LOGIN FORM */}
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "4rem" }}>
        <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "1rem", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", width: "100%", maxWidth: "400px" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>Admin Login</h1>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", borderRadius: "0.25rem", border: "1px solid #ccc", boxSizing: "border-box" }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", borderRadius: "0.25rem", border: "1px solid #ccc", boxSizing: "border-box" }}
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "0.5rem",
              backgroundColor: "#402b2c",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

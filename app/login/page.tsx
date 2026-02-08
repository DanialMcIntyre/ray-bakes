"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/navbar";
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

  return (
    <div style={{ minHeight: "100vh", backgroundColor: 'var(--page-bg)' }}>
      <Navbar />

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
            onMouseEnter={() => setHoveredButton("login")}
            onMouseLeave={() => setHoveredButton(null)}
            onMouseDown={() => setActiveButton("login")}
            onMouseUp={() => setActiveButton(null)}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "0.5rem",
              backgroundColor: activeButton === "login" ? "#2c1f1f" : hoveredButton === "login" ? "#523a37" : "#402b2c",
              color: "white",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.12s, transform 0.06s",
              transform: activeButton === "login" ? "scale(0.995)" : "none",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CookieItem {
  flavour: string;
  quantity: number;
  size?: "Small" | "Regular" | "Large";
}

interface PricingConfig {
  Small: number;
  Regular: number;
  Large: number;
}

const cookies = [
  { flavour: "Chocolate Chip", image: "/cookies/choco.jpg", description: "Flour, Sugar, Butter, Chocolate Chips" },
  { flavour: "Oreo", image: "/cookies/oreo.jpg", description: "Flour, Cocoa, Sugar, Butter, Vanilla" },
  { flavour: "Biscoff", image: "/cookies/biscoff.jpg", description: "Flour, Sugar, Biscoff Spread, Butter" },
  { flavour: "Birthday Cake", image: "/cookies/birthday.jpg", description: "Flour, Sugar, Butter, Sprinkles, Vanilla" },
];

const quantities = [5, 10, 15, 20, 25, 30, 35, 40];
const adminQuantities = Array.from({ length: 100 }, (_, i) => i + 1);


const DEFAULT_PRICE_PER_COOKIE = 2.5;
const PRICE_PER_10 = DEFAULT_PRICE_PER_COOKIE * 10;
const DEFAULT_PRICING: PricingConfig = {
  Small: 2.0,
  Regular: 2.5,
  Large: 3.0,
};

export default function OrderPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [customization, setCustomization] = useState("");
  const [items, setItems] = useState<CookieItem[]>([]);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setIsAdminView(true);
      } else {
        setIsAdminView(false);
      }
    });
  }, []);

  const totalCookies = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = items.reduce((sum, item) => {
    const size = item.size || "Regular";
    return sum + (item.quantity * pricing[size]);
  }, 0);

  const addCookie = (flavour: string, quantity: number | null, size: "Small" | "Regular" | "Large" = "Regular") => {
    const index = items.findIndex(item => item.flavour === flavour && (item.size || "Regular") === size);

    if (!quantity) {
      if (index !== -1) {
        const copy = [...items];
        copy.splice(index, 1);
        setItems(copy);
      }
    } else if (index !== -1) {
      const copy = [...items];
      copy[index].quantity = quantity;
      setItems(copy);
    } else {
      setItems([...items, { flavour, quantity, size }]);
    }
  };

  const handleQuantityChange = (flavour: string, value: string, size: "Small" | "Regular" | "Large" = "Regular") => {
    if (value === "") addCookie(flavour, null, size);
    else addCookie(flavour, Number(value), size);
  };

  const canSubmit = isAdminView
    ? name.trim() !== "" && instagram.trim() !== "" && dueDate.trim() !== "" && totalCookies > 0
    : name.trim() !== "" &&
      instagram.trim() !== "" &&
      dueDate.trim() !== "" &&
      totalCookies >= 10 &&
      totalCookies <= 40;

  const placeOrder = async () => {
    if (!canSubmit) return;

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          buyer: name.trim(),
          instagram_handle: instagram.trim(),
          date_order_created: new Date().toISOString(),
          date_order_due: dueDate,
          total_revenue: totalCost,
          customization: customization.trim() || null,
          status: "Pending",
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error(orderError);
      alert("Failed to create order.");
      return;
    }

    const orderItems = items.map(item => ({
      order_id: orderData.id,
      flavour: item.flavour,
      quantity: item.quantity,
      size: item.size || "Regular",
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) {
      console.error(itemsError);
      alert("Failed to add cookies.");
      return;
    }

    setShowSuccess(true);
    setName("");
    setInstagram("");
    setDueDate("");
    setCustomization("");
    setItems([]);
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
    <div style={{ minHeight: "100vh", backgroundColor: isAdminView ? "#f5e6d3" : "#a3dfff" }}>
      {/* NAVBAR */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          backgroundColor: isAdminView ? "#8b6f47" : "#56baf2",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: isAdminView ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 5px rgba(0,0,0,0.2)",
          zIndex: 1000,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h1
            style={{ fontSize: "1.5rem", fontWeight: "bold", cursor: "pointer", color: "white" }}
            onClick={() => router.push("/home")}
          >
            🍪 Rays Cookies
          </h1>
          {isAdminView && (
            <span style={{
              backgroundColor: "#402b2c",
              color: "#f5e6d3",
              padding: "0.25rem 0.75rem",
              borderRadius: "999px",
              fontSize: "0.75rem",
              fontWeight: "600",
              letterSpacing: "0.5px"
            }}>
              ADMIN
            </span>
          )}
        </div>

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
          {isAdminView && (
            <button
              style={navButtonStyle("admin")}
              onClick={() => router.push("/admin")}
              onMouseEnter={() => setHoveredButton("admin")}
              onMouseLeave={() => setHoveredButton(null)}
              onMouseDown={() => setActiveButton("admin")}
              onMouseUp={() => setActiveButton(null)}
            >
              Admin
            </button>
          )}
        </div>
      </nav>

      {/* CONTENT */}
      <div style={{ paddingTop: "6rem", paddingBottom: "2rem" }}>
        <Card style={{ maxWidth: "750px", margin: "0 auto", borderRadius: "1rem", backgroundColor: isAdminView ? "#faf8f5" : undefined }}>
          <CardContent style={{ padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>🍪 {isAdminView ? "Custom Order" : "Cookie Order"}</h1>
              {isAdminView && (
                <span style={{
                  backgroundColor: "#e8d9c9",
                  color: "#402b2c",
                  padding: "0.35rem 0.6rem",
                  borderRadius: "0.375rem",
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  letterSpacing: "0.5px"
                }}>
                  ADMIN
                </span>
              )}
            </div>

            {isAdminView && (
              <div style={{ marginTop: "1rem" }}>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem", color: "#402b2c" }}>Pricing by Size:</p>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    flexWrap: "wrap", // allows cards to move to next line
                  }}
                >
                  {["Small", "Regular", "Large"].map(size => (
                    <div
                      key={size}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        backgroundColor: "#f5e6d3",
                        padding: "0.35rem 0.5rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #e0d4c0",
                        flex: "1 1 180px", // bigger flex-basis → wraps sooner
                        minWidth: "180px",
                        boxSizing: "border-box",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          color: "#402b2c",
                          flexShrink: 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {size}:
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={pricing[size as keyof PricingConfig]}
                        onChange={e =>
                          setPricing(prev => ({
                            ...prev,
                            [size]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        style={{
                          flexGrow: 1,      // take remaining space
                          flexShrink: 1,    // shrink if needed
                          minWidth: "50px", // slightly larger minimum
                          padding: "0.2rem",
                          borderRadius: "0.375rem",
                          border: "1px solid #ccc",
                          textAlign: "center",
                          fontSize: "0.85rem",
                          backgroundColor: "#fff",
                          color: "#402b2c",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b4f3c",
                          flexShrink: 0,
                          whiteSpace: "nowrap",
                        }}
                      >
                        ${pricing[size as keyof PricingConfig].toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Buyer Info */}
            <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <Label>Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <Label>Instagram *</Label>
                <Input value={instagram} onChange={e => setInstagram(e.target.value)} />
              </div>
              <div>
                <Label>Pickup Date *</Label>
                <Input type="date" value={dueDate} min={today} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>

            {/* Cookies */}
            <div style={{ marginTop: "2rem" }}>
              <strong>Cookies selected: {totalCookies}{!isAdminView && " / 40"}</strong>

              {cookies.map(cookie => {
              const availableQuantities = isAdminView ? adminQuantities : quantities;
              const sizes: ("Small" | "Regular" | "Large")[] = ["Small", "Regular", "Large"];

              return (
                <div
                  key={cookie.flavour}
                  style={{
                    border: "1px solid #ccc",
                    padding: "1rem",
                    borderRadius: "1rem",
                    marginTop: "1rem",
                  }}
                >
                  {/* Image + Description */}
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <img
                      src={cookie.image}
                      alt={cookie.flavour}
                      style={{ width: "80px", height: "80px", borderRadius: "0.5rem" }}
                    />
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: "block" }}>{cookie.flavour}</strong>
                      <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>{cookie.description}</p>
                      {!isAdminView && (
                        <div style={{ marginTop: "0.5rem" }}>
                          <select
                            value={items.find(i => i.flavour === cookie.flavour)?.quantity || ""}
                            onChange={e => handleQuantityChange(cookie.flavour, e.target.value)}
                            style={{
                              minWidth: "70px",
                              padding: "0.25rem",
                              borderRadius: "0.375rem",
                              border: "1px solid #ccc",
                              fontSize: "0.85rem",
                              textAlign: "center",
                            }}
                          >
                            <option value="">Qty</option>
                            {quantities.map(q => {
                              const remaining = 40 - totalCookies + (items.find(i => i.flavour === cookie.flavour)?.quantity || 0);
                              return (
                                <option key={q} value={q} disabled={q > remaining}>
                                  {q}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}

                      {/* All sizes on a single row */}
                      {isAdminView && (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            flexWrap: "wrap", // wraps if screen is too small
                            marginTop: "0.5rem",
                          }}
                        >
                          {sizes.map(size => {
                            const currentQty =
                              items.find(
                                i => i.flavour === cookie.flavour && (i.size || "Regular") === size
                              )?.quantity || 0;

                            return (
                              <div
                                key={`${cookie.flavour}-${size}`}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  minWidth: "120px", // ensures reasonable size
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.85rem",
                                    fontWeight: 500,
                                    whiteSpace: "nowrap",
                                    flexShrink: 0,
                                  }}
                                >
                                  {size}:
                                </span>
                                <select
                                  value={currentQty || ""}
                                  onChange={e => handleQuantityChange(cookie.flavour, e.target.value, size)}
                                  style={{
                                    flexGrow: 1,
                                    flexShrink: 1,
                                    minWidth: "60px",
                                    padding: "0.25rem",
                                    borderRadius: "0.375rem",
                                    border: "1px solid #ccc",
                                    fontSize: "0.85rem",
                                    textAlign: "center",
                                  }}
                                >
                                  <option value="">Qty</option>
                                  {availableQuantities.map(q => (
                                    <option key={q} value={q}>
                                      {q} - ${(q * pricing[size]).toFixed(2)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            </div>

            {/* Notes */}
            <div style={{ marginTop: "1.5rem" }}>
              <Label>Customization / Notes</Label>
              <textarea
                value={customization}
                onChange={e => setCustomization(e.target.value)}
                style={{
                  width: "100%",
                  height: "5rem",
                  marginTop: "0.5rem",
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #ccc",
                  backgroundColor: "white",
                  color: "#000",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Receipt */}
            <div
              style={{
                marginTop: "2rem",
                padding: "1rem",
                borderRadius: "0.75rem",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <h3
                style={{
                  fontWeight: "bold",
                  color: "#402b2c",
                  marginBottom: "0.75rem",
                }}
              >
                🧾 Order Summary
              </h3>

              {items.length === 0 ? (
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#6b7280",
                  }}
                >
                  No cookies selected yet.
                </p>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {items.map(item => {
                      const size = item.size || "Regular";
                      const itemPrice = item.quantity * pricing[size];
                      return (
                        <div
                          key={`${item.flavour}-${size}`}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.9rem",
                            color: "#402b2c",
                          }}
                        >
                          <span>
                            {item.flavour}{isAdminView && ` (${size})`} × {item.quantity}
                          </span>
                          <span>
                            ${itemPrice.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <hr style={{ margin: "0.75rem 0" }} />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: "bold",
                      color: "#402b2c",
                    }}
                  >
                    <span>Total ({totalCookies} cookies)</span>
                    <span>${totalCost.toFixed(2)}</span>
                  </div>
                </>
              )}

              <p
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.8rem",
                  color: "#6b7280",
                }}
              >
                {!isAdminView && (
                  <>
                    ${DEFAULT_PRICE_PER_COOKIE.toFixed(2)} per cookie · ${(DEFAULT_PRICE_PER_COOKIE * 10).toFixed(2)} per
                    10 cookies
                  </>
                )}
              </p>
            </div>



            <button
              disabled={!canSubmit}
              onClick={placeOrder}
              style={{
                marginTop: "1rem",
                width: "100%",
                padding: "0.75rem",
                borderRadius: "1rem",
                backgroundColor: canSubmit ? "#402b2c" : "#aaa",
                color: "white",
                border: "none",
                cursor: canSubmit ? "pointer" : "not-allowed",
              }}
            >
              Place Order
            </button>
          </CardContent>
        </Card>
      </div>
      {showSuccess && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(64,43,44,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            background: "#f9fafb",
            padding: "2rem",
            borderRadius: "1.25rem",
            maxWidth: "90%",
            width: "420px",
            textAlign: "center",
            boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            border: "2px solid #402b2c",
          }}
        >
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: "bold",
              color: "#402b2c",
              marginBottom: "0.5rem",
            }}
          >
            🍪 Order placed!
          </h2>

          <p
            style={{
              fontSize: "0.95rem",
              color: "#402b2c",
              marginBottom: "1.25rem",
            }}
          >
            Your cookie order has been received.
            <br />
            Ray will contact you on Instagram to confirm pickup details.
          </p>

          <button
            onClick={() => setShowSuccess(false)}
            style={{
              padding: "0.6rem 1.75rem",
              borderRadius: "999px",
              border: "none",
              backgroundColor: "#402b2c",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      </div>
    )}


    </div>
  );
}

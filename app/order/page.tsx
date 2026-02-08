"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/navbar";
// menu items are loaded from the `menu` table below; remove hard-coded fallbacks
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

interface MenuItem {
  id?: number;
  flavour: string;
  description?: string | null;
  ingredients?: string | null;
  image_path?: string | null;
  hidden?: boolean | null;
}

const fallbackCookies: MenuItem[] = [];

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [receiptEmail, setReceiptEmail] = useState("");
  const [isSendingReceipt, setIsSendingReceipt] = useState(false);
  const [receiptSent, setReceiptSent] = useState(false);
  const [lastOrder, setLastOrder] = useState<any | null>(null);
  const [lastItems, setLastItems] = useState<CookieItem[]>([]);
  const [lastTotals, setLastTotals] = useState<{ totalCookies: number; totalCost: number } | null>(null);
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

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

  useEffect(() => {
    let mounted = true;
    const loadMenuItems = async () => {
      try {
        const { data, error } = await supabase
          .from("menu")
          .select("id, flavour, description, ingredients, image_path, hidden")
          .order("flavour", { ascending: true });

        if (error || !data) {
          console.error("Failed to load menu items (query error)", error);
          if (mounted) setMenuItems([]);
          return;
        }
        if (!mounted) return;
        setMenuItems(data as MenuItem[]);
      } catch (err: unknown) {
        try {
          const printable = err && typeof err === 'object' ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : String(err);
          console.error("Failed to load menu items (exception)", printable);
        } catch (e) {
          console.error("Failed to load menu items", err);
        }
        if (mounted) setMenuItems([]);
      }
    };

    loadMenuItems();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (showSuccess && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showSuccess]);

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

    const nowInTimeZone = (timeZone = "America/New_York") => {
      const now = new Date();
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(now);

      const get = (type: string) => parts.find(p => p.type === type)?.value || "00";
      const year = get("year");
      const month = get("month");
      const day = get("day");

      // Return date only in YYYY-MM-DD for the specified timezone
      return `${year}-${month}-${day}`;
    };

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          buyer: name.trim(),
          instagram_handle: instagram.trim(),
          date_order_created: nowInTimeZone("America/New_York"),
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

    // Resolve flavours to menu ids and insert order_items using flavour_id
    const flavours = Array.from(new Set(items.map(i => i.flavour)));
    const { data: menuRows, error: menuErr } = await supabase.from("menu").select("id, flavour").in("flavour", flavours);
    if (menuErr) {
      console.error(menuErr);
      alert("Failed to resolve menu flavours.");
      return;
    }

    const menuMap: Record<string, number> = {};
    (menuRows || []).forEach((r: any) => { menuMap[String(r.flavour)] = Number(r.id); });

    const missing = flavours.filter(f => !menuMap[f]);
    if (missing.length > 0) {
      alert(`Order contains unknown flavours: ${missing.join(", ")}. Please pick from the menu.`);
      return;
    }

    const orderItemsToInsert = items.map(item => ({
      order_id: orderData.id,
      flavour_id: menuMap[item.flavour],
      quantity: item.quantity,
      size: item.size || "Regular",
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItemsToInsert);
    if (itemsError) {
      console.error(itemsError);
      alert("Failed to add cookies.");
      return;
    }

    try {
      await fetch("/api/order-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: orderData,
          items: items.map(item => ({
            flavour: item.flavour,
            quantity: item.quantity,
            size: item.size || "Regular",
          })),
          totals: {
            totalCookies,
            totalCost,
          },
          kind: "admin",
        }),
      });
    } catch (notifyError) {
      console.error("Failed to send admin notification", notifyError);
    }

    setLastOrder(orderData);
    setLastItems(items.map(item => ({ ...item })));
    setLastTotals({ totalCookies, totalCost });
    setReceiptEmail("");
    setReceiptSent(false);
    setIsSendingReceipt(false);
    setShowSuccess(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setName("");
    setInstagram("");
    setDueDate("");
    setCustomization("");
    setItems([]);
  };

  const sendReceiptEmail = async () => {
    if (!receiptEmail || !lastOrder || !lastTotals) return;
    try {
      setIsSendingReceipt(true);
      await fetch("/api/order-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: lastOrder,
          items: lastItems.map(item => ({
            flavour: item.flavour,
            quantity: item.quantity,
            size: item.size || "Regular",
          })),
          totals: lastTotals,
          kind: "receipt",
          recipientEmail: receiptEmail,
        }),
      });
      setReceiptSent(true);
    } catch (notifyError) {
      console.error("Failed to send receipt email", notifyError);
    } finally {
      setIsSendingReceipt(false);
    }
  };

  const cookies = menuItems.filter((item) => !item.hidden);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: isAdminView ? "#f5e6d3" : "var(--page-bg)", padding: "0.5rem" }}>
      <Navbar isAdmin={isAdminView} />

      <div style={{ paddingTop: "6rem", paddingBottom: "2.5rem", backgroundColor: isAdminView ? "#f5e6d3" : "var(--page-bg)" }}>
        <Card style={{ maxWidth: "820px", margin: "0 auto", borderRadius: "1rem", background: isAdminView ? "#faf8f5" : "#ffffff", boxShadow: "0 12px 40px rgba(2,6,23,0.08)" }}>
          <CardContent style={{ padding: "2.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>🍪 {isAdminView ? "Custom Order" : "Make an Order"}</h1>
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

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
                  {["Small", "Regular", "Large"].map(size => (
                    <div
                      key={size}
                      style={{
                        background: "#fffaf8",
                        border: "1px solid #efe6dd",
                        padding: "0.6rem",
                        borderRadius: "0.75rem",
                        boxShadow: "0 6px 18px rgba(2,6,23,0.04)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#402b2c" }}>{size}</span>
                        <span style={{ fontSize: "0.85rem", color: "#6b4f3c" }}>${pricing[size as keyof PricingConfig].toFixed(2)}</span>
                      </div>

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
                          width: "100%",
                          padding: "0.45rem",
                          borderRadius: "0.5rem",
                          border: "1px solid #ddd",
                          fontSize: "0.95rem",
                          textAlign: "center",
                          background: "white",
                          color: "#402b2c",
                        }}
                      />
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
              <strong>Cookies selected: {totalCookies}{!isAdminView && " (Max 40)"}</strong>

              <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#6b7280" }}>
                {!isAdminView && (
                  <>
                    ${DEFAULT_PRICE_PER_COOKIE.toFixed(2)} per cookie · ${(DEFAULT_PRICE_PER_COOKIE * 10).toFixed(2)} per 10 cookies
                  </>
                )}
              </p>

              <p style={{ marginTop: "0.25rem", fontSize: "0.8rem", color: "#6b7280" }}>
                Orders are tentative and subject to confirmation. For custom orders, please contact Ray directly on his <a href="https://www.instagram.com/rayscookies.to/" target="_blank" rel="noopener noreferrer" style={{ color: "#402b2c", fontWeight: "500" }}>Instagram</a>.
              </p>


              {cookies.length === 0 ? (
                <div style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.95rem' }}>
                  No flavours available. Please check back later or ask an admin to add menu items.
                </div>
              ) : cookies.map(cookie => {
              const availableQuantities = isAdminView ? adminQuantities : quantities;
              const sizes: ("Small" | "Regular" | "Large")[] = ["Small", "Regular", "Large"];

              return (
                <div
                  key={cookie.flavour}
                  className="cookie-card"
                  style={{
                    border: "1px solid #e6eef6",
                    padding: "0.9rem",
                    borderRadius: "0.9rem",
                    marginTop: "1rem",
                    background: "#faf8f5",
                    boxShadow: "0 6px 18px rgba(2,6,23,0.04)",
                  }}
                >
                  {/* Image + Description */}
                  <div className="cookie-row" style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <div style={{ width: 96, height: 96, flex: "0 0 96px", position: "relative", borderRadius: 12, overflow: "hidden", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.03)" }}>
                      <Image
                        src={cookie.image_path ?? '/cookies/birthday.jpg'}
                        alt={cookie.flavour}
                        width={96}
                        height={96}
                        style={{ objectFit: "cover", width: "100%", height: "100%" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: "block" }}>{cookie.flavour}</strong>
                      <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>{cookie.description}</p>
                      {!isAdminView && (
                        <div style={{ marginTop: "0.5rem" }}>
                          <select
                            className="quantity-select"
                            value={items.find(i => i.flavour === cookie.flavour)?.quantity || ""}
                            onChange={e => handleQuantityChange(cookie.flavour, e.target.value)}
                            style={{
                              minWidth: "90px",
                              padding: "0.4rem 0.5rem",
                              borderRadius: "0.5rem",
                              border: "1px solid #e6eef6",
                              fontSize: "0.9rem",
                              textAlign: "center",
                              background: "#fff",
                              boxShadow: "0 4px 12px rgba(2,6,23,0.04)",
                            }}
                          >
                            <option value="">Qty</option>
                            {quantities.map(q => {
                              const remaining = 40 - totalCookies + (items.find(i => i.flavour === cookie.flavour)?.quantity || 0);
                              return (
                                <option key={q} value={q} disabled={q > remaining}>
                                  {q} - ${ (q * pricing.Regular).toFixed(2) }
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

              {/* price-per-cookie text moved above 'Cookies selected' */}
            </div>

            {/* Confirmation notice before placing order */}
            {!isAdminView && (
              <div style={{ marginTop: "0.75rem", color: "#374151", fontSize: "0.95rem" }}>
                After placing your order, Ray will contact you via Instagram to confirm your order and pickup details.
              </div>
            )}

            {!isAdminView && (
              <div style={{ marginTop: "0.4rem", color: "#6b7280", fontSize: "0.9rem" }}>
                Payments are made via e‑transfer.
              </div>
            )}



            <button
              disabled={!canSubmit}
              onClick={placeOrder}
              style={{
                marginTop: "1rem",
                width: "100%",
                padding: "0.75rem",
                borderRadius: "1rem",
                background: canSubmit ? "linear-gradient(90deg,#6b3b2a,#402b2c)" : "#ccc",
                color: "white",
                border: "none",
                cursor: canSubmit ? "pointer" : "not-allowed",
                boxShadow: canSubmit ? "0 10px 30px rgba(64,43,44,0.14)" : "none",
                transition: "transform 0.12s, box-shadow 0.12s, filter 0.12s",
                transform: "translateY(0)",
                filter: "none",
              }}
              onMouseEnter={canSubmit ? (e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = "translateY(-2px)";
                el.style.filter = "brightness(1.03)";
              }) : undefined}
              onMouseLeave={canSubmit ? (e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = "translateY(0)";
                el.style.filter = "none";
              }) : undefined}
            >
              Place Order
            </button>
          </CardContent>
        </Card>
      </div>
            {!isAdminView && (
              <footer style={{ borderTop: "1px solid rgba(2,6,23,0.04)", padding: "1rem", marginTop: "1rem" }}>
                <div style={{ width: "100%", maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#475569" }}>
                  <div>© {new Date().getFullYear()} Ray's Cookies</div>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); setShowContactPopup(true); }}
                      style={{ color: "#475569", textDecoration: "none" }}
                    >
                      Contact
                    </a>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); setShowReportPopup(true); }}
                      style={{ color: "#475569", textDecoration: "none" }}
                    >
                      Report Issues
                    </a>
                  </div>
                </div>
              </footer>
            )}
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
            width: "480px",
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

          <div
            style={{
              margin: "0 0 1rem",
              padding: "0.75rem",
              borderRadius: "0.75rem",
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              textAlign: "left",
            }}
          >
            <div style={{ fontWeight: 700, color: "#1e3a8a", marginBottom: "0.5rem" }}>
              Email your receipt
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={receiptEmail}
                onChange={e => setReceiptEmail(e.target.value)}
                style={{
                  flex: "1 1 220px",
                  padding: "0.45rem 0.6rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #cbd5f5",
                  fontSize: "0.9rem",
                }}
              />
              <button
                onClick={sendReceiptEmail}
                disabled={!receiptEmail || isSendingReceipt || receiptSent}
                style={{
                  padding: "0.45rem 0.9rem",
                  borderRadius: "0.6rem",
                  border: "none",
                  backgroundColor: receiptSent ? "#94a3b8" : "#2563eb",
                  color: "white",
                  fontWeight: 700,
                  cursor: receiptSent ? "default" : "pointer",
                }}
              >
                {receiptSent ? "Sent" : isSendingReceipt ? "Sending..." : "Send"}
              </button>
            </div>
          </div>

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
      {showReportPopup && (
        <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 1400 }}>
          <div style={{ minWidth: 260, maxWidth: 340, background: 'white', color: '#0f172a', padding: '0.75rem 1rem', borderRadius: 12, boxShadow: '0 12px 40px rgba(2,6,23,0.12)', border: '1px solid rgba(2,6,23,0.06)', fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
              <div style={{ fontWeight: 700 }}>Report an issue</div>
              <button onClick={() => setShowReportPopup(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#475569', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ marginTop: 6, color: '#374151', lineHeight: 1.4 }}>Please email <a href="mailto:mcintyredanial@gmail.com" style={{ color: '#0369a1', textDecoration: 'underline' }}>mcintyredanial@gmail.com</a> with a short description and screenshots if possible.</div>
          </div>
        </div>
      )}

      {showContactPopup && (
        <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 1400 }}>
          <div style={{ minWidth: 260, maxWidth: 340, background: 'white', color: '#0f172a', padding: '0.75rem 1rem', borderRadius: 12, boxShadow: '0 12px 40px rgba(2,6,23,0.12)', border: '1px solid rgba(2,6,23,0.06)', fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
              <div style={{ fontWeight: 700 }}>Contact Ray</div>
              <button onClick={() => setShowContactPopup(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#475569', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ marginTop: 6, color: '#374151', lineHeight: 1.4 }}>You can reach Ray on Instagram: <a href="https://www.instagram.com/rayscookies.to/" target="_blank" rel="noreferrer" style={{ color: '#0369a1', textDecoration: 'underline' }}>instagram.com/rayscookies.to</a></div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .cookie-row {
            flex-direction: column;
          }
          .cookie-card {
            padding: 0.75rem;
          }
          .quantity-select {
            width: 100%;
            min-width: 0;
            box-sizing: border-box;
          }
        }
      `}</style>
    </div>
  );
}

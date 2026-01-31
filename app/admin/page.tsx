"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface OrderItem {
  flavour: string;
  quantity: number;
  size: "Small" | "Regular" | "Large";
}

interface Order {
  id: number;
  buyer: string;
  instagram_handle: string;
  date_order_created: string;
  date_order_due: string;
  total_revenue: number;
  customization: string | null;
  status: string;
  items: OrderItem[];
  totalCookies: number;
  deleted?: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string[]>([]); 
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false); 

  const [sortField, setSortField] = useState<"date" | "revenue" | "id" | "buyer" | "instagram" | "dueDate">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [editMode, setEditMode] = useState<boolean>(false);
  const [backupOrders, setBackupOrders] = useState<Order[]>([]);
  const [addSelection, setAddSelection] = useState<Record<number, string>>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showApplySuccess, setShowApplySuccess] = useState<boolean>(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState<boolean>(false);
  const [deletedOrderId, setDeletedOrderId] = useState<number | null>(null);const [allFlavours, setAllFlavours] = useState<string[]>([]);

    useEffect(() => {
    const fetchFlavours = async () => {
        try {
        const { data: flavourData, error: flavourError } = await supabase
            .from("flavours_view")
            .select("flavour");

        if (flavourError) throw flavourError;

        setAllFlavours(flavourData?.map(f => f.flavour) || []);
        } catch (err: any) {
        console.error("Failed to fetch flavours:", err);
        setError("Failed to load flavours.");
        }
    };

    fetchFlavours();
    }, []);


  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/login");
      else fetchOrders();
    });
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id,
          buyer,
          instagram_handle,
          date_order_created,
          date_order_due,
          total_revenue,
          customization,
          status,
          order_items (
            flavour,
            quantity,
            size
          )
        `);

      if (ordersError) throw ordersError;

      const enrichedOrders = ordersData.map((o: any) => ({
        ...o,
        items: o.order_items,
        totalCookies: o.order_items.reduce((sum: number, i: any) => sum + i.quantity, 0),
      }));

      setOrders(enrichedOrders);
      setFilteredOrders(enrichedOrders);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["ID", "Buyer", "Instagram", "Created", "Due", "Total Cookies", "Revenue", "Status", "Customization", "Items"];
    const rows: any[] = [];
    
    filteredOrders.forEach(order => {
      const itemsStr = order.items
        .map(item => `${item.flavour} (${item.size || "Regular"}) × ${item.quantity}`)
        .join("; ");
      
      rows.push([
        order.id,
        order.buyer,
        order.instagram_handle,
        new Date(order.date_order_created).toLocaleString(),
        new Date(order.date_order_due).toLocaleString(),
        order.totalCookies,
        order.total_revenue.toFixed(2),
        order.status,
        order.customization || "",
        itemsStr
      ]);
    });
    
    const csv = [
      headers.join(","),
      ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    let filtered = [...orders];
    if (statusFilter.length > 0) {
    filtered = filtered.filter(o => statusFilter.includes(o.status));
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o => 
        o.buyer.toLowerCase().includes(term) ||
        o.instagram_handle.toLowerCase().includes(term) ||
        o.id.toString().includes(term)
      );
    }

    filtered.sort((a, b) => {
      switch (sortField) {
        case "date": return sortOrder === "asc"
          ? new Date(a.date_order_created).getTime() - new Date(b.date_order_created).getTime()
          : new Date(b.date_order_created).getTime() - new Date(a.date_order_created).getTime();
        case "revenue": return sortOrder === "asc" ? a.total_revenue - b.total_revenue : b.total_revenue - a.total_revenue;
        case "id": return sortOrder === "asc" ? a.id - b.id : b.id - a.id;
        case "buyer": return sortOrder === "asc" ? a.buyer.localeCompare(b.buyer) : b.buyer.localeCompare(a.buyer);
        case "instagram": return sortOrder === "asc" ? a.instagram_handle.localeCompare(b.instagram_handle) : b.instagram_handle.localeCompare(a.instagram_handle);
        case "dueDate": return sortOrder === "asc"
          ? new Date(a.date_order_due).getTime() - new Date(b.date_order_due).getTime()
          : new Date(b.date_order_due).getTime() - new Date(a.date_order_due).getTime();
        default: return 0;
      }
    });

    setFilteredOrders(filtered);
  }, [statusFilter, sortField, sortOrder, searchTerm, orders]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const updateItemQuantity = (orderId: number, flavour: string, value: number, size: "Small" | "Regular" | "Large" = "Regular") => {
    const rounded = Math.max(0, Math.round(value / 5) * 5);
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const items = order.items.map(i => (i.flavour === flavour && i.size === size) ? { ...i, quantity: rounded } : i);
      const totalCookies = items.reduce((sum, i) => sum + i.quantity, 0);
      return { ...order, items, totalCookies };
    }));
  };

  const removeItem = (orderId: number, flavour: string, size: "Small" | "Regular" | "Large" = "Regular") => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const items = order.items.filter(i => !(i.flavour === flavour && i.size === size));
      const totalCookies = items.reduce((sum, i) => sum + i.quantity, 0);
      return { ...order, items, totalCookies };
    }));
  };

  const addItem = (orderId: number, flavour: string) => {
    if (!flavour) return;
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      // Find the next available size for this flavour
      const usedSizes = order.items.filter(i => i.flavour === flavour).map(i => i.size);
      const sizes: ("Small" | "Regular" | "Large")[] = ["Small", "Regular", "Large"];
      const nextSize = (sizes.find(s => !usedSizes.includes(s)) || "Small") as "Small" | "Regular" | "Large";
      // prevent adding more than 3 of the same flavor
      if (usedSizes.length >= 3) return order;
      const items = [...order.items, { flavour, quantity: 5, size: nextSize }];
      const totalCookies = items.reduce((sum, i) => sum + i.quantity, 0);
      return { ...order, items, totalCookies };
    }));
    setAddSelection(prev => ({ ...prev, [orderId]: "" }));
  };

  const updateOrderField = (orderId: number, field: keyof Order, value: any) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId
        ? { ...order, [field]: value }
        : order
    ));
  };

  const handleApplyChanges = async () => {
    try {
      for (const order of orders) {
        if (order.deleted) {
            const { error: delErr } = await supabase.from("orders").delete().eq("id", order.id);
            if (delErr) throw delErr;
            continue; 
        }

        const { error: orderErr } = await supabase.from("orders").update({
            buyer: order.buyer,
            instagram_handle: order.instagram_handle,
            date_order_due: order.date_order_due,
            total_revenue: order.total_revenue,
            status: order.status,
            customization: order.customization
        }).eq("id", order.id);
        if (orderErr) throw orderErr;

        const { error: delItemsErr } = await supabase.from("order_items").delete().eq("order_id", order.id);
        if (delItemsErr) throw delItemsErr;

        if (order.items.length > 0) {
            const itemsToInsert = order.items.map(i => ({ order_id: order.id, flavour: i.flavour, quantity: i.quantity, size: i.size || "Regular" }));
            const { error: insErr } = await supabase.from("order_items").insert(itemsToInsert);
            if (insErr) throw insErr;
        }
        }

      setShowApplySuccess(true);
      setEditMode(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#a3dfff", padding: "0.5rem" }}>
      {/* Navbar */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          backgroundColor: "#56baf2",
          color: "white",
          padding: "0.75rem 1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          zIndex: 1000,
        }}
      >
        <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.5rem)", fontWeight: "bold", cursor: "pointer" }} onClick={() => router.push("/home")}>
          🍪 Rays Cookies
        </h1>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              if (editMode) setOrders(backupOrders); 
              else setBackupOrders([...orders]);
              setEditMode(!editMode);
            }}
            style={{
              padding: "0.5rem clamp(0.75rem, 2vw, 1rem)",
              borderRadius: "0.5rem",
              backgroundColor: editMode ? "#ef4444" : "#402b2c",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "clamp(0.8rem, 2vw, 0.95rem)",
              transition: "background-color 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = editMode ? "#dc2626" : "#3a2423";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = editMode ? "#ef4444" : "#402b2c";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {editMode ? "Exit Edit" : "Edit"}
          </button>
          {editMode && (
            <button
              onClick={handleApplyChanges}
              style={{
                padding: "0.5rem clamp(0.75rem, 2vw, 1rem)",
                borderRadius: "0.5rem",
                backgroundColor: "#10b981",
                color: "white",
                fontWeight: "bold",
                fontSize: "clamp(0.8rem, 2vw, 0.95rem)",
                cursor: "pointer",
                transition: "background-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "#059669";
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "#10b981";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Apply Changes
            </button>
          )}
          <button
            onClick={() => router.push("/order")}
            style={{
              padding: "0.5rem clamp(0.75rem, 2vw, 1rem)",
              borderRadius: "0.5rem",
              backgroundColor: "#10b981",
              color: "white",
              fontWeight: "bold",
              fontSize: "clamp(0.8rem, 2vw, 0.95rem)",
              cursor: "pointer",
              transition: "background-color 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "#059669";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "#10b981";
              e.currentTarget.style.boxShadow = "none";
            }}
            onMouseDown={e => {
              e.currentTarget.style.backgroundColor = "#047857";
            }}
            onMouseUp={e => {
              e.currentTarget.style.backgroundColor = "#059669";
            }}
          >
            + New Order
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: "0.5rem clamp(0.75rem, 2vw, 1rem)",
              borderRadius: "0.5rem",
              backgroundColor: "#402b2c",
              color: "white",
              fontWeight: "bold",
              fontSize: "clamp(0.8rem, 2vw, 0.95rem)",
              cursor: "pointer",
              transition: "background-color 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "#3a2423";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "#402b2c";
              e.currentTarget.style.boxShadow = "none";
            }}
            onMouseDown={e => {
              e.currentTarget.style.backgroundColor = "#2c1f20";
            }}
            onMouseUp={e => {
              e.currentTarget.style.backgroundColor = "#3a2423";
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Filters & Search */}
      <div
        style={{
          paddingTop: "6rem",
          marginBottom: "0.5rem",
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "flex-end",
        }}
      >
        <div style={{ backgroundColor: "white", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontWeight: "500", fontSize: "0.85rem", color: "#374151", whiteSpace: "nowrap" }}>Search:</label>
          <input
            type="text"
            placeholder="ID, Buyer, Instagram"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              padding: "0.35rem 0.5rem",
              borderRadius: "0.25rem",
              border: "1px solid #d1d5db",
              fontSize: "0.9rem",
              width: "180px",
            }}
          />
        </div>
        <div
  style={{
    backgroundColor: "white",
    padding: "0.5rem 0.75rem",
    borderRadius: "0.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flex: "0 0 auto",   // prevent shrinking
    minWidth: "90px",   // starting width
    overflow: "visible", // allow horizontal growth
  }}
>
  <label style={{ fontWeight: "500", fontSize: "0.85rem", color: "#374151", whiteSpace: "nowrap" }}>
    Status:
  </label>
  <div style={{ position: "relative", flex: "0 0 auto" }}>
    <button
      onClick={() => setStatusDropdownOpen(prev => !prev)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        width: "auto",
        minWidth: "120px",
        flexShrink: 0,
        padding: "0.35rem 0.5rem",
        borderRadius: "0.25rem",
        border: "1px solid #d1d5db",
        fontSize: "0.85rem",
        cursor: "pointer",
        backgroundColor: "white",
        minHeight: "1.5rem",
        textAlign: "left",
        whiteSpace: "nowrap",
        overflowX: "auto",  // scroll if too long
      }}
    >
      {statusFilter.length > 0 ? statusFilter.join(", ") : "Select..."}
      <span style={{ marginLeft: "auto" }}>▾</span>
    </button>

    {statusDropdownOpen && (
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          backgroundColor: "white",
          border: "1px solid #d1d5db",
          borderRadius: "0.25rem",
          boxShadow: "0 1px 5px rgba(0,0,0,0.2)",
          zIndex: 1000,
          padding: "0.5rem 0",
          boxSizing: "border-box",
        }}
      >
        {["Pending", "Confirmed", "Delivered"].map(status => (
          <label
            key={status}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0.25rem 0.5rem",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={statusFilter.includes(status)}
              onChange={() => {
                setStatusFilter(prev =>
                  prev.includes(status)
                    ? prev.filter(s => s !== status)
                    : [...prev, status]
                );
              }}
              style={{ marginRight: "0.5rem" }}
            />
            {status}
          </label>
        ))}
      </div>
    )}
  </div>
</div>

        <div style={{ backgroundColor: "white", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <label style={{ marginRight: "0.5rem", fontWeight: "500", fontSize: "0.85rem", color: "#374151" }}>Sort by:</label>
          <select value={sortField} onChange={e => setSortField(e.target.value as any)} style={{ padding: "0.35rem 0.5rem", borderRadius: "0.25rem", border: "1px solid #d1d5db", fontSize: "0.9rem", cursor: "pointer" }}>
            <option value="id">ID</option>
            <option value="buyer">Buyer</option>
            <option value="instagram">Instagram</option>
            <option value="dueDate">Due Date</option>
            <option value="date">Created Date</option>
            <option value="revenue">Revenue</option>
          </select>
        </div>
        <div style={{ backgroundColor: "white", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <label style={{ marginRight: "0.5rem", fontWeight: "500", fontSize: "0.85rem", color: "#374151" }}>Order:</label>
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)} style={{ padding: "0.35rem 0.5rem", borderRadius: "0.25rem", border: "1px solid #d1d5db", fontSize: "0.9rem", cursor: "pointer" }}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
        <button
          onClick={exportToCSV}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "0.5rem",
            backgroundColor: "white",
            color: "#6366f1",
            fontWeight: "500",
            fontSize: "0.85rem",
            cursor: "pointer",
            border: "1.5px solid #6366f1",
            transition: "background-color 0.12s, box-shadow 0.12s, color 0.12s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = "#6366f1";
            e.currentTarget.style.color = "white";
            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.12)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = "white";
            e.currentTarget.style.color = "#6366f1";
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
          }}
          onMouseDown={e => {
            e.currentTarget.style.backgroundColor = "#4f46e5";
          }}
          onMouseUp={e => {
            e.currentTarget.style.backgroundColor = "#6366f1";
          }}
        >
          📥 Export
        </button>
      </div>

      {/* Apply Changes moved into navbar */}

      {/* Table */}
      <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: "0.75rem" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "95vw",
            backgroundColor: "white",
            borderRadius: "0.75rem",
            boxShadow: "0 3px 8px rgba(0,0,0,0.12)",
            overflowX: "auto",
            border: editMode ? "3px solid #3b82f6" : "none",
            transition: "border 0.2s",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1200px", fontSize: "clamp(0.75rem, 2vw, 0.9rem)", tableLayout: "auto" }}>
            <thead style={{ position: "sticky", top: 0, backgroundColor: "#56baf2", color: "white", zIndex: 10 }}>
              <tr style={{ backgroundColor: "#56baf2", color: "white", textAlign: "left" }}>
                <th style={{ padding: "clamp(0.35rem, 1vw, 0.5rem)", fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)" }}>ID</th>
                <th style={{ padding: "clamp(0.35rem, 1vw, 0.5rem)", fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)", wordBreak: "break-word" }}>Buyer</th>
                <th style={{ padding: "clamp(0.35rem, 1vw, 0.5rem)", fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)", wordBreak: "break-word" }}>Instagram</th>
                <th style={{ padding: "clamp(0.35rem, 1vw, 0.5rem)", fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)" }}>Created</th>
                <th style={{ padding: "clamp(0.35rem, 1vw, 0.5rem)", fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)" }}>Due</th>
                <th style={{ padding: "clamp(0.35rem, 1vw, 0.5rem)", textAlign: "center", fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)" }}>Cookies</th>
                <th style={{ padding: "clamp(0.35rem, 1vw, 0.5rem)", textAlign: "center", fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)" }}>Revenue</th>
                <th style={{ padding: "clamp(0.35rem, 1vw, 0.5rem)", fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)" }}>Status</th>
                <th style={{ padding: "clamp(0.35rem, 1vw, 0.5rem)", fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)" }}>Custom</th>
                <th style={{ padding: "clamp(0.35rem, 1vw, 0.5rem)", fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)", textAlign: "center" }}>Flavors</th>
                <th style={{ padding: "clamp(0.35rem, 1vw, 0.5rem)", fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)", textAlign: "center" }}>Sizes</th>
                <th style={{ padding: "clamp(0.35rem, 1vw, 0.5rem)", fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)", textAlign: "center" }}>Quantities</th>
                <th style={{ padding: "clamp(0.35rem, 1vw, 0.5rem)", fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)", textAlign: "center", display: editMode ? "table-cell" : "none" }}>Remove</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.filter(order => !order.deleted).map((order, index) => (
                <React.Fragment key={order.id}>
                  <tr style={{ backgroundColor: index % 2 === 0 ? "#f9f9f9" : "white", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "#e9f6ff"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#f9f9f9" : "white"}>
                  <td style={{ padding: "clamp(0.25rem, 1vw, 0.35rem)", fontSize: "clamp(0.7rem, 1.5vw, 0.9rem)" }}>{order.id}</td>
                  <td style={{ padding: "clamp(0.25rem, 1vw, 0.35rem)", fontSize: "clamp(0.7rem, 1.5vw, 0.9rem)", wordBreak: "break-word", overflowWrap: "break-word", hyphens: "auto" }}>
                    {editMode ? (
                      <input
                        type="text"
                        value={order.buyer}
                        onChange={e => updateOrderField(order.id, "buyer", e.target.value)}
                        style={{ width: "100%", fontSize: "0.9rem" }}
                      />
                    ) : order.buyer}
                  </td>
                  <td style={{ padding: "clamp(0.25rem, 1vw, 0.35rem)", fontSize: "clamp(0.7rem, 1.5vw, 0.9rem)", wordBreak: "break-word", overflowWrap: "break-word", hyphens: "auto" }}>
                    {editMode ? (
                      <input
                        type="text"
                        value={order.instagram_handle}
                        onChange={e => updateOrderField(order.id, "instagram_handle", e.target.value)}
                        style={{ width: "100%", fontSize: "0.9rem" }}
                      />
                    ) : order.instagram_handle}
                  </td>
                  <td style={{ padding: "clamp(0.25rem, 1vw, 0.35rem)", fontSize: "clamp(0.65rem, 1.2vw, 0.85rem)" }}>{new Date(order.date_order_created).toLocaleDateString()}</td>
                  <td style={{ padding: "clamp(0.25rem, 1vw, 0.35rem)", fontSize: "clamp(0.65rem, 1.2vw, 0.85rem)" }}>
                    {editMode ? (
                      <input
                        type="date"
                        value={new Date(order.date_order_due).toISOString().split("T")[0]}
                        onChange={e => updateOrderField(order.id, "date_order_due", e.target.value)}
                        style={{ fontSize: "0.85rem" }}
                      />
                    ) : new Date(order.date_order_due).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "clamp(0.25rem, 1vw, 0.35rem)", textAlign: "center", fontSize: "clamp(0.7rem, 1.5vw, 0.9rem)" }}>{order.totalCookies}</td>
                  <td style={{ padding: "clamp(0.25rem, 1vw, 0.35rem)", textAlign: "center", fontSize: "clamp(0.7rem, 1.5vw, 0.9rem)" }}>
                    {editMode ? (
                        <input
                        type="number"
                        value={order.total_revenue}
                        onChange={e => updateOrderField(order.id, "total_revenue", parseFloat(e.target.value))}
                        style={{ width: "80px", textAlign: "center", fontSize: "0.9rem" }}
                        step={0.01}
                        min={0}
                        />
                    ) : order.total_revenue.toFixed(2)}
                    </td>

                  <td style={{ padding: "clamp(0.25rem, 1vw, 0.35rem)", fontSize: "clamp(0.7rem, 1.5vw, 0.9rem)" }}>
                    {editMode ? (
                      <select value={order.status} onChange={e => updateOrderField(order.id, "status", e.target.value)} style={{ fontSize: "0.85rem" }}>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    ) : order.status}
                  </td>
                  <td style={{ padding: "clamp(0.25rem, 1vw, 0.35rem)", fontSize: "clamp(0.7rem, 1.5vw, 0.9rem)", wordBreak: "break-word", overflowWrap: "break-word", hyphens: "auto" }}>
                    {editMode ? (
                      <input
                        type="text"
                        value={order.customization || ""}
                        onChange={e => updateOrderField(order.id, "customization", e.target.value)}
                        style={{ width: "100%", fontSize: "0.9rem" }}
                      />
                    ) : order.customization || "-"}
                  </td>
                  <td style={{ padding: "clamp(0.25rem, 1vw, 0.35rem)", minWidth: "340px", whiteSpace: "normal", wordWrap: "break-word" }} colSpan={3}>
                    {editMode ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        {order.items.map((item, idx) => (
                          <div key={`${item.flavour}-${item.size}-${idx}`} style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px 32px", alignItems: "center", gap: "0.5rem", fontSize: "clamp(0.65rem, 1.2vw, 0.85rem)", marginBottom: idx < order.items.length - 1 ? "0.3rem" : 0 }}>
                            <div style={{ overflowWrap: "break-word" }}>{item.flavour}</div>
                            <select
                              value={item.size || "Regular"}
                              onChange={e => {
                                const newSize = e.target.value as "Small" | "Regular" | "Large";
                                setOrders(prev => prev.map(o => {
                                  if (o.id !== order.id) return o;
                                  const items = o.items.map(i => (i.flavour === item.flavour && (i.size || "Regular") === (item.size || "Regular")) ? { ...i, size: newSize } : i);
                                  const totalCookies = items.reduce((sum, i) => sum + i.quantity, 0);
                                  return { ...o, items, totalCookies };
                                }));
                              }}
                              style={{ padding: "0.25rem", minWidth: "65px", fontSize: "0.85rem" }}
                            >
                              {["Small", "Regular", "Large"].map(size => {
                                const isUsed = order.items.some(i => i.flavour === item.flavour && (i.size || "Regular") !== (item.size || "Regular") && i.size === size);
                                return (
                                  <option key={size} value={size} disabled={isUsed} style={{ color: isUsed ? "#999" : "black" }}>
                                    {size}
                                  </option>
                                );
                              })}
                            </select>
                            <select
                              value={item.quantity}
                              onChange={e => {
                                const selected = Number(e.target.value);
                                const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
                                const currentQty = item.quantity;
                                const remaining = 100 - totalQty + currentQty;
                                if (selected > remaining) return;
                                updateItemQuantity(order.id, item.flavour, selected, item.size || "Regular");
                              }}
                              style={{ padding: "0.25rem", minWidth: "50px", fontSize: "0.85rem" }}
                            >
                              {[5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 100].map(q => {
                                const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
                                const currentQty = item.quantity;
                                const remaining = 100 - totalQty + currentQty;
                                const isDisabled = q > remaining;
                                return (
                                  <option key={q} value={q} disabled={isDisabled} style={{ color: isDisabled ? "#999" : "black" }}>
                                    {q}
                                  </option>
                                );
                              })}
                            </select>
                            <button
                              onClick={() => removeItem(order.id, item.flavour, item.size || "Regular")}
                              title={`Remove ${item.flavour}`}
                              style={{
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                backgroundColor: "#f59e0b",
                                color: "white",
                                cursor: "pointer",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                lineHeight: 1,
                                padding: 0,
                                transition: "transform 0.12s, background-color 0.12s",
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.transform = "scale(1.1)";
                                e.currentTarget.style.backgroundColor = "#d97706";
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.backgroundColor = "#f59e0b";
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {editMode && (
                          <div style={{ marginTop: "0.4rem", paddingTop: "0.4rem", borderTop: "1px solid #e5e7eb", display: "flex", gap: "0.3rem", alignItems: "center", flexWrap: "wrap" }}>
                            <select value={addSelection[order.id] || ""} onChange={e => setAddSelection(prev => ({ ...prev, [order.id]: e.target.value }))} style={{ minWidth: "120px", padding: "0.25rem 0.4rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", fontSize: "0.8rem" }}>
                              <option value="">Add flavour...</option>
                              {allFlavours.map((f: string) => {
                                const count = order.items.filter((i: OrderItem) => i.flavour === f).length;
                                const isDisabled = count >= 3;
                                return (
                                  <option key={f} value={f} disabled={isDisabled} style={{ color: isDisabled ? "#999" : "black" }}>
                                    {f}
                                  </option>
                                );
                              })}
                            </select>
                            <button onClick={() => addItem(order.id, addSelection[order.id] || "")} style={{ padding: "0.25rem 0.4rem", borderRadius: "0.375rem", backgroundColor: "#3b82f6", color: "white", cursor: "pointer", border: "none", fontWeight: "500", transition: "background-color 0.12s, box-shadow 0.12s", fontSize: "0.8rem" }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#2563eb"; e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.12)"; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#3b82f6"; e.currentTarget.style.boxShadow = "none"; }} onMouseDown={e => { e.currentTarget.style.backgroundColor = "#1d4ed8"; }} onMouseUp={e => { e.currentTarget.style.backgroundColor = "#2563eb"; }}>+</button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        {order.items.map((item, idx) => (
                          <div key={`${item.flavour}-${item.size}-${idx}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", alignItems: "center", fontSize: "clamp(0.65rem, 1.2vw, 0.85rem)", marginBottom: idx < order.items.length - 1 ? "0.3rem" : 0 }}>
                            <div style={{ overflowWrap: "break-word", textAlign: "center" }}>{item.flavour}</div>
                            <div style={{ textAlign: "center" }}>{item.size || "Regular"}</div>
                            <div style={{ textAlign: "center" }}>{item.quantity}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: "clamp(0.25rem, 1vw, 0.35rem)", verticalAlign: "middle", display: editMode ? "table-cell" : "none" }}>
                    {editMode && (
                      <button
                        style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            backgroundColor: order.deleted ? "#9ca3af" : "#ef4444",
                            color: "white",
                            fontWeight: "bold",
                            cursor: "pointer",
                            border: "none",
                            transition: "transform 0.12s, background-color 0.12s, box-shadow 0.12s",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            margin: "0 auto",
                        }}
                        onMouseEnter={e => {
                            if (!order.deleted) {
                            e.currentTarget.style.transform = "scale(1.05)";
                            e.currentTarget.style.backgroundColor = "#dc2626";
                            e.currentTarget.style.boxShadow = "0 3px 8px rgba(0,0,0,0.12)";
                            }
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.backgroundColor = order.deleted ? "#9ca3af" : "#ef4444";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                        onClick={() => {
                            setOrders(prev => prev.map(o =>
                            o.id === order.id ? { ...o, deleted: !o.deleted } : o
                            ));
                        setDeletedOrderId(order.id);
                        setShowDeleteSuccess(true);
                        }}
                        title={order.deleted ? "Restore order" : `Delete order #${order.id}`}
                        >
                        {order.deleted ? "↩" : "🗑"}
                        </button>

                    )}
                  </td>
                </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap", textAlign: "center" }}>
        <div style={{ backgroundColor: "#f3f4f6", padding: "0.6rem 1rem", borderRadius: "0.6rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", minWidth: "120px" }}>
          <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>Total Orders</div>
          <div style={{ fontWeight: "bold", fontSize: "1rem", color: "#402b2c" }}>{filteredOrders.length}</div>
        </div>
        <div style={{ backgroundColor: "#f3f4f6", padding: "0.6rem 1rem", borderRadius: "0.6rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", minWidth: "120px" }}>
          <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>Total Revenue</div>
          <div style={{ fontWeight: "bold", fontSize: "1rem", color: "#402b2c" }}>
            ${filteredOrders.reduce((sum, o) => sum + o.total_revenue, 0).toFixed(2)}
          </div>
        </div>
        <div style={{ backgroundColor: "#f3f4f6", padding: "0.6rem 1rem", borderRadius: "0.6rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", minWidth: "120px" }}>
          <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>Total Cookies Sold</div>
          <div style={{ fontWeight: "bold", fontSize: "1rem", color: "#402b2c" }}>
            {filteredOrders.reduce((sum, o) => sum + o.totalCookies, 0)}
          </div>
        </div>
      </div>

      {/* Apply Changes Success Modal */}
      {showApplySuccess && (
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
              ✅ Changes saved!
            </h2>

            <p
              style={{
                fontSize: "0.95rem",
                color: "#402b2c",
                marginBottom: "1.25rem",
              }}
            >
              All order updates have been saved successfully.
            </p>

            <button
              onClick={() => setShowApplySuccess(false)}
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

      {/* Delete Order Success Modal */}
      {showDeleteSuccess && (
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
              🗑 Order deleted
            </h2>

            <p
              style={{
                fontSize: "0.95rem",
                color: "#402b2c",
                marginBottom: "1.25rem",
              }}
            >
              Order #{deletedOrderId} has been removed.
            </p>

            <button
              onClick={() => setShowDeleteSuccess(false)}
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

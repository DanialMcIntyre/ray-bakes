"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/navbar";
import ConfirmModal from "@/components/ui/confirmModal";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface MenuItem {
  id: number;
  flavour: string;
  description?: string | null;
  ingredients?: string | null;
  image_path?: string | null;
  hidden?: boolean | null;
}

const emptyForm = {
  flavour: "",
  description: "",
  ingredients: "",
  image_path: "",
  hidden: false,
};

export default function ManageMenuPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<Array<{ name: string; path: string }>>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [selectedImagePath, setSelectedImagePath] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MenuItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileHover, setFileHover] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const rightCardRef = useRef<HTMLDivElement | null>(null);
  const [matchedHeightPx, setMatchedHeightPx] = useState<number | null>(null);

  const loadMenuItems = async () => {
    // noop - replaced by throttled loader below
    return loadMenuItemsThrottled();
  };

  const lastLoadedRef = useRef<number>(0);
  const MIN_RELOAD_MS = 15_000; // 15 seconds

  const loadMenuItemsThrottled = async (force = false) => {
    try {
      if (!force && Date.now() - (lastLoadedRef.current || 0) < MIN_RELOAD_MS) {
        // recently loaded — skip to avoid reloads on visibility/tab change
        return;
      }
      lastLoadedRef.current = Date.now();
      setLoading(true);
      setError(null);
      const { data, error: loadError } = await supabase
        .from("menu")
        .select("id, flavour, description, ingredients, image_path, hidden")
        .order("flavour", { ascending: true });

      if (loadError) throw loadError;
      setMenuItems((data as MenuItem[]) || []);
    } catch (err: unknown) {
      console.error("Failed to load menu items", err);
      const message = err instanceof Error ? err.message : "Failed to load menu items.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const loadImageFiles = async () => {
    try {
      setImageLoading(true);
      setImageError(null);
      const response = await fetch("/api/cookies-images", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load images.");
      }
      const payload = (await response.json()) as { images: Array<{ name: string; path: string }> };
      setImageFiles(payload.images || []);
    } catch (err: unknown) {
      console.error("Failed to load images", err);
      const message = err instanceof Error ? err.message : "Failed to load images.";
      setImageError(message);
    } finally {
      setImageLoading(false);
    }
  };

  const handleSelectImage = (path: string) => {
    setSelectedImagePath(path);
    setForm((prev) => ({ ...prev, image_path: path }));
  };

  const handleUploadImage = async (file?: File | null) => {
    const fileToSend = file ?? fileToUpload;
    if (!fileToSend) {
      setUploadError("Choose an image to upload.");
      return;
    }
    try {
      setUploading(true);
      setUploadError(null);
      const formData = new FormData();
      formData.append("file", fileToSend);
      const response = await fetch("/api/cookies-images/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload failed.");
      }
      const payload = (await response.json()) as { path: string };
      await loadImageFiles();
      handleSelectImage(payload.path);
      setFileToUpload(null);
      setSelectedFileName("");
    } catch (err: unknown) {
      console.error("Image upload failed", err);
      const message = err instanceof Error ? err.message : "Image upload failed.";
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (path: string) => {
    const name = path.split("/").pop();
    if (!name) return;
    const confirmed = window.confirm(`Delete image ${name}?`);
    if (!confirmed) return;
    try {
      setImageError(null);
      const response = await fetch(`/api/cookies-images?name=${encodeURIComponent(name)}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete image.");
      }
      await loadImageFiles();
      if (form.image_path === path) {
        setForm((prev) => ({ ...prev, image_path: "" }));
        setSelectedImagePath("");
      }
    } catch (err: unknown) {
      console.error("Failed to delete image", err);
      const message = err instanceof Error ? err.message : "Failed to delete image.";
      setImageError(message);
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const hasSession = Boolean(data.session);
      setIsAdmin(hasSession);
      if (hasSession) {
        loadMenuItems();
        loadImageFiles();
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const hasSession = Boolean(session);
      setIsAdmin(hasSession);
      if (hasSession) {
        loadMenuItems();
        loadImageFiles();
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  useLayoutEffect(() => {
    const measure = () => {
      const el = rightCardRef.current;
      if (!el) return setMatchedHeightPx((prev) => prev ?? null);
      const h = el.clientHeight;
      setMatchedHeightPx(h || null);
    };

    // measure after layout
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [menuItems.length, isAdmin, imageFiles.length, selectedImagePath, uploading]);

  const leftInnerMaxHeight = matchedHeightPx ? matchedHeightPx : null;

  const handleAddItem = async () => {
    if (!form.flavour.trim()) {
      setError("Flavour name is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = {
        flavour: form.flavour.trim(),
        description: form.description.trim() || null,
        ingredients: form.ingredients.trim() || null,
        image_path: form.image_path.trim() || null,
        hidden: Boolean(form.hidden),
      };

      const { data, error: insertError } = await supabase
        .from("menu")
        .insert(payload)
        .select("id, flavour, description, ingredients, image_path, hidden")
        .single();

      if (insertError) throw insertError;

      setMenuItems((prev) => {
        const next = [data as MenuItem, ...prev];
        return next.sort((a, b) => a.flavour.localeCompare(b.flavour));
      });
      setForm({ ...emptyForm });
      setSelectedImagePath("");
    } catch (err: unknown) {
      console.error("Failed to add menu item", err);
      const message = err instanceof Error ? err.message : "Failed to add menu item.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleHidden = async (item: MenuItem) => {
    try {
      setError(null);
      const { data, error: updateError } = await supabase
        .from("menu")
        .update({ hidden: !item.hidden })
        .eq("id", item.id)
        .select("id, flavour, description, ingredients, image_path, hidden")
        .single();

      if (updateError) throw updateError;

      setMenuItems((prev) => prev.map((i) => (i.id === item.id ? (data as MenuItem) : i)));
    } catch (err: unknown) {
      console.error("Failed to update menu item", err);
      const message = err instanceof Error ? err.message : "Failed to update menu item.";
      setError(message);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    // Open confirmation modal
    setPendingDelete(item);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const item = pendingDelete;
    try {
      setError(null);
      // Resolve the menu id for this flavour and null any order_items.flavour_id that reference it
      const { data: menuRow, error: menuFetchErr } = await supabase.from("menu").select("id").eq("flavour", item.flavour).maybeSingle();
      if (menuFetchErr) throw menuFetchErr;

      if (menuRow && menuRow.id) {
        const { error: orderUpdateError } = await supabase
          .from("order_items")
          .update({ flavour_id: null })
          .eq("flavour_id", menuRow.id);
        if (orderUpdateError) throw orderUpdateError;
      }

      const { error: deleteError } = await supabase
        .from("menu")
        .delete()
        .eq("id", item.id);

      if (deleteError) throw deleteError;

      setMenuItems((prev) => prev.filter((i) => i.id !== item.id));
      setPendingDelete(null);
    } catch (err: unknown) {
      console.error("Failed to delete menu item", err);
      const message = err instanceof Error ? err.message : "Failed to remove menu item.";
      setError(message);
      setPendingDelete(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5e6d3", padding: "0.5rem" }}>
      <Navbar isAdmin={isAdmin} />

      <div style={{ paddingTop: "6rem", paddingBottom: "3rem" }}>
        <div style={{ width: "100%", maxWidth: 1100, margin: "0 auto", padding: "0 1.25rem" }}>

          {!isAdmin && !loading && (
            <Card style={{ marginTop: "1.5rem", borderRadius: "1rem" }}>
              <CardContent style={{ padding: "1.5rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Admin access required</h2>
                <p style={{ marginTop: "0.5rem", color: "#64748b" }}>Please log in to manage the menu.</p>
                <Button style={{ marginTop: "0.75rem" }} onClick={() => router.push("/login")}>Go to login</Button>
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "1.75rem", flexWrap: "wrap" }}>
              <Card style={{ flex: "1 1 520px", borderRadius: "1rem", alignSelf: "flex-start", maxHeight: matchedHeightPx ? `${matchedHeightPx}px` : "min(55vh,520px)", overflow: "hidden", boxShadow: "0 14px 50px rgba(2,6,23,0.06)", border: "1px solid rgba(2,6,23,0.04)" }}>
                <CardContent style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Menu Items</h2>
                    <span style={{ color: "#64748b", fontSize: 13 }}>{menuItems.length} items</span>
                  </div>

                  {error && (
                    <div style={{ marginTop: "0.75rem", color: "#b91c1c", fontSize: 14 }}>{error}</div>
                  )}

                  {loading ? (
                    <div style={{ marginTop: "1rem", color: "#64748b" }}>Loading menu items…</div>
                  ) : menuItems.length === 0 ? (
                    <div style={{ marginTop: "1rem", color: "#64748b" }}>No menu items yet.</div>
                  ) : (
                    <div style={{ marginTop: "0.85rem", position: "relative" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", maxHeight: leftInnerMaxHeight ? `${leftInnerMaxHeight}px` : "min(55vh,520px)", overflowY: "auto", paddingRight: 6, paddingBottom: 128 }}>
                                {menuItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="menu-item-card"
                                    style={{
                                      border: "1px solid rgba(2,6,23,0.06)",
                                      borderRadius: 14,
                                      padding: "0.85rem",
                                      background: "#faf8f5",
                                      display: "flex",
                                      gap: "0.85rem",
                                      alignItems: "flex-start",
                                            boxShadow: "0 8px 22px rgba(2,6,23,0.06)",
                                          }}
                                  >
                          <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", background: "#f1f5f9", flex: "0 0 64px" }}>
                            {item.image_path ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.image_path} alt={item.flavour} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                                {item.flavour[0]}
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="menu-item-header" style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                              <div>
                                <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.flavour}</div>
                                <div style={{ color: "#475569", fontSize: "0.9rem", marginTop: 4 }}>
                                  {item.description || "No description"}
                                </div>
                              </div>
                              <div className="menu-item-actions" style={{ display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "flex-end" }}>
                                <span style={{
                                  fontSize: 12,
                                  padding: "0.2rem 0.55rem",
                                  borderRadius: 999,
                                  background: item.hidden ? "#fde2e2" : "#dcfce7",
                                  color: item.hidden ? "#991b1b" : "#166534",
                                  fontWeight: 700,
                                }}>
                                  {item.hidden ? "Hidden" : "Visible"}
                                </span>
                                <div style={{ display: "flex", gap: "0.4rem" }}>
                                  <Button size="sm" variant="outline" onClick={() => handleToggleHidden(item)}>
                                    {item.hidden ? "Show" : "Hide"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleDelete(item)}
                                    variant="destructive"
                                    className="bg-red-600 text-white hover:bg-red-700"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            </div>
                            {item.ingredients && (
                              <div style={{ marginTop: 8, color: "#64748b", fontSize: "0.85rem" }}>
                                Ingredients: {item.ingredients}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      aria-hidden
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 12,
                        bottom: 0,
                        height: 32,
                        background: "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.75))",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                  )}
                </CardContent>
              </Card>

              <div ref={rightCardRef} style={{ flex: "1 1 320px" }}>
                <Card style={{ flex: "1 1 320px", borderRadius: "1rem", alignSelf: "flex-start", boxShadow: "0 14px 50px rgba(2,6,23,0.06)", border: "1px solid rgba(2,6,23,0.04)" }}>
                  <CardContent style={{ padding: "1.5rem" }}>
                  <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Add new item</h2>
                  <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    <div>
                      <Label>Flavour *</Label>
                      <Input
                        value={form.flavour}
                        onChange={(e) => setForm((prev) => ({ ...prev, flavour: e.target.value }))}
                        placeholder="Chocolate Chip"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        placeholder="Short description"
                        style={{
                          width: "100%",
                          padding: "0.6rem 0.75rem",
                          borderRadius: "0.6rem",
                          border: "1px solid rgba(15,23,42,0.1)",
                          resize: "vertical",
                          fontSize: "0.95rem",
                        }}
                      />
                    </div>
                    <div>
                      <Label>Ingredients</Label>
                      <textarea
                        value={form.ingredients}
                        onChange={(e) => setForm((prev) => ({ ...prev, ingredients: e.target.value }))}
                        rows={3}
                        placeholder="Flour, Sugar, Butter"
                        style={{
                          width: "100%",
                          padding: "0.6rem 0.75rem",
                          borderRadius: "0.6rem",
                          border: "1px solid rgba(15,23,42,0.1)",
                          resize: "vertical",
                          fontSize: "0.95rem",
                        }}
                      />
                    </div>
                    <div>
                      <Label>Image</Label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                        <div style={{ fontSize: 13, color: "#475569" }}>
                          Upload a new image to <strong>/public/cookies</strong>, or pick one that already exists.
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <input
                            ref={(el) => { fileInputRef.current = el; }}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={async (e) => {
                              const f = e.target.files?.[0] ?? null;
                              setFileToUpload(f);
                              setSelectedFileName(f ? f.name : "");
                              if (f) await handleUploadImage(f);
                            }}
                          />

                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                            onMouseEnter={() => setFileHover(true)}
                            onMouseLeave={() => setFileHover(false)}
                            style={{
                              padding: '0.75rem',
                              borderRadius: 8,
                              border: '1px dashed rgba(15,23,42,0.08)',
                              background: fileHover ? 'rgba(6,182,212,0.06)' : 'transparent',
                              cursor: 'pointer',
                              color: '#0f172a',
                            }}
                          >
                            {selectedFileName ? `Selected: ${selectedFileName}` : (uploading ? 'Uploading...' : 'Choose file (click to pick an image)')}
                          </div>

                          {uploadError && <div style={{ color: "#b91c1c", fontSize: 13 }}>{uploadError}</div>}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <div style={{ fontSize: 13, color: "#475569" }}>Select from existing images:</div>
                          {imageLoading ? (
                            <div style={{ color: "#64748b", fontSize: 13 }}>Loading images…</div>
                          ) : imageFiles.length === 0 ? (
                            <div style={{ color: "#64748b", fontSize: 13 }}>No images found in /public/cookies</div>
                          ) : (
                            <select
                              value={selectedImagePath}
                              onChange={(e) => handleSelectImage(e.target.value)}
                              style={{ padding: "0.5rem", borderRadius: 8, border: "1px solid rgba(15,23,42,0.1)" }}
                            >
                              <option value="">Select an image</option>
                              {imageFiles.map((img) => (
                                <option key={img.path} value={img.path}>{img.name}</option>
                              ))}
                            </select>
                          )}
                          {imageError && <div style={{ color: "#b91c1c", fontSize: 13 }}>{imageError}</div>}
                          {selectedImagePath && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                              <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", background: "#f1f5f9" }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={selectedImagePath} alt="Selected" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    className="bg-red-600 text-white hover:bg-red-700"
                                    onClick={() => handleDeleteImage(selectedImagePath)}
                                  >
                                    Delete image
                                  </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#0f172a" }}>
                      <input
                        type="checkbox"
                        checked={form.hidden}
                        onChange={(e) => setForm((prev) => ({ ...prev, hidden: e.target.checked }))}
                      />
                      Hide from order sheet
                    </label>
                    {
                      (() => {
                        const canAdd = Boolean(form.flavour && form.flavour.trim().length > 0) && !saving;
                        const enabledStyle: React.CSSProperties = { background: "linear-gradient(90deg,#5b21b6,#06b6d4)", color: "white", fontWeight: 700, cursor: 'pointer' };
                        const disabledStyle: React.CSSProperties = { background: "#e6eaf2", color: "#94a3b8", fontWeight: 700, cursor: 'not-allowed' };
                        return (
                          <Button onClick={handleAddItem} disabled={!canAdd} style={canAdd ? enabledStyle : disabledStyle}>
                            {saving ? "Saving..." : "Add menu item"}
                          </Button>
                        );
                      })()
                    }
                  </div>
                </CardContent>
              </Card>
              </div>
                <ConfirmModal
                  open={Boolean(pendingDelete)}
                  title={pendingDelete ? `Remove ${pendingDelete.flavour}?` : "Remove item"}
                  description={"Warning: any orders that use this item will be updated and the flavour will be set to null."}
                  confirmLabel="Remove item"
                  cancelLabel="Cancel"
                  onConfirm={confirmDelete}
                  onClose={() => setPendingDelete(null)}
                />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

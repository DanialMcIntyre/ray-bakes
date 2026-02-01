"use client";

import { useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import Navbar from "@/components/ui/navbar";
import flavoursList from "@/lib/flavours";

export default function HomePage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<{ name: string; desc?: string; ingredients?: string; image?: string } | null>(null);
  const flavours = flavoursList;
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const HoverButton: React.FC<React.PropsWithChildren<{ onClick?: () => void; style?: React.CSSProperties }>> = ({ children, onClick, style }) => {
    const [hover, setHover] = useState(false);
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          transition: 'transform 0.12s, box-shadow 0.12s',
          transform: hover ? 'translateY(-3px)' : 'translateY(0)',
          boxShadow: hover ? '0 10px 30px rgba(2,6,23,0.12)' : undefined,
          cursor: 'pointer',
          ...(style || {}),
        }}
      >
        {children}
      </button>
    );
  };

  const FlavourCard: React.FC<{ f: { flavour: string; description?: string; ingredients?: string }; onClick: (f: any) => void }> = ({ f, onClick }) => {
    const [hover, setHover] = useState(false);
    return (
      <div
        onClick={() => onClick(f)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          minWidth: 280,
          minHeight: 120,
          background: 'white',
          padding: '1.25rem',
          borderRadius: 14,
          boxShadow: hover ? '0 14px 34px rgba(2,6,23,0.12)' : '0 8px 20px rgba(2,6,23,0.04)',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          cursor: 'pointer',
          transition: 'box-shadow 0.12s, transform 0.12s',
          transform: hover ? 'translateY(-4px)' : 'translateY(0)'
        }}
      >
        <div style={{ width: 84, height: 84, borderRadius: 12, background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20 }}>{(f.flavour || '')[0]}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 18 }}>{f.flavour}</div>
          <div style={{ color: '#475569', fontSize: '0.95rem', marginTop: 6 }}>{f.description ?? ''}</div>
        </div>
      </div>
    );
  };

  const openModal = (f: { flavour: string; description?: string; ingredients?: string }) => {
    setSelected({ name: f.flavour, desc: f.description, ingredients: f.ingredients, image: (f as any).image });
    setModalOpen(true);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      setCanScrollLeft(el.scrollLeft > 8);
      setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 8);
    };
    check();
    window.addEventListener('resize', check);
    el.addEventListener('scroll', check);
    return () => {
      window.removeEventListener('resize', check);
      el.removeEventListener('scroll', check);
    };
  }, [flavours]);
  return (
    <div style={{ minHeight: "100vh", backgroundColor: 'var(--page-bg)' }}>
      <Navbar />

      <header style={{ padding: "6.5rem 1.25rem 2rem", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 1100, borderRadius: 16, overflow: "visible", boxShadow: "0 12px 30px rgba(2,6,23,0.08)", background: "linear-gradient(135deg,#f8fbff 0%, #ffffff 40%, #e6f9ff 100%)", padding: "2.25rem" }}>
          <div style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 380px", minWidth: 280, overflow: "visible" }}>
              <h2 style={{ fontSize: "2rem", margin: 0, color: "#402b2c" }}>Fresh cookies, made to order</h2>
              <p style={{ marginTop: "0.75rem", color: "#374151", fontSize: "1rem", maxWidth: 560 }}>Small-batch, hand-decorated cookies baked daily. Browse flavours, choose sizes, and schedule a pickup — it’s that simple.</p>

              <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <HoverButton onClick={() => router.push('/order')} style={{ background: "linear-gradient(90deg,#6366f1,#06b6d4)", color: "white", padding: "0.6rem 1rem", borderRadius: 12, border: "none", fontWeight: 700, boxShadow: "0 6px 12px rgba(6,182,212,0.12)", zIndex: 2 }}>Order Now</HoverButton>
                  <HoverButton onClick={() => router.push('/order')} style={{ background: "transparent", border: "1px solid rgba(15,23,42,0.06)", padding: "0.55rem 0.9rem", borderRadius: 12, fontWeight: 600 }}>See Menu</HoverButton>
              </div>
            </div>

            <div style={{ flex: "0 0 320px", display: "grid", gridTemplateColumns: "1fr", gap: "0.75rem" }}>
              <div style={{ height: 140, borderRadius: 12, background: "#fff url('/cookies/cookies1.jpg') center/cover no-repeat", boxShadow: "0 8px 20px rgba(2,6,23,0.06)" }} />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ flex: 1, height: 70, borderRadius: 10, background: "#fff url('/cookies/cookies2.jpg') center/cover no-repeat", boxShadow: "0 6px 16px rgba(2,6,23,0.06)" }} />
                <div style={{ flex: 1, height: 70, borderRadius: 10, background: "#fff url('/cookies/cookies3.jpeg') center/cover no-repeat", boxShadow: "0 6px 16px rgba(2,6,23,0.06)" }} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ padding: "1rem 1.25rem 3rem" }}>
        <div style={{ width: "100%", maxWidth: 1100, margin: "0 auto" }}>
          <section style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 0.25rem 0", color: "#0f172a", fontSize: '1.25rem', letterSpacing: '0.2px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'inline-block', padding: '0.35rem 0.8rem', background: '#fde68a', borderRadius: 10, fontSize: '0.95rem', color: '#92400e', fontWeight: 800 }}>Menu</span>
              <span style={{ color: '#0f172a', fontWeight: 800, fontSize: 18 }}>All Flavours</span>
            </h3>
            <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 12 }}>Tap a card to view full details and ingredients</div>

            <div style={{ position: 'relative' }}>
              {/* scroll container and indicators */}
              <div
                ref={scrollRef}
                style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '0.5rem 0', scrollBehavior: 'smooth' }}
                onScroll={() => {
                  const el = scrollRef.current;
                  if (!el) return;
                  setCanScrollLeft(el.scrollLeft > 8);
                  setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 8);
                }}
              >
                {flavours.map((f) => (
                <div
                  key={f.flavour}
                  onClick={() => openModal(f)}
                  style={{
                    width: 360,
                    height: 160,
                    background: 'white',
                    padding: '1.25rem',
                    borderRadius: 14,
                    boxShadow: '0 8px 20px rgba(2,6,23,0.04)',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.12s, transform 0.12s',
                    flex: '0 0 auto',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <div style={{ width: 120, height: 120, borderRadius: 12, overflow: 'hidden', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {f.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.image} alt={f.flavour} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ fontWeight: 700, fontSize: 28 }}>{(f.flavour || '')[0]}</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 18 }}>{f.flavour}</div>
                    <div style={{ color: '#475569', fontSize: '1rem', marginTop: 8, maxHeight: 64, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.description}</div>
                  </div>
                </div>
              ))}
              </div>

              {/* left gradient + chevron (always visible, dim when not scrollable) */}
              <>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 56, pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(230,249,255,1), rgba(230,249,255,0))', opacity: canScrollLeft ? 1 : 0.35 }} />
                <button
                  aria-label="Scroll left"
                  aria-disabled={!canScrollLeft}
                  onClick={() => {
                    const el = scrollRef.current;
                    if (!el || !canScrollLeft) return;
                    el.scrollBy({ left: -320, behavior: 'smooth' });
                    setTimeout(() => {
                      setCanScrollLeft(el.scrollLeft > 8);
                      setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 8);
                    }, 300);
                  }}
                  style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 10, border: 'none', background: 'white', width: 36, height: 36, borderRadius: 999, boxShadow: '0 6px 16px rgba(2,6,23,0.12)', cursor: canScrollLeft ? 'pointer' : 'default', opacity: canScrollLeft ? 1 : 0.45 }}
                >
                  ‹
                </button>
              </>

              {/* right gradient + chevron (always visible, dim when not scrollable) */}
              <>
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 56, pointerEvents: 'none', background: 'linear-gradient(270deg, rgba(230,249,255,1), rgba(230,249,255,0))', opacity: canScrollRight ? 1 : 0.35 }} />
                <button
                  aria-label="Scroll right"
                  aria-disabled={!canScrollRight}
                  onClick={() => {
                    const el = scrollRef.current;
                    if (!el || !canScrollRight) return;
                    el.scrollBy({ left: 320, behavior: 'smooth' });
                    setTimeout(() => {
                      setCanScrollLeft(el.scrollLeft > 8);
                      setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 8);
                    }, 300);
                  }}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 10, border: 'none', background: 'white', width: 36, height: 36, borderRadius: 999, boxShadow: '0 6px 16px rgba(2,6,23,0.12)', cursor: canScrollRight ? 'pointer' : 'default', opacity: canScrollRight ? 1 : 0.45 }}
                >
                  ›
                </button>
              </>
            </div>
          </section>
            {modalOpen && selected && (
              <div
                style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(3px)' }}
                onClick={() => setModalOpen(false)}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ background: 'white', padding: '0', borderRadius: 16, width: 'min(920px, 96vw)', boxShadow: '0 30px 60px rgba(2,6,23,0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'row', backgroundClip: 'padding-box' }}
                >
                  <div
                    style={{
                      width: 320,
                      minWidth: 240,
                      minHeight: 420,
                      backgroundColor: '#f9fafb',
                      display: 'flex',
                      alignItems: 'stretch',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selected.image ?? '/cookies/birthday.jpg'}
                      alt={selected.name}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>

                  <div style={{ padding: '1.25rem 1.5rem', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: 22, color: '#0f172a', fontWeight: 800 }}>{selected.name}</h2>
                        <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Full details</div>
                      </div>
                      <button
                        onClick={() => setModalOpen(false)}
                        style={{ border: 'none', background: '#f3f4f6', width: 40, height: 40, borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}
                        onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.background = '#e9eefb'; }}
                        onMouseLeave={(e: any) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#f3f4f6'; }}
                      >
                        ×
                      </button>
                    </div>

                    <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(2,6,23,0.06), transparent)', margin: '12px 0' }} />

                    <p style={{ color: '#374151', lineHeight: 1.6, marginBottom: 12 }}>{selected.desc}</p>

                    {selected.ingredients && (
                      <div style={{ marginTop: 6 }}>
                        <strong style={{ display: 'block', marginBottom: 8, color: '#0f172a' }}>Ingredients</strong>
                        <ul style={{ margin: 0, paddingLeft: 18, color: '#475569' }}>
                          {selected.ingredients.split(',').map((ing, i) => (
                            <li key={i} style={{ marginBottom: 6 }}>{ing.trim()}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          {/* removed 'Why choose Rays?' per UI update; show CTA button */}
          {/* Removed bottom CTA per request */}
        </div>
      </main>

          <footer style={{ borderTop: "1px solid rgba(2,6,23,0.04)", padding: "1rem", marginTop: "2rem" }}>
        <div style={{ width: "100%", maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#475569" }}>
          <div>© {new Date().getFullYear()} Rays Cookies</div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <a href="#" style={{ color: "#475569", textDecoration: "none" }}>Contact</a>
            <a href="#" style={{ color: "#475569", textDecoration: "none" }}>Report Issues</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

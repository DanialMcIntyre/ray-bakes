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
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [showContactPopup, setShowContactPopup] = useState(false);

  const HoverButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, onClick, style, className, ...rest }) => {
    const [hover, setHover] = useState(false);
    return (
      <button
        {...rest}
        onClick={onClick}
        className={className}
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
    <div className="page-with-fixed-nav" style={{ minHeight: "100vh", backgroundColor: 'var(--page-bg)' }}>
      <Navbar />

      <header className="hero" style={{ padding: "2.25rem 1.25rem 1rem", display: "flex", justifyContent: "center" }}>
        <div className="hero-card" style={{ width: "100%", maxWidth: 1100, borderRadius: 16, overflow: "hidden", boxShadow: "0 12px 30px rgba(2,6,23,0.08)", background: "linear-gradient(135deg,#f8fbff 0%, #ffffff 40%, #e6f9ff 100%)", padding: "1.5rem" }}>
          <div
            className="hero-grid"
            style={{
              display: 'flex',
              gap: '2rem',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap'
            }}
          >
            <div className="hero-copy" style={{ minWidth: 0, flex: '1 1 480px', overflow: 'visible' }}>
              <h2 style={{ fontSize: '3rem', lineHeight: 1.03, margin: 0, color: '#402b2c', fontWeight: 800 }}>Fresh cookies, made to order</h2>
              <p style={{ marginTop: '0.8rem', color: '#374151', fontSize: '1.125rem', maxWidth: 560 }}>Small-batch, hand-decorated cookies baked daily. Browse flavours, choose sizes, and schedule a pickup — it’s that simple.</p>

              <div style={{ marginTop: '1.6rem', display: 'flex', gap: '0.9rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <HoverButton className="cta-primary" onClick={() => router.push('/order')} style={{ background: 'linear-gradient(90deg,#5b21b6,#06b6d4)', color: 'white', padding: '0.9rem 1.25rem', borderRadius: 999, border: 'none', fontWeight: 800, fontSize: 16, boxShadow: '0 12px 30px rgba(6,182,212,0.12)', zIndex: 2 }}>Order Now</HoverButton>
                <HoverButton className="cta-secondary" onClick={() => {
                  const el = document.getElementById('menu-section');
                    if (el) {
                      const nav = document.querySelector('nav');
                      const navRect = nav ? (nav as HTMLElement).getBoundingClientRect() : null;
                      const navBottom = navRect ? navRect.bottom : ((nav && (nav as HTMLElement).offsetHeight) || 72);
                      const extraOffset = 8;
                      const y = el.getBoundingClientRect().top + window.scrollY - navBottom - extraOffset;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                      el.classList.add('highlight');
                      window.setTimeout(() => el.classList.remove('highlight'), 2400);
                  }
                }} style={{ background: 'white', border: '1px solid rgba(15,23,42,0.06)', padding: '0.7rem 1rem', borderRadius: 999, fontWeight: 700 }}>See Menu</HoverButton>
              </div>
            </div>

            <div className="hero-media" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: '0 0 420px', alignItems: 'flex-end' }}>
              <div className="hero-tile hero-tile--large" style={{ width: 420, height: 220, borderRadius: 14, overflow: 'hidden', boxShadow: '0 12px 34px rgba(2,6,23,0.08)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/cookies/cookies1.jpg" alt="cookies" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.85rem', width: 420 }}>
                <div className="hero-tile hero-tile--small" style={{ width: '50%', height: 96, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/cookies/cookies2.jpg" alt="cookies" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div className="hero-tile hero-tile--small" style={{ width: '50%', height: 96, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/cookies/cookies3.jpeg" alt="cookies" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ padding: "1rem 1.25rem 1.25rem" }}>
        <div style={{ width: "100%", maxWidth: 1100, margin: "0 auto" }}>
          <section id="menu-section" style={{ marginBottom: "0.75rem" }}>
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
                className="flavour-modal"
                style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(3px)' }}
                onClick={() => setModalOpen(false)}
              >
                <div
                  className="flavour-modal-card"
                  onClick={(e) => e.stopPropagation()}
                  style={{ background: 'white', padding: '0', borderRadius: 16, width: 'min(820px, 90vw)', boxShadow: '0 30px 60px rgba(2,6,23,0.18)', overflow: 'hidden', backgroundClip: 'padding-box' }}
                >
                  <div
                    className="flavour-modal-media"
                    style={{
                      width: '100%',
                      minHeight: 480,
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

                  <div className="flavour-modal-body" style={{ padding: '1.25rem 1.5rem', flex: 1 }}>
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

        </div>
      </main>

          <footer style={{ borderTop: "1px solid rgba(2,6,23,0.04)", padding: "1rem", marginTop: "1rem" }}>
        <div style={{ width: "100%", maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#475569" }}>
          <div>© {new Date().getFullYear()} Ray's Cookies</div>
          <div style={{ display: "flex", gap: "1rem" }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowContactPopup(true);
                  }}
                  style={{ color: "#475569", textDecoration: "none" }}
                >
                  Contact
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowReportPopup(true);
                  }}
                  style={{ color: "#475569", textDecoration: "none" }}
                >
                  Report Issues
                </a>
          </div>
        </div>
      </footer>

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
    </div>
  );
}

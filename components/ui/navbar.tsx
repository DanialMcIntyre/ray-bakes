"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface NavbarProps {
  isAdmin?: boolean;
  children?: React.ReactNode;
}

export default function Navbar({ isAdmin = false, children }: NavbarProps) {
  const router = useRouter();
  const [sessionIsPresent, setSessionIsPresent] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname?.() ?? "";

  useEffect(() => {
    let mounted = true;
    // check current session
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSessionIsPresent(Boolean(data.session));
    });

    // listen for changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionIsPresent(Boolean(session));
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const linkStyle: React.CSSProperties = {
    backgroundColor: "transparent",
    border: "none",
    color: "white",
    padding: "0 0.45rem",
    borderRadius: 0,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "16px",
    lineHeight: 1,
    letterSpacing: "0.2px",
    transition: "font-weight 0.12s",
    boxShadow: "none",
    height: "100%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const primaryLinkStyle: React.CSSProperties = { ...linkStyle, fontWeight: 600 };
  const neutralLinkStyle: React.CSSProperties = { ...linkStyle, fontWeight: 600 };

  const hoverStyle: React.CSSProperties = { fontWeight: 800 };
  const activeStyle: React.CSSProperties = { fontWeight: 800 };

  const styleObjToCss = (styleObj: Record<string, any>) => {
    const toKebab = (s: string) => s.replace(/([A-Z])/g, "-$1").toLowerCase();
    const unitless = new Set(["opacity", "z-index", "font-weight", "line-height", "flex"]);
    return Object.entries(styleObj)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => {
        let value: any = v;
        const key = toKebab(k);
        if (typeof value === "number" && !unitless.has(key)) value = `${value}px`;
        return `${key}: ${value}`;
      })
      .join("; ");
  };

  const normalizeStyle = (styleObj?: Record<string, any>) => {
    if (!styleObj) return {};
    const s: Record<string, any> = { ...styleObj };
    if (s.background !== undefined && s.backgroundColor === undefined) {
      s.backgroundColor = s.background;
      delete s.background;
    }
    return s;
  };

  const getOriginal = (el: HTMLElement) => el.dataset.originalStyle ?? "";
  const storeOriginal = (el: HTMLElement, styleObj: Record<string, any>) => (el.dataset.originalStyle = styleObjToCss(styleObj || {}));

  const applyHover = (el: HTMLElement) => {
    const orig = getOriginal(el);
    const css = styleObjToCss(hoverStyle as any);
    el.style.cssText = [orig, css].filter(Boolean).join("; ");
  };
  const applyLeave = (el: HTMLElement) => (el.style.cssText = getOriginal(el));
  const applyDown = (el: HTMLElement) => {
    const orig = getOriginal(el);
    const css = styleObjToCss(activeStyle as any);
    el.style.cssText = [orig, css].filter(Boolean).join("; ");
  };
  const applyUp = (el: HTMLElement) => applyHover(el);

  const renderActions = (mobile = false) => {
    if (children) {
      return React.Children.toArray(children).map((child) => {
        if (!React.isValidElement(child)) return child;
        const element = child as React.ReactElement<any, any>;
        const childProps: any = element.props || {};
        const label = String(childProps?.children ?? "").toLowerCase();
        const baseStyle = label.includes("order") ? primaryLinkStyle : neutralLinkStyle;
        const merged = { ...baseStyle, ...(childProps.style ? normalizeStyle(childProps.style) : {}) } as Record<string, any>;

        // Mobile adjustments: make actions block-level and full width
        if (mobile) {
          merged.display = "block";
          merged.width = "100%";
          merged.padding = "0.7rem 0.9rem";
          merged.textAlign = "left";
          merged.backgroundColor = "transparent";
          merged.color = "#0f172a";
          merged.borderRadius = 8;
        }

        // Fragments cannot accept style props — render their children instead
        if (element.type === React.Fragment) {
          return React.Children.toArray(element.props.children).map((fc) => {
            if (!React.isValidElement(fc)) return fc;
            const fe = fc as React.ReactElement<any>;
            const fp: any = { ...fe.props };
            fp.style = { ...(fe.props.style || {}), ...(merged || {}) };
            if (!mobile) fp["data-original-style"] = styleObjToCss(fp.style || {});
            if (mobile) {
              const originalClick = fp.onClick;
              fp.onClick = (e: any) => {
                setIsMenuOpen(false);
                if (originalClick) originalClick(e);
              };
            }
            if (!mobile) {
              fp.onMouseEnter = (e: any) => {
                const el = e.currentTarget as HTMLElement;
                if (!el.dataset.originalStyle) storeOriginal(el, fp.style as any);
                applyHover(el);
              };
              fp.onMouseLeave = (e: any) => applyLeave(e.currentTarget as HTMLElement);
              fp.onMouseDown = (e: any) => {
                const el = e.currentTarget as HTMLElement;
                if (!el.dataset.originalStyle) storeOriginal(el, fp.style as any);
                applyDown(el);
              };
              fp.onMouseUp = (e: any) => applyUp(e.currentTarget as HTMLElement);
            }
            return React.cloneElement(fe, fp as any);
          });
        }

        const clonedProps: any = {};
        clonedProps.style = merged as React.CSSProperties;
        if (!mobile) clonedProps["data-original-style"] = styleObjToCss(merged as any);
        if (mobile) {
          const originalClick = childProps.onClick;
          clonedProps.onClick = (e: any) => {
            setIsMenuOpen(false);
            if (originalClick) originalClick(e);
          };
        }
        if (!mobile) {
          clonedProps.onMouseEnter = (e: any) => {
            const el = e.currentTarget as HTMLElement;
            if (!el.dataset.originalStyle) storeOriginal(el, merged as any);
            applyHover(el);
          };
          clonedProps.onMouseLeave = (e: any) => applyLeave(e.currentTarget as HTMLElement);
          clonedProps.onMouseDown = (e: any) => {
            const el = e.currentTarget as HTMLElement;
            if (!el.dataset.originalStyle) storeOriginal(el, merged as any);
            applyDown(el);
          };
          clonedProps.onMouseUp = (e: any) => applyUp(e.currentTarget as HTMLElement);
        }

        return React.cloneElement(element, clonedProps as any);
      });
    }

    // Default fallback actions when no children provided
    if (mobile) {
      return (
        <button onClick={() => { setIsMenuOpen(false); router.push('/order'); }} style={{ padding: '0.75rem 0.9rem', border: 'none', background: 'transparent', color: '#0f172a', borderRadius: 8, fontWeight: 700, textAlign: 'left', width: '100%' }}>
          Make Order
        </button>
      );
    }

    return (
      <>
        <button
          onClick={() => router.push('/order')}
          style={primaryLinkStyle}
          data-original-style={styleObjToCss(primaryLinkStyle as any)}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            if (!el.dataset.originalStyle) storeOriginal(el, primaryLinkStyle as any);
            applyHover(el);
          }}
          onMouseLeave={(e) => {
            applyLeave(e.currentTarget);
          }}
          onMouseDown={(e) => {
            const el = e.currentTarget as HTMLElement;
            if (!el.dataset.originalStyle) storeOriginal(el, primaryLinkStyle as any);
            applyDown(el);
          }}
          onMouseUp={(e) => applyUp(e.currentTarget)}
        >
          Make Order
        </button>
      </>
    );
  };

  return (
      <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "72px",
        backgroundColor: isAdmin ? "#8b6f47" : "#56baf2",
        color: "white",
        padding: "0 1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "stretch",
        zIndex: 1000,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", height: "100%" }}>
        <h1
          style={{ fontSize: "1.5rem", fontWeight: 800, cursor: "pointer", transition: "transform 0.15s", color: "white" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onClick={() => router.push("/home")}
        >
          🍪 Ray's Cookies
        </h1>
        {(isAdmin || sessionIsPresent) && (
          <span style={{ backgroundColor: "#402b2c", color: "#f5e6d3", padding: "0.25rem 0.65rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700 }}>
            ADMIN
          </span>
        )}
      </div>

      <div className="nav-actions" style={{ display: "flex", gap: "0.75rem", alignItems: "center", height: "100%" }}>
        {renderActions(false)}
        {((pathname === "/" || pathname === "/home") && (isAdmin || sessionIsPresent)) && (
          <button
            onClick={() => router.push("/admin")}
            style={neutralLinkStyle}
            data-original-style={styleObjToCss(neutralLinkStyle as any)}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              if (!el.dataset.originalStyle) storeOriginal(el, neutralLinkStyle as any);
              applyHover(el);
            }}
            onMouseLeave={(e) => applyLeave(e.currentTarget)}
            onMouseDown={(e) => {
              const el = e.currentTarget as HTMLElement;
              if (!el.dataset.originalStyle) storeOriginal(el, neutralLinkStyle as any);
              applyDown(el);
            }}
            onMouseUp={(e) => applyUp(e.currentTarget)}
          >
            Admin
          </button>
        )}
        {sessionIsPresent && (
          <button
            onClick={async () => {
              try {
                await supabase.auth.signOut();
              } finally {
                router.push('/login');
              }
            }}
            style={neutralLinkStyle}
            data-original-style={styleObjToCss(neutralLinkStyle as any)}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              if (!el.dataset.originalStyle) storeOriginal(el, neutralLinkStyle as any);
              applyHover(el);
            }}
            onMouseLeave={(e) => applyLeave(e.currentTarget)}
            onMouseDown={(e) => {
              const el = e.currentTarget as HTMLElement;
              if (!el.dataset.originalStyle) storeOriginal(el, neutralLinkStyle as any);
              applyDown(el);
            }}
            onMouseUp={(e) => applyUp(e.currentTarget)}
          >
            Logout
          </button>
        )}
      </div>
      <button
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setIsMenuOpen((s) => !s)}
        className="nav-toggle"
        style={{
          border: 'none',
          background: 'transparent',
          color: 'white',
          width: 44,
          height: 44,
          borderRadius: 8,
          cursor: 'pointer',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isMenuOpen ? '✕' : '☰'}
      </button>
      {isMenuOpen && (
        <div className="nav-drawer" role="dialog" aria-label="Navigation" style={{ position: 'fixed', top: 72, right: 12, left: 12, zIndex: 1100 }}>
          <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 12px 40px rgba(2,6,23,0.12)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem' }}>
              {renderActions(true)}
              {((pathname === '/' || pathname === '/home') && (isAdmin || sessionIsPresent)) && (
                <button onClick={() => { setIsMenuOpen(false); router.push('/admin'); }} style={{ padding: '0.75rem 0.9rem', border: 'none', background: 'transparent', color: '#0f172a', textAlign: 'left', borderRadius: 8, fontWeight: 700 }}>Admin</button>
              )}
              {sessionIsPresent && (
                <button onClick={async () => { setIsMenuOpen(false); try { await supabase.auth.signOut(); } finally { router.push('/login'); } }} style={{ padding: '0.75rem 0.9rem', border: 'none', background: 'transparent', color: '#0f172a', textAlign: 'left', borderRadius: 8, fontWeight: 700 }}>Logout</button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

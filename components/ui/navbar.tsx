"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface NavbarProps {
  isAdmin?: boolean;
  children?: React.ReactNode;
}

export default function Navbar({ isAdmin = false, children }: NavbarProps) {
  const router = useRouter();

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

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "56px",
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
          style={{ fontSize: "1.15rem", fontWeight: 800, cursor: "pointer", transition: "transform 0.15s", color: "white" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onClick={() => router.push("/home")}
        >
          🍪 Rays Cookies
        </h1>
        {isAdmin && (
          <span style={{ backgroundColor: "#402b2c", color: "#f5e6d3", padding: "0.25rem 0.65rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700 }}>
            ADMIN
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", height: "100%" }}>
        {children ? (
          React.Children.toArray(children).map((child) => {
            if (!React.isValidElement(child)) return child;
            const element = child as React.ReactElement<any, any>;
            const childProps: any = element.props || {};
            const label = String(childProps?.children ?? "").toLowerCase();
            const baseStyle = label.includes("order") ? primaryLinkStyle : neutralLinkStyle;
            const merged = { ...baseStyle, ...(childProps.style ? normalizeStyle(childProps.style) : {}) } as Record<string, any>;
            const originalCss = styleObjToCss(merged as any);
            const clonedProps: any = {
              style: (element.type === React.Fragment ? undefined : (merged as React.CSSProperties)),
              "data-original-style": originalCss,
              onMouseEnter: (e: any) => {
                const el = e.currentTarget as HTMLElement;
                if (!el.dataset.originalStyle) storeOriginal(el, merged as any);
                applyHover(el);
              },
              onMouseLeave: (e: any) => applyLeave(e.currentTarget as HTMLElement),
              onMouseDown: (e: any) => {
                const el = e.currentTarget as HTMLElement;
                if (!el.dataset.originalStyle) storeOriginal(el, merged as any);
                applyDown(el);
              },
              onMouseUp: (e: any) => applyUp(e.currentTarget as HTMLElement),
            };
            if (element.type === React.Fragment) {
              const fragChildren = React.Children.toArray(element.props.children).map((fc) => {
                if (!React.isValidElement(fc)) return fc;
                const fe = fc as React.ReactElement<any>;
                const fp = { ...fe.props };
                const childStyle = normalizeStyle({ ...(baseStyle as any), ...((fe.props.style as any) || {}) });
                fp.style = childStyle;
                fp["data-original-style"] = styleObjToCss(childStyle || {});
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
                return React.cloneElement(fe, fp as any);
              });
              return fragChildren;
            }

            return React.cloneElement(element, clonedProps as any);
          })
        ) : (
          <>
            <button
              onClick={() => router.push("/home")}
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
              Home
            </button>
            <button
              onClick={() => router.push("/order")}
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
        )}
      </div>
    </nav>
  );
}

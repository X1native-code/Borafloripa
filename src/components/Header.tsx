"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { Icon } from './Icon';

export const Header: React.FC = () => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const NAV = [
    { href: "/", label: "Inicio" },
    { href: "/search", label: "Tours" },
    { href: "/search?cat=traslados", label: "Traslados" },
    { href: "/search?cat=cultural", label: "Blog" },
    { href: "/about", label: "Bora nosotros" },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "rgba(247,241,227,0.85)",
        backdropFilter: "saturate(140%) blur(10px)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div className="wrap-wide" style={{ display: "flex", alignItems: "center", gap: 16, height: 72 }}>
        <Link href="/">
          <Logo size={22} />
        </Link>
        <nav style={{ display: "flex", gap: 24, marginLeft: 32 }} className="desktop-nav">
          {NAV.map(n => {
            // Check active based on pathname
            const active = pathname === n.href.split("?")[0];
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`nav-link ${active ? "active" : ""}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <button className="btn btn-ghost btn-sm" style={{ display: "inline-flex" }}>
            <Icon name="globe" size={14} /> ES
          </button>
          <Link href="/search" className="btn btn-coral btn-sm">
            Bora reservar
          </Link>
          <button className="mobile-only" onClick={() => setOpen(o => !o)} style={{ padding: 8 }}>
            <Icon name={open ? "close" : "menu"} size={22} />
          </button>
        </div>
      </div>
      {open && (
        <div
          className="mobile-only"
          style={{
            borderTop: "1px solid var(--line)",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            background: "var(--cream)"
          }}
        >
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              style={{
                padding: "12px 4px",
                borderBottom: "1px solid var(--line-soft)",
                fontSize: 16,
                fontWeight: 500
              }}
            >
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

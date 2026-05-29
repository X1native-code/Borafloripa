import React from 'react';

interface LogoProps {
  size?: number;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 24, color }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: color || "var(--ink)" }}>
    <svg width={size + 4} height={size + 4} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" fill="var(--coral)"/>
      <path d="M4 20c3-3 6-3 9 0s6 3 9 0 6-3 9 0" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      <circle cx="22" cy="11" r="2.6" fill="var(--sun)"/>
    </svg>
    <span className="display" style={{ fontSize: size, fontWeight: 700, letterSpacing: "-0.03em" }}>
      Bora<span style={{ color: "var(--coral)" }}>Floripa</span>
    </span>
  </div>
);

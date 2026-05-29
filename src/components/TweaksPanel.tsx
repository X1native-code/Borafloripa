"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTheme, PALETTES } from '../context/ThemeContext';

interface TweakSectionProps {
  label: string;
  children?: React.ReactNode;
}

export const TweakSection: React.FC<TweakSectionProps> = ({ label, children }) => (
  <>
    <div className="twk-sect">{label}</div>
    {children}
  </>
);

interface TweakRowProps {
  label: string;
  value?: string | number | null;
  children: React.ReactNode;
  inline?: boolean;
}

export const TweakRow: React.FC<TweakRowProps> = ({ label, value, children, inline = false }) => (
  <div className={inline ? 'twk-row twk-row-h' : 'twk-row'}>
    <div className="twk-lbl">
      <span>{label}</span>
      {value != null && <span className="twk-val">{value}</span>}
    </div>
    {children}
  </div>
);

interface TweakRadioProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: any) => void;
}

export const TweakRadio: React.FC<TweakRadioProps> = ({ label, value, options, onChange }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  const n = options.length;
  const idx = Math.max(0, options.indexOf(value));

  const segAt = (clientX: number) => {
    if (!trackRef.current) return value;
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor(((clientX - r.left - 2) / inner) * n);
    return options[Math.max(0, Math.min(n - 1, i))];
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    
    const move = (ev: PointerEvent) => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <TweakRow label={label}>
      <div
        ref={trackRef}
        role="radiogroup"
        onPointerDown={onPointerDown}
        className={dragging ? 'twk-seg dragging' : 'twk-seg'}
        style={{ touchAction: 'none' }}
      >
        <div
          className="twk-seg-thumb"
          style={{
            left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
            width: `calc((100% - 4px) / ${n})`
          }}
        />
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={o === value}
            onClick={() => onChange(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </TweakRow>
  );
};

interface TweakColorProps {
  label: string;
  value: string;
  options: string[][];
  onChange: (value: any, index: number) => void;
}

export const TweakColor: React.FC<TweakColorProps> = ({ label, value, options, onChange }) => {
  const key = (o: string[]) => String(JSON.stringify(o)).toLowerCase();
  
  // Find current index based on value
  const curIdx = options.findIndex(opt => opt[0].toLowerCase() === value.toLowerCase());
  
  return (
    <TweakRow label={label}>
      <div className="twk-chips" role="radiogroup">
        {options.map((colors, i) => {
          const [hero, ...rest] = colors;
          const sup = rest.slice(0, 4);
          const on = i === curIdx;
          
          // Simple luminosity calculator for checkmarks
          const isLight = (() => {
            const h = String(hero).replace('#', '');
            const x = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.padEnd(6, '0');
            const nVal = parseInt(x.slice(0, 6), 16);
            if (Number.isNaN(nVal)) return true;
            const r = (nVal >> 16) & 255, g = (nVal >> 8) & 255, b = nVal & 255;
            return r * 299 + g * 587 + b * 114 > 148000;
          })();

          return (
            <button
              key={i}
              type="button"
              className="twk-chip"
              role="radio"
              aria-checked={on}
              data-on={on ? '1' : '0'}
              title={colors.join(' · ')}
              style={{ background: hero }}
              onClick={() => onChange(colors, i)}
            >
              {sup.length > 0 && (
                <span>
                  {sup.map((c, j) => <i key={j} style={{ background: c }} />)}
                </span>
              )}
              {on && (
                <svg viewBox="0 0 14 14" aria-hidden="true" style={{ position: 'absolute', top: 6, left: 6, width: 13, height: 13 }}>
                  <path
                    d="M3 7.2 5.8 10 11 4.2"
                    fill="none"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke={isLight ? 'rgba(0,0,0,.78)' : '#fff'}
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </TweakRow>
  );
};

export const TweaksPanel: React.FC = () => {
  const { tweaks, setTweak } = useTheme();
  const [open, setOpen] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 16, y: 16 });
  const PAD = 16;

  const clampToViewport = useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);

  useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);

  // Set default keyboard trigger: toggle tweaks with Shift+T
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 't') {
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const onDragStart = (e: React.MouseEvent) => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    
    const move = (ev: MouseEvent) => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      };
      clampToViewport();
    };
    
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const paletteLabels: Record<string, string> = {
    tropical: "Tropical",
    sunset: "Atardecer",
    ocean: "Atlántico",
    jungle: "Mata atlántica",
  };

  // Static options for curated themes
  const colorOptions = useMemo(() => {
    return Object.keys(PALETTES).map(k => {
      const p = PALETTES[k as keyof typeof PALETTES];
      return [p.coral, p.ink, p.sun, p.cream];
    });
  }, []);

  return (
    <>
      {/* Floating Toggle Icon */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 45,
          background: 'var(--ink)',
          color: 'var(--cream)',
          padding: '12px 16px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        ⚙️ {!open ? 'Ver Tweaks' : 'Cerrar'}
      </button>

      {open && (
        <div
          ref={dragRef}
          className="twk-panel"
          data-noncommentable=""
          style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}
        >
          <div className="twk-hd" onMouseDown={onDragStart}>
            <b>Tweaks · Bora</b>
            <button className="twk-x" aria-label="Close tweaks" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="twk-body">
            <TweakSection label="Paleta" />
            <TweakColor
              label="Tema"
              value={PALETTES[tweaks.palette]?.coral}
              options={colorOptions}
              onChange={(_, index) => {
                const paletteKey = Object.keys(PALETTES)[index];
                setTweak('palette', paletteKey);
              }}
            />
            
            <div className="twk-row">
              <div className="twk-lbl"><span>Nombre</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {Object.keys(PALETTES).map(k => (
                  <button
                    key={k}
                    onClick={() => setTweak('palette', k)}
                    style={{
                      padding: "8px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                      background: tweaks.palette === k ? PALETTES[k as keyof typeof PALETTES].ink : "rgba(0,0,0,0.05)",
                      color: tweaks.palette === k ? PALETTES[k as keyof typeof PALETTES].cream : "#29261b",
                      textAlign: "left", border: 0,
                      cursor: "default",
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: PALETTES[k as keyof typeof PALETTES].coral,
                        boxShadow: `0 0 0 2px ${PALETTES[k as keyof typeof PALETTES].sun}`
                      }}
                    />
                    {paletteLabels[k]}
                  </button>
                ))}
              </div>
            </div>

            <TweakSection label="Tipografía" />
            <TweakRadio
              label="Display"
              value={tweaks.displayFont}
              options={["Bricolage Grotesque", "Instrument Serif", "Space Grotesk", "DM Serif Display"]}
              onChange={(v) => setTweak('displayFont', v)}
            />

            <TweakSection label="Layout" />
            <TweakRadio
              label="Densidad"
              value={tweaks.density}
              options={["cozy", "compact"]}
              onChange={(v) => setTweak('density', v)}
            />

            <TweakSection label="Social" />
            <TweakRadio
              label="Compartir"
              value={tweaks.shareEmphasis}
              options={["loud", "quiet"]}
              onChange={(v) => setTweak('shareEmphasis', v)}
            />
          </div>
        </div>
      )}
    </>
  );
};

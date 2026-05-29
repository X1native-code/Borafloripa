"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Photo } from './Photo';
import { Badge } from './Badge';
import { Stars } from './Stars';
import { Icon } from './Icon';

interface TourProps {
  id: string;
  title: string;
  subtitle: string;
  cat: string;
  tags: string[];
  duration: string;
  rating: number;
  reviews: number;
  priceFrom: number;
  badge?: string | null;
  photoVariant: string;
  glyph: string;
  photoLabel: string;
  location: string;
}

interface TourCardProps {
  tour: TourProps;
  dense?: boolean;
  shareEmphasis?: 'loud' | 'quiet';
}

export const TourCard: React.FC<TourCardProps> = ({ tour, dense, shareEmphasis = "loud" }) => {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/tour/${tour.id}`);
  };

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/tour/${tour.id}` : '';
    const text = encodeURIComponent(`¿Bora a este tour en Floripa? 🌴 ${tour.title} - ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div
      onClick={handleCardClick}
      className="card"
      style={{ display: "flex", flexDirection: "column", cursor: "pointer" }}
    >
      <div style={{ position: "relative" }}>
        <Photo
          variant={tour.photoVariant}
          glyph={tour.glyph}
          label={tour.photoLabel}
          ratio={dense ? "16/10" : "4/3"}
          rounded="none"
        />
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
          {tour.badge && (
            <Badge tone={tour.badge === "Más vendido" ? "coral" : tour.badge === "Recomendado" ? "ink" : tour.badge === "Nuevo" ? "sun" : "soft"}>
              {tour.badge}
            </Badge>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          aria-label="Guardar"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(255,255,255,0.95)",
            padding: 8,
            borderRadius: 999,
            boxShadow: "var(--shadow-sm)"
          }}
        >
          <Icon name="heart" size={16} />
        </button>
      </div>
      <div style={{ padding: dense ? 14 : 18, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)", fontSize: 12 }}>
          <Icon name="pin" size={12} /> {tour.location} · <Icon name="clock" size={12}/> {tour.duration}
        </div>
        <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: dense ? 18 : 20, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
          {tour.title}
        </h3>
        {!dense && <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.5 }}>{tour.subtitle}</p>}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 10 }}>
          <Stars rating={tour.rating} reviews={tour.reviews} compact />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>desde</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>R$ {tour.priceFrom}</div>
          </div>
        </div>
        {shareEmphasis === "loud" && (
          <div
            style={{
              display: "flex",
              gap: 6,
              marginTop: 4,
              paddingTop: 12,
              borderTop: "1px dashed var(--line)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <a
              className="share-btn wpp"
              style={{ padding: "6px 10px", fontSize: 12 }}
              onClick={handleWhatsAppShare}
              href="#"
            >
              <Icon name="whatsapp" size={12}/> Bora?
            </a>
            <a
              className="share-btn ig"
              style={{ padding: "6px 10px", fontSize: 12 }}
              onClick={(e) => { e.stopPropagation(); }}
              href="https://www.instagram.com/bora.floripa/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="instagram" size={12}/>
            </a>
            <a
              className="share-btn tt"
              style={{ padding: "6px 10px", fontSize: 12 }}
              onClick={(e) => { e.stopPropagation(); }}
              href="https://www.tiktok.com/@borafloripa"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="tiktok" size={10}/>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

"use client";

import React from 'react';
import { Icon } from './Icon';

interface ShareRowProps {
  size?: 'sm' | 'md';
  emphasis?: 'loud' | 'quiet';
  title?: string;
  url?: string;
}

export const ShareRow: React.FC<ShareRowProps> = ({
  size = "md",
  emphasis = "loud",
  title = "Compartir con tus",
  url = ""
}) => {
  const isSmall = size === "sm";

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert('¡Enlace copiado al portapapeles!'))
        .catch(() => {});
    }
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const text = encodeURIComponent(`¡Bora! Mira esta experiencia: ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (emphasis === "quiet") {
    return (
      <div className="share-row">
        <a className="share-btn copy" href="#" onClick={handleCopy}>
          <Icon name="share" size={14}/> Compartir
        </a>
      </div>
    );
  }

  return (
    <div>
      {title && <div className="eyebrow" style={{ marginBottom: 8 }}>{title}</div>}
      <div className="share-row">
        <a className="share-btn wpp" href="#" onClick={handleWhatsApp}>
          <Icon name="whatsapp" size={isSmall ? 14 : 16}/> WhatsApp
        </a>
        <a className="share-btn ig" href="https://www.instagram.com/bora.floripa/" target="_blank" rel="noopener noreferrer">
          <Icon name="instagram" size={isSmall ? 14 : 16}/> Instagram
        </a>
        <a className="share-btn tt" href="https://www.tiktok.com/@borafloripa" target="_blank" rel="noopener noreferrer">
          <Icon name="tiktok" size={isSmall ? 12 : 14}/> TikTok
        </a>
        <a className="share-btn copy" href="#" onClick={handleCopy}>
          <Icon name="share" size={14}/> Copiar enlace
        </a>
      </div>
    </div>
  );
};

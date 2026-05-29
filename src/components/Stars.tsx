import React from 'react';
import { Icon } from './Icon';

interface StarsProps {
  rating: number;
  reviews?: number;
  size?: number;
  compact?: boolean;
}

export const Stars: React.FC<StarsProps> = ({ rating, reviews, size = 14, compact }) => (
  <span className="stars" style={{ fontSize: size }}>
    <Icon name="star" size={size} />
    <strong>{rating.toFixed(2)}</strong>
    {reviews != null && (
      <span style={{ color: "var(--muted)", fontWeight: 400 }}>
        {compact ? ` (${reviews})` : ` · ${reviews.toLocaleString("es")} reseñas`}
      </span>
    )}
  </span>
);

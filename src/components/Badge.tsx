import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  tone?: 'coral' | 'sun' | 'turq' | 'ink' | 'soft';
}

export const Badge: React.FC<BadgeProps> = ({ children, tone = 'coral' }) => (
  <span className={`badge badge-${tone}`}>{children}</span>
);

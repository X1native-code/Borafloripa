import React from 'react';

interface PhotoProps {
  variant?: string;
  label?: string;
  glyph?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  ratio?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
}

export const Photo: React.FC<PhotoProps> = ({
  variant = "turq",
  label,
  glyph,
  className = "",
  style = {},
  children,
  ratio = "4/3",
  rounded = "md"
}) => {
  const radiusMap = {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
    none: "0"
  };

  const borderRadius = radiusMap[rounded];

  return (
    <div
      className={`ph ph-${variant} ${className}`}
      style={{
        aspectRatio: ratio,
        borderRadius,
        ...style
      }}
    >
      {glyph && (
        <div
          className="ph-glyph"
          style={{ fontSize: "clamp(40px, 12vw, 120px)" }}
        >
          {glyph}
        </div>
      )}
      {label && <div className="ph-label">{label}</div>}
      {children}
    </div>
  );
};

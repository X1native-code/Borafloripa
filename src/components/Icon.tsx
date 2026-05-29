import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  size?: number;
  stroke?: number;
}

export const Icon: React.FC<IconProps> = ({ name, size = 18, stroke = 2, ...rest }) => {
  const s = size;
  const sw = stroke;
  const common = {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: sw,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest
  };

  switch (name) {
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      );
    case "close":
    case "x-mark":
      return (
        <svg {...common}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    case "map":
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s-7-7-7-12a7 7 0 1 1 14 0c0 5-7 12-7 12Z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "star":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M12 2.5l2.9 6.5 7 .7-5.3 4.7 1.6 6.9L12 17.8l-6.2 3.5 1.6-6.9L2.1 9.7l7-.7L12 2.5Z" />
        </svg>
      );
    case "star-line":
      return (
        <svg {...common}>
          <path d="M12 2.5l2.9 6.5 7 .7-5.3 4.7 1.6 6.9L12 17.8l-6.2 3.5 1.6-6.9L2.1 9.7l7-.7L12 2.5Z" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21Z" />
        </svg>
      );
    case "share":
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="6" r="2.5" />
          <circle cx="18" cy="18" r="2.5" />
          <path d="m8 11 8-4M8 13l8 4" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4 10-10" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...common}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      );
    case "chevron-down":
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case "chevron-left":
      return (
        <svg {...common}>
          <path d="m15 6-6 6 6 6" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...common}>
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      );
    case "globe":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" />
        </svg>
      );
    case "wave":
      return (
        <svg {...common}>
          <path d="M3 12c1.5-2 3-2 4.5 0S10.5 14 12 12s3-2 4.5 0S19.5 14 21 12" />
        </svg>
      );
    case "play":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M8 5v14l11-7L8 5Z" />
        </svg>
      );
    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8h.01M11 12h1v5h1" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "credit":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 11h18M7 16h4" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" width={s} height={s} fill="currentColor" {...rest}>
          <path d="M20.5 3.5A11 11 0 0 0 4.4 18.3L3 22l3.8-1.4A11 11 0 1 0 20.5 3.5Zm-8.4 17a9 9 0 0 1-4.6-1.3l-.3-.2-2.3.8.8-2.2-.2-.3A9 9 0 1 1 12.1 20.5Zm5-6.5c-.3-.1-1.6-.8-1.9-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6 0c-.3-.1-1.2-.4-2.2-1.3a8 8 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.3-.5c0-.2 0-.4-.1-.5l-.7-1.8c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.4s-.9.9-.9 2.2.9 2.5 1 2.7c.2.2 1.9 2.9 4.6 4 .6.3 1.1.4 1.5.5.6.2 1.2.2 1.7.1.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.2-1.3-.1-.1-.3-.2-.6-.3Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...rest}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" width={s} height={s} fill="currentColor" {...rest}>
          <path d="M16.5 3h-2.8v12.3c0 1.6-1.2 2.8-2.8 2.8s-2.8-1.2-2.8-2.8 1.2-2.8 2.8-2.8c.3 0 .6 0 .9.1V9.7a6 6 0 0 0-.9-.1A5.7 5.7 0 1 0 16.5 15V8.5a7.4 7.4 0 0 0 4.5 1.5V7.2a5 5 0 0 1-4.5-4.2Z" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" width={s} height={s} fill="currentColor" {...rest}>
          <path d="M22 12a10 10 0 1 0-11.6 9.9V15h-2.5v-3h2.5V9.5c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.5V12h2.7l-.4 3h-2.3v6.9A10 10 0 0 0 22 12Z" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...common}>
          <path d="M21 3c-4 0-12 2-15 11-1 3 0 6 2 7 2 1 5 1 7-1 9-3 11-11 11-15-2 0-3 0-5 1" />
          <path d="M3 21c2-6 6-9 12-12" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...common}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 1 1 8 0v3" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 6a2 2 0 0 1 2-2Z" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 7 9-7" />
        </svg>
      );
    case "diamond":
      return (
        <svg {...common}>
          <path d="m12 2 5 6-5 14L7 8l5-6Z" />
          <path d="M2 8h20" />
        </svg>
      );
    default:
      return null;
  }
};

import React from 'react';
import { Logo } from './Logo';
import { Icon } from './Icon';

const FooterCol: React.FC<{ title: string; links: string[] }> = ({ title, links }) => (
  <div>
    <div className="eyebrow" style={{ color: "rgba(247,241,227,0.55)", marginBottom: 12 }}>{title}</div>
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
      {links.map(l => <li key={l}><a href="#" style={{ color: "rgba(247,241,227,0.85)", fontSize: 14 }}>{l}</a></li>)}
    </ul>
  </div>
);

export const Footer: React.FC = () => (
  <footer style={{ marginTop: 80, background: "var(--ink)", color: "var(--cream)", padding: "64px 0 32px" }}>
    <div className="wrap-wide">
      <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 40 }}>
        <div>
          <Logo size={22} color="var(--cream)" />
          <p style={{ marginTop: 16, color: "rgba(247,241,227,0.7)", fontSize: 14, lineHeight: 1.6 }}>
            Las mejores experiencias de Florianópolis, hechas por floripenses, contadas en español.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <a className="share-btn ig" href="https://www.instagram.com/bora.floripa/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Icon name="instagram" size={16}/> Instagram</a>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <a className="share-btn tt" href="https://www.tiktok.com/@borafloripa" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><Icon name="tiktok" size={14}/> TikTok</a>
          </div>
        </div>
        <FooterCol title="Explora" links={["Todos los tours", "Día completo", "Medio día", "Atardeceres", "Bora con niños", "Traslados privados"]} />
        <FooterCol title="Bora nosotros" links={["Nuestra historia", "Trabajá con nosotros", "Guías locales", "Política de cancelación", "Preguntas frecuentes"]} />
        <FooterCol title="Soporte 24/7" links={["WhatsApp +55 48 99999-1234", "ola@boraflo.com", "Centro de ayuda", "Reembolsos", "Términos y privacidad"]} />
      </div>
      <div style={{ marginTop: 56, paddingTop: 24, borderTop: "1px solid rgba(247,241,227,0.15)", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", color: "rgba(247,241,227,0.55)", fontSize: 13 }}>
        <span>© 2026 Bora Floripa · CNPJ 00.000.000/0001-00 · Florianópolis, SC</span>
        <span style={{ fontFamily: "var(--font-mono)" }}>Hecho com saudade na Ilha da Magia 🌴</span>
      </div>
    </div>
  </footer>
);

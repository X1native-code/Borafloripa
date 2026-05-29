import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { Header } from "@/components/Header";
import { TweaksPanel } from "@/components/TweaksPanel";

export const metadata: Metadata = {
  title: "Bora Floripa — Experiencias en Florianópolis",
  description: "Tours, paseos y experiencias auténticas en la Ilha da Magia. Hechos por floripenses, contados en español, reservables en 30 segundos.",
  icons: {
    icon: "/favicon.ico",
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" id="root">
      <body>
        <ThemeProvider>
          {children}
          <TweaksPanel />
        </ThemeProvider>
      </body>
    </html>
  );
}

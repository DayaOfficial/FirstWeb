import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://dayamartofficial.my.id'),
  title: { default: 'DAYA MART — One Stop Digital Store', template: '%s | DAYA MART' },
  description: "Top up game, pulsa, paket data, token listrik, aplikasi premium, dan produk digital lainnya. Proses cepat, harga terbaik, aman & terpercaya.",
  keywords: "top up game, pulsa, paket data, token listrik, QRIS, aplikasi premium, daya mart",
  openGraph: {
    title: "DAYA MART - One Stop Digital Store",
    description: "Top up game, pulsa, paket data, token listrik, aplikasi premium, dan produk digital lainnya.",
    url: "https://dayamartofficial.my.id",
    siteName: "DAYA MART",
    type: "website",
  },
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${montserrat.variable} ${inter.variable}`}>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jumpinfortacos.com"),
  title: "Jumpin’ For Tacos — Free Browser Platformer Game",
  description: "Play Jumpin’ For Tacos, a free taco-collecting browser platformer by Travis and Olivia. Explore colorful worlds on iPhone or PC with touch or controller.",
  applicationName: "Jumpin’ For Tacos",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Jumpin’ For Tacos",
    title: "Jumpin’ For Tacos — Free Browser Platformer Game",
    description: "Run, jump, bounce, and collect glorious tacos in a colorful free browser adventure by Travis and Olivia.",
    images: [{ url: "/assets/jumpin-for-tacos-social-v1.jpg", width: 1200, height: 630, alt: "Taco Hero and Olivia crossing the three painted worlds of Jumpin’ For Tacos" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jumpin’ For Tacos — Free Browser Platformer Game",
    description: "Run, jump, bounce, and collect glorious tacos in a colorful free browser adventure.",
    images: ["/assets/jumpin-for-tacos-social-v1.jpg"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  icons: {
    icon: "/game/assets/icon_512.png",
    shortcut: "/game/assets/icon_512.png",
    apple: "/game/assets/icon_512.png",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://jumpinfortacos.com/#website",
      name: "Jumpin’ For Tacos",
      url: "https://jumpinfortacos.com/",
      description: "A free taco-collecting browser platformer created by Travis and Olivia.",
    },
    {
      "@type": ["VideoGame", "SoftwareApplication"],
      "@id": "https://jumpinfortacos.com/#game",
      name: "Jumpin’ For Tacos",
      url: "https://jumpinfortacos.com/",
      image: "https://jumpinfortacos.com/assets/jumpin-for-tacos-social-v1.jpg",
      description: "A free family-made side-scrolling browser platformer with colorful worlds, taco collecting, touch controls, keyboard controls, and gamepad support.",
      applicationCategory: "GameApplication",
      operatingSystem: "Web Browser",
      gamePlatform: ["Web browser", "iPhone", "PC"],
      playMode: "SinglePlayer",
      genre: ["Platformer", "Adventure", "Family"],
      creator: [
        { "@type": "Person", name: "Travis King", sameAs: ["https://x.com/TravisKingX"] },
        { "@type": "Person", name: "Olivia" },
      ],
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <script async src="/analytics.js?v=1"></script>
        {children}
      </body>
    </html>
  );
}

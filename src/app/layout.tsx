import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { business } from "@/data/business";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

const description =
  "AOT.ng is a modest fashion brand in Ilorin, Nigeria, offering ready-to-wear pieces and custom sewing.";

export const metadata: Metadata = {
  metadataBase: new URL(business.siteUrl),
  title: { default: `${business.name} | ${business.tagline}`, template: `%s | ${business.name}` },
  description,
  alternates: { canonical: "./" },
  openGraph: { siteName: business.name, type: "website", locale: "en_NG", description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

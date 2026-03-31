import type { Metadata } from "next";
import { Inter, Bebas_Neue, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "./redux";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "ITList",
  description: "An IT Task Management App",
  icons: {
    icon: "Code.svg",
    apple: "Code.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${bebasNeue.variable} ${jetbrainsMono.variable}`}>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
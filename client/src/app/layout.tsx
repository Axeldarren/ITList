import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StoreProvider from "./redux";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <StoreProvider>
          <Toaster position="top-right" 
            toastOptions={{
              style: {
                background: '#333',
                color: '#fff',
              },
            }}
          />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
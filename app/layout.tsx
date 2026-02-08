"use client"; // make this a client component to safely modify body classes

import { useEffect } from "react";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Add any client-only classes here
    document.body.classList.add("vc-init");
  }, []);

  return (
    <html lang="en">
      <body className={`${roboto.className} font-semibold`}>
        {children}
      </body>
    </html>
  );
}

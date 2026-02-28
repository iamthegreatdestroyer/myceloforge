import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MYCELOFORGE — Empire Forge",
  description: "AI-powered empire deployment through the mycelial network",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "MYCELOFORGE",
    description: "Forge your empire across the mycelial network",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-black text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STI Distribution - ERP Dashboard",
  description: "Enterprise ERP dashboard for telecommunications distribution management",
  icons: {
    icon: "/assets/logo-sti.png",
    apple: "/assets/logo-sti.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full" style={{ fontFamily: "'Inter', system-ui, sans-serif" }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

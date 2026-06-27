import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import LayoutWrapper from "@/components/LayoutWrapper";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Cyborg Healthcare",
  description: "Healthcare platform with AI-powered insights",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cyborg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
          <PWAInstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}

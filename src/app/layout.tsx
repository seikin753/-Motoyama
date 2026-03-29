import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import AuthProvider from "@/components/AuthProvider";
import { BottomNav } from "@/components/BottomNav";
import { Heart, MessageCircle } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const noto = Noto_Sans_JP({ subsets: ["latin"], variable: "--font-noto" });

export const metadata: Metadata = {
  title: "MuscleBoard",
  description: "筋トレの成長を可視化し、添削によって加速させるトレーニング特化SNS",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} ${noto.variable} font-sans bg-gray-50 text-gray-900`}>
        <AuthProvider>
          <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white border-x border-gray-100 shadow-sm relative">
            
            {/* Header (Instagram Style) */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200/60">
              <div className="flex justify-between items-center px-4 h-11">
                <Link href="/">
                  {/* Imitating classic Instagram logo font with a standard serif/cursive fallback */}
                  <h1 className="text-xl font-bold tracking-tight text-gray-900" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                    MuscleBoard
                  </h1>
                </Link>
                <div className="flex items-center gap-4">
                  <button className="hover:opacity-50 transition-opacity">
                    <Heart className="w-6 h-6 text-gray-900" />
                  </button>
                  <button className="hover:opacity-50 transition-opacity">
                    <MessageCircle className="w-6 h-6 text-gray-900" />
                  </button>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-[50px]">
              {children}
            </main>

            {/* Bottom Nav */}
            <BottomNav />
            
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const noto = Noto_Sans_JP({ subsets: ["latin"], variable: "--font-noto" });

export const metadata: Metadata = {
  title: "MuscleBoard | 筋トレ成長可視化SNS",
  description: "筋トレの成長を可視化し、添削によって加速させるトレーニング特化SNS",
};

import Link from "next/link";
import AuthProvider from "@/components/AuthProvider";
import { BottomNav } from "@/components/BottomNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className={`${inter.variable} ${noto.variable} font-sans bg-gray-50 text-gray-900`}>
        <AuthProvider>
          <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white border-x border-gray-200 shadow-sm">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
              <div className="flex justify-between items-center px-4 h-14">
                <Link href="/">
                  <h1 className="text-xl font-bold italic tracking-tighter text-gray-900">
                    MuscleBoard
                  </h1>
                </Link>
                <Link href="/profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                  M
                </Link>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-20">
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

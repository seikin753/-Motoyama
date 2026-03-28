import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const noto = Noto_Sans_JP({ subsets: ["latin"], variable: "--font-noto" });

export const metadata: Metadata = {
  title: "MuscleBoard | 筋トレ成長可視化SNS",
  description: "筋トレの成長を可視化し、添削によって加速させるトレーニング特化SNS",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

import Link from "next/link";
import { Icons } from "@/components/icons";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} ${noto.variable} font-sans bg-[#0a0a0f] text-[#f0f0f5] min-h-screen pb-20`}>
        <div className="max-w-[480px] mx-auto min-h-screen border-x border-white/5 bg-[#0a0a0f] shadow-2xl">
          <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
            <Link href="/">
              <h1 className="text-xl font-black bg-gradient-to-r from-[#ff6b35] to-[#ff4757] bg-clip-text text-transparent">
                MuscleBoard
              </h1>
            </Link>
          </header>
          <main className="p-4">
            {children}
          </main>
          <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#0a0a0f]/90 backdrop-blur-xl pb-safe">
            <div className="max-w-[480px] mx-auto h-16 flex justify-around items-center">
              <Link href="/"><NavItem icon="Home" label="ホーム" active /></Link>
              <Link href="/workout"><NavItem icon="Calendar" label="記録" /></Link>
              <Link href="/timeline">
                <div className="mt-[-24px] bg-gradient-to-br from-[#ff6b35] to-[#ff4757] w-12 h-12 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(255,107,53,0.3)] hover:scale-110 transition-transform">
                  <span className="text-2xl text-white font-bold">+</span>
                </div>
              </Link>
              <Link href="/ranking"><NavItem icon="BarChart2" label="ランキング" /></Link>
              <Link href="/profile"><NavItem icon="User" label="マイページ" /></Link>
            </div>
          </nav>
        </div>
      </body>
    </html>
  );
}

function NavItem({ icon, label, active = false }: { icon: string; label: string; active?: boolean }) {
  return (
    <button className={`flex flex-col items-center gap-1 ${active ? 'text-[#a29bfe]' : 'text-[#555570]'}`}>
      <span className="text-xs font-bold leading-none">{label}</span>
    </button>
  );
}

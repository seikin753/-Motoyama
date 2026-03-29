"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, PlusSquare, BarChart2, User } from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "ホーム" },
  { href: "/workout", icon: Dumbbell, label: "記録" },
  { href: "/timeline", icon: PlusSquare, label: "投稿", isCenter: true },
  { href: "/ranking", icon: BarChart2, label: "ランキング" },
  { href: "/profile", icon: User, label: "マイページ" },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 pb-safe">
      <div className="max-w-md mx-auto flex justify-around items-center h-14">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Link key={item.href} href={item.href}>
                <div className="w-11 h-11 -mt-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 hover:scale-110 active:scale-95 transition-transform">
                  <PlusSquare className="w-5 h-5 text-white" />
                </div>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${active ? "text-gray-900" : "text-gray-400"}`}>
                <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

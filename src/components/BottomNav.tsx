"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Compass, MessageCircle, User, PlusSquare } from "lucide-react";

const navItems = [
  { href: "/", icon: Home },
  { href: "/workout", icon: Search },
  { href: "/timeline", icon: PlusSquare },
  { href: "/ranking", icon: Compass },
  { href: "/profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200/60 pb-safe">
      <div className="max-w-md mx-auto flex justify-between items-center h-[50px] px-6">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          if (item.href === "/profile") {
            return (
              <Link key={item.href} href={item.href} className="p-2 transition-transform active:scale-95">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-gray-200 ${active ? "ring-1 ring-offset-1 ring-gray-900" : ""}`}>
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href} className="p-2 transition-transform active:scale-95">
              <Icon 
                className={`w-[26px] h-[26px] ${active ? "text-gray-900 fill-gray-900" : "text-gray-900"}`} 
                strokeWidth={active ? 2.5 : 1.5} 
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

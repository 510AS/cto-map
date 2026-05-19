"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useProgress } from "@/lib/progress-context";
import ThemeToggle from "@/components/ThemeToggle";
import XPBar from "@/components/XPBar";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

// Enhancement #2: 5 main nav items
const mainNavItems: NavItem[] = [
  {
    label: "Today",
    href: "/today",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Progress",
    href: "/progress",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: "Search",
    href: "/search",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// "More" menu items
const moreNavItems: NavItem[] = [
  {
    label: "Analytics",
    href: "/analytics",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: "Knowledge",
    href: "/knowledge",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    label: "Flashcards",
    href: "/flashcards",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    label: "Timeline",
    href: "/timeline",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Bookmarks",
    href: "/bookmarks",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
  },
  {
    label: "Build Log",
    href: "/build-log",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Achievements",
    href: "/achievements",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
];

export function Navigation({ variant }: { variant: "sidebar" | "bottom" }) {
  const pathname = usePathname();
  const { state } = useProgress();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  if (variant === "bottom") {
    // Mobile bottom nav: Today, Dashboard, Progress, Search, More
    const mobileMainItems = mainNavItems.filter((item) =>
      ['/today', '/', '/progress', '/search'].includes(item.href)
    );

    return (
      <>
        <div className="flex items-center justify-around px-2 py-1">
          {mobileMainItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-1 py-1 rounded-lg text-xs transition-all duration-150 ${
                  active
                    ? "text-blue-600 dark:text-blue-400 font-semibold scale-105"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 active:scale-95"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.icon}
                <span className="mt-0.5 truncate text-[10px]">{item.label}</span>
              </Link>
            );
          })}
          {/* More button */}
          <button
            onClick={() => setMobileSheetOpen(true)}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-1 py-1 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 active:scale-95 transition-all duration-150"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="mt-0.5 truncate text-[10px]">More</span>
          </button>
        </div>

        {/* Mobile slide-up sheet */}
        {mobileSheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end" onClick={() => setMobileSheetOpen(false)}>
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
            <div
              className="relative w-full bg-white dark:bg-gray-900 rounded-t-2xl border-t border-gray-200 dark:border-gray-700 p-4 pb-8 animate-slide-up max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />
              <div className="grid grid-cols-3 gap-3">
                {[...moreNavItems, mainNavItems[4]].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileSheetOpen(false)}
                    className={`flex flex-col items-center justify-center min-h-[64px] p-3 rounded-xl transition-all ${
                      isActive(item.href)
                        ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                        : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {item.icon}
                    <span className="mt-1 text-[11px] font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
              <div className="mt-4 flex justify-center">
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Sidebar variant
  return (
    <nav className="flex-1 flex flex-col px-3 py-4 space-y-1 overflow-y-auto">
      {/* Main nav items */}
      {mainNavItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 min-h-[44px] min-w-[44px] px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
              active
                ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold shadow-sm ring-1 ring-blue-100 dark:ring-blue-800"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 active:bg-gray-100 dark:active:bg-gray-700"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}

      {/* More section - expandable */}
      <div className="pt-2">
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className="flex items-center gap-3 min-h-[44px] min-w-[44px] px-3 py-2.5 rounded-lg text-sm w-full text-left text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-150"
        >
          <svg className={`w-5 h-5 transition-transform duration-200 ${moreOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>More</span>
        </button>

        {moreOpen && (
          <div className="ml-2 mt-1 space-y-0.5 animate-fade-in">
            {moreNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                    active
                      ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Mini progress indicator in sidebar */}
      <div className="mt-auto pt-4 px-3 border-t border-gray-100 dark:border-gray-800">
        <XPBar />
        <div className="flex items-center justify-between mb-1.5 mt-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">Overall Progress</div>
          <ThemeToggle />
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${state.overallPct}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {state.totalCompletedDays}/{state.totalDays} days • {state.overallPct}%
        </div>

        {/* User profile section */}
        <UserMenu />
      </div>
    </nav>
  );
}

function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      <Link
        href="/profile"
        className="flex items-center gap-2 min-h-[44px] px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt=""
            className="w-7 h-7 rounded-full"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {(session.user.name || session.user.email || "U")[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
            {session.user.name || "User"}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
            {session.user.email}
          </p>
        </div>
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: "/auth/login" })}
        className="flex items-center gap-2 min-h-[44px] min-w-[44px] w-full px-2 py-2 mt-1 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-red-600 dark:hover:text-red-400 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Sign out
      </button>
    </div>
  );
}

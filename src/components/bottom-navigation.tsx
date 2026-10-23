"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  House,
  Trophy,
  ChartNoAxesColumnIncreasing,
  CupSoda,
  Ellipsis,
} from "lucide-react";
import { appNavigation, navigationContext } from "@/lib/app-navigation";
const icons = [House, Trophy, ChartNoAxesColumnIncreasing, CupSoda, Ellipsis];
export function BottomNavigationView({
  pathname = "",
  search = "",
  context = "",
}: {
  pathname?: string;
  search?: string;
  context?: string;
}) {
  return (
    <nav className="bottom-nav app-bottom-nav" aria-label="Mobile primary">
      {appNavigation(pathname, search, context).map((tab, index) => {
        const Icon = icons[index];
        return (
          <Link
            key={tab.path}
            href={tab.href}
            prefetch={false}
            aria-current={tab.active ? "page" : undefined}
          >
            <Icon size={21} aria-hidden />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
export function BottomNavigation() {
  const pathname = usePathname() ?? "";
  const search = useSearchParams()?.toString() ?? "";
  const [previous, setPrevious] = useState("");
  const context = navigationContext(previous, search, pathname);
  useEffect(() => {
    setPrevious(context);
  }, [context]);
  // The owner review is a standalone proposal page with its own return link.
  if (pathname === "/review/next") return null;
  return (
    <BottomNavigationView
      pathname={pathname}
      search={search}
      context={context}
    />
  );
}

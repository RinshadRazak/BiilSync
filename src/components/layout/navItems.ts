import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Store,
  Package,
  Truck,
  CalendarRange,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  isSpecial?: boolean;
}

export const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "New Order",
    href: "/orders/new",
    icon: PlusCircle,
    isSpecial: true,
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ClipboardList,
    badge: "38",
  },
  {
    title: "Shops",
    href: "/shops",
    icon: Store,
  },
  {
    title: "Products",
    href: "/products",
    icon: Package,
  },
  {
    title: "Suppliers",
    href: "/suppliers",
    icon: Truck,
  },
  {
    title: "Purchase Planning",
    href: "/purchase-planning",
    icon: CalendarRange,
    badge: "14 Req",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

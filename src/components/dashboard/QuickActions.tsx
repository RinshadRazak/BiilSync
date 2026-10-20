import React from "react";
import Link from "next/link";
import {
  PlusCircle,
  PackagePlus,
  Store,
  CalendarRange,
  ArrowRight,
} from "lucide-react";

interface ActionItem {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  iconColor: string;
  badge?: string;
}

const actions: ActionItem[] = [
  {
    title: "Create New Order",
    description: "Generate retail shop order, packing list, and wholesale invoice.",
    href: "/orders/new",
    icon: PlusCircle,
    iconColor: "bg-blue-50 text-blue-600 border-blue-100",
    badge: "Primary",
  },
  {
    title: "Add Product",
    description: "Register new wholesale catalog SKU, pricing tiers, and stock count.",
    href: "/products",
    icon: PackagePlus,
    iconColor: "bg-indigo-50 text-indigo-600 border-indigo-100",
  },
  {
    title: "Add Shop",
    description: "Onboard retail store account, credit limit, and delivery route.",
    href: "/shops",
    icon: Store,
    iconColor: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    title: "View Purchase Planning",
    description: "Aggregate order requirements and prepare supplier PO orders.",
    href: "/purchase-planning",
    icon: CalendarRange,
    iconColor: "bg-amber-50 text-amber-600 border-amber-100",
    badge: "Action Needed",
  },
];

export function QuickActions() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Quick Actions
          </h2>
          <p className="text-xs text-slate-500">
            Frequently executed distribution workflows
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className="group relative bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border ${action.iconColor}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {action.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {action.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {action.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {action.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-medium text-blue-600 group-hover:text-blue-700">
                <span>Open module</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
